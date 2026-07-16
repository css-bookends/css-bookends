/* eslint-disable no-restricted-syntax -- this whole file tests the per-group unit
   factories; every create*Units() call is the subject under test. */
// Per-group unit factories. Each existing units/<group> module now also exposes a
// create<Group>Units factory that binds that group's helpers through createCalipers,
// so a consumer can construct them from config. The bare helpers still exist for now
// (removed in a later step); this only adds the factory path.
import { describe, expect, it } from 'vitest';

import { createAbsoluteUnits } from '../../../src/units/absolute';
import { createPercentUnits } from '../../../src/units/percent';
import { createViewportUnits } from '../../../src/units/viewport';

const captureMessage = (fn: () => void): string => {
  try {
    fn();
  } catch (error) {
    return (error as Error).message;
  }
  return '';
};

describe('per-group unit factories', () => {
  it('createViewportUnits binds its viewport helpers', () => {
    const { mVh, mVw } = createViewportUnits();
    expect(mVh(20).css()).toBe('20vh');
    expect(mVw(100).css()).toBe('100vw');
  });

  it('createAbsoluteUnits binds its absolute helpers', () => {
    expect(createAbsoluteUnits().mPx(2).css()).toBe('2px');
  });

  it('createPercentUnits binds mPercent and its guard', () => {
    const { mPercent, isPercentMeasurement } = createPercentUnits();
    expect(mPercent(50).css()).toBe('50%');
    expect(isPercentMeasurement(mPercent(50))).toBe(true);
    expect(isPercentMeasurement(42)).toBe(false);
  });

  it('threads per-instance error config to its helpers', () => {
    const withHints = createAbsoluteUnits({
      errorConfig: { stackHints: 'on' },
    });
    const withoutHints = createAbsoluteUnits({
      errorConfig: { stackHints: 'off' },
    });
    expect(captureMessage(() => withHints.mPx(Number.NaN))).toContain(
      'stack=',
    );
    expect(
      captureMessage(() => withoutHints.mPx(Number.NaN)),
    ).not.toContain('stack=');
  });
});
