import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishBookBorderImageOutset } from '../../src';

const borderImageOutset = publishBookBorderImageOutset();

describe('border-image-outset: happy paths', () => {
  it('renders one to four numbers or lengths', () => {
    expect(
      borderImageOutset([
        0,
      ]).css(),
    ).toBe('0');
    expect(
      borderImageOutset([
        0,
      ]).value(),
    ).toBe('0');
    expect(
      borderImageOutset([
        1,
        m(2),
      ]).css(),
    ).toBe('1 2px');
    expect(
      borderImageOutset([
        1,
        2,
        3,
        4,
      ]).css(),
    ).toBe('1 2 3 4');
  });
});

describe('border-image-outset: rejections', () => {
  it('rejects a negative number', () => {
    expect(() =>
      borderImageOutset([
        -1,
      ]),
    ).toThrow(/below the minimum/);
  });

  it('rejects the auto keyword (outset has no auto)', () => {
    expect(() =>
      borderImageOutset([
        'auto' as unknown as number,
      ]),
    ).toThrow(/not a valid keyword/);
  });
});
