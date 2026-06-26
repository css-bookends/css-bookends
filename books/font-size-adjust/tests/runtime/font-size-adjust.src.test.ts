import { describe, expect, it } from 'vitest';

import { publishBookFontSizeAdjust } from '../../src';

const fontSizeAdjust = publishBookFontSizeAdjust();

describe('font-size-adjust: happy paths', () => {
  it('renders a constrained number', () => {
    expect(fontSizeAdjust(0.5).css()).toBe('0.5');
    expect(fontSizeAdjust(0.5).value()).toBe(0.5);
    expect(fontSizeAdjust(0).css()).toBe('0');
  });

  it('renders the none keyword', () => {
    expect(fontSizeAdjust('none').css()).toBe('none');
    expect(fontSizeAdjust('none').value()).toBe('none');
  });

  it('renders the from-font keyword', () => {
    expect(fontSizeAdjust('from-font').css()).toBe('from-font');
    expect(fontSizeAdjust('from-font').value()).toBe('from-font');
  });

  it('a bare call renders the configured default', () => {
    // the book default is 'none'.
    expect(fontSizeAdjust().css()).toBe('none');
    // 'unset' also falls back to the default.
    expect(fontSizeAdjust('unset').css()).toBe('none');
    const themed = publishBookFontSizeAdjust({
      config: { value: 0.6 },
    });
    expect(themed().css()).toBe('0.6');
    expect(themed('unset').css()).toBe('0.6');
  });
});

describe('font-size-adjust: rejections', () => {
  it('rejects an unknown keyword', () => {
    // @ts-expect-error 'big' is not a valid font-size-adjust keyword.
    expect(() => fontSizeAdjust('big')).toThrow(
      /not a valid keyword/,
    );
  });

  it('throws on an out-of-range number by default', () => {
    expect(() => fontSizeAdjust(-1)).toThrow(/below the minimum/);
  });
});
