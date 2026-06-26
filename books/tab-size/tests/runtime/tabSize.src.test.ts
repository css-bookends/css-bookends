import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishBookTabSize } from '../../src';

const tabSize = publishBookTabSize();

describe('tab-size: happy paths', () => {
  it('renders a non-negative number (not restricted to integer)', () => {
    expect(tabSize(4).css()).toBe('4');
    expect(tabSize(4).value()).toBe('4');
    expect(tabSize(2.5).css()).toBe('2.5');
    expect(tabSize(0).css()).toBe('0');
  });

  it('renders a length measurement', () => {
    expect(tabSize(m(8)).css()).toBe('8px');
    expect(tabSize(m(8)).value()).toBe('8px');
  });

  it('a bare call renders the configured default tab size', () => {
    // the book default is 8.
    expect(tabSize().css()).toBe('8');
    const themed = publishBookTabSize({ config: { value: 4 } });
    expect(themed().css()).toBe('4');
    const measured = publishBookTabSize({ config: { value: m(8) } });
    expect(measured().css()).toBe('8px');
  });
});
