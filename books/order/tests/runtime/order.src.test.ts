import { describe, expect, it } from 'vitest';

import { publishBookOrder } from '../../src';

const order = publishBookOrder();

describe('order: happy paths', () => {
  it('renders a constrained ordinal', () => {
    expect(order(2).css()).toBe('2');
    expect(order(2).value()).toBe(2);
    expect(order(0).css()).toBe('0');
    expect(order(10).css()).toBe('10');
  });

  it('a bare call renders the configured default ordinal', () => {
    // the book default is 0.
    expect(order().css()).toBe('0');
    // 'unset' also falls back to the default.
    expect(order('unset').css()).toBe('0');
    const themed = publishBookOrder({ config: { value: 3 } });
    expect(themed().css()).toBe('3');
    expect(themed('unset').css()).toBe('3');
  });
});

describe('order: unbounded integer', () => {
  it('accepts negative ordinals (the property is unbounded)', () => {
    expect(order(-1).css()).toBe('-1');
    expect(order(-1).value()).toBe(-1);
    expect(order(-5).css()).toBe('-5');
  });

  it('accepts negatives with the default and the clamp policy alike', () => {
    const clamped = publishBookOrder({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(-2).css()).toBe('-2');
    expect(clamped(4).css()).toBe('4');
  });
});
