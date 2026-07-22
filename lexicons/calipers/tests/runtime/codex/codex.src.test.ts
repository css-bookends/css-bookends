/* eslint-disable no-restricted-syntax -- this whole file tests the codex bundle
   factory; every createCalipersBundleFactory() call here is the subject under test. */
// The codex config cascade: each unit resolves a setting as own keyed config ->
// bundle `global` -> factory default. Worked example: the shared `errorConfig`
// (see the errorConfig-cascade block below). The bundle must expose the CONFIGURED
// units, so a bundle-level `global` or per-unit key actually reaches them.
import { describe, expect, it } from 'vitest';

import {
  type CalipersBundle,
  type ColorFormatPlugin,
  type ColorString,
} from '../../../src';
import createCalipersBundleFactory from '../../../src/codex';

describe('codex config cascade (own key -> global -> factory default)', () => {
  // The color quarter of the bundle: `config.color` must forward to `createColorFactory`,
  // so a custom format plugin registered through the bundle actually reaches the
  // bound `color` instance. Previously only existence (`typeof bundle.color`) was
  // checked, leaving the forwarding path untested through the split.
  describe('color (bundle color slot forwards to createColorFactory)', () => {
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
      const c = createCalipersBundleFactory();
      expect(c.color('#3366cc').hex().css()).toBe('#3366cc');
    });

    it('forwards a custom format plugin to the bundle color instance', () => {
      const c = createCalipersBundleFactory({
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
      const c = createCalipersBundleFactory();
      expect(c.r(16, 9).css()).toBe('16/9');
    });

    it('accepts a ratio key', () => {
      const c = createCalipersBundleFactory({ ratio: {} });
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
      const c = createCalipersBundleFactory();
      expect(c.mVh(20).css()).toBe('20vh');
      expect(c.mPx(2).css()).toBe('2px');
      expect(c.mPercent(50).css()).toBe('50%');
      expect(c.isPercentMeasurement(c.mPercent(50))).toBe(true);
    });

    it('a group key threads its config to the group helpers', () => {
      const withHints = createCalipersBundleFactory({
        viewport: { errorConfig: { stackHints: 'on' } },
      });
      const withoutHints = createCalipersBundleFactory({
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
  // renders a stack hint iff the resolved errorConfig says so.
  const mError = (c: CalipersBundle): string =>
    captureMessage(() => c.m(2, 'px').divide(0));

  it('global.errorConfig applies to m when there is no unit key', () => {
    const on = createCalipersBundleFactory({
      global: { errorConfig: { stackHints: 'on' } },
    });
    expect(mError(on)).toContain('stack=');
    const off = createCalipersBundleFactory({
      global: { errorConfig: { stackHints: 'off' } },
    });
    expect(mError(off)).not.toContain('stack=');
  });

  it('the measurements key overrides global.errorConfig', () => {
    const c = createCalipersBundleFactory({
      global: { errorConfig: { stackHints: 'on' } },
      measurement: { errorConfig: { stackHints: 'off' } },
    });
    expect(mError(c)).not.toContain('stack=');
  });

  it('global.errorConfig reaches the unit-group helpers too', () => {
    // `mVh(NaN)` passes a stack-hint override, so 'auto' already shows a stack;
    // 'off' is the discriminating oracle (it suppresses despite the override).
    const off = createCalipersBundleFactory({
      global: { errorConfig: { stackHints: 'off' } },
    });
    expect(captureMessage(() => off.mVh(Number.NaN))).not.toContain(
      'stack=',
    );
  });

  it('factory default (auto, no override -> no stack) when neither is set', () => {
    expect(mError(createCalipersBundleFactory())).not.toContain(
      'stack=',
    );
  });

  // The scalar family (i / f / r) is composed through createScalarBundleFactory; the
  // codex `global.errorConfig` must reach it, same as it reaches m + unit groups.
  const iError = (c: CalipersBundle): string =>
    captureMessage(() => c.i(8, { min: 0, max: 10 }).multiply(2));
  const fError = (c: CalipersBundle): string =>
    captureMessage(() => c.f(0.6, { min: 0, max: 1 }).multiply(2));
  const rError = (c: CalipersBundle): string =>
    captureMessage(() => c.r(1, 0));

  it('global.errorConfig reaches i, f and r (the scalar family)', () => {
    const on = createCalipersBundleFactory({
      global: { errorConfig: { stackHints: 'on' } },
    });
    expect(iError(on)).toContain('stack=');
    expect(fError(on)).toContain('stack=');
    expect(rError(on)).toContain('stack=');
    const off = createCalipersBundleFactory({
      global: { errorConfig: { stackHints: 'off' } },
    });
    expect(iError(off)).not.toContain('stack=');
    expect(fError(off)).not.toContain('stack=');
    expect(rError(off)).not.toContain('stack=');
  });

  it('a scalar unit key overrides global.errorConfig', () => {
    const c = createCalipersBundleFactory({
      global: { errorConfig: { stackHints: 'on' } },
      integer: { errorConfig: { stackHints: 'off' } },
    });
    // integer key wins -> no stack; float / ratio fall back to global -> stack
    expect(iError(c)).not.toContain('stack=');
    expect(fError(c)).toContain('stack=');
    expect(rError(c)).toContain('stack=');
  });

  it('a scalar unit key forwards a factory bound to that unit (min / max)', () => {
    const c = createCalipersBundleFactory({
      integer: { min: 100, max: 900 },
    });
    expect(c.i(400).constraints()).toEqual({ min: 100, max: 900 });
    expect(() => c.i(50)).toThrow(/minimum/);
  });
});
