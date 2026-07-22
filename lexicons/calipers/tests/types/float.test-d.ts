import { expectAssignable, expectError, expectType } from 'tsd';

import {
  createFloatFactory,
  type IFloat,
  type InRangeFloat,
} from '../../dist/index';
import { f, isFloat } from '../support/calipers_tests.dist';

const n = f(0.5);
expectAssignable<IFloat>(n);
expectAssignable<string>(n.css());
expectAssignable<number>(n.value());
expectAssignable<IFloat>(n.add(0.1));
expectAssignable<IFloat>(n.add(f(0.1)));
expectAssignable<IFloat>(n.withValue(0.25));
expectAssignable<IFloat>(n.clamp(0, 1));
// clamp brands the result with its exact literal bound (System A).
expectType<InRangeFloat<0, 1>>(n.clamp(0, 1));
expectAssignable<IFloat>(f(0.5, { min: 0, max: 1 }));

const opacity = f(0.25, { min: 0, max: 1 });
expectAssignable<IFloat>(opacity);

// createFloatFactory bakes a bound; its `f` ALWAYS brands every value with the factory's
// exact range (System B surfaced as System A) — a bounded value is always in range
// (it throws otherwise), so the proof always holds.
const { f: alpha } = createFloatFactory({ min: 0, max: 1 });
expectType<InRangeFloat<0, 1>>(alpha(0.5));

// clone() preserves the receiver's brand (same value + bound, so the proof still holds).
expectType<InRangeFloat<0, 1>>(alpha(0.5).clone());
// a plain float's clone stays plain.
expectType<IFloat>(f(0.5).clone());

// the `hardening` reaction knob is retired (2026-07-21): a bounded builder cannot
// opt out of enforcement, so `hardening` is no longer a valid option (any value).
expectError(
  createFloatFactory({ min: 0, max: 1, hardening: 'warn' }),
);
expectError(
  createFloatFactory({ min: 0, max: 1, hardening: 'fail' }),
);

// a per-value bound brands the same way; a per-call `hardening` is rejected.
expectType<InRangeFloat<0, 1>>(f(0.5, { min: 0, max: 1 }));
expectError(f(0.5, { min: 0, max: 1, hardening: 'warn' }));

// an unbounded float is never branded.
expectType<IFloat>(f(0.5));

// a call's contextual type must NOT be able to back-infer a foreign brand: a plain
// float cannot satisfy a demand for [0, 1] ...
declare function needsInRange0to1(value: InRangeFloat<0, 1>): void;
expectError(needsInRange0to1(f(0.5)));
// ... and a float bounded to a DIFFERENT range (here [0, 1]) cannot satisfy [0, 2].
declare function needsInRange0to2(value: InRangeFloat<0, 2>): void;
expectError(needsInRange0to2(alpha(0.5)));

const u: unknown = f(0.5);
if (isFloat(u)) {
  expectAssignable<IFloat>(u);
}

// the value must be a number
expectError(f('0.5'));
// options only accept the known constraint keys
expectError(f(0.5, { nope: true }));
