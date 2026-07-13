// nodenext resolution GUARD. This consumer imports css-calipers under
// module/moduleResolution NodeNext. Before the tsup build, the emitted `.d.ts`
// carried 185 extensionless relative imports that nodenext could not resolve
// (fine under bundler). This file type-checking green is the proof the PUBLISHED
// types resolve under nodenext. If it goes red, the exports/build regressed.
import {
  color,
  f,
  i,
  m,
  nonNegative,
  r,
} from '@css-bookends/css-calipers';
import { colorFormats } from '@css-bookends/css-calipers/color';
import { mPx } from '@css-bookends/css-calipers/measurements';

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
