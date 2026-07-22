/* eslint-disable no-restricted-syntax -- this whole file tests the per-group unit
   factories; every create*Units() call is the subject under test. */
// Per-group unit factories. Each existing units/<group> module now also exposes a
// create<Group>Units factory that binds that group's helpers through createCalipersFactory,
// so a consumer can construct them from config. The bare helpers still exist for now
// (removed in a later step); this only adds the factory path.
import { describe, expect, it } from 'vitest';

import { createAbsoluteUnitsFactory } from '../../../src/units/absolute';
import { createPercentUnitsFactory } from '../../../src/units/percent';
import { createViewportUnitsFactory } from '../../../src/units/viewport';

const captureMessage = (fn: () => void): string => {
  try {
    fn();
  } catch (error) {
    return (error as Error).message;
  }
  return '';
};

describe('per-group unit factories', () => {
  it('createViewportUnitsFactory binds its viewport helpers', () => {
    const { mVh, mVw } = createViewportUnitsFactory();
    expect(mVh(20).css()).toBe('20vh');
    expect(mVw(100).css()).toBe('100vw');
  });

  it('createAbsoluteUnitsFactory binds its absolute helpers', () => {
    expect(createAbsoluteUnitsFactory().mPx(2).css()).toBe('2px');
  });

  it('createPercentUnitsFactory binds mPercent and its guard', () => {
    const { mPercent, isPercentMeasurement } =
      createPercentUnitsFactory();
    expect(mPercent(50).css()).toBe('50%');
    expect(isPercentMeasurement(mPercent(50))).toBe(true);
    expect(isPercentMeasurement(42)).toBe(false);
  });

  it('threads per-instance error config to its helpers', () => {
    const withHints = createAbsoluteUnitsFactory({
      errorConfig: { stackHints: 'on' },
    });
    const withoutHints = createAbsoluteUnitsFactory({
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
