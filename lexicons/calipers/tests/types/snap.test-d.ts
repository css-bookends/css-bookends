import { expectAssignable, expectError, expectType } from 'tsd';

import {
  createFloatFactory,
  createIntegerFactory,
  type IFloat,
  type IInteger,
  type InRangeFloat,
  type InRangeInteger,
} from '../../dist/index';
import { f, i } from '../support/calipers_tests.dist';

// SPEC for the `snap` CONFIG type (docs/foundations.md, "Snap"). RED until the code lands: `snap`
// and the object edge form (`{ value?, snap? }`) are not in the config type yet, so every valid case
// below is an unexpected type error, and every branding assertion fails, until the union ships.

// ── snap: valid configs typecheck ────────────────────────────────────────────
// blanket only (no per-edge)
expectAssignable<IInteger>(createIntegerFactory({ snap: true }).i(5));
// blanket + bare bounds: snap governs both edges; branding still holds.
expectType<InRangeInteger<0, 100>>(
  createIntegerFactory({ min: 0, max: 100, snap: true }).i(50),
);
// blanket + ONE edge opting out via the object form (co-locates value + snap).
expectType<InRangeInteger<0, 100>>(
  createIntegerFactory({
    min: 0,
    max: { value: 100, snap: false },
    snap: true,
  }).i(50),
);
// per-edge snap, NO blanket: both edges may carry their own snap.
expectType<InRangeInteger<0, 100>>(
  createIntegerFactory({
    min: { value: 0, snap: true },
    max: { value: 100, snap: false },
  }).i(50),
);
// per-value snap.
expectAssignable<IInteger>(
  i(50, { max: { value: 100, snap: true } }),
);
expectAssignable<IInteger>(i(50, { min: 0, max: 100, snap: true }));

// float mirrors.
expectType<InRangeFloat<0, 1>>(
  createFloatFactory({ min: 0, max: 1, snap: true }).f(0.5),
);
expectAssignable<IFloat>(f(0.5, { min: 0, max: 1, snap: true }));

// ── the dead-blanket redundancy ban is a COMPILE error ────────────────────────
// blanket set AND both edges override it -> the blanket is dead -> rejected.
expectError(
  createIntegerFactory({
    min: { value: 0, snap: false },
    max: { value: 100, snap: false },
    snap: true,
  }),
);
expectError(
  i(50, { min: { snap: false }, max: { snap: false }, snap: true }),
);

// snap must be a boolean.
expectError(createIntegerFactory({ min: 0, max: 100, snap: 'yes' }));
expectError(i(50, { max: { value: 100, snap: 1 } }));
