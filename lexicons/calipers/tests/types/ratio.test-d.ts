/* eslint-disable no-restricted-syntax -- this whole file tests the createRatio
   factory; every createRatio() call is the subject under test. */
import { expectAssignable, expectType } from 'tsd';

import {
  createRatio,
  type IRatio,
  type RatioApi,
} from '../../dist/index';

// The ratio factory exists and returns the bound ratio surface.
expectAssignable<RatioApi>(createRatio());
// It tolerates an empty config (ratio is config-free today).
expectAssignable<RatioApi>(createRatio({}));

const ratios = createRatio();
// Its bound `r` builds ratios, and `isRatio` narrows.
expectType<IRatio>(ratios.r(16, 9));
expectType<boolean>(ratios.isRatio(ratios.r(1)));
