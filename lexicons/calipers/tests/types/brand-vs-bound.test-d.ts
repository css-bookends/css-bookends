// Cross-cutting: the two constraint systems are ORTHOGONAL.
//   System A (brand): a phantom compile-time proof, additive, dropped by arithmetic.
//   System B (runtime bound): stored min/max, carried through arithmetic, enforced by hardening.
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

// A runtime bound [0, 100] WITHOUT a construction brand: under `warn` the builder does not brand
// (a warn breach would drop the bound, so the InRange proof would be dishonest). So this value
// carries the runtime bound but is a plain IInteger at the type level.
const bounded0to100 = i(5, {
  min: 0,
  max: 100,
  hardening: 'warn',
});
expectAssignable<IInteger>(bounded0to100);
expectNotAssignable<InRangeInteger<0, 100>>(bounded0to100);

// A refinement then PROVES the narrower [0, 10] and brands it. Now the value has a runtime bound
// of [0, 100] and a compile-time brand of [0, 10] — the brand is narrower than the bound.
const provenNarrow = inRangeInteger(0, 10).ensure(bounded0to100);
expectType<InRangeInteger<0, 10>>(provenNarrow);
// The brand is exact-bound, so the wider [0, 100] is NOT the brand it carries.
expectNotAssignable<InRangeInteger<0, 100>>(provenNarrow);

// Arithmetic DROPS the brand (System A): the result is a plain IInteger and must be re-proven.
expectNotAssignable<InRangeInteger<0, 10>>(provenNarrow.add(1));
expectAssignable<IInteger>(provenNarrow.add(1));
