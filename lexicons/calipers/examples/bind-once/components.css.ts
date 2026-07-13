// A consumer stylesheet. RECOMMENDED: import the bound helpers from ./calipers, so
// nothing here reaches into css-calipers directly.
import { createCalipers } from '@css-bookends/css-calipers/factory';

import { color, f, i, m, mPercent, r } from './calipers';

// A media card, using every lexicon, all from the bare binding module.
export const card = {
  padding: m(16).css(), // '16px'   measurement
  borderRadius: m(8).css(), // '8px'
  color: color('#1a1a1a').css(), // colour
  backgroundColor: color('#ffffff').css(), // colour
  lineHeight: f(1.5).css(), // '1.5'    float (unitless real)
  zIndex: i(10).css(), // '10'     integer (unitless whole)
};

export const thumbnail = {
  aspectRatio: r(16, 9).css(), // '16/9'   ratio (its natural CSS home)
  width: mPercent(100).css(), // '100%'   percent
  borderRadius: m(8).css(),
};

// A factory called inline with a config override (a rem-first `m`), instead of
// binding it once in ./calipers. It scatters config across files. Not best
// practice, but you're free to author your project your way.
const remM = createCalipers({ defaultUnit: 'rem' }).m;
export const hero = {
  fontSize: remM(2).css(), // '2rem'
};
