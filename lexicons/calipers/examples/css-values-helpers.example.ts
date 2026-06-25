/**
 * Example-only file.
 *
 * Not part of the public API surface and not published. It demonstrates the
 * per-property CSS-value helper layer: each helper constrains a single (or
 * composite) CSS value against that property's bound, accepts the property's
 * keyword companions, and renders a `.css()` string typed against csstype.
 */

import {
  animationIterationCount,
  counterReset,
  fontWeight,
  gridColumnEnd,
  opacity,
  scale,
  span,
  zIndex,
} from '@css-bookends/css-calipers';

// --- opacity: throw (default) vs clamp (opt-in) ----------------------------

// In range: renders as-is.
export const validOpacity = opacity(0.5).css(); // '0.5'

// Out of range throws by default, so a bad value is caught at build time, not
// silently emitted.
export const opacityThrows = (): string => {
  try {
    // .toString() mirrors .css() but is always a string (csstype's Opacity
    // value type widens to include `number`, so .css() is not string-narrow).
    return opacity(1.5).toString();
  } catch (error) {
    return error instanceof Error ? error.message : 'unknown';
  }
};

// Opt in to clamping when graceful degradation is wanted: 1.5 -> 1, -0.5 -> 0.
export const clampedHigh = opacity(1.5, {
  outOfRange: 'clamp',
}).css(); // '1'
export const clampedLow = opacity(-0.5, {
  outOfRange: 'clamp',
}).css(); // '0'

// --- keyword companions pass through ---------------------------------------

// zIndex accepts the integer line OR its 'auto' keyword.
export const zIndexNumber = zIndex(10).css(); // '10'
export const zIndexAuto = zIndex('auto').css(); // 'auto'

// fontWeight accepts its [1, 1000] range AND the named-weight keywords.
export const boldNumeric = fontWeight(700).css(); // '700'
export const boldKeyword = fontWeight('bold').css(); // 'bold'

// animationIterationCount accepts a non-negative count OR 'infinite'.
export const iterateThrice = animationIterationCount(3).css(); // '3'
export const iterateForever =
  animationIterationCount('infinite').css(); // 'infinite'

// --- multi-value helpers ----------------------------------------------------

// A counter entry: a <custom-ident> with an explicit integer (the integer is
// hardened, so a non-integer would throw).
export const resetPage = counterReset([
  'page',
  1,
]).css(); // 'page 1'

// A grid line built with span(n): the count is hardened to an integer >= 1.
export const spanTwoColumns = gridColumnEnd(span(2)).css(); // 'span 2'

// scale: one to three factors (each hardened through f()), or the 'none' keyword.
export const scaleUniform = scale(1.5).css(); // '1.5'
export const scaleXYZ = scale(1, 2, 0.5).css(); // '1 2 0.5'
