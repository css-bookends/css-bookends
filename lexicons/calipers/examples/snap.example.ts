/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * `snap` is the opt-in that makes a bound ABSORB an out-of-range value to its limit instead of
 * throwing: the "stay valid in production without crashing" tool. A computed value that overshoots
 * its domain snaps back in, silently. `snap` is PER-EDGE, so you can absorb one edge and still throw
 * on the other. It cascades and composes like any config; see `docs/foundations.md` ("Snap").
 */

import {
  createFloatFactory,
  createIntegerFactory,
} from '@css-bookends/css-calipers';

// OPACITY must stay in [0, 1]. A blanket `snap: true` absorbs any overshoot to the nearest limit
// rather than throwing, so a runaway animation factor can never emit invalid CSS.
const { f: opacity } = createFloatFactory({
  min: 0,
  max: 1,
  snap: true,
});

export const fadedIn = opacity(0.8).css(); // '0.8' (in range, untouched)
export const overshoot = opacity(1.4).css(); // '1'   (snapped down to max)
export const undershoot = opacity(-0.2).css(); // '0' (snapped up to min)
// A value pushed out of range by ARITHMETIC snaps too (the config is carried through operations).
export const doubled = opacity(0.6).multiply(2).css(); // '1' (1.2 -> 1)

// FONT-WEIGHT is [1, 1000], but only the TOP edge should absorb: a weight above 1000 is a harmless
// overshoot to clamp, while a weight below 1 is a real bug worth a throw. Per-edge `snap` on `max`
// only; `min` keeps the default (throw).
const { i: fontWeight } = createIntegerFactory({
  min: 1,
  max: { value: 1000, snap: true },
});

export const bold = fontWeight(700).css(); // '700'
export const clampedHeavy = fontWeight(1400).css(); // '1000' (max snaps)
export const tooLight = (): string => {
  try {
    fontWeight(0); // below the un-snapped minimum
    return 'no throw';
  } catch {
    return 'threw: below the minimum';
  }
};
