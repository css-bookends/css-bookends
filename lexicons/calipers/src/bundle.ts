// The calipers MASTER factory + its config, in a CYCLE-FREE module so BOTH the
// package root (`@css-bookends/css-calipers`) and the `/codex` subpath can
// surface it (root re-exports it like it does `createColorFactory`; codex gets it via
// `export * from './index'`). It combines the sub-factories (`createCalipersFactory` /
// `createIntegerFactory` / `createFloatFactory` / `createColorFactory`) under one keyed config with
// the cascade: own unit key -> bundle `global` -> factory default.
import {
  type ColorFormatPlugin,
  type CreateColorConfig,
  createColorFactory,
  type CustomColor,
} from './color';
import {
  type CalipersFactoryConfig,
  type CalipersInstance,
  createCalipersFactory,
} from './factory';
import { type FloatApi, type FloatFactoryConfig } from './float';
import {
  type IntegerApi,
  type IntegerFactoryConfig,
} from './integer';
import { type ErrorConfig } from './internal/errors';
import { type UnitsApi } from './internal/unitsApi';
import { type RatioApi, type RatioFactoryConfig } from './ratio';
import { createScalarBundleFactory } from './scalar-bundle';
import {
  createAbsoluteUnitsFactory,
  createAngleUnitsFactory,
  createContainerUnitsFactory,
  createFontRelativeUnitsFactory,
  createFrequencyUnitsFactory,
  createGridUnitsFactory,
  createPercentUnitsFactory,
  createResolutionUnitsFactory,
  createTimeUnitsFactory,
  createViewportDynamicUnitsFactory,
  createViewportLargeUnitsFactory,
  createViewportSmallUnitsFactory,
  createViewportUnitsFactory,
} from './units';

/** The calipers master config: a `global` slot + one OPTIONAL key per sub-factory. */
export interface CalipersBundleConfig<
  P extends ReadonlyArray<ColorFormatPlugin> = readonly [],
> {
  /**
   * Shared options that cascade to every sub-factory. A unit's own keyed config
   * wins; otherwise it falls back here, then to the built-in factory default.
   */
  global?: {
    /** Error-rendering config (e.g. stack hints) shared across every unit. */
    errorConfig?: ErrorConfig;
    /** The blanket snap policy for the scalar family (integer / float); forwarded to the scalar
     *  bundle's `global.snap`. A unit's own `snap` (or a per-edge `snap` on `min` / `max`) overrides
     *  it. Policy only, no bound value; `m` / units / ratio have no bound, so it does not reach them. */
    snap?: boolean;
  };
  /** forwarded to `createCalipersFactory` (the measurement / scalar surface + units). */
  measurement?: CalipersFactoryConfig;
  /** forwarded to `createIntegerFactory` (the integer surface). */
  integer?: IntegerFactoryConfig;
  /** forwarded to `createFloatFactory` (the float surface). */
  float?: FloatFactoryConfig;
  /** forwarded to `createColorFactory` (custom colour format plugins). */
  color?: CreateColorConfig<P>;
  /** forwarded to `createRatioFactory` (the ratio surface). */
  ratio?: RatioFactoryConfig;
  /** forwarded to `createAbsoluteUnitsFactory` (the absolute-length helpers). */
  absolute?: CalipersFactoryConfig;
  /** forwarded to `createAngleUnitsFactory`. */
  angle?: CalipersFactoryConfig;
  /** forwarded to `createContainerUnitsFactory`. */
  container?: CalipersFactoryConfig;
  /** forwarded to `createFontRelativeUnitsFactory`. */
  fontRelative?: CalipersFactoryConfig;
  /** forwarded to `createFrequencyUnitsFactory`. */
  frequency?: CalipersFactoryConfig;
  /** forwarded to `createGridUnitsFactory`. */
  grid?: CalipersFactoryConfig;
  /** forwarded to `createPercentUnitsFactory`. */
  percent?: CalipersFactoryConfig;
  /** forwarded to `createResolutionUnitsFactory`. */
  resolution?: CalipersFactoryConfig;
  /** forwarded to `createTimeUnitsFactory`. */
  time?: CalipersFactoryConfig;
  /** forwarded to `createViewportUnitsFactory`. */
  viewport?: CalipersFactoryConfig;
  /** forwarded to `createViewportDynamicUnitsFactory`. */
  viewportDynamic?: CalipersFactoryConfig;
  /** forwarded to `createViewportLargeUnitsFactory`. */
  viewportLarge?: CalipersFactoryConfig;
  /** forwarded to `createViewportSmallUnitsFactory`. */
  viewportSmall?: CalipersFactoryConfig;
}

/** The bound calipers bundle: every helper plus the colour instance, in one object. */
export type CalipersBundle<
  P extends ReadonlyArray<ColorFormatPlugin> = readonly [],
> = CalipersInstance &
  UnitsApi &
  IntegerApi &
  FloatApi &
  RatioApi & { color: CustomColor<P> };

/**
 * The calipers MASTER factory: combine the sub-factories under one keyed config,
 * returning every helper bound in one object. Mirrors `publishCompendium`. A
 * bare `createCalipersBundleFactory()` binds everything at defaults. Each setting
 * resolves own unit key -> bundle `global` -> built-in factory default.
 */
export const createCalipersBundleFactory = <
  const P extends ReadonlyArray<ColorFormatPlugin> = readonly [],
>(
  config: CalipersBundleConfig<P> = {},
): CalipersBundle<P> => {
  // cascade for a measurement-shaped sub-config: own key -> bundle `global` ->
  // built-in factory default. `m` and the unit helpers are pure containers with
  // NO numeric config, so only `errorConfig` cascades here. `defaultUnit` is
  // forwarded unchanged from the own config.
  const cascade = (
    own?: CalipersFactoryConfig,
  ): CalipersFactoryConfig => ({
    ...own,
    errorConfig: own?.errorConfig ?? config.global?.errorConfig,
  });
  return {
    ...createCalipersFactory(cascade(config.measurement)),
    // The per-group factories are spread AFTER createCalipersFactory so a group's own
    // config (e.g. viewport) wins over the base measurement instance's helpers.
    ...createAbsoluteUnitsFactory(cascade(config.absolute)),
    ...createAngleUnitsFactory(cascade(config.angle)),
    ...createContainerUnitsFactory(cascade(config.container)),
    ...createFontRelativeUnitsFactory(cascade(config.fontRelative)),
    ...createFrequencyUnitsFactory(cascade(config.frequency)),
    ...createGridUnitsFactory(cascade(config.grid)),
    ...createPercentUnitsFactory(cascade(config.percent)),
    ...createResolutionUnitsFactory(cascade(config.resolution)),
    ...createTimeUnitsFactory(cascade(config.time)),
    ...createViewportUnitsFactory(cascade(config.viewport)),
    ...createViewportDynamicUnitsFactory(
      cascade(config.viewportDynamic),
    ),
    ...createViewportLargeUnitsFactory(cascade(config.viewportLarge)),
    ...createViewportSmallUnitsFactory(cascade(config.viewportSmall)),
    // the scalar family (integer / float / ratio) is composed through its own
    // family bundle, same pattern one level down; it applies the identical
    // own-key -> global -> default cascade internally.
    ...createScalarBundleFactory({
      global: config.global,
      integer: config.integer,
      float: config.float,
      ratio: config.ratio,
    }),
    // when no colour config is given, P is the default `readonly []` (no custom formats),
    // so an empty formats list is the right default; the double cast satisfies the generic.
    color: createColorFactory(
      config.color ??
        ({ formats: [] } as unknown as CreateColorConfig<P>),
    ),
  };
};

export default createCalipersBundleFactory;
