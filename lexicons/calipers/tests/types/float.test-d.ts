import { expectAssignable, expectError } from 'tsd';

import { type IFloat } from '../../dist/index';
import { f, isFloat } from '../support/calipers_tests.dist';

const n = f(0.5);
expectAssignable<IFloat>(n);
expectAssignable<string>(n.css());
expectAssignable<number>(n.value());
expectAssignable<IFloat>(n.add(0.1));
expectAssignable<IFloat>(n.add(f(0.1)));
expectAssignable<IFloat>(n.withValue(0.25));
expectAssignable<IFloat>(n.clamp(0, 1));
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
