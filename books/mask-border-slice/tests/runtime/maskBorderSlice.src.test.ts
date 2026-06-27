import { mPx } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishBookMaskBorderSlice } from '../../src';

const maskBorderSlice = publishBookMaskBorderSlice();

describe('mask-border-slice: happy paths', () => {
  it('renders one to four numbers', () => {
    expect(
      maskBorderSlice([
        5,
      ]).css(),
    ).toBe('5');
    expect(
      maskBorderSlice([
        10,
        20,
        30,
        40,
      ]).css(),
    ).toBe('10 20 30 40');
    expect(
      maskBorderSlice([
        5,
      ]).value(),
    ).toBe('5');
  });

  it('renders an optional trailing fill keyword', () => {
    expect(
      maskBorderSlice([
        7,
        'fill',
      ]).css(),
    ).toBe('7 fill');
    expect(
      maskBorderSlice([
        10,
        20,
        30,
        40,
        'fill',
      ]).css(),
    ).toBe('10 20 30 40 fill');
  });
});

describe('mask-border-slice: rejections', () => {
  it('rejects a negative number', () => {
    expect(() =>
      maskBorderSlice([
        -1,
      ]),
    ).toThrow(/below the minimum/);
  });

  it('rejects fill in a non-trailing position', () => {
    expect(() =>
      maskBorderSlice([
        10,
        'fill',
        20,
      ]),
    ).toThrow(/only appear as the trailing keyword/);
  });

  it('rejects a length measurement (slice is number-only)', () => {
    expect(() =>
      maskBorderSlice([
        // @ts-expect-error mask-border-slice does not accept an IMeasurement.
        mPx(10),
      ]),
    ).toThrow();
  });
});
