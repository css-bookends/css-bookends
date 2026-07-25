// S3 of the author-time magnitude layer (D4): a PROVABLE construction overflow is a COMPILE ERROR.
// `i(50, { max: 10 })` cannot be in range, so the call is rejected at author time (the runtime also
// throws). NON-NEGATIVE INTEGER LITERALS against a real bound only (tuple arithmetic, D6): a negative
// value or bound is exempt (skipped, the runtime catches it), and so are unbounded / non-literal
// constructions; every in-range one is clean (edges inclusive, the comparison is strict). `f` never gets
// this (floats are unencodable), so a float construction overflow is left to the runtime. See D2/D3/D6.
import { expectError } from 'tsd';

import { f, i } from '../support/calipers_tests.src';

// --- NEW behaviour (RED until S3 lands): a provable construction overflow is a compile error --
expectError(i(50, { max: 10 })); // over max-only
expectError(i(50, { min: 0, max: 10 })); // over max, both edges bounded
expectError(i(3, { min: 5, max: 10 })); // under min
expectError(i(3, { min: 5 })); // under a min-only bound
expectError(i(200, { min: -10, max: 100 })); // over max still fires despite a negative (skipped) min

// --- boundaries that must stay clean (GREEN before and after) ---------------------------------
i(5, { min: 0, max: 10 }); // in range
i(0, { min: 0, max: 10 }); // lower edge inclusive (strict comparison)
i(10, { min: 0, max: 10 }); // upper edge inclusive
i(50); // unbounded: nothing to overflow
i(-50, { min: -10, max: 10 }); // negative value: exempt from the compile check, the runtime throws
declare const dyn: number;
i(dyn, { min: 0, max: 10 }); // non-literal: not provable
f(50, { min: 0, max: 10 }); // f is brand-only: no compile check, the runtime throws

// --- S4: overflow through `multiply` (the captured value threads through the op) --------------
// provable overflow (RED until S4): value * factor exceeds the max. The receiver must be fully bounded
// (min + max), so it carries the ValueBrand the op reads.
expectError(i(5, { min: 0, max: 10 }).multiply(3)); // 5 * 3 = 15 > 10
expectError(i(2, { min: 0, max: 10 }).multiply(3).multiply(2)); // 6, then 12 > 10 (the value threads)
expectError(i(500, { min: 0, max: 900 }).multiply(30)); // 15000 > 900, caught via short-circuit (no ~10k wall)

// clean (GREEN before and after):
i(2, { min: 0, max: 10 }).multiply(3); // 6 <= 10
i(2, { min: 0, max: 10 }).multiply(5); // 10 = 10, upper edge inclusive
i(5, { min: 0, max: 10 }).multiply(dyn); // non-literal factor: skip
i(5, { min: 0, max: 10 }).multiply(1000); // 4-digit factor: skip, runtime catches
f(2, { min: 0, max: 5 }).multiply(3); // f is brand-only: no check

// --- S5: overflow through add / subtract / divide (the captured value threads through each op) ------
// add raises the value, so (like multiply) it can only breach the MAX; subtract / divide lower it
// (divide shrinks toward zero), so they can only breach the MIN. Same operand rules as multiply: a
// non-negative integer literal 0-999 on a FULLY BOUNDED receiver (both edges); anything else skips.
// provable overflow (RED until S5):
expectError(i(5, { min: 0, max: 10 }).add(8)); // 5 + 8 = 13 > 10
expectError(i(2, { min: 0, max: 10 }).add(3).add(6)); // 5, then 11 > 10 (the value threads)
expectError(i(2, { min: 0, max: 10 }).subtract(5)); // 2 - 5 = -3 < 0
expectError(i(9, { min: 0, max: 10 }).subtract(3).subtract(8)); // 6, then -2 < 0 (value threads)
expectError(i(3, { min: 2, max: 10 }).subtract(2)); // 3 - 2 = 1 < 2
expectError(i(10, { min: 6, max: 100 }).divide(2)); // 10 / 2 = 5 < 6 (min * k > value)
expectError(i(2, { min: 0, max: 10 }).multiply(4).subtract(20)); // 8, then -12 < 0 (threads across ops)

// clean (GREEN before and after):
i(2, { min: 0, max: 10 }).add(8); // 10 = 10, upper edge inclusive
i(2, { min: 0, max: 10 }).add(3); // 5 <= 10
i(5, { min: 0, max: 10 }).subtract(5); // 0 = 0, lower edge inclusive
i(5, { min: 0, max: 10 }).subtract(3); // 2 >= 0
i(10, { min: 5, max: 100 }).divide(2); // 5 = 5, lower edge inclusive
i(5, { min: 0, max: 10 }).add(dyn); // non-literal operand: skip
i(5, { min: 0, max: 10 }).subtract(1000); // 4-digit operand: skip
i(5, { max: 10 }).add(20); // single-edge bound: no captured value, no squiggle (runtime catches)
i(20, { min: 0, max: 100 }).divide(2).multiply(60); // divide drops the captured value, so the next op skips (runtime: 600 > 100 throws)
f(2, { min: 0, max: 5 }).add(8); // f is brand-only: no check
