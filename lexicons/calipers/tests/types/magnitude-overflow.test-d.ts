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
