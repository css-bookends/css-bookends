// The UNIFIED value surface: one raw/unit accessor across all value types —
// `.value()` (raw number) + `.unit()` (unit string, empty for unitless).
import { describe, expect, it } from 'vitest';

import { f, i, m } from '../../support/calipers_tests.src';

describe('unified value surface: .value() + .unit()', () => {
  describe('measurement', () => {
    it('.value() returns the raw number', () => {
      expect(m(8).value()).toBe(8);
      expect(m(2.5, 'rem').value()).toBe(2.5);
    });

    it('.unit() returns the unit string', () => {
      expect(m(8).unit()).toBe('px');
      expect(m(2.5, 'rem').unit()).toBe('rem');
    });
  });

  describe('integer / float (unitless)', () => {
    it('.value() returns the raw number', () => {
      expect(i(4).value()).toBe(4);
      expect(f(2.5).value()).toBe(2.5);
    });

    it('.unit() is empty for unitless scalars', () => {
      expect(i(4).unit()).toBe('');
      expect(f(2.5).unit()).toBe('');
    });
  });
});
