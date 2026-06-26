import { describe, expect, it } from 'vitest';

import { publishBookFontWeight } from '../../src';

const fontWeight = publishBookFontWeight();

describe('font-weight: happy paths', () => {
  it('renders a constrained number', () => {
    expect(fontWeight(400).css()).toBe('400');
    expect(fontWeight(400).value()).toBe(400);
    expect(fontWeight(1).css()).toBe('1');
    expect(fontWeight(1000).css()).toBe('1000');
  });

  it('renders each keyword', () => {
    expect(fontWeight('normal').css()).toBe('normal');
    expect(fontWeight('normal').value()).toBe('normal');
    expect(fontWeight('bold').css()).toBe('bold');
    expect(fontWeight('lighter').css()).toBe('lighter');
    expect(fontWeight('bolder').css()).toBe('bolder');
  });

  it('a bare call renders the configured default', () => {
    // the book default is 'normal'.
    expect(fontWeight().css()).toBe('normal');
    // 'unset' also falls back to the default.
    expect(fontWeight('unset').css()).toBe('normal');
    const themed = publishBookFontWeight({ config: { value: 700 } });
    expect(themed().css()).toBe('700');
    expect(themed('unset').css()).toBe('700');
  });

  it('rejects an unknown keyword', () => {
    // @ts-expect-error 'heavy' is not a font-weight keyword.
    expect(() => fontWeight('heavy')).toThrow(/not a valid keyword/);
  });
});

describe('font-weight: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => fontWeight(0)).toThrow(/below the minimum/);
    expect(() => fontWeight(1001)).toThrow(/above the maximum/);
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookFontWeight({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(0).css()).toBe('1');
    expect(clamped(1001).css()).toBe('1000');
    // in-range values are untouched by clamp.
    expect(clamped(400).css()).toBe('400');
  });
});
