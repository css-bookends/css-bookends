import { describe, expect, it } from 'vitest';

import { publishBookShapeImageThreshold } from '../../src';

const shapeImageThreshold = publishBookShapeImageThreshold();

describe('shapeImageThreshold: happy paths', () => {
  it('renders a constrained alpha', () => {
    expect(shapeImageThreshold(0.5).css()).toBe('0.5');
    expect(shapeImageThreshold(0.5).value()).toBe(0.5);
    expect(shapeImageThreshold(0).css()).toBe('0');
    expect(shapeImageThreshold(1).css()).toBe('1');
  });

  it('a bare call renders the configured default alpha', () => {
    // the book default is 0.
    expect(shapeImageThreshold().css()).toBe('0');
    // 'unset' also falls back to the default.
    expect(shapeImageThreshold('unset').css()).toBe('0');
    const themed = publishBookShapeImageThreshold({
      config: { value: 0.8 },
    });
    expect(themed().css()).toBe('0.8');
    expect(themed('unset').css()).toBe('0.8');
  });
});

describe('shapeImageThreshold: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => shapeImageThreshold(1.5)).toThrow(
      /above the maximum/,
    );
    expect(() => shapeImageThreshold(-0.5)).toThrow(
      /below the minimum/,
    );
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookShapeImageThreshold({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(1.5).css()).toBe('1');
    expect(clamped(-0.5).css()).toBe('0');
    // in-range values are untouched by clamp.
    expect(clamped(0.25).css()).toBe('0.25');
  });
});
