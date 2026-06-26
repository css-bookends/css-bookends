import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishBookBorderImageSlice } from '../../src';

const borderImageSlice = publishBookBorderImageSlice();

describe('border-image-slice: happy paths', () => {
  it('renders one to four numbers', () => {
    expect(
      borderImageSlice([
        30,
      ]).css(),
    ).toBe('30');
    expect(
      borderImageSlice([
        30,
      ]).value(),
    ).toBe('30');
    expect(
      borderImageSlice([
        10,
        20,
        30,
        40,
      ]).css(),
    ).toBe('10 20 30 40');
  });

  it('renders an optional trailing fill keyword', () => {
    expect(
      borderImageSlice([
        30,
        'fill',
      ]).css(),
    ).toBe('30 fill');
    expect(
      borderImageSlice([
        10,
        20,
        30,
        40,
        'fill',
      ]).css(),
    ).toBe('10 20 30 40 fill');
  });
});

describe('border-image-slice: rejections', () => {
  it('rejects a negative number', () => {
    expect(() =>
      borderImageSlice([
        -1,
      ]),
    ).toThrow(/below the minimum/);
  });

  it('rejects fill in a non-trailing position', () => {
    expect(() =>
      borderImageSlice([
        10,
        'fill',
        20,
      ]),
    ).toThrow(/only appear as the trailing keyword/);
  });

  it('rejects a length measurement (slice is number-only)', () => {
    expect(() =>
      borderImageSlice([
        m(10) as unknown as number,
      ]),
    ).toThrow();
  });
});
