/* eslint-disable no-restricted-syntax -- this whole file tests createScalarBundle;
   every create*() call is the subject under test. */
// createScalarBundle is the SCALAR FAMILY bundle: it groups the integer / float /
// ratio unit factories under one `{ global?, integer?, float?, ratio? }` config with
// the SAME cascade as the codex (own key -> bundle global -> factory default),
// mirroring `src/bundle.ts` one level down. The codex composes it. This is the
// "same pattern all the way down" family bundle; see the `config-cascade` skill.
import { describe, expect, it } from 'vitest';

import { createScalarBundle } from '../../../src/scalar-bundle';

describe('createScalarBundle (scalar family bundle)', () => {
  it('returns the whole scalar surface (integer + float + ratio)', () => {
    const s = createScalarBundle();
    // integer
    expect(s.i(3).value()).toBe(3);
    expect(s.isInteger(s.i(3))).toBe(true);
    // float
    expect(s.f(1.5).value()).toBe(1.5);
    expect(s.isFloat(s.f(1.5))).toBe(true);
    // ratio
    expect(s.r(16, 9).css()).toBe('16/9');
    expect(s.isRatio(s.r(16, 9))).toBe(true);
  });

  describe('errorConfig cascade -> integer, float AND ratio', () => {
    const captureMessage = (fn: () => void): string => {
      try {
        fn();
      } catch (error) {
        return (error as Error).message;
      }
      return '';
    };
    // discriminating throws: i / f breach their max; r hits a zero denominator.
    const iError = (
      s: ReturnType<typeof createScalarBundle>,
    ): string =>
      captureMessage(() => s.i(8, { min: 0, max: 10 }).multiply(2));
    const fError = (
      s: ReturnType<typeof createScalarBundle>,
    ): string =>
      captureMessage(() => s.f(0.6, { min: 0, max: 1 }).multiply(2));
    const rError = (
      s: ReturnType<typeof createScalarBundle>,
    ): string => captureMessage(() => s.r(1, 0));

    it('the global reaches integer, float and ratio when there is no unit key', () => {
      const on = createScalarBundle({
        global: { errorConfig: { stackHints: 'on' } },
      });
      expect(iError(on)).toContain('stack=');
      expect(fError(on)).toContain('stack=');
      expect(rError(on)).toContain('stack=');
      const off = createScalarBundle({
        global: { errorConfig: { stackHints: 'off' } },
      });
      expect(iError(off)).not.toContain('stack=');
      expect(fError(off)).not.toContain('stack=');
      expect(rError(off)).not.toContain('stack=');
    });

    it('a unit key overrides the global (per unit)', () => {
      const mixed = createScalarBundle({
        global: { errorConfig: { stackHints: 'on' } },
        integer: { errorConfig: { stackHints: 'off' } },
      });
      // integer key wins -> no stack; float / ratio fall back to the global -> stack
      expect(iError(mixed)).not.toContain('stack=');
      expect(fError(mixed)).toContain('stack=');
      expect(rError(mixed)).toContain('stack=');
    });

    it('defaults to auto (no override -> no stack) when neither is set', () => {
      const s = createScalarBundle();
      expect(iError(s)).not.toContain('stack=');
      expect(fError(s)).not.toContain('stack=');
      expect(rError(s)).not.toContain('stack=');
    });
  });
});
