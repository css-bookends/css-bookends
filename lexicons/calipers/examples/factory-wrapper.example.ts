import { createCalipersBundle } from '@css-bookends/css-calipers/codex';
import { createCalipers } from '@css-bookends/css-calipers/factory';

/**
 * Example wrapper module.
 * Use the factory once, then re-export from here across your app.
 * This keeps a single import path and makes refactors cheaper.
 */
const calipers = createCalipers({
  errorConfig: { stackHints: 'on' },
});

// The measurement core (m + builders) comes from `createCalipers`; the bound unit
// helpers come from the codex bundle.
export const { assertMatchingUnits, assertCondition } = calipers;
export const { mPx, mPercent, mEm, mVw } = createCalipersBundle();

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
