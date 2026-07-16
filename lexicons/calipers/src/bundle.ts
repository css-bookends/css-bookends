// The calipers MASTER factory + its config, in a CYCLE-FREE module so BOTH the
// package root (`@css-bookends/css-calipers`) and the `/codex` subpath can
// surface it (root re-exports it like it does `createColor`; codex gets it via
// `export * from './index'`). It combines the sub-factories (`createCalipers` /
// `createInteger` / `createFloat` / `createColor`) under one keyed config with
// the cascade: own unit key -> bundle `global` -> factory default.
import {
  type ColorFormatPlugin,
  createColor,
  type CreateColorConfig,
  type CustomColor,
} from './color';
import {
  type CalipersFactoryConfig,
  type CalipersInstance,
  createCalipers,
} from './factory';
import { type FloatApi, type FloatFactoryConfig } from './float';
import { type Hardening } from './hardening';
import {
  type IntegerApi,
  type IntegerFactoryConfig,
} from './integer';
import { type ErrorConfig } from './internal/errors';
import { type UnitsApi } from './internal/unitsApi';
import { type RatioApi, type RatioFactoryConfig } from './ratio';
import { createScalarBundle } from './scalar-bundle';
import {
  createAbsoluteUnits,
  createAngleUnits,
  createContainerUnits,
  createFontRelativeUnits,
  createFrequencyUnits,
  createGridUnits,
  createPercentUnits,
  createResolutionUnits,
  createTimeUnits,
  createViewportDynamicUnits,
  createViewportLargeUnits,
  createViewportSmallUnits,
  createViewportUnits,
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
    /** Hardening reaction for the measurement / scalar surface. */
    hardening?: Hardening;
    /** Error-rendering config (e.g. stack hints) shared across every unit. */
    errorConfig?: ErrorConfig;
  };
  /** forwarded to `createCalipers` (the measurement / scalar surface + units). */
  measurement?: CalipersFactoryConfig;
  /** forwarded to `createInteger` (the integer surface). */
  integer?: IntegerFactoryConfig;
  /** forwarded to `createFloat` (the float surface). */
  float?: FloatFactoryConfig;
  /** forwarded to `createColor` (custom colour format plugins). */
  color?: CreateColorConfig<P>;
  /** forwarded to `createRatio` (the ratio surface). */
  ratio?: RatioFactoryConfig;
  /** forwarded to `createAbsoluteUnits` (the absolute-length helpers). */
  absolute?: CalipersFactoryConfig;
  /** forwarded to `createAngleUnits`. */
  angle?: CalipersFactoryConfig;
  /** forwarded to `createContainerUnits`. */
  container?: CalipersFactoryConfig;
  /** forwarded to `createFontRelativeUnits`. */
  fontRelative?: CalipersFactoryConfig;
  /** forwarded to `createFrequencyUnits`. */
  frequency?: CalipersFactoryConfig;
  /** forwarded to `createGridUnits`. */
  grid?: CalipersFactoryConfig;
  /** forwarded to `createPercentUnits`. */
  percent?: CalipersFactoryConfig;
  /** forwarded to `createResolutionUnits`. */
  resolution?: CalipersFactoryConfig;
  /** forwarded to `createTimeUnits`. */
  time?: CalipersFactoryConfig;
  /** forwarded to `createViewportUnits`. */
  viewport?: CalipersFactoryConfig;
  /** forwarded to `createViewportDynamicUnits`. */
  viewportDynamic?: CalipersFactoryConfig;
  /** forwarded to `createViewportLargeUnits`. */
  viewportLarge?: CalipersFactoryConfig;
  /** forwarded to `createViewportSmallUnits`. */
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
 * bare `createCalipersBundle()` binds everything at defaults. Each setting
 * resolves own unit key -> bundle `global` -> built-in factory default.
 */
export const createCalipersBundle = <
  const P extends ReadonlyArray<ColorFormatPlugin> = readonly [],
>(
  config: CalipersBundleConfig<P> = {},
): CalipersBundle<P> => {
  // cascade for a measurement-shaped sub-config: own key -> bundle `global` ->
  // built-in factory default. Forwards errorConfig / defaultUnit unchanged.
  const cascade = (
    own?: CalipersFactoryConfig,
  ): CalipersFactoryConfig => ({
    ...own,
    hardening: own?.hardening ?? config.global?.hardening,
    errorConfig: own?.errorConfig ?? config.global?.errorConfig,
  });
  return {
    ...createCalipers(cascade(config.measurement)),
    // The per-group factories are spread AFTER createCalipers so a group's own
    // config (e.g. viewport) wins over the base measurement instance's helpers.
    ...createAbsoluteUnits(cascade(config.absolute)),
    ...createAngleUnits(cascade(config.angle)),
    ...createContainerUnits(cascade(config.container)),
    ...createFontRelativeUnits(cascade(config.fontRelative)),
    ...createFrequencyUnits(cascade(config.frequency)),
    ...createGridUnits(cascade(config.grid)),
    ...createPercentUnits(cascade(config.percent)),
    ...createResolutionUnits(cascade(config.resolution)),
    ...createTimeUnits(cascade(config.time)),
    ...createViewportUnits(cascade(config.viewport)),
    ...createViewportDynamicUnits(cascade(config.viewportDynamic)),
    ...createViewportLargeUnits(cascade(config.viewportLarge)),
    ...createViewportSmallUnits(cascade(config.viewportSmall)),
    // the scalar family (integer / float / ratio) is composed through its own
    // family bundle, same pattern one level down; it applies the identical
    // own-key -> global -> default cascade internally.
    ...createScalarBundle({
      global: config.global,
      integer: config.integer,
      float: config.float,
      ratio: config.ratio,
    }),
    // when no colour config is given, P is the default `readonly []` (no custom formats),
    // so an empty formats list is the right default; the double cast satisfies the generic.
    color: createColor(
      config.color ??
        ({ formats: [] } as unknown as CreateColorConfig<P>),
    ),
  };
};

export default createCalipersBundle;
