// Scalar (i / f) refinements mirror the measurement quartet: a runtime check that
// returns the same value branded, so a function can demand a bounded scalar and the
// compiler rejects an unchecked one. The brands REUSE the measurement brand symbols
// (InRangeBrand etc.), so a scalar brand is structurally the same tag on IInteger / IFloat.
import {
  expectAssignable,
  expectError,
  expectNotAssignable,
} from 'tsd';

import {
  type IFloat,
  type IInteger,
  type InRangeBrand,
  type InRangeFloat,
  type InRangeInteger,
  type NonNegativeFloat,
  type NonNegativeInteger,
  type NonPositiveInteger,
} from '../../dist/index';
import {
  f,
  i,
  inRangeFloat,
  inRangeInteger,
  makeIntegerRefinement,
  nonNegativeFloat,
  nonNegativeInteger,
  nonPositiveInteger,
} from '../support/calipers_tests.dist';

// ensure narrows an integer to the matching brand; the alias matches.
const geZeroInt = nonNegativeInteger.ensure(i(4));
expectAssignable<NonNegativeInteger>(geZeroInt);
expectAssignable<IInteger>(geZeroInt);

const leZeroInt = nonPositiveInteger.ensure(i(-4));
expectAssignable<NonPositiveInteger>(leZeroInt);

// inRangeInteger exposes its literal bounds in the type (exact-bound, not containment).
const r0to10 = inRangeInteger(0, 10).ensure(i(4));
expectAssignable<InRangeInteger<0, 10>>(r0to10);
expectAssignable<InRangeInteger>(r0to10); // assignable to the unbounded form
expectNotAssignable<InRangeInteger<0, 5>>(r0to10); // a different range is distinct

declare function needs0to10(value: InRangeInteger<0, 10>): void;
needs0to10(r0to10);
expectError(needs0to10(inRangeInteger(0, 5).ensure(i(4))));
expectError(needs0to10(i(4))); // a plain integer is unproven

// A plain integer carries no constraint brand.
expectNotAssignable<NonNegativeInteger>(i(4));
expectNotAssignable<InRangeInteger>(i(4));

// Arithmetic drops the brand - the result must be re-checked.
expectNotAssignable<NonNegativeInteger>(geZeroInt.add(1));
expectNotAssignable<NonNegativeInteger>(geZeroInt.multiply(2));

// The scalar brand reuses the measurement brand symbol (structurally shared).
expectAssignable<IInteger & InRangeBrand<0, 10>>(r0to10);

// Float mirrors integer.
const geZeroF = nonNegativeFloat.ensure(f(0.5));
expectAssignable<NonNegativeFloat>(geZeroF);
expectAssignable<IFloat>(geZeroF);
const rangedF = inRangeFloat(0, 1).ensure(f(0.5));
expectAssignable<InRangeFloat<0, 1>>(rangedF);

// makeIntegerRefinement is generic over an arbitrary brand.
declare const evenBrand: unique symbol;
type EvenBrand = { readonly [evenBrand]: true };
const evenInt = makeIntegerRefinement<EvenBrand>({
  predicate: (value) => value % 2 === 0,
  message: (value) => `expected even, got ${value.css()}`,
});
const evenI = evenInt.ensure(i(4));
expectAssignable<IInteger & EvenBrand>(evenI);
expectNotAssignable<NonNegativeInteger>(evenI);
