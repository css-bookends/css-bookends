import { describe, expect, it } from 'vitest';

import { publishBookCounterIncrement } from '../../src';

const counterIncrement = publishBookCounterIncrement();

describe('counterIncrement: happy paths', () => {
  it('renders a single ident with the default integer (1)', () => {
    expect(
      counterIncrement([
        'page',
      ]).css(),
    ).toBe('page 1');
    expect(
      counterIncrement([
        'page',
      ]).value(),
    ).toBe('page 1');
  });

  it('renders an explicit integer via a tuple', () => {
    expect(
      counterIncrement([
        [
          'section',
          -2,
        ],
      ]).css(),
    ).toBe('section -2');
  });

  it('renders multiple entries in order', () => {
    expect(
      counterIncrement([
        [
          'a',
          1,
        ],
        'b',
        [
          'c',
          4,
        ],
      ]).css(),
    ).toBe('a 1 b 1 c 4');
  });

  it('passes the none keyword through', () => {
    expect(counterIncrement('none').css()).toBe('none');
    expect(counterIncrement('none').value()).toBe('none');
  });
});

describe('counterIncrement: rejections', () => {
  it('rejects a non-integer counter value', () => {
    expect(() =>
      counterIncrement([
        [
          'page',
          1.5,
        ],
      ]),
    ).toThrow(/expected an integer/);
  });

  it('rejects an invalid custom-ident', () => {
    expect(() =>
      counterIncrement([
        [
          '1bad',
          0,
        ],
      ]),
    ).toThrow(/not a valid <custom-ident>/);
    expect(() =>
      counterIncrement([
        'has space',
      ]),
    ).toThrow(/not a valid <custom-ident>/);
  });
});
