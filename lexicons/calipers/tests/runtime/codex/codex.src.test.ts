// The codex config cascade: each unit (m / i / f) resolves a setting as
// own keyed config -> bundle `global` -> factory default. Worked example: the
// shared `hardening` reaction. The bundle must expose the CONFIGURED i / f / m,
// so a bundle-level `global` or per-unit key actually reaches them.
import { describe, expect, it } from 'vitest';

import {
  type ColorFormatPlugin,
  type ColorString,
  hardenInteger,
} from '../../../src';
import createCalipersBundle from '../../../src/codex';

describe('codex config cascade (own key -> global -> factory default)', () => {
  const hardenedI = () => hardenInteger({ min: 0, max: 10 })(8);

  describe('m (measurement)', () => {
    it('unit key wins over global', () => {
      const c = createCalipersBundle({
        global: { hardening: 'fail' },
        measurements: { hardening: 'ignore' },
      });
      expect(c.m(hardenedI()).multiply(2).css()).toBe('16px');
    });

    it('falls back to global when no unit key', () => {
      const c = createCalipersBundle({
        global: { hardening: 'fail' },
      });
      expect(() => c.m(hardenedI()).multiply(2)).toThrow(
        /hardened bound/,
      );
    });

    it('factory default (fail) when neither is set', () => {
      const c = createCalipersBundle();
      expect(() => c.m(hardenedI()).multiply(2)).toThrow(
        /hardened bound/,
      );
    });
  });

  describe('i (integer)', () => {
    it('global relaxes the breach (ignore)', () => {
      const c = createCalipersBundle({
        global: { hardening: 'ignore' },
      });
      expect(c.i(8, { min: 0, max: 10 }).multiply(2).value()).toBe(
        16,
      );
    });

    it('unit key wins over global', () => {
      const c = createCalipersBundle({
        global: { hardening: 'ignore' },
        integer: { hardening: 'fail' },
      });
      expect(() => c.i(8, { min: 0, max: 10 }).multiply(2)).toThrow(
        /maximum/,
      );
    });

    it('factory default (fail) when neither is set', () => {
      const c = createCalipersBundle();
      expect(() => c.i(8, { min: 0, max: 10 }).multiply(2)).toThrow(
        /maximum/,
      );
    });

    it('the bundle hardenInteger is configured too', () => {
      const c = createCalipersBundle({
        global: { hardening: 'ignore' },
      });
      const fontWeight = c.hardenInteger({ min: 0, max: 10 });
      expect(fontWeight(8).multiply(2).value()).toBe(16);
    });
  });

  describe('f (float)', () => {
    it('global relaxes the breach (ignore)', () => {
      const c = createCalipersBundle({
        global: { hardening: 'ignore' },
      });
      expect(c.f(0.6, { min: 0, max: 1 }).multiply(2).value()).toBe(
        1.2,
      );
    });

    it('unit key wins over global', () => {
      const c = createCalipersBundle({
        global: { hardening: 'ignore' },
        float: { hardening: 'fail' },
      });
      expect(() => c.f(0.6, { min: 0, max: 1 }).multiply(2)).toThrow(
        /maximum/,
      );
    });

    it('factory default (fail) when neither is set', () => {
      const c = createCalipersBundle();
      expect(() => c.f(0.6, { min: 0, max: 1 }).multiply(2)).toThrow(
        /maximum/,
      );
    });

    it('the bundle hardenFloat is configured too', () => {
      const c = createCalipersBundle({
        global: { hardening: 'ignore' },
      });
      const alpha = c.hardenFloat({ min: 0, max: 1 });
      expect(alpha(0.6).multiply(2).value()).toBe(1.2);
    });
  });

  // The color quarter of the bundle: `config.color` must forward to `createColor`,
  // so a custom format plugin registered through the bundle actually reaches the
  // bound `color` instance. Previously only existence (`typeof bundle.color`) was
  // checked, leaving the forwarding path untested through the split.
  describe('color (bundle color slot forwards to createColor)', () => {
    const marker: ColorFormatPlugin<'marker'> = {
      format: 'marker',
      hasAlpha: true,
      gamut: 'unbounded',
      supportsProbe: null,
      gamutDependent: false,
      srgbFloor: false,
      render: () => 'MARKER' as ColorString<'marker'>,
    };

    it('binds a default color instance when no color config is given', () => {
      const c = createCalipersBundle();
      expect(c.color('#3366cc').hex().css()).toBe('#3366cc');
    });

    it('forwards a custom format plugin to the bundle color instance', () => {
      const c = createCalipersBundle({
        color: {
          formats: [
            marker,
          ],
        },
      });
      // the plugin is registered on the forwarded color instance...
      expect(c.color.formats.marker).toBe(marker);
      // ...and renders through it, via both the one-off selector and the typed name.
      expect(c.color('#3366cc').formatAs(marker).css()).toBe(
        'MARKER',
      );
      expect(c.color('#3366cc').marker.css()).toBe('MARKER');
    });
  });

  // Ratio is now aggregated into the bundle (previously absent).
  describe('r (ratio)', () => {
    it('is bound in the bundle', () => {
      const c = createCalipersBundle();
      expect(c.r(16, 9).css()).toBe('16/9');
    });

    it('accepts a ratio key', () => {
      const c = createCalipersBundle({ ratio: {} });
      expect(c.r(16, 9).css()).toBe('16/9');
    });
  });

  // The 13 unit-group factories are aggregated; a group key threads its config.
  describe('unit groups (aggregated + config threads via a group key)', () => {
    const captureMessage = (fn: () => void): string => {
      try {
        fn();
      } catch (error) {
        return (error as Error).message;
      }
      return '';
    };

    it('exposes every unit-group helper', () => {
      const c = createCalipersBundle();
      expect(c.mVh(20).css()).toBe('20vh');
      expect(c.mPx(2).css()).toBe('2px');
      expect(c.mPercent(50).css()).toBe('50%');
      expect(c.isPercentMeasurement(c.mPercent(50))).toBe(true);
    });

    it('a group key threads its config to the group helpers', () => {
      const withHints = createCalipersBundle({
        viewport: { errorConfig: { stackHints: 'on' } },
      });
      const withoutHints = createCalipersBundle({
        viewport: { errorConfig: { stackHints: 'off' } },
      });
      expect(
        captureMessage(() => withHints.mVh(Number.NaN)),
      ).toContain('stack=');
      expect(
        captureMessage(() => withoutHints.mVh(Number.NaN)),
      ).not.toContain('stack=');
    });
  });
});
