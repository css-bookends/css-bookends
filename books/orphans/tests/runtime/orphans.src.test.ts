import { describe, expect, it } from 'vitest';

import { publishBookOrphans } from '../../src';

const orphans = publishBookOrphans();

describe('orphans: happy paths', () => {
  it('renders a constrained count', () => {
    expect(orphans(3).css()).toBe('3');
    expect(orphans(3).value()).toBe(3);
    expect(orphans(1).css()).toBe('1');
    expect(orphans(10).css()).toBe('10');
  });

  it('a bare call renders the configured default count', () => {
    // the book default is 2.
    expect(orphans().css()).toBe('2');
    // 'unset' also falls back to the default.
    expect(orphans('unset').css()).toBe('2');
    const themed = publishBookOrphans({ config: { value: 4 } });
    expect(themed().css()).toBe('4');
    expect(themed('unset').css()).toBe('4');
  });
});

describe('orphans: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => orphans(0)).toThrow(/below the minimum/);
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookOrphans({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(0).css()).toBe('1');
    // in-range values are untouched by clamp.
    expect(clamped(3).css()).toBe('3');
  });
});
