import { DEFAULT_HARDENING, type Hardening } from './hardening';
import {
  type CoreApi,
  createCoreApi,
} from './internal/createCoreApi';
import {
  createUnitsApi,
  type UnitsApi,
} from './internal/createUnitsApi';
import {
  createErrorConfigStore,
  type ErrorConfig,
} from './internal/errors';

export type CalipersFactoryConfig = {
  errorConfig?: ErrorConfig;
  /**
   * How `m` reacts when arithmetic breaks a carried hardened bound:
   * `'ignore' | 'warn' | 'fail'` (default `'fail'`). The shared `Hardening`
   * type; also settable via the codex / compendium bundle `global`.
   */
  hardening?: Hardening;
  /**
   * The unit bare `m(value)` uses when no unit is given (default `'px'`), e.g.
   * `createCalipers({ defaultUnit: '%' }).m(50)` yields `50%`. An explicit
   * `m(value, unit)` still overrides it, and the fixed-unit helpers (`mVh`,
   * `mRem`, …) are unaffected.
   */
  defaultUnit?: string;
};

export type CalipersInstance = CoreApi &
  UnitsApi & {
    units: UnitsApi;
  };

export const createCalipers = (
  config: CalipersFactoryConfig = {},
): CalipersInstance => {
  const errorStore = createErrorConfigStore(config.errorConfig ?? {});
  const core = createCoreApi(
    errorStore,
    config.hardening ?? DEFAULT_HARDENING,
    config.defaultUnit,
  );
  const units = createUnitsApi(core);

  return {
    ...core,
    ...units,
    units,
  };
};
