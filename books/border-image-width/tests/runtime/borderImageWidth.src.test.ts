import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishBookBorderImageWidth } from '../../src';

const borderImageWidth = publishBookBorderImageWidth();

describe('border-image-width: happy paths', () => {
  it('renders one to four number multipliers', () => {
    expect(
      borderImageWidth([
        1,
      ]).css(),
    ).toBe('1');
    expect(
      borderImageWidth([
        1,
      ]).value(),
    ).toBe('1');
    expect(
      borderImageWidth([
        1,
        2,
      ]).css(),
    ).toBe('1 2');
    expect(
      borderImageWidth([
        1,
        2,
        3,
        4,
      ]).css(),
    ).toBe('1 2 3 4');
    expect(
      borderImageWidth([
        2.5,
      ]).css(),
    ).toBe('2.5');
  });

  it('renders length measurements and the auto keyword per edge', () => {
    expect(
      borderImageWidth([
        m(10),
      ]).css(),
    ).toBe('10px');
    expect(
      borderImageWidth([
        m(10),
      ]).value(),
    ).toBe('10px');
    expect(
      borderImageWidth([
        'auto',
        m(4),
        2,
      ]).css(),
    ).toBe('auto 4px 2');
    expect(
      borderImageWidth([
        'auto',
      ]).css(),
    ).toBe('auto');
  });
});

describe('border-image-width: rejections', () => {
  it('rejects a negative number', () => {
    expect(() =>
      borderImageWidth([
        -1,
      ]),
    ).toThrow(/below the minimum/);
  });

  it('rejects an unknown keyword', () => {
    expect(() =>
      borderImageWidth([
        'fill' as unknown as 'auto',
      ]),
    ).toThrow(/not a valid keyword/);
  });
});
