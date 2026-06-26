import { describe, expect, it } from 'vitest';

import { publishBookColumnCount } from '../../src';

const columnCount = publishBookColumnCount();

describe('column-count: happy paths', () => {
  it('renders a constrained positive integer', () => {
    expect(columnCount(3).css()).toBe('3');
    expect(columnCount(3).value()).toBe(3);
    expect(columnCount(1).css()).toBe('1');
  });

  it('renders the auto keyword', () => {
    expect(columnCount('auto').css()).toBe('auto');
    expect(columnCount('auto').value()).toBe('auto');
  });

  it('a bare call renders the configured default', () => {
    // the book default is 'auto'.
    expect(columnCount().css()).toBe('auto');
    // 'unset' also falls back to the default.
    expect(columnCount('unset').css()).toBe('auto');
    const themed = publishBookColumnCount({ config: { value: 2 } });
    expect(themed().css()).toBe('2');
    expect(themed('unset').css()).toBe('2');
  });

  it('rejects an unknown keyword', () => {
    // @ts-expect-error 'fill' is not a column-count keyword.
    expect(() => columnCount('fill')).toThrow(/not a valid keyword/);
  });
});

describe('column-count: out of range', () => {
  it('throws on a value below the minimum by default', () => {
    expect(() => columnCount(0)).toThrow(/below the minimum/);
  });

  it('throws on a non-integer value', () => {
    expect(() => columnCount(1.5)).toThrow();
  });
});
