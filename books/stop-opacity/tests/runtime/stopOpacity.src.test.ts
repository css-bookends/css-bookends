import { describe, expect, it } from 'vitest';

import { publishBookStopOpacity } from '../../src';

const stopOpacity = publishBookStopOpacity();

describe('stopOpacity: happy paths', () => {
  it('renders a constrained alpha', () => {
    expect(stopOpacity(0.5).css()).toBe('0.5');
    expect(stopOpacity(0.5).value()).toBe(0.5);
    expect(stopOpacity(0).css()).toBe('0');
    expect(stopOpacity(1).css()).toBe('1');
  });

  it('a bare call renders the configured default alpha', () => {
    // the book default is 1.
    expect(stopOpacity().css()).toBe('1');
    // 'unset' also falls back to the default.
    expect(stopOpacity('unset').css()).toBe('1');
    const themed = publishBookStopOpacity({ config: { value: 0.8 } });
    expect(themed().css()).toBe('0.8');
    expect(themed('unset').css()).toBe('0.8');
  });
});

describe('stopOpacity: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => stopOpacity(1.5)).toThrow(/above the maximum/);
    expect(() => stopOpacity(-0.5)).toThrow(/below the minimum/);
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookStopOpacity({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(1.5).css()).toBe('1');
    expect(clamped(-0.5).css()).toBe('0');
    // in-range values are untouched by clamp.
    expect(clamped(0.25).css()).toBe('0.25');
  });
});
