import { describe, expect, it } from 'vitest';

import { publishBookFillOpacity } from '../../src';

const fillOpacity = publishBookFillOpacity();

describe('fillOpacity: happy paths', () => {
  it('renders a constrained alpha', () => {
    expect(fillOpacity(0.5).css()).toBe('0.5');
    expect(fillOpacity(0.5).value()).toBe(0.5);
    expect(fillOpacity(0).css()).toBe('0');
    expect(fillOpacity(1).css()).toBe('1');
  });

  it('a bare call renders the configured default alpha', () => {
    // the book default is 1.
    expect(fillOpacity().css()).toBe('1');
    // 'unset' also falls back to the default.
    expect(fillOpacity('unset').css()).toBe('1');
    const themed = publishBookFillOpacity({ config: { value: 0.8 } });
    expect(themed().css()).toBe('0.8');
    expect(themed('unset').css()).toBe('0.8');
  });
});

describe('fillOpacity: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => fillOpacity(1.5)).toThrow(/above the maximum/);
    expect(() => fillOpacity(-0.5)).toThrow(/below the minimum/);
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookFillOpacity({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(1.5).css()).toBe('1');
    expect(clamped(-0.5).css()).toBe('0');
    // in-range values are untouched by clamp.
    expect(clamped(0.25).css()).toBe('0.25');
  });
});
