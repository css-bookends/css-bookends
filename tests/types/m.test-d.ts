import { expectAssignable } from 'tsd';

import { m, type IMeasurement } from '../../dist/esm';

const implicit = m(10);
expectAssignable<IMeasurement<string>>(implicit);

const explicitPx = m(10, 'px');
expectAssignable<IMeasurement<'px'>>(explicitPx);

const explicitEm = m(10, 'em');
expectAssignable<IMeasurement<'em'>>(explicitEm);

const added = explicitPx.add(explicitPx);
expectAssignable<IMeasurement<'px'>>(added);
