import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishBookStrokeDasharray } from '../../src';

const strokeDasharray = publishBookStrokeDasharray();

describe('stroke-dasharray: happy paths', () => {
  it('renders a list of numbers and/or lengths', () => {
    expect(
      strokeDasharray([
        4,
      ]).css(),
    ).toBe('4');
    expect(
      strokeDasharray([
        4,
      ]).value(),
    ).toBe('4');
    expect(
      strokeDasharray([
        4,
        2,
      ]).css(),
    ).toBe('4 2');
    expect(
      strokeDasharray([
        4,
        m(2),
        1,
      ]).css(),
    ).toBe('4 2px 1');
  });

  it('renders a length measurement entry', () => {
    expect(
      strokeDasharray([
        m(8),
      ]).css(),
    ).toBe('8px');
  });

  it('renders the none keyword', () => {
    expect(strokeDasharray('none').css()).toBe('none');
    expect(strokeDasharray('none').value()).toBe('none');
  });
});

describe('stroke-dasharray: rejections', () => {
  it('rejects a negative number', () => {
    expect(() =>
      strokeDasharray([
        -1,
      ]),
    ).toThrow(/below the minimum/);
  });
});
