// Exhaustive unit regression net. Every generated unit helper must round-trip its
// CSS unit string and report its category. Cheap and table-driven over the whole
// `UNIT_DEFINITIONS` registry, so the ~72 helpers are all behaviorally asserted.
// Helpers are taken from the codex bundle (the whole bound surface); the `./units`
// subpath now exposes the per-group FACTORIES rather than bare helpers.
import { describe, expect, it } from 'vitest';

import { UNIT_DEFINITIONS } from '../../../src/unitDefinitions';
// eslint-disable-next-line no-restricted-imports -- verifies the ./units subpath exposes the group factories
import * as unitsModule from '../../../src/units';
import { bundle } from '../../support/calipers_tests.src';

type UnitHelper = (value: number) => {
  css: () => string;
  category: () => string | undefined;
};

const helpers = bundle as unknown as Record<string, UnitHelper>;

describe('every unit helper round-trips its CSS unit + reports its category', () => {
  for (const [
    name,
    def,
  ] of Object.entries(UNIT_DEFINITIONS)) {
    it(`${name}(1).css() === '1${def.unit}' and category '${def.category}'`, () => {
      const helper = helpers[name];
      expect(helper, `${name} on the bundle`).toBeTypeOf('function');
      const value = helper(1);
      expect(value.css()).toBe(`1${def.unit}`);
      expect(value.category()).toBe(def.category);
    });
  }
});

describe('the ./units subpath exposes the group factories', () => {
  it('surfaces create<Group>Units', () => {
    const mod = unitsModule as Record<string, unknown>;
    expect(typeof mod.createViewportUnits).toBe('function');
    expect(typeof mod.createAbsoluteUnits).toBe('function');
    expect(typeof mod.createPercentUnits).toBe('function');
  });
});
