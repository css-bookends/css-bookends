import { describe, expect, it } from 'vitest';

import { publishBookGridColumnEnd, span } from '../../src';

const gridColumnEnd = publishBookGridColumnEnd();

describe('grid-column-end: happy paths', () => {
  it('renders a nonzero line number', () => {
    expect(gridColumnEnd(2).css()).toBe('2');
    expect(gridColumnEnd(2).value()).toBe('2');
    expect(gridColumnEnd(-1).css()).toBe('-1');
  });

  it('renders the auto keyword', () => {
    expect(gridColumnEnd('auto').css()).toBe('auto');
  });

  it('renders a named line (custom-ident)', () => {
    expect(gridColumnEnd('main-end').css()).toBe('main-end');
  });

  it('renders span N', () => {
    expect(gridColumnEnd(span(2)).css()).toBe('span 2');
    expect(gridColumnEnd(span(3, 'main')).css()).toBe('span 3 main');
  });
});

describe('grid-column-end: rejections', () => {
  it('rejects line number 0', () => {
    expect(() => gridColumnEnd(0)).toThrow(/must be nonzero/);
  });

  it('rejects span N below 1', () => {
    expect(() => gridColumnEnd(span(0))).toThrow(/below the minimum/);
  });
});
