/* eslint-disable no-restricted-syntax -- this whole file tests the createRatioFactory
   factory; every createRatioFactory() call is the subject under test. */
import { expectAssignable, expectType } from 'tsd';

import {
  createRatioFactory,
  type IRatio,
  type RatioApi,
} from '../../dist/index';

// The ratio factory exists and returns the bound ratio surface.
expectAssignable<RatioApi>(createRatioFactory());
// It tolerates an empty config (ratio is config-free today).
expectAssignable<RatioApi>(createRatioFactory({}));

const ratios = createRatioFactory();
// Its bound `r` builds ratios, and `isRatio` narrows.
expectType<IRatio>(ratios.r(16, 9));
expectType<boolean>(ratios.isRatio(ratios.r(1)));
