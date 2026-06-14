import { describe, expect, it } from 'vitest';

import * as colorPackage from '../../src';
import { colorFormats, publishBookColor } from '../../src';

/*
 * The factory contract: the book is consumed ONLY through `publishBookColor` (never a
 * pre-built instance), and the factory takes the 3 config options output/base/strictness.
 */

describe('color — factory-only contract (no pre-built instance)', () => {
  it('exports the publishBookColor factory', () => {
    expect(typeof publishBookColor).toBe('function');
  });

  it('ships NO ready-made color instance - you must bind via the factory', () => {
    // a bare `color` export would let consumers skip the factory; there must be none.
    expect('color' in colorPackage).toBe(false);
    expect(
      (colorPackage as Record<string, unknown>).color,
    ).toBeUndefined();
  });

  it('the factory yields a usable, callable book', () => {
    const color = publishBookColor();
    expect(typeof color).toBe('function');
    expect(color('#3366cc').css()).toBe('rgba(51, 102, 204, 1)');
  });
});

describe('color — factory config #1: output (default format)', () => {
  it('binds the format that bare .css() renders', () => {
    const color = publishBookColor({
      config: { output: colorFormats.hex },
    });
    expect(color('#3366cc').css()).toBe('#3366cc');
  });

  it('defaults to rgba (alpha slot always shown)', () => {
    expect(publishBookColor()('#3366cc').css()).toBe(
      'rgba(51, 102, 204, 1)',
    );
  });
});

describe('color — factory config #2: base (bare-call color)', () => {
  it('a bare call resolves the configured base', () => {
    const color = publishBookColor({ config: { base: 'red' } });
    expect(color().css()).toBe('rgba(255, 0, 0, 1)');
  });

  it('defaults the base to black', () => {
    expect(publishBookColor()().css()).toBe('rgba(0, 0, 0, 1)');
  });
});

describe('color — factory config #3: strictness (violation handling)', () => {
  it("'silent' suppresses the alpha-drop violation and still renders", () => {
    const color = publishBookColor({
      config: { strictness: 'silent' },
    });
    expect(color('#3366cc80').css(colorFormats.rgb)).toBe(
      'rgb(51, 102, 204)',
    );
  });

  it("'throw' raises on a violation regardless of env", () => {
    const color = publishBookColor({
      config: { strictness: 'throw' },
    });
    expect(() => color('#3366cc80').css(colorFormats.rgb)).toThrow();
  });
});
