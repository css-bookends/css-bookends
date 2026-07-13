// API-surface contract test for the built CommonJS bundle.
// This file focuses on export presence and basic shapes, not behavior.
import { describe, expect, it } from 'vitest';

const cjsRoot = await import('../../../dist/index.js');
const cjsUnits = await import('../../../dist/units/index.js');

const cjsUnitsPercent =
  await import('../../../dist/units/percent.js');
const cjsUnitsAbsolute =
  await import('../../../dist/units/absolute.js');
const cjsUnitsFontRelative =
  await import('../../../dist/units/font-relative.js');
const cjsUnitsViewport =
  await import('../../../dist/units/viewport.js');
const cjsUnitsViewportSmall =
  await import('../../../dist/units/viewport-small.js');
const cjsUnitsViewportLarge =
  await import('../../../dist/units/viewport-large.js');
const cjsUnitsViewportDynamic =
  await import('../../../dist/units/viewport-dynamic.js');
const cjsUnitsContainer =
  await import('../../../dist/units/container.js');
const cjsUnitsAngle = await import('../../../dist/units/angle.js');
const cjsUnitsTime = await import('../../../dist/units/time.js');
const cjsUnitsFrequency =
  await import('../../../dist/units/frequency.js');
const cjsUnitsResolution =
  await import('../../../dist/units/resolution.js');
const cjsUnitsGrid = await import('../../../dist/units/grid.js');

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

describe('API surface (CJS)', () => {
  it('exposes expected core exports from the root entrypoint', () => {
    expect(cjsRoot).toHaveProperty('m');
    expect(typeof cjsRoot.m).toBe('function');

    expect(cjsRoot).toHaveProperty('assertUnit');
    expect(typeof cjsRoot.assertUnit).toBe('function');
  });

  it('exposes the group factories via the units aggregator', () => {
    const units = cjsUnits as Record<string, unknown>;
    for (const name of groupFactoryNames) {
      expect(units, name).toHaveProperty(name);
      expect(typeof units[name]).toBe('function');
    }
  });

  it('exposes the group factory via each unit family subpath', () => {
    expect(typeof cjsUnitsPercent.createPercentUnits).toBe(
      'function',
    );
    expect(typeof cjsUnitsAbsolute.createAbsoluteUnits).toBe(
      'function',
    );
    expect(typeof cjsUnitsFontRelative.createFontRelativeUnits).toBe(
      'function',
    );
    expect(typeof cjsUnitsViewport.createViewportUnits).toBe(
      'function',
    );
    expect(
      typeof cjsUnitsViewportSmall.createViewportSmallUnits,
    ).toBe('function');
    expect(
      typeof cjsUnitsViewportLarge.createViewportLargeUnits,
    ).toBe('function');
    expect(
      typeof cjsUnitsViewportDynamic.createViewportDynamicUnits,
    ).toBe('function');
    expect(typeof cjsUnitsContainer.createContainerUnits).toBe(
      'function',
    );
    expect(typeof cjsUnitsAngle.createAngleUnits).toBe('function');
    expect(typeof cjsUnitsTime.createTimeUnits).toBe('function');
    expect(typeof cjsUnitsFrequency.createFrequencyUnits).toBe(
      'function',
    );
    expect(typeof cjsUnitsResolution.createResolutionUnits).toBe(
      'function',
    );
    expect(typeof cjsUnitsGrid.createGridUnits).toBe('function');
  });

  it('exposes the full root runtime export map', () => {
    // `__esModule` and `default` are CJS<->ESM interop artifacts on the namespace
    // (the dynamic `import()` of a CJS bundle synthesizes a `default`), not part of the
    // package's real named API surface.
    const rootKeys = Object.keys(cjsRoot).filter(
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
