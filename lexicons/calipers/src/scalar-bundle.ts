// The SCALAR FAMILY bundle, in its own module (like the codex `./bundle`) so it can
// compose the integer / float / ratio sub-factories WITHOUT the cycle that would form
// if it lived in the leaf `./scalar` operand module (which integer / float / ratio all
// value-import for `toNumber`). It combines the three scalar unit factories under one
// keyed config with the SAME cascade as the codex: own unit key -> bundle `global` ->
// factory default. Mirrors `createCalipersBundle` one level down; see the
// `config-cascade` skill, "Same pattern all the way down".
import {
  createFloat,
  type FloatApi,
  type FloatFactoryConfig,
} from './float';
import {
  createInteger,
  type IntegerApi,
  type IntegerFactoryConfig,
} from './integer';
import { type ErrorConfig } from './internal/errors';
import {
  createRatio,
  type RatioApi,
  type RatioFactoryConfig,
} from './ratio';

/** The scalar family config: a `global` slot + one OPTIONAL key per sub-factory. */
export interface ScalarBundleConfig {
  /**
   * Shared options that cascade to every scalar sub-factory. A unit's own keyed
   * config wins; otherwise it falls back here, then to the built-in factory default.
   */
  global?: {
    /** Error-rendering config (e.g. stack hints) shared across integer / float / ratio. */
    errorConfig?: ErrorConfig;
  };
  /** forwarded to `createInteger` (the integer surface). */
  integer?: IntegerFactoryConfig;
  /** forwarded to `createFloat` (the float surface). */
  float?: FloatFactoryConfig;
  /** forwarded to `createRatio` (the ratio surface; config-free today). */
  ratio?: RatioFactoryConfig;
}

/** The bound scalar surface: integer + float + ratio helpers in one object. */
export type ScalarBundle = IntegerApi & FloatApi & RatioApi;

/**
 * The SCALAR family factory: combine the integer / float / ratio sub-factories under
 * one keyed config, returning every scalar helper bound in one object. Mirrors
 * `createCalipersBundle` one level down; the codex composes THIS instead of spreading
 * the three scalar factories itself. A bare `createScalarBundle()` binds everything at
 * defaults. Each setting resolves own unit key -> bundle `global` -> factory default.
 */
export const createScalarBundle = (
  config: ScalarBundleConfig = {},
): ScalarBundle => {
  // cascade a scalar sub-config: own key -> bundle `global` -> factory default, for
  // `errorConfig`. `IntegerFactoryConfig` and `FloatFactoryConfig` share the same shape,
  // so one helper covers integer and float.
  const cascade = (
    own?: IntegerFactoryConfig,
  ): IntegerFactoryConfig => ({
    ...own,
    errorConfig: own?.errorConfig ?? config.global?.errorConfig,
  });
  // Ratio takes an errorConfig-only forward.
  const cascadeRatio = (
    own?: RatioFactoryConfig,
  ): RatioFactoryConfig => ({
    ...own,
    errorConfig: own?.errorConfig ?? config.global?.errorConfig,
  });
  return {
    ...createInteger(cascade(config.integer)),
    ...createFloat(cascade(config.float)),
    ...createRatio(cascadeRatio(config.ratio)),
  };
};

export default createScalarBundle;
