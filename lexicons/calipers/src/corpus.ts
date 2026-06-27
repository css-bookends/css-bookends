// CORPUS: the css-calipers LAZY-DEFAULTS convenience entry, plus the master factory.
//
// - DEFAULT export: `createCalipersBundle`, the calipers MASTER factory. It mirrors the
//   compendium's `publishCompendium`: one keyed config (a slot per sub-factory) that binds
//   the whole calipers surface in one object. A bare `createCalipersBundle()` binds it all
//   at defaults.
// - NAMED exports: the full default set (`m` / `r` / `i` / `f` / `color`, each a
//   factory-at-defaults instance) plus the sub-factories (`createCalipers` / `createColor`),
//   so a consumer who just wants the defaults never has to bind anything.
//
// This is the convenience layer ON TOP of the factory, never a replacement: configuration
// still goes through a factory. (Per-property value helpers are the books layer now, not
// calipers.) Unlike `./measurements`, this entry is NOT colour-free: it pulls in the colour
// value primitive (and `culori`) by design.
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

export * from './index';
// `createCalipers` lives on the `./factory` real path and is not re-exported by the root;
// surface it here so the corpus exposes both sub-factories (`createCalipers` / `createColor`).
export { createCalipers };
export type { CalipersFactoryConfig, CalipersInstance };

/** The calipers master config: one OPTIONAL key per calipers sub-factory. */
export interface CalipersBundleConfig<
  P extends ReadonlyArray<ColorFormatPlugin> = readonly [],
> {
  /** forwarded to `createCalipers` (the measurement / scalar surface + units). */
  measurements?: CalipersFactoryConfig;
  /** forwarded to `createColor` (custom colour format plugins). */
  color?: CreateColorConfig<P>;
}

/** The bound calipers bundle: every helper plus the colour instance, in one object. */
export type CalipersBundle<
  P extends ReadonlyArray<ColorFormatPlugin> = readonly [],
> = CalipersInstance & { color: CustomColor<P> };

/**
 * The calipers MASTER factory: combine the two sub-factories (`createCalipers` for the
 * measurement / scalar surface, `createColor` for the colour value) under one keyed config,
 * returning every helper bound in one object. Mirrors `publishCompendium`. A bare
 * `createCalipersBundle()` binds everything at defaults; this file DEFAULT-exports it, and
 * the named re-exports above are the same helpers already bound at defaults.
 */
export const createCalipersBundle = <
  const P extends ReadonlyArray<ColorFormatPlugin> = readonly [],
>(
  config: CalipersBundleConfig<P> = {},
): CalipersBundle<P> => ({
  ...createCalipers(config.measurements),
  // when no colour config is given, P is the default `readonly []` (no custom formats),
  // so an empty formats list is the right default; the double cast satisfies the generic.
  color: createColor(
    config.color ??
      ({ formats: [] } as unknown as CreateColorConfig<P>),
  ),
});

export default createCalipersBundle;
