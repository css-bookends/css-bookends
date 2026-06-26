import { describe, expect, it } from 'vitest';

import { publishBookGridRowEnd, span } from '../../src';

const gridRowEnd = publishBookGridRowEnd();

describe('grid-row-end: happy paths', () => {
  it('renders a nonzero line number', () => {
    expect(gridRowEnd(2).css()).toBe('2');
    expect(gridRowEnd(2).value()).toBe('2');
    expect(gridRowEnd(-1).css()).toBe('-1');
  });

  it('renders the auto keyword', () => {
    expect(gridRowEnd('auto').css()).toBe('auto');
  });

  it('renders a named line (custom-ident)', () => {
    expect(gridRowEnd('main-end').css()).toBe('main-end');
  });

  it('renders span N', () => {
    expect(gridRowEnd(span(2)).css()).toBe('span 2');
    expect(gridRowEnd(span(3, 'main')).css()).toBe('span 3 main');
  });
});

describe('grid-row-end: rejections', () => {
  it('rejects line number 0', () => {
    expect(() => gridRowEnd(0)).toThrow(/must be nonzero/);
  });

  it('rejects span N below 1', () => {
    expect(() => gridRowEnd(span(0))).toThrow(/below the minimum/);
  });
});
