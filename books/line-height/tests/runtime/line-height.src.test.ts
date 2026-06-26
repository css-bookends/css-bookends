import { describe, expect, it } from 'vitest';

import { publishBookLineHeight } from '../../src';

const lineHeight = publishBookLineHeight();

describe('line-height: happy paths', () => {
  it('renders a constrained number', () => {
    expect(lineHeight(1.5).css()).toBe('1.5');
    expect(lineHeight(1.5).value()).toBe(1.5);
    expect(lineHeight(0).css()).toBe('0');
    expect(lineHeight(2).css()).toBe('2');
  });

  it('renders the normal keyword', () => {
    expect(lineHeight('normal').css()).toBe('normal');
    expect(lineHeight('normal').value()).toBe('normal');
  });

  it('a bare call renders the configured default', () => {
    // the book default is 'normal'.
    expect(lineHeight().css()).toBe('normal');
    // 'unset' also falls back to the default.
    expect(lineHeight('unset').css()).toBe('normal');
    const themed = publishBookLineHeight({ config: { value: 1.4 } });
    expect(themed().css()).toBe('1.4');
    expect(themed('unset').css()).toBe('1.4');
  });

  it('rejects an unknown keyword', () => {
    // @ts-expect-error 'tight' is not a line-height keyword.
    expect(() => lineHeight('tight')).toThrow(/not a valid keyword/);
  });
});

describe('line-height: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => lineHeight(-0.5)).toThrow(/below the minimum/);
  });
});
