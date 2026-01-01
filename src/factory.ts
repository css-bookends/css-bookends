import { createErrorConfigStore, type ErrorConfig } from './internal/errors';
import { createCoreApi, type CoreApi } from './internal/createCoreApi';
import { createUnitsApi, type UnitsApi } from './internal/createUnitsApi';
import {
  createMediaQueriesApi,
  type MediaQueriesApi,
} from './internal/createMediaQueriesApi';

export type CalipersFactoryConfig = {
  errorConfig?: ErrorConfig;
};

export type CalipersInstance = CoreApi &
  UnitsApi & {
    mediaQueries: MediaQueriesApi;
    units: UnitsApi;
  };

export const createCalipers = (
  config: CalipersFactoryConfig = {},
): CalipersInstance => {
  const errorStore = createErrorConfigStore(
    config.errorConfig ?? {},
  );
  const core = createCoreApi(errorStore);
  const units = createUnitsApi(core);
  const mediaQueries = createMediaQueriesApi(core);

  return {
    ...core,
    ...units,
    mediaQueries,
    units,
  };
};
