/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * calipers is a CSS DESIGN-TOKEN library: it types and validates the raw values a design system
 * defines. Each token below is a NAMED DOMAIN TYPE built from a factory bound once, so `fontWeight`
 * only accepts 100-900 and `opacity` only 0-1 — an out-of-range token is a construction error, not a
 * silent bug. (A Layer-2 book turns these typed values into `{ fontWeight: '400' }`; here we define
 * the tokens themselves.)
 */

import {
  createFloat,
  createInteger,
} from '@css-bookends/css-calipers';

import { m } from './calipers_examples.ts';

// font-weight: an integer token constrained to the usable <font-weight> range.
const { i: fontWeight } = createInteger({ min: 100, max: 900 });
export const regular = fontWeight(400).css(); // '400'
export const bold = fontWeight(700).css(); // '700'
export const fontWeightOutOfRange = (): string => {
  try {
    fontWeight(1000); // above 900
    return 'no throw';
  } catch (error) {
    return error instanceof Error ? error.message : 'unknown';
  }
};

// opacity: a float token constrained to [0, 1].
const { f: opacity } = createFloat({ min: 0, max: 1 });
export const halfOpaque = opacity(0.5).css(); // '0.5'
export const opacityOutOfRange = (): string => {
  try {
    opacity(2); // above 1
    return 'no throw';
  } catch (error) {
    return error instanceof Error ? error.message : 'unknown';
  }
};

// z-index: an integer token with a stacking scale (a design-system layer budget).
const { i: zIndex } = createInteger({ min: 0, max: 9999 });
export const modalLayer = zIndex(1000).css(); // '1000'

// a bounded MEASUREMENT token: a radius scale checked at construction.
export const radius = m(8, { unit: 'px', min: 0, max: 24 }).css(); // '8px'
export const radiusBound = m(8, {
  unit: 'px',
  min: 0,
  max: 24,
}).constraints(); // { min: 0, max: 24 }
