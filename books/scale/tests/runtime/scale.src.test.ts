import { describe, expect, it } from 'vitest';

import { publishBookScale } from '../../src';

const scale = publishBookScale();

describe('scale: happy paths', () => {
  it('renders one to three factors', () => {
    expect(
      scale([
        2,
      ]).css(),
    ).toBe('2');
    expect(
      scale([
        2,
      ]).value(),
    ).toBe('2');
    expect(
      scale([
        1,
        0.5,
      ]).css(),
    ).toBe('1 0.5');
    expect(
      scale([
        1,
        2,
        3,
      ]).css(),
    ).toBe('1 2 3');
  });

  it('renders the none keyword', () => {
    expect(scale('none').css()).toBe('none');
    expect(scale('none').value()).toBe('none');
  });

  it('a bare call renders the configured default factor', () => {
    // the book default is [1].
    expect(scale().css()).toBe('1');
    const themed = publishBookScale({
      config: {
        value: [
          2,
          2,
        ],
      },
    });
    expect(themed().css()).toBe('2 2');
  });
});
