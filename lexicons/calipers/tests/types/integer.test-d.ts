import { expectAssignable, expectError, expectType } from 'tsd';

import {
  createIntegerFactory,
  type IInteger,
  type InRangeInteger,
} from '../../dist/index';
import { i, isInteger } from '../support/calipers_tests.dist';

const n = i(5);
expectAssignable<IInteger>(n);
expectAssignable<string>(n.css());
expectAssignable<number>(n.value());
expectAssignable<IInteger>(n.add(2));
expectAssignable<IInteger>(n.add(i(1)));
expectAssignable<IInteger>(n.withValue(3));
expectAssignable<IInteger>(n.clamp(0, 10));
// clamp brands the result with its exact literal bound (System A).
expectType<InRangeInteger<0, 10>>(n.clamp(0, 10));
expectAssignable<IInteger>(i(5, { min: 0, max: 10 }));

const bounded = i(700, { min: 1, max: 1000 });
expectAssignable<IInteger>(bounded);

// createIntegerFactory bakes a bound; its `i` ALWAYS brands every value with the factory's
// exact range (System B surfaced as System A) — a bounded value is always in range
// (it throws otherwise), so the proof always holds.
const { i: fontWeight } = createIntegerFactory({
  min: 100,
  max: 900,
});
expectType<InRangeInteger<100, 900>>(fontWeight(400));

// clone() preserves the receiver's brand (same value + bound, so the proof still holds).
expectType<InRangeInteger<100, 900>>(fontWeight(400).clone());
// a plain integer's clone stays plain.
expectType<IInteger>(i(5).clone());

// the `hardening` reaction knob is retired (2026-07-21): a bounded builder cannot
// opt out of enforcement, so `hardening` is no longer a valid option (any value).
expectError(
  createIntegerFactory({ min: 100, max: 900, hardening: 'warn' }),
);
expectError(
  createIntegerFactory({ min: 100, max: 900, hardening: 'fail' }),
);

// a per-value bound brands the same way; a per-call `hardening` is rejected.
expectType<InRangeInteger<0, 10>>(i(5, { min: 0, max: 10 }));
expectError(i(5, { min: 0, max: 10, hardening: 'warn' }));

// an unbounded integer is never branded.
expectType<IInteger>(i(5));

// a call's contextual type must NOT be able to back-infer a foreign brand: a plain
// integer, or one bounded to a different range, cannot satisfy a demand for [0, 10].
declare function needsInRange0to10(
  value: InRangeInteger<0, 10>,
): void;
expectError(needsInRange0to10(i(4)));
expectError(needsInRange0to10(fontWeight(400)));

const u: unknown = i(5);
if (isInteger(u)) {
  expectAssignable<IInteger>(u);
}

// the value must be a number
expectError(i('5'));
// options only accept the known constraint keys
expectError(i(5, { nope: true }));
