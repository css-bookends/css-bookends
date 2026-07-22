import type { IMeasurement, InscribedMeasurement } from '../../core';
import { type Scalar } from '../../scalar';
import { ScalarBase } from '../scalarBase';
import { type IUnspecified, u } from '../unspecified';
import { type MeasurementClass } from './class';
import { type MeasurementContext } from './context';

// `m` is a PURE CONTAINER: it carries NO numeric config. A bound / modifier belong on the
// `i` / `f` you hand it (`m(i(700, { min: 1, max: 900 }), 'px')`), never on `m` itself. So its options
// are only the unit + an error context.
export type MeasurementCreateOptions<Unit extends string> = {
  unit?: Unit;
  context?: string;
};

/**
 * The construction module: build a measurement from a plain number or an ingested scalar. Takes the
 * context (error store, default unit) and the `Measurement` class produced by `makeMeasurementClass`.
 */
export const makeConstruct = (
  ctx: MeasurementContext,
  Measurement: MeasurementClass,
) => {
  const { errorStore, defaultUnit } = ctx;

  // Single controlled point where the unit brand is asserted onto a freshly created measurement
  // (the brand is a compile-time-only phantom). The scalar has already validated its value.
  const createMeasurement = <Unit extends string>(
    scalar: IUnspecified,
    unit: Unit,
  ): InscribedMeasurement<Unit> =>
    new Measurement(
      scalar,
      unit,
    ) as unknown as InscribedMeasurement<Unit>;

  // Build a measurement from a PLAIN numeric value: embed a `u` carrying ONLY error plumbing (no
  // bound or modifier — `m` is a pure container). The `u` validates finiteness at its own
  // construction, so a non-finite value throws there, through this instance's error store. Used by
  // `m()` for a plain number and by every unit helper.
  const buildMeasurement = <Unit extends string>(
    value: number,
    normalizedUnit: Unit,
    contextLabel: string | undefined,
  ): InscribedMeasurement<Unit> =>
    createMeasurement(
      u(value, {
        errorStore,
        context: contextLabel,
        // The embedded scalar names the measurement in its errors: `m(u): ...`.
        wrapperLabel: 'm',
      }),
      normalizedUnit,
    );

  const isMeasurement = (x: unknown): x is IMeasurement<string> =>
    x instanceof Measurement;

  function m(value: Scalar): InscribedMeasurement<'px'>;
  function m(
    value: Scalar,
    options: { context?: string },
  ): InscribedMeasurement<'px'>;
  function m<Unit extends string>(
    value: Scalar,
    unit: Unit,
    context?: string,
  ): InscribedMeasurement<Lowercase<Unit>>;
  function m<Unit extends string>(
    value: Scalar,
    options: MeasurementCreateOptions<Unit>,
  ): InscribedMeasurement<Lowercase<Unit>>;
  function m<Unit extends string>(
    value: Scalar,
    unitOrOptions:
      | Unit
      | MeasurementCreateOptions<Unit> = defaultUnit as Unit,
    context?: string,
  ): InscribedMeasurement<Lowercase<Unit>> {
    const options: MeasurementCreateOptions<Unit> =
      unitOrOptions && typeof unitOrOptions === 'object'
        ? unitOrOptions
        : { unit: unitOrOptions, context };
    const unit = (options.unit ?? defaultUnit) as Unit;
    const contextLabel = options.context;
    const normalizedUnit = unit.toLowerCase() as Lowercase<Unit>;

    // A typed scalar (i / f) is INGESTED as-is: it already owns its numeric config (value, bound,
    // modifier, integer-ness), so the measurement embeds it directly and delegates. `m`
    // adds NO numeric config of its own (it is a pure container), so there is nothing to reconcile: a
    // bound / modifier rides on the scalar you pass in, or you mint a fresh value.
    if (typeof value === 'object' && value !== null) {
      // Embed the ingested scalar under the `m` wrapper so its errors name the measurement AND the
      // subtype (`m(i): ...`), preserving its full config. Every scalar is a `ScalarBase` (that is
      // where `embedUnder` lives); the guard is a defensive narrow.
      const embedded =
        value instanceof ScalarBase
          ? value.embedUnder('m', contextLabel)
          : (value as unknown as IUnspecified);
      return createMeasurement(embedded, normalizedUnit);
    }

    // A plain number embeds a `u` carrying only m's error store (no bound / modifier).
    // The `u` validates finiteness at construction.
    return buildMeasurement(value, normalizedUnit, contextLabel);
  }

  return { createMeasurement, buildMeasurement, isMeasurement, m };
};

/** The construction module's shape, so a downstream module can type it as a dependency. */
export type Construct = ReturnType<typeof makeConstruct>;
