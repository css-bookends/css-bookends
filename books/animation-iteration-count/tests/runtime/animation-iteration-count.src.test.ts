import { describe, expect, it } from 'vitest';

import { publishBookAnimationIterationCount } from '../../src';

const animationIterationCount = publishBookAnimationIterationCount();

describe('animation-iteration-count: happy paths', () => {
  it('renders a constrained number', () => {
    expect(animationIterationCount(3).css()).toBe('3');
    expect(animationIterationCount(3).value()).toBe(3);
    expect(animationIterationCount(0).css()).toBe('0');
  });

  it('renders the infinite keyword', () => {
    expect(animationIterationCount('infinite').css()).toBe(
      'infinite',
    );
    expect(animationIterationCount('infinite').value()).toBe(
      'infinite',
    );
  });

  it('a bare call renders the configured default count', () => {
    // the book default is 1.
    expect(animationIterationCount().css()).toBe('1');
    // 'unset' also falls back to the default.
    expect(animationIterationCount('unset').css()).toBe('1');
    const themed = publishBookAnimationIterationCount({
      config: { value: 2 },
    });
    expect(themed().css()).toBe('2');
    expect(themed('unset').css()).toBe('2');
  });
});

describe('animation-iteration-count: invalid keyword', () => {
  it('throws on an unknown keyword', () => {
    expect(() =>
      // @ts-expect-error 'always' is not a valid animation-iteration-count keyword.
      animationIterationCount('always'),
    ).toThrow(/not a valid keyword/);
  });
});

describe('animation-iteration-count: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => animationIterationCount(-1)).toThrow(
      /below the minimum/,
    );
  });
});
