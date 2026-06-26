import { describe, expect, it } from 'vitest';

import { publishBookGridColumnStart, span } from '../../src';

const gridColumnStart = publishBookGridColumnStart();

describe('grid-column-start: happy paths', () => {
  it('renders a nonzero line number', () => {
    expect(gridColumnStart(2).css()).toBe('2');
    expect(gridColumnStart(2).value()).toBe('2');
    expect(gridColumnStart(-1).css()).toBe('-1');
  });

  it('renders the auto keyword', () => {
    expect(gridColumnStart('auto').css()).toBe('auto');
  });

  it('renders a named line (custom-ident)', () => {
    expect(gridColumnStart('main-start').css()).toBe('main-start');
  });

  it('renders span N', () => {
    expect(gridColumnStart(span(2)).css()).toBe('span 2');
    expect(gridColumnStart(span(3, 'main')).css()).toBe(
      'span 3 main',
    );
  });
});

describe('grid-column-start: rejections', () => {
  it('rejects line number 0', () => {
    expect(() => gridColumnStart(0)).toThrow(/must be nonzero/);
  });

  it('rejects span N below 1', () => {
    expect(() => gridColumnStart(span(0))).toThrow(
      /below the minimum/,
    );
  });
});
