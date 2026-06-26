import { describe, expect, it } from 'vitest';

import { publishBookMathDepth } from '../../src';

const mathDepth = publishBookMathDepth();

describe('math-depth: happy paths', () => {
  it('renders a constrained integer', () => {
    expect(mathDepth(2).css()).toBe('2');
    expect(mathDepth(2).value()).toBe(2);
    expect(mathDepth(0).css()).toBe('0');
    expect(mathDepth(-1).css()).toBe('-1');
  });

  it('renders the auto-add keyword', () => {
    expect(mathDepth('auto-add').css()).toBe('auto-add');
    expect(mathDepth('auto-add').value()).toBe('auto-add');
  });

  it('a bare call renders the configured default', () => {
    // the book default is 0.
    expect(mathDepth().css()).toBe('0');
    // 'unset' also falls back to the default.
    expect(mathDepth('unset').css()).toBe('0');
    const themed = publishBookMathDepth({ config: { value: 3 } });
    expect(themed().css()).toBe('3');
    expect(themed('unset').css()).toBe('3');
  });

  it('rejects an unknown keyword', () => {
    // @ts-expect-error 'auto' is not a math-depth keyword.
    expect(() => mathDepth('auto')).toThrow(/not a valid keyword/);
  });
});

describe('math-depth: out of range', () => {
  it('throws on a non-integer number by default', () => {
    expect(() => mathDepth(1.5)).toThrow();
  });
});
