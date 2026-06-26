import { describe, expect, it } from 'vitest';

import { publishBookFlexGrow } from '../../src';

const flexGrow = publishBookFlexGrow();

describe('flexGrow: happy paths', () => {
  it('renders a constrained factor', () => {
    expect(flexGrow(0.5).css()).toBe('0.5');
    expect(flexGrow(0.5).value()).toBe(0.5);
    expect(flexGrow(0).css()).toBe('0');
    expect(flexGrow(2).css()).toBe('2');
  });

  it('a bare call renders the configured default factor', () => {
    // the book default is 0.
    expect(flexGrow().css()).toBe('0');
    // 'unset' also falls back to the default.
    expect(flexGrow('unset').css()).toBe('0');
    const themed = publishBookFlexGrow({ config: { value: 1 } });
    expect(themed().css()).toBe('1');
    expect(themed('unset').css()).toBe('1');
  });
});

describe('flexGrow: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => flexGrow(-0.5)).toThrow(/below the minimum/);
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookFlexGrow({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(-0.5).css()).toBe('0');
    // in-range values are untouched by clamp.
    expect(clamped(0.25).css()).toBe('0.25');
  });
});
