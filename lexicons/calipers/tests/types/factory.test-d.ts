import { expectAssignable, expectError } from 'tsd';

import {
  type CalipersFactoryConfig,
  type CalipersInstance,
  createCalipers,
} from '../../dist/factory';

const config: CalipersFactoryConfig = {
  errorConfig: { stackHints: 'on' },
};

const instance = createCalipers(config);
expectAssignable<CalipersInstance>(instance);

// `defaultUnit` is an accepted factory option (the configured unit is applied
// to bare `m()` at runtime; branding the return type is a separate follow-up).
expectAssignable<CalipersFactoryConfig>({ defaultUnit: '%' });

// `hardening` is not a factory option anywhere: `m` never carried numeric config,
// and the `hardening: 'warn' | 'fail'` reaction knob on `i` / `f` was retired
// (2026-07-21). A breached bound throws; there is no reaction to configure.
expectError(createCalipers({ hardening: 'warn' }));

instance.m(10);
// unit helpers and the `units` namespace are no longer on the core instance;
// they come from the per-group factories or the codex bundle.
expectError(instance.mPx(2));
expectError(instance.units);
