// Hardening-through-math, TYPE layer for `f` (the HARD RULE, matrix block 1). Mirrors
// hardening-i.test-d.ts: at the type layer `f` behaves exactly like `i` (the runtime difference,
// `divide` not throwing on a fraction, is asserted in through-math-f.src.test.ts, not here).
//
// RED until the code preserves the brand: today the arithmetic ops return a plain `IFloat`.
import { expectType } from 'tsd';

import {
  type IFloat,
  type IInteger,
  type InRangeFloat,
  type InRangeInteger,
  type NonNegativeFloat,
  type NonNegativeInteger,
  type NonPositiveFloat,
  type NonPositiveInteger,
} from '../../dist/index';
import {
  f,
  i,
  nonNegativeFloat,
  nonPositiveFloat,
} from '../support/calipers_tests.dist';

const ranged = f(5, { min: 0, max: 10 }); // InRangeFloat<0, 10>
const nonNeg = nonNegativeFloat.ensure(f(5)); // NonNegativeFloat (refinement, stored as min 0)
const nonPos = nonPositiveFloat.ensure(f(-5)); // NonPositiveFloat (refinement, stored as max 0)
const plain = f(5); // IFloat (unbounded)

// --- InRange<0, 10>: preserved through every op; clamp mints a fresh range ----------------
expectType<InRangeFloat<0, 10>>(ranged.add(1));
expectType<InRangeFloat<0, 10>>(ranged.subtract(1));
expectType<InRangeFloat<0, 10>>(ranged.multiply(2));
expectType<InRangeFloat<0, 10>>(ranged.divide(2));
expectType<InRangeFloat<0, 10>>(ranged.withValue(3));
// f.asScalar narrows Integer|Float (a whole value -> integer), so it preserves the BOUND across the
// narrowing: the result is `InRange` either way, integer or float. (i.asScalar never narrows.)
expectType<InRangeInteger<0, 10> | InRangeFloat<0, 10>>(
  ranged.asScalar(),
);
expectType<InRangeFloat<0, 10>>(ranged.clone()); // green: clone returns `this`
expectType<InRangeFloat<2, 8>>(ranged.clamp(2, 8)); // green: clamp mints

// arg-kind axis: non-literal number, a hardened scalar arg (`f.add(i(...))`), and a fractional arg
const k: number = 3;
expectType<InRangeFloat<0, 10>>(ranged.add(f(k)));
expectType<InRangeFloat<0, 10>>(ranged.add(i(1)));
expectType<InRangeFloat<0, 10>>(ranged.multiply(0.5));

// --- NonNegative: preserved through every op; clamp mints InRange -------------------------
expectType<NonNegativeFloat>(nonNeg.add(1));
expectType<NonNegativeFloat>(nonNeg.subtract(1));
expectType<NonNegativeFloat>(nonNeg.multiply(2));
expectType<NonNegativeFloat>(nonNeg.divide(2));
expectType<NonNegativeFloat>(nonNeg.withValue(3));
expectType<NonNegativeInteger | NonNegativeFloat>(nonNeg.asScalar());
expectType<NonNegativeFloat>(nonNeg.clone());
expectType<InRangeFloat<0, 8>>(nonNeg.clamp(0, 8));

// --- NonPositive: mirror of NonNegative --------------------------------------------------
expectType<NonPositiveFloat>(nonPos.add(1));
expectType<NonPositiveFloat>(nonPos.subtract(1));
expectType<NonPositiveFloat>(nonPos.multiply(2));
expectType<NonPositiveFloat>(nonPos.divide(2));
expectType<NonPositiveFloat>(nonPos.withValue(3));
expectType<NonPositiveInteger | NonPositiveFloat>(nonPos.asScalar());
expectType<NonPositiveFloat>(nonPos.clone());
expectType<InRangeFloat<-8, 0>>(nonPos.clamp(-8, 0));

// --- unbounded: nothing to preserve; every op stays plain, clamp still mints --------------
expectType<IFloat>(plain.add(1));
expectType<IFloat>(plain.subtract(1));
expectType<IFloat>(plain.multiply(2));
expectType<IFloat>(plain.divide(2));
expectType<IFloat>(plain.withValue(3));
expectType<IInteger | IFloat>(plain.asScalar()); // unbounded narrowing (already the shipped behaviour)
expectType<IFloat>(plain.clone());
expectType<InRangeFloat<0, 10>>(plain.clamp(0, 10));

// --- chains: the brand holds at EVERY step -----------------------------------------------
expectType<InRangeFloat<0, 10>>(
  ranged.add(1).multiply(2).subtract(3),
);
expectType<NonNegativeFloat>(nonNeg.add(1).multiply(2));
expectType<NonPositiveFloat>(nonPos.subtract(1).multiply(2));

// --- a single-edge bound carries NO compile brand; green locks ---------------------------
expectType<IFloat>(f(5, { min: 0 }));
expectType<IFloat>(f(5, { max: 10 }));
expectType<IFloat>(f(5, { min: 0 }).add(1));
expectType<IFloat>(f(5, { max: 10 }).multiply(2));
