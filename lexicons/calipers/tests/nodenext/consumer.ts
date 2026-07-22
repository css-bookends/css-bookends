// nodenext resolution GUARD. This consumer imports css-calipers under
// module/moduleResolution NodeNext. Before the tsup build, the emitted `.d.ts`
// carried 185 extensionless relative imports that nodenext could not resolve
// (fine under bundler). This file type-checking green is the proof the PUBLISHED
// types resolve under nodenext. If it goes red, the exports/build regressed.
import { createCalipersBundleFactory } from '@css-bookends/css-calipers';
// eslint-disable-next-line no-restricted-imports -- consumer resolution smoke: imports the built package surface directly to prove it resolves under nodenext
import { colorFormats } from '@css-bookends/css-calipers/color';
import { createAbsoluteUnitsFactory } from '@css-bookends/css-calipers/units';

// A consumer smoke test: it MUST bind the built package itself (a test binder can't
// stand in) to prove nodenext resolution, so these factory calls are the point.
// eslint-disable-next-line no-restricted-syntax -- consumer resolution smoke
const { color, f, i, m, nonNegative, r } =
  createCalipersBundleFactory();
// eslint-disable-next-line no-restricted-syntax -- consumer resolution smoke
const { mPx } = createAbsoluteUnitsFactory();

const px: string = m(8).css();
const hex: string = color('#3366cc').hex().css();
const ratio: string = r(16, 9).css();
const int: string = i(3).css();
const flt: string = f(1.5).css();
const rem: string = mPx(4).css();
const hardened = nonNegative.ensure(m(2)).css();

void [
  px,
  hex,
  ratio,
  int,
  flt,
  rem,
  hardened,
  colorFormats,
];
