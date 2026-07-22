// Cross-cutting: the two constraint systems are ORTHOGONAL.
//   System A (brand): a phantom compile-time proof, additive, dropped by arithmetic.
//   System B (runtime bound): stored min/max, carried through arithmetic, enforced by throwing on breach.
// A value can carry a runtime bound AND a NARROWER compile-time brand, and arithmetic drops the
// brand while the runtime bound travels on (its re-check is covered at runtime in
// tests/runtime/integer/integer.src.test.ts). This file pins the TYPE-level interplay.
import {
  expectAssignable,
  expectNotAssignable,
  expectType,
} from 'tsd';

import { type IInteger, type InRangeInteger } from '../../dist/index';
import { i, inRangeInteger } from '../support/calipers_tests.dist';

// A bounded builder brands its exact range, [0, 100] here. (There is no longer a way to carry a
// runtime bound WITHOUT a brand: the `hardening: 'warn'` escape that used to strip it is retired,
// since a bounded value is always in range or it throws.) It is still assignable to plain IInteger.
const bounded0to100 = i(5, { min: 0, max: 100 });
expectType<InRangeInteger<0, 100>>(bounded0to100);
expectAssignable<IInteger>(bounded0to100);

// A refinement PROVES a NARROWER [0, 10] and ADDS that brand (System A is ADDITIVE, brands stack).
// The value keeps its runtime bound [0, 100] (System B, unchanged) and now carries BOTH brands, so it
// is assignable to the narrow [0, 10] AND still to the wider [0, 100] — the two systems are orthogonal.
const provenNarrow = inRangeInteger(0, 10).ensure(bounded0to100);
expectAssignable<InRangeInteger<0, 10>>(provenNarrow);
expectAssignable<InRangeInteger<0, 100>>(provenNarrow);

// Arithmetic DROPS the brands (System A): the result is a plain IInteger and must be re-proven.
expectNotAssignable<InRangeInteger<0, 10>>(provenNarrow.add(1));
expectNotAssignable<InRangeInteger<0, 100>>(provenNarrow.add(1));
expectAssignable<IInteger>(provenNarrow.add(1));
