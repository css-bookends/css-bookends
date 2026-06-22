import type { Color } from 'culori';

import type { CssFormat } from '../types';
import { colorFormats } from './index';
import { hasRealAlpha, inP3, inSrgb } from './internals';
import type { ColorSpaceDescriptor } from './types';

const descriptorFor = (format: CssFormat): ColorSpaceDescriptor =>
  colorFormats[format.format] as ColorSpaceDescriptor;

/**
 * Whether a format can FAITHFULLY hold the color: its gamut contains the color, and
 * it carries alpha if the color is non-opaque. 8-bit sRGB precision is accepted as
 * faithful, so gamut + alpha are the only fit criteria.
 */
const fits = (color: Color, format: CssFormat): boolean => {
  const d = descriptorFor(format);
  const gamutOk =
    d.gamut === 'unbounded'
      ? true
      : d.gamut === 'p3'
        ? inP3(color)
        : inSrgb(color);
  const alphaOk = d.hasAlpha || !hasRealAlpha(color);
  return gamutOk && alphaOk;
};

/**
 * Resolve an output config to a single format. A single format passes through
 * unchanged (an explicit choice, no escalation). A priority list escalates to the
 * first format that faithfully holds the color, or the last entry if none do (which
 * then clamps via the render step's strictness).
 */
export const chooseFormat = (
  color: Color,
  output: CssFormat | CssFormat[],
): CssFormat => {
  if (!Array.isArray(output)) {
    return output;
  }
  for (const format of output) {
    if (fits(color, format)) {
      return format;
    }
  }
  return output[output.length - 1];
};
