import { mPx } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishBookMaskBorderWidth } from '../../src';

const maskBorderWidth = publishBookMaskBorderWidth();

describe('mask-border-width: happy paths', () => {
  it('renders one to four number multipliers', () => {
    expect(
      maskBorderWidth([
        1,
      ]).css(),
    ).toBe('1');
    expect(
      maskBorderWidth([
        1,
        2,
      ]).css(),
    ).toBe('1 2');
    expect(
      maskBorderWidth([
        1,
        2,
        3,
        4,
      ]).css(),
    ).toBe('1 2 3 4');
    expect(
      maskBorderWidth([
        2.5,
      ]).css(),
    ).toBe('2.5');
    expect(
      maskBorderWidth([
        1,
      ]).value(),
    ).toBe('1');
  });

  it('renders length measurements and the auto keyword per edge', () => {
    expect(
      maskBorderWidth([
        mPx(10),
      ]).css(),
    ).toBe('10px');
    expect(
      maskBorderWidth([
        'auto',
        mPx(4),
        2,
      ]).css(),
    ).toBe('auto 4px 2');
    expect(
      maskBorderWidth([
        'auto',
      ]).css(),
    ).toBe('auto');
  });
});

describe('mask-border-width: rejections', () => {
  it('rejects a negative number', () => {
    expect(() =>
      maskBorderWidth([
        -1,
      ]),
    ).toThrow(/below the minimum/);
  });

  it('rejects an unknown keyword', () => {
    expect(() =>
      maskBorderWidth([
        // @ts-expect-error 'fill' is not a valid mask-border-width keyword.
        'fill',
      ]),
    ).toThrow(/not a valid keyword/);
  });
});
