import { expectAssignable, expectError, expectType } from 'tsd';

import { type IFloat, type InRangeFloat } from '../../dist/index';
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

const u: unknown = f(0.5);
if (isFloat(u)) {
  expectAssignable<IFloat>(u);
}

// the value must be a number
expectError(f('0.5'));
// options only accept the known constraint keys
expectError(f(0.5, { nope: true }));
