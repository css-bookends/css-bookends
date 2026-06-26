import { mPx } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishBookMaskBorderOutset } from '../../src';

const maskBorderOutset = publishBookMaskBorderOutset();

describe('mask-border-outset: happy paths', () => {
  it('renders one to four numbers or lengths', () => {
    expect(
      maskBorderOutset([
        0,
      ]).css(),
    ).toBe('0');
    expect(
      maskBorderOutset([
        1,
        mPx(2),
      ]).css(),
    ).toBe('1 2px');
    expect(
      maskBorderOutset([
        1,
        2,
        3,
        4,
      ]).css(),
    ).toBe('1 2 3 4');
    expect(
      maskBorderOutset([
        0,
      ]).value(),
    ).toBe('0');
  });
});

describe('mask-border-outset: rejections', () => {
  it('rejects a negative number', () => {
    expect(() =>
      maskBorderOutset([
        -1,
      ]),
    ).toThrow(/below the minimum/);
  });

  it('rejects the auto keyword (outset has no auto)', () => {
    expect(() =>
      // @ts-expect-error mask-border-outset has no 'auto' keyword.
      maskBorderOutset([
        'auto',
      ]),
    ).toThrow(/not a valid keyword/);
  });

  it('rejects an entry that is neither a number nor an IMeasurement', () => {
    expect(() =>
      maskBorderOutset([
        // deliberately wrong type to reach the runtime guard.
        {} as unknown as number,
      ]),
    ).toThrow(
      /maskBorderOutset: expected a <number> or an IMeasurement \(got object\)/,
    );
    expect(() =>
      maskBorderOutset([
        true as unknown as number,
      ]),
    ).toThrow(/got boolean/);
  });
});
