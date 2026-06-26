import { describe, expect, it } from 'vitest';

import { publishBookZoom } from '../../src';

const zoom = publishBookZoom();

describe('zoom: happy paths', () => {
  it('renders a constrained factor', () => {
    expect(zoom(0.5).css()).toBe('0.5');
    expect(zoom(0.5).value()).toBe(0.5);
    expect(zoom(0).css()).toBe('0');
    expect(zoom(2).css()).toBe('2');
  });

  it('a bare call renders the configured default factor', () => {
    // the book default is 1.
    expect(zoom().css()).toBe('1');
    // 'unset' also falls back to the default.
    expect(zoom('unset').css()).toBe('1');
    const themed = publishBookZoom({ config: { value: 1.5 } });
    expect(themed().css()).toBe('1.5');
    expect(themed('unset').css()).toBe('1.5');
  });
});

describe('zoom: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => zoom(-0.5)).toThrow(/below the minimum/);
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookZoom({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(-0.5).css()).toBe('0');
    // in-range values are untouched by clamp.
    expect(clamped(0.25).css()).toBe('0.25');
  });
});
