// Hardening-through-math, TYPE layer for `i` (the HARD RULE, matrix block 1 in docs/magnitude.md).
// Every value-producing op keeps the receiver's brand; ONLY `clamp` mints a fresh `InRange`.
// This file asserts column A (the brand). Runtime value / throw / snap (columns B / C) live in
// tests/runtime/hardening/through-math-i.src.test.ts.
//
// RED until the code preserves the brand: today `add` / `subtract` / `multiply` / `divide` /
// `withValue` / `asScalar` return a plain `IInteger`, so every brand-preserving assertion below
// fails. `clone` (returns `this`) and `clamp` (mints) are already green and lock that behaviour.
import { expectAssignable, expectType } from 'tsd';

import {
  type IInteger,
  type InRangeInteger,
  type NonNegativeInteger,
  type NonPositiveInteger,
} from '../../dist/index';
import {
  f,
  i,
  nonNegativeInteger,
  nonPositiveInteger,
} from '../support/calipers_tests.dist';

// One receiver per brand in play (matrix "Brands in play").
const ranged = i(5, { min: 0, max: 10 }); // InRangeInteger<0, 10> (both edges, per-value bound)
const nonNeg = nonNegativeInteger.ensure(i(5)); // NonNegativeInteger (refinement, stored as min 0)
const nonPos = nonPositiveInteger.ensure(i(-5)); // NonPositiveInteger (refinement, stored as max 0)
const plain = i(5); // IInteger (unbounded, nothing to preserve)

// --- InRange<0, 10>: preserved through every op; clamp mints a fresh range ----------------
expectType<InRangeInteger<0, 10>>(ranged.add(1));
expectType<InRangeInteger<0, 10>>(ranged.subtract(1));
expectType<InRangeInteger<0, 10>>(ranged.multiply(2));
expectType<InRangeInteger<0, 10>>(ranged.divide(2));
expectType<InRangeInteger<0, 10>>(ranged.withValue(3));
expectType<InRangeInteger<0, 10>>(ranged.asScalar());
expectAssignable<InRangeInteger<0, 10>>(ranged.clone()); // clone returns `this`, now with a ValueBrand phantom (S2)
expectType<InRangeInteger<2, 8>>(ranged.clamp(2, 8)); // green: clamp mints InRange<2, 8>

// arg-kind axis: a non-literal number arg, and a hardened scalar arg (`i.add(f(...))`). The
// receiver's brand is preserved regardless of the arg.
const k: number = 3;
expectType<InRangeInteger<0, 10>>(ranged.add(i(k)));
expectType<InRangeInteger<0, 10>>(ranged.add(f(1)));

// --- NonNegative: preserved through every op; clamp mints InRange -------------------------
expectType<NonNegativeInteger>(nonNeg.add(1));
expectType<NonNegativeInteger>(nonNeg.subtract(1));
expectType<NonNegativeInteger>(nonNeg.multiply(2));
expectType<NonNegativeInteger>(nonNeg.divide(2));
expectType<NonNegativeInteger>(nonNeg.withValue(3));
expectType<NonNegativeInteger>(nonNeg.asScalar());
expectType<NonNegativeInteger>(nonNeg.clone());
expectType<InRangeInteger<0, 8>>(nonNeg.clamp(0, 8));

// --- NonPositive: mirror of NonNegative --------------------------------------------------
expectType<NonPositiveInteger>(nonPos.add(1));
expectType<NonPositiveInteger>(nonPos.subtract(1));
expectType<NonPositiveInteger>(nonPos.multiply(2));
expectType<NonPositiveInteger>(nonPos.divide(2));
expectType<NonPositiveInteger>(nonPos.withValue(3));
expectType<NonPositiveInteger>(nonPos.asScalar());
expectType<NonPositiveInteger>(nonPos.clone());
expectType<InRangeInteger<-8, 0>>(nonPos.clamp(-8, 0));

// --- unbounded: nothing to preserve; every op stays plain, clamp still mints --------------
expectType<IInteger>(plain.add(1));
expectType<IInteger>(plain.subtract(1));
expectType<IInteger>(plain.multiply(2));
expectType<IInteger>(plain.divide(2));
expectType<IInteger>(plain.withValue(3));
expectType<IInteger>(plain.asScalar());
expectType<IInteger>(plain.clone());
expectType<InRangeInteger<0, 10>>(plain.clamp(0, 10));

// --- chains: the brand holds at EVERY step, not just the first (matrix "multi-op CHAINS") --
expectType<InRangeInteger<0, 10>>(
  ranged.add(1).multiply(2).subtract(3),
);
expectType<NonNegativeInteger>(nonNeg.add(1).multiply(2));
expectType<NonPositiveInteger>(nonPos.subtract(1).multiply(2));

// --- a single-edge bound carries NO compile brand (matrix "general {min:k}/{max:k}" row):
//     the System-B bound is runtime-only, so the type stays plain. Green locks. ------------
expectType<IInteger>(i(5, { min: 0 }));
expectType<IInteger>(i(5, { max: 10 }));
expectType<IInteger>(i(5, { min: 0 }).add(1));
expectType<IInteger>(i(5, { max: 10 }).multiply(2));
