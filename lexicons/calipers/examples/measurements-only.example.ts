/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * The colour-free path. Importing from the `/measurements` and `/units` subpaths
 * pulls in only the measurement lexicon and its unit helpers, with NO colour, so no
 * `culori` in the dependency graph. This is the standalone, minimal-footprint way to
 * use calipers when you want typed lengths / angles / etc. and nothing else.
 */
/* eslint-disable no-restricted-syntax -- this example demonstrates the colour-free
   /measurements + /units subpaths; the create* calls are the point of the example. */
import { createCalipersFactory } from '@css-bookends/css-calipers/measurements';
import {
  createFontRelativeUnitsFactory,
  createViewportUnitsFactory,
} from '@css-bookends/css-calipers/units';

// Colour-free: the measurement core + the unit-group factories, no bundle (which
// would pull in the colour lexicon and culori).
const { m } = createCalipersFactory();
const { mRem } = createFontRelativeUnitsFactory();
const { mVw } = createViewportUnitsFactory();

export const px = m(8).css(); // '8px'
export const rem = mRem(1.5).css(); // '1.5rem'
export const vw = mVw(50).css(); // '50vw'

// arithmetic stays in measurement space; render once, at the edge.
export const doubled = m(8).multiply(2).css(); // '16px'
