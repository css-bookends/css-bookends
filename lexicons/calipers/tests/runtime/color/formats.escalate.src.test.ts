import { describe, expect, it } from 'vitest';

import { type ColorInput } from '../../../src/color';
import { color as colorValue } from '../../support/calipers_tests.src';

/**
 * Output escalation: when `output` is a priority list, `.css()` emits the FIRST
 * format that faithfully holds the color (its gamut contains it + alpha if needed),
 * staying as simple as possible. A single-format `output` does not escalate. The
 * default config is unchanged here; this binds an explicit priority list.
 */

// The planned default ladder (hex first), as an explicit config.
const PRIORITY = [
  colorValue.formats.hex,
  colorValue.formats.rgb,
  colorValue.formats.hexAlpha,
  colorValue.formats.rgba,
  colorValue.formats.hsl,
  colorValue.formats.hwb,
  colorValue.formats.displayP3,
  colorValue.formats.lab,
  colorValue.formats.lch,
  colorValue.formats.oklab,
  colorValue.formats.oklch,
];
// Bind the explicit priority-list config, mirroring the old factory-bound book.
const color = (input: ColorInput) =>
  colorValue(input, { output: PRIORITY });

describe('output escalation — emit the simplest faithful format', () => {
  it('opaque, in sRGB -> hex (the simplest)', () => {
    expect(color('#3366cc').css()).toBe('#3366cc');
  });

  it('alpha, in sRGB -> hexAlpha (skips no-alpha hex/rgb)', () => {
    expect(color('#3366cc80').css()).toBe('#3366cc80');
  });

  it('outside sRGB but within P3 -> display-p3', () => {
    expect(color('color(display-p3 0 1 0)').css()).toMatch(
      /^color\(display-p3 /,
    );
  });

  it('beyond P3 -> the first unbounded format (lab)', () => {
    expect(color('oklch(0.7 0.37 150)').css()).toMatch(/^lab\(/);
  });

  it('a single-format config does not escalate', () => {
    expect(
      colorValue('#3366cc', {
        output: colorValue.formats.rgba,
      }).css(),
    ).toBe('rgba(51, 102, 204, 1)');
  });
});
