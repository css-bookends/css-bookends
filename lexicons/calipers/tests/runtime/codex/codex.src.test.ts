/* eslint-disable no-restricted-syntax -- this whole file tests the codex bundle
   factory; every createCalipersBundle() call here is the subject under test. */
// The codex config cascade: each unit (m / i / f) resolves a setting as
// own keyed config -> bundle `global` -> factory default. Worked example: the
// shared `hardening` reaction. The bundle must expose the CONFIGURED i / f / m,
// so a bundle-level `global` or per-unit key actually reaches them.
import { describe, expect, it } from 'vitest';

import {
  type CalipersBundle,
  type ColorFormatPlugin,
  type ColorString,
  i,
} from '../../../src';
import createCalipersBundle from '../../../src/codex';

describe('codex config cascade (own key -> global -> factory default)', () => {
  const hardenedI = () => i(8, { min: 0, max: 10 });

  describe('m (measurement)', () => {
    it('unit key wins over global', () => {
      const c = createCalipersBundle({
        global: { hardening: 'fail' },
        measurement: { hardening: 'warn' },
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
    it('global relaxes the breach (warn)', () => {
      const c = createCalipersBundle({
        global: { hardening: 'warn' },
      });
      expect(c.i(8, { min: 0, max: 10 }).multiply(2).value()).toBe(
        16,
      );
    });

    it('unit key wins over global', () => {
      const c = createCalipersBundle({
        global: { hardening: 'warn' },
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

    it('the bundle i threads hardening to a per-call bound', () => {
      const c = createCalipersBundle({
        global: { hardening: 'warn' },
      });
      expect(c.i(8, { min: 0, max: 10 }).multiply(2).value()).toBe(
        16,
      );
    });
  });

  describe('f (float)', () => {
    it('global relaxes the breach (warn)', () => {
      const c = createCalipersBundle({
        global: { hardening: 'warn' },
      });
      expect(c.f(0.6, { min: 0, max: 1 }).multiply(2).value()).toBe(
        1.2,
      );
    });

    it('unit key wins over global', () => {
      const c = createCalipersBundle({
        global: { hardening: 'warn' },
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

    it('the bundle f threads hardening to a per-call bound', () => {
      const c = createCalipersBundle({
        global: { hardening: 'warn' },
      });
      expect(c.f(0.6, { min: 0, max: 1 }).multiply(2).value()).toBe(
        1.2,
      );
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

describe('codex errorConfig cascade (global -> unit key -> factory default)', () => {
  const captureMessage = (fn: () => void): string => {
    try {
      fn();
    } catch (error) {
      return (error as Error).message;
    }
    return '';
  };
  // m core: divide-by-zero always throws through the instance error store, so it
  // renders a stack hint iff the resolved errorConfig says so (independent of hardening).
  const mError = (c: CalipersBundle): string =>
    captureMessage(() => c.m(2, 'px').divide(0));

  it('global.errorConfig applies to m when there is no unit key', () => {
    const on = createCalipersBundle({
      global: { errorConfig: { stackHints: 'on' } },
    });
    expect(mError(on)).toContain('stack=');
    const off = createCalipersBundle({
      global: { errorConfig: { stackHints: 'off' } },
    });
    expect(mError(off)).not.toContain('stack=');
  });

  it('the measurements key overrides global.errorConfig', () => {
    const c = createCalipersBundle({
      global: { errorConfig: { stackHints: 'on' } },
      measurement: { errorConfig: { stackHints: 'off' } },
    });
    expect(mError(c)).not.toContain('stack=');
  });

  it('global.errorConfig reaches the unit-group helpers too', () => {
    // `mVh(NaN)` passes a stack-hint override, so 'auto' already shows a stack;
    // 'off' is the discriminating oracle (it suppresses despite the override).
    const off = createCalipersBundle({
      global: { errorConfig: { stackHints: 'off' } },
    });
    expect(captureMessage(() => off.mVh(Number.NaN))).not.toContain(
      'stack=',
    );
  });

  it('factory default (auto, no override -> no stack) when neither is set', () => {
    expect(mError(createCalipersBundle())).not.toContain('stack=');
  });

  // The scalar family (i / f / r) is composed through createScalarBundle; the
  // codex `global.errorConfig` must reach it, same as it reaches m + unit groups.
  const iError = (c: CalipersBundle): string =>
    captureMessage(() => c.i(8, { min: 0, max: 10 }).multiply(2));
  const fError = (c: CalipersBundle): string =>
    captureMessage(() => c.f(0.6, { min: 0, max: 1 }).multiply(2));
  const rError = (c: CalipersBundle): string =>
    captureMessage(() => c.r(1, 0));

  it('global.errorConfig reaches i, f and r (the scalar family)', () => {
    const on = createCalipersBundle({
      global: { errorConfig: { stackHints: 'on' } },
    });
    expect(iError(on)).toContain('stack=');
    expect(fError(on)).toContain('stack=');
    expect(rError(on)).toContain('stack=');
    const off = createCalipersBundle({
      global: { errorConfig: { stackHints: 'off' } },
    });
    expect(iError(off)).not.toContain('stack=');
    expect(fError(off)).not.toContain('stack=');
    expect(rError(off)).not.toContain('stack=');
  });

  it('a scalar unit key overrides global.errorConfig', () => {
    const c = createCalipersBundle({
      global: { errorConfig: { stackHints: 'on' } },
      integer: { errorConfig: { stackHints: 'off' } },
    });
    // integer key wins -> no stack; float / ratio fall back to global -> stack
    expect(iError(c)).not.toContain('stack=');
    expect(fError(c)).toContain('stack=');
    expect(rError(c)).toContain('stack=');
  });

  it('a scalar unit key forwards a factory bound to that unit (min / max)', () => {
    const c = createCalipersBundle({
      integer: { min: 100, max: 900 },
    });
    expect(c.i(400).constraints()).toEqual({ min: 100, max: 900 });
    expect(() => c.i(50)).toThrow(/minimum/);
  });
});
