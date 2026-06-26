import { describe, expect, it } from 'vitest';

import { publishBookGridRowStart, span } from '../../src';

const gridRowStart = publishBookGridRowStart();

describe('grid-row-start: happy paths', () => {
  it('renders a nonzero line number', () => {
    expect(gridRowStart(2).css()).toBe('2');
    expect(gridRowStart(2).value()).toBe('2');
    expect(gridRowStart(-1).css()).toBe('-1');
  });

  it('renders the auto keyword', () => {
    expect(gridRowStart('auto').css()).toBe('auto');
  });

  it('renders a named line (custom-ident)', () => {
    expect(gridRowStart('main-start').css()).toBe('main-start');
  });

  it('renders span N', () => {
    expect(gridRowStart(span(2)).css()).toBe('span 2');
    expect(gridRowStart(span(3, 'main')).css()).toBe('span 3 main');
  });
});

describe('grid-row-start: rejections', () => {
  it('rejects line number 0', () => {
    expect(() => gridRowStart(0)).toThrow(/must be nonzero/);
  });

  it('rejects span N below 1', () => {
    expect(() => gridRowStart(span(0))).toThrow(/below the minimum/);
  });
});
