// API-surface contract test for the built ESM bundle.
// This file focuses on export presence and basic shapes, not behavior.
import { describe, expect, it } from 'vitest';

const esmRoot = await import('../../../dist/index.mjs');
const esmUnits = await import('../../../dist/units/index.mjs');

const esmUnitsPercent =
  await import('../../../dist/units/percent.mjs');
const esmUnitsAbsolute =
  await import('../../../dist/units/absolute.mjs');
const esmUnitsFontRelative =
  await import('../../../dist/units/font-relative.mjs');
const esmUnitsViewport =
  await import('../../../dist/units/viewport.mjs');
const esmUnitsViewportSmall =
  await import('../../../dist/units/viewport-small.mjs');
const esmUnitsViewportLarge =
  await import('../../../dist/units/viewport-large.mjs');
const esmUnitsViewportDynamic =
  await import('../../../dist/units/viewport-dynamic.mjs');
const esmUnitsContainer =
  await import('../../../dist/units/container.mjs');
const esmUnitsAngle = await import('../../../dist/units/angle.mjs');
const esmUnitsTime = await import('../../../dist/units/time.mjs');
const esmUnitsFrequency =
  await import('../../../dist/units/frequency.mjs');
const esmUnitsResolution =
  await import('../../../dist/units/resolution.mjs');
const esmUnitsGrid = await import('../../../dist/units/grid.mjs');

const groupFactoryNames = [
  'createAbsoluteUnits',
  'createAngleUnits',
  'createContainerUnits',
  'createFontRelativeUnits',
  'createFrequencyUnits',
  'createGridUnits',
  'createPercentUnits',
  'createResolutionUnits',
  'createTimeUnits',
  'createViewportUnits',
  'createViewportDynamicUnits',
  'createViewportLargeUnits',
  'createViewportSmallUnits',
] as const;

describe('API surface (ESM)', () => {
  it('exposes expected core exports from the root entrypoint', () => {
    expect(esmRoot).toHaveProperty('m');
    expect(typeof esmRoot.m).toBe('function');

    expect(esmRoot).toHaveProperty('assertUnit');
    expect(typeof esmRoot.assertUnit).toBe('function');
  });

  it('exposes the group factories via the units aggregator', () => {
    const units = esmUnits as Record<string, unknown>;
    for (const name of groupFactoryNames) {
      expect(units, name).toHaveProperty(name);
      expect(typeof units[name]).toBe('function');
    }
  });

  it('exposes the group factory via each unit family subpath', () => {
    expect(typeof esmUnitsPercent.createPercentUnits).toBe(
      'function',
    );
    expect(typeof esmUnitsAbsolute.createAbsoluteUnits).toBe(
      'function',
    );
    expect(typeof esmUnitsFontRelative.createFontRelativeUnits).toBe(
      'function',
    );
    expect(typeof esmUnitsViewport.createViewportUnits).toBe(
      'function',
    );
    expect(
      typeof esmUnitsViewportSmall.createViewportSmallUnits,
    ).toBe('function');
    expect(
      typeof esmUnitsViewportLarge.createViewportLargeUnits,
    ).toBe('function');
    expect(
      typeof esmUnitsViewportDynamic.createViewportDynamicUnits,
    ).toBe('function');
    expect(typeof esmUnitsContainer.createContainerUnits).toBe(
      'function',
    );
    expect(typeof esmUnitsAngle.createAngleUnits).toBe('function');
    expect(typeof esmUnitsTime.createTimeUnits).toBe('function');
    expect(typeof esmUnitsFrequency.createFrequencyUnits).toBe(
      'function',
    );
    expect(typeof esmUnitsResolution.createResolutionUnits).toBe(
      'function',
    );
    expect(typeof esmUnitsGrid.createGridUnits).toBe('function');
  });

  it('exposes the full root runtime export map', () => {
    const rootKeys = Object.keys(esmRoot).filter(
      (key) => key !== '__esModule' && key !== 'default',
    );

    // Factories + types + core builders only. The bare unit helpers and the
    // percent guard/assert are gone (they come from the group factories now).
    const expectedKeys = [
      'm',
      'r',
      'isMeasurement',
      'isRatio',
      'assertMatchingUnits',
      'measurementMin',
      'measurementMax',
      'measurementUnitMetadata',
      'makeUnitHelper',
      'makeUnitHelperFromDefinition',
      'makeUnitGuard',
      'makeUnitAssert',
      'hasCssMethod',
      'assertUnit',
      'assertCondition',
      'makeMeasurementRefinement',
      'nonNegative',
      'nonPositive',
      'inRange',
      'normalizeRatio',
      'parseRatio',
      'ratioToFloat',
      'toFloat',
      'reduceRatio',
      'simplifyRatio',
      'i',
      'f',
      'isInteger',
      'isFloat',
      'hardenInteger',
      'hardenFloat',
      'createInteger',
      'createFloat',
      'createRatio',
      'createCalipersBundle',
      ...groupFactoryNames,
      'getErrorConfig',
      'setErrorConfig',
      // colour value surface (re-exported from ./color)
      'color',
      'colorFormats',
      'createColor',
      'defaultColorConfig',
      'defaultFormatPriority',
      'defineColorSpace',
      'parseColor',
      'resolveColor',
      'storeColor',
    ].sort();

    expect(rootKeys.sort()).toEqual(expectedKeys);
  });
});
