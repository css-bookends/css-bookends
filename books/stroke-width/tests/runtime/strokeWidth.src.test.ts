import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishBookStrokeWidth } from '../../src';

const strokeWidth = publishBookStrokeWidth();

describe('stroke-width: happy paths', () => {
  it('renders a non-negative number (not restricted to integer)', () => {
    expect(strokeWidth(2).css()).toBe('2');
    expect(strokeWidth(2).value()).toBe('2');
    expect(strokeWidth(2.5).css()).toBe('2.5');
    expect(strokeWidth(0).css()).toBe('0');
  });

  it('renders a length measurement', () => {
    expect(strokeWidth(m(3)).css()).toBe('3px');
    expect(strokeWidth(m(3)).value()).toBe('3px');
  });
});

describe('stroke-width: rejections', () => {
  it('rejects a negative number', () => {
    expect(() => strokeWidth(-1)).toThrow(/below the minimum/);
  });
});
