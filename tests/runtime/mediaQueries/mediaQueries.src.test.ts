import { runMediaQueryTests } from './mediaQueries.shared';

import { mDpi, mPx } from '../../../src';
import {
  buildMediaQueryFromFeatures,
  buildMediaQueryString,
  createMediaQueryBuilder,
  emitCustomFeatures,
  emitDimensionsFeatures,
  emitResolutionFeatures,
} from '../../../src/mediaQueries';

runMediaQueryTests('src', {
  buildMediaQueryFromFeatures,
  buildMediaQueryString,
  createMediaQueryBuilder,
  emitCustomFeatures,
  emitDimensionsFeatures,
  emitResolutionFeatures,
  mDpi,
  mPx,
});
