import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishBookStrokeDashoffset } from '../../src';

const strokeDashoffset = publishBookStrokeDashoffset();

describe('stroke-dashoffset: happy paths', () => {
  it('renders any signed number', () => {
    expect(strokeDashoffset(5).css()).toBe('5');
    expect(strokeDashoffset(5).value()).toBe('5');
    expect(strokeDashoffset(-5).css()).toBe('-5');
  });

  it('renders a length measurement', () => {
    expect(strokeDashoffset(m(8)).css()).toBe('8px');
    expect(strokeDashoffset(m(8)).value()).toBe('8px');
  });
});

describe('stroke-dashoffset: rejections', () => {
  it('rejects a non-finite number', () => {
    expect(() => strokeDashoffset(Infinity)).toThrow(/finite/);
  });
});
