import { expectAssignable } from 'tsd';

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

instance.m(10);
instance.mPx(2);
instance.units.mPx(3);
