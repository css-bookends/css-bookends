import { describe, expect, it } from 'vitest';

import { publishBookCounterSet } from '../../src';

const counterSet = publishBookCounterSet();

describe('counterSet: happy paths', () => {
  it('renders a single ident with the default integer (0)', () => {
    expect(
      counterSet([
        'page',
      ]).css(),
    ).toBe('page 0');
    expect(
      counterSet([
        'page',
      ]).value(),
    ).toBe('page 0');
  });

  it('renders an explicit integer via a tuple', () => {
    expect(
      counterSet([
        [
          'page',
          3,
        ],
      ]).css(),
    ).toBe('page 3');
  });

  it('renders multiple entries in order', () => {
    expect(
      counterSet([
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
    expect(counterSet('none').css()).toBe('none');
    expect(counterSet('none').value()).toBe('none');
  });
});

describe('counterSet: rejections', () => {
  it('rejects a non-integer counter value', () => {
    expect(() =>
      counterSet([
        [
          'page',
          1.5,
        ],
      ]),
    ).toThrow(/expected an integer/);
  });

  it('rejects an invalid custom-ident', () => {
    expect(() =>
      counterSet([
        [
          '1bad',
          0,
        ],
      ]),
    ).toThrow(/not a valid <custom-ident>/);
    expect(() =>
      counterSet([
        'has space',
      ]),
    ).toThrow(/not a valid <custom-ident>/);
  });
});
