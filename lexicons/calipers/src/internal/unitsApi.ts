import type { UnitAssertion, UnitGuard, UnitHelper } from '../core';
import type {
  UnitDefinitionRecord,
  UnitHelperName,
} from '../unitDefinitions';

type UnitHelpersMap = {
  [K in UnitHelperName]: UnitHelper<UnitDefinitionRecord[K]['unit']>;
};

// The full unit-helper surface: every bound unit helper plus the percent
// guard / assert. It is produced at RUNTIME by the per-group unit factories, and
// the codex bundle spreads them; this type describes that combined surface (used
// to type the bundle). `createCalipersFactory` no longer carries it.
export type UnitsApi = UnitHelpersMap & {
  isPercentMeasurement: UnitGuard<UnitHelpersMap['mPercent']>;
  assertPercentMeasurement: UnitAssertion<UnitHelpersMap['mPercent']>;
};
