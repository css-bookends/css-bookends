// Hardening-through-math, RED-HAT guard (pass 2): the HARD RULE preserves BOUND brands (InRange /
// NonNegative / NonPositive), which are kept honest by a min/max the runtime enforces. It must NOT
// preserve a CUSTOM refinement brand: `even.add(1)` is odd, and there is no bound to keep evenness
// honest. So the code CANNOT implement `add(): this` (that would preserve `Even` too, a lie); it must
// preserve only the known bound-brands and drop the rest.
//
// These are GREEN LOCKS: custom brands drop today and must KEEP dropping. They FAIL if the code ever
// preserves `this` wholesale, which is exactly the trap the HARD RULE could fall into. The bound side
// of the combo case is RED-first (the bound must start being preserved).
import {
  expectAssignable,
  expectNotAssignable,
  expectType,
} from 'tsd';

import {
  type IFloat,
  type IInteger,
  type IMeasurement,
  type InRangeInteger,
} from '../../dist/index';
import {
  f,
  i,
  m,
  makeFloatRefinement,
  makeIntegerRefinement,
  makeMeasurementRefinement,
} from '../support/calipers_tests.dist';

declare const evenBrand: unique symbol;
type EvenBrand = { readonly [evenBrand]: true };

// --- integer: a custom (non-bound) brand DROPS through arithmetic ------------------------
const evenInt = makeIntegerRefinement<EvenBrand>({
  predicate: (v) => v % 2 === 0,
  message: (v) => `expected even, got ${v.css()}`,
});
const evenI = evenInt.ensure(i(4));
expectNotAssignable<IInteger & EvenBrand>(evenI.add(1)); // odd, brand gone
expectNotAssignable<IInteger & EvenBrand>(evenI.multiply(2));
expectType<IInteger>(evenI.add(1)); // plain integer, not `this`

// --- float: mirror ------------------------------------------------------------------------
const evenFloat = makeFloatRefinement<EvenBrand>({
  predicate: (v) => v % 2 === 0,
  message: (v) => `expected even, got ${v.css()}`,
});
const evenF = evenFloat.ensure(f(4));
expectNotAssignable<IFloat & EvenBrand>(evenF.add(1));
expectType<IFloat>(evenF.add(1));

// --- measurement: mirror ------------------------------------------------------------------
const evenMeas = makeMeasurementRefinement<EvenBrand>({
  predicate: (v) => v % 2 === 0,
  message: (v) => `expected even, got ${v.css()}`,
});
const evenM = evenMeas.ensure(m(4, 'px'));
expectNotAssignable<IMeasurement<'px'> & EvenBrand>(evenM.add(1));

// --- the decisive case: a BOUND brand + a CUSTOM brand together --------------------------
// The bound survives (RED-first: it must start being preserved); the custom brand drops (GREEN lock).
const boundAndEven = evenInt.ensure(i(4, { min: 0, max: 10 })); // InRange<0,10> & Even
expectAssignable<InRangeInteger<0, 10>>(boundAndEven.add(2)); // RED now: bound must be preserved
expectNotAssignable<EvenBrand>(boundAndEven.add(1)); // lock: custom brand must drop
