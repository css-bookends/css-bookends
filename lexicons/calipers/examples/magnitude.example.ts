/**
 * Example-only file, and the reason for the opt-in magnitude ESLint rule.
 *
 * Calipers keeps `i` / `f` types as STRICT as possible, so `tsc` catches an out-of-range magnitude at
 * COMPILE time however deep the chain, correctness is never in question. The gap is purely LIVE: past
 * some depth the strict type work outruns what the IDE's language server recomputes on every
 * keystroke, so the editor quietly stops guiding you (the build still fails). The rule runs on
 * file-edit and evaluates the real JS math, restoring that live guidance. It does NOT replace `tsc`;
 * it fills in for the IDE where TS's live feedback drops out.
 */

import { createIntegerFactory } from '@css-bookends/css-calipers';

const { i: budget } = createIntegerFactory({ min: 0, max: 100 });

// A compounding chain that overflows: 1 * 2^7 = 128, above the max 100. The rule evaluates it and
// reports on file-edit: `budget(1).multiply(2)... = 128 is above the maximum 100`. On a chain this
// short TS still guides you live; deepen the compounding and TS's live feedback drops out first,
// while the rule keeps reporting. `tsc` fails the build either way.
export const overBudget = () =>
  budget(1)
    .multiply(2)
    .multiply(2)
    .multiply(2)
    .multiply(2)
    .multiply(2)
    .multiply(2)
    .multiply(2);

// In range stays quiet (1 * 2^6 = 64, within [0, 100]).
export const inBudget = () =>
  budget(1)
    .multiply(2)
    .multiply(2)
    .multiply(2)
    .multiply(2)
    .multiply(2)
    .multiply(2)
    .css();
