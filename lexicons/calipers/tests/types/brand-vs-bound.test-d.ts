// The two constraint systems, updated 2026-07-24 for the HARD RULE + set-once bounds:
//   - System A (brand): a phantom compile-time proof.
//   - System B (runtime bound): stored min/max, enforced by throwing / snapping on breach.
// A value now carries AT MOST ONE range brand: a bound is set ONCE, and re-bounding an already-bounded
// value throws (refinements apply to UNBOUNDED values; to change a bound, mint a fresh value). The
// runtime re-bounding throw is covered in tests/runtime/hardening/through-math-i.src.test.ts. That
// single brand is PRESERVED through arithmetic (the HARD RULE), kept honest by the runtime bound.
import { expectAssignable, expectType } from 'tsd';

import { type IInteger, type InRangeInteger } from '../../dist/index';
import { i } from '../support/calipers_tests.dist';

// A bounded builder brands its exact range, [0, 100] here, and is still assignable to plain IInteger.
const bounded0to100 = i(5, { min: 0, max: 100 });
expectType<InRangeInteger<0, 100>>(bounded0to100);
expectAssignable<IInteger>(bounded0to100);

// The HARD RULE: arithmetic PRESERVES the single range brand; the runtime bound keeps it honest
// (an out-of-range result throws, so the preserved brand is never a lie).
expectType<InRangeInteger<0, 100>>(bounded0to100.add(1));
expectType<InRangeInteger<0, 100>>(bounded0to100.subtract(1));
expectType<InRangeInteger<0, 100>>(bounded0to100.multiply(2));
expectType<InRangeInteger<0, 100>>(bounded0to100.divide(2));
