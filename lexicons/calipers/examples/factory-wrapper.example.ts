/* eslint-disable no-restricted-syntax -- this example demonstrates building your own
   binder and wrapping the factories; the create* calls are the point of the example. */
import { createCalipersBundleFactory } from '@css-bookends/css-calipers/codex';
import { createCalipersFactory } from '@css-bookends/css-calipers/factory';

/**
 * Example wrapper module.
 * Use the factory once, then re-export from here across your app.
 * This keeps a single import path and makes refactors cheaper.
 */
const calipers = createCalipersFactory({
  errorConfig: { stackHints: 'on' },
});

// The measurement core (m + builders) comes from `createCalipersFactory`; the bound unit
// helpers come from the codex bundle.
export const { assertMatchingUnits, assertCondition } = calipers;
export const { mPx, mPercent, mEm, mVw } =
  createCalipersBundleFactory();

/**
 * Benefit: you can make custom changes in one place without touching call sites.
 * Example wrapper below is intentionally demonstrative, not a recommended m change.
 */
export const m = (
  value: number,
  unitOrOptions?: string | { unit?: string; context?: string },
  context?: string,
) => {
  if (!unitOrOptions) {
    return calipers.m(value, '%', context);
  }
  if (typeof unitOrOptions === 'object') {
    return calipers.m(value, {
      ...unitOrOptions,
      unit: unitOrOptions.unit ?? '%',
    });
  }
  return calipers.m(value, unitOrOptions, context);
};
