import { describe, expect, it } from 'vitest';

import { publishBookCounterReset } from '../../src';

const counterReset = publishBookCounterReset();

describe('counterReset: happy paths', () => {
  it('renders a single ident with the default integer (0)', () => {
    expect(
      counterReset([
        'page',
      ]).css(),
    ).toBe('page 0');
    expect(
      counterReset([
        'page',
      ]).value(),
    ).toBe('page 0');
  });

  it('renders an explicit integer via a tuple', () => {
    expect(
      counterReset([
        [
          'page',
          3,
        ],
      ]).css(),
    ).toBe('page 3');
  });

  it('renders multiple entries in order', () => {
    expect(
      counterReset([
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
    ).toBe('a 1 b 0 c 4');
  });

  it('passes the none keyword through', () => {
    expect(counterReset('none').css()).toBe('none');
    expect(counterReset('none').value()).toBe('none');
  });
});

describe('counterReset: rejections', () => {
  it('rejects a non-integer counter value', () => {
    expect(() =>
      counterReset([
        [
          'page',
          1.5,
        ],
      ]),
    ).toThrow(/expected an integer/);
  });

  it('rejects an invalid custom-ident', () => {
    expect(() =>
      counterReset([
        [
          '1bad',
          0,
        ],
      ]),
    ).toThrow(/not a valid <custom-ident>/);
    expect(() =>
      counterReset([
        'has space',
      ]),
    ).toThrow(/not a valid <custom-ident>/);
  });
});
