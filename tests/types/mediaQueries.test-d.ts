import { expectAssignable, expectType } from 'tsd';

import type { IMeasurement } from '../../dist/esm';
import { mPx } from '../../dist/esm';
import {
  buildMediaQueryFromFeatures,
  buildMediaQueryString,
  createMediaQueryBuilder,
  emitDimensionsFeatures,
} from '../../dist/esm/mediaQueries';

const width = mPx(640);
expectAssignable<IMeasurement<'px'>>(width);

const query = buildMediaQueryString({
  minWidth: width,
  maxWidth: mPx(1200),
  orientation: 'landscape',
});
expectType<string>(query);

const customQuery = buildMediaQueryFromFeatures({
  'min-width': width,
  'custom-level': 2,
});
expectType<string>(customQuery);

const builder = createMediaQueryBuilder({
  emitBase: emitDimensionsFeatures,
  config: {
    errorHandling: {
      invalidValueMode: 'log',
      lintingMode: 'allow',
    },
  },
});

expectType<string>(builder({ width }));
