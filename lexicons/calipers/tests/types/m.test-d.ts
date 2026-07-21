import {
  expectAssignable,
  expectError,
  expectNotAssignable,
} from 'tsd';

import {
  type IMeasurement,
  type MeasurementString,
  type PercentMeasurement,
  type PxMeasurement,
  type UnitAssertion,
  type UnitGuard,
} from '../../dist/index';
import {
  assertPercentMeasurement,
  i,
  isMeasurement,
  isPercentMeasurement,
  m,
  makeUnitHelperFromDefinition,
  mDeg,
  measurementMax,
  measurementMin,
  mPercent,
  mPx,
} from '../support/calipers_tests.dist';

const implicit = m(10);
expectAssignable<IMeasurement<string>>(implicit);

// The value-surface accessor is `asScalar()` (a view of the value as a scalar, not a conversion);
// the obscure `toTypedValue` name is removed.
m(10).asScalar();
expectError(m(10).toTypedValue());
expectAssignable<PxMeasurement>(implicit);

const explicitPx = m(10, 'px');
expectAssignable<IMeasurement<'px'>>(explicitPx);

const explicitEm = m(10, 'em');
expectAssignable<IMeasurement<'em'>>(explicitEm);

const implicitWithContext = m(10, { context: 'spacing.token' });
expectAssignable<PxMeasurement>(implicitWithContext);

const explicitWithContext = m(10, 'px', 'spacing.token');
expectAssignable<IMeasurement<'px'>>(explicitWithContext);

const explicitWithOptions = m(10, {
  unit: 'em',
  context: 'spacing.token',
});
expectAssignable<IMeasurement<'em'>>(explicitWithOptions);

// `m` is a pure container: it carries NO numeric config. A bound or a modifier belongs on the
// `i` / `f` you hand it (e.g. `m(i(700, { min: 1, max: 900 }), 'px')`), so passing `min` / `max` /
// `modifier` directly to `m` is a compile-time error.
expectError(m(10, { max: 10 }));
expectError(m(10, { min: 0 }));
expectError(m(10, { modifier: (n: number) => Math.floor(n) }));

// The same holds when the value is an ingested scalar: a bound on `m` is never accepted, whether the
// value is a plain number or an `i` / `f` (the scalar you pass already owns its own config).
expectError(m(i(5), { max: 10 }));

// Unit helpers are config-free too (like `m`). The factory takes only a unit name, and a bound
// helper takes only a value + optional string context, so handing either a numeric config does not
// compile.
expectError(
  makeUnitHelperFromDefinition('mDeg', {
    modifier: (n: number) => Math.floor(n),
  }),
);
expectError(mDeg(45, { max: 10 }));

const added = explicitPx.add(explicitPx);
expectAssignable<IMeasurement<'px'>>(added);

// Plain numbers remain valid operands
expectAssignable<IMeasurement<'px'>>(explicitPx.add(4));

// Mismatched units are rejected at compile time (this is what surfaces as a
// red squiggle in the editor, not just a thrown error at runtime).
expectError(explicitPx.add(explicitEm));
expectError(explicitPx.subtract(explicitEm));
expectError(explicitPx.clamp(explicitEm, explicitPx));
expectError(explicitPx.clamp(explicitPx, explicitEm));

// isMeasurement narrows unknown to IMeasurement<string>
declare const maybeMeasurement: unknown;

if (isMeasurement(maybeMeasurement)) {
  expectAssignable<IMeasurement<string>>(maybeMeasurement);
}

// Unit helpers produce correctly branded measurements
const pxFromHelper = mPx(10);
expectAssignable<PxMeasurement>(pxFromHelper);
expectAssignable<IMeasurement<'px'>>(pxFromHelper);

const pxFromHelperWithContext = mPx(10, 'spacing.token');
expectAssignable<PxMeasurement>(pxFromHelperWithContext);

const percentFromHelper = mPercent(50);
expectAssignable<PercentMeasurement>(percentFromHelper);
expectAssignable<IMeasurement<'%'>>(percentFromHelper);

// Percent guard and assertion narrow to PercentMeasurement
declare const unknownPercent: unknown;

if (isPercentMeasurement(unknownPercent)) {
  expectAssignable<PercentMeasurement>(unknownPercent);
}

declare let maybePercent: unknown;

const useAssertPercent = () => {
  assertPercentMeasurement(maybePercent);
  expectAssignable<PercentMeasurement>(maybePercent);
};

// MeasurementString is a string-like template literal
declare const pxString: MeasurementString<'px'>;
expectAssignable<string>(pxString);

// Unit-specific MeasurementStrings are not interchangeable
expectNotAssignable<MeasurementString<'em'>>(pxString);

// Fake CSS property: keywords plus measurement-like strings
type FakeMarginProperty =
  | 'auto'
  | 'fit-content'
  | MeasurementString<'px'>
  | MeasurementString<'em'>;

// Exclude measurement-shaped strings to get only keywords
type FakeSpacingKeyword = Exclude<
  FakeMarginProperty,
  MeasurementString
>;

declare const keywordOnlyMargin: FakeSpacingKeyword;
expectAssignable<'auto' | 'fit-content'>(keywordOnlyMargin);

// Measurement-shaped strings should not be accepted as keyword-only margin
expectNotAssignable<FakeSpacingKeyword>(pxString);

// measurementMin carries through the unit type
const px1 = m(1, 'px');
const px2 = m(2, 'px');
expectAssignable<IMeasurement<'px'>>(measurementMin(px1, px2));

// measurementMin / measurementMax reject mismatched units at compile time
expectError(measurementMin(px1, explicitEm));
expectError(measurementMax(px1, explicitEm));

// Generic UnitGuard / UnitAssertion types align with percent helpers
type PercentGuard = UnitGuard<typeof mPercent>;
type PercentAssert = UnitAssertion<typeof mPercent>;

expectAssignable<PercentGuard>(isPercentMeasurement);
expectAssignable<PercentAssert>(assertPercentMeasurement);

// Value-constraint refinements have their own type suite in refinement.test-d.ts.
