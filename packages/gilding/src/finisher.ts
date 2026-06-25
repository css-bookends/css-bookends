import {
  lightningCore,
  type LightningOptions,
} from './cores/lightningcss';
import type { FinishConfig, PostProcessCore } from './types';

/**
 * Bind a gilding finisher. Returns a `(css) => css` pass that completes browser
 * compatibility (older-browser fallbacks + vendor prefixes) for the configured
 * `targets`, via the configured `core` (default: the Lightning CSS core).
 *
 * Export the factory, never a pre-made instance: a call site binds once
 * (`const gild = createGilding({ targets })`) and runs it over emitted CSS.
 */
export const createGilding =
  <Opts = LightningOptions>(config: FinishConfig<Opts> = {}) =>
  (css: string): string => {
    const core =
      config.core ??
      (lightningCore as unknown as PostProcessCore<Opts>);
    return core.finish(
      css,
      { targets: config.targets },
      config.coreOptions,
    );
  };
