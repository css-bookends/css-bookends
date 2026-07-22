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
  'createAbsoluteUnitsFactory',
  'createAngleUnitsFactory',
  'createContainerUnitsFactory',
  'createFontRelativeUnitsFactory',
  'createFrequencyUnitsFactory',
  'createGridUnitsFactory',
  'createPercentUnitsFactory',
  'createResolutionUnitsFactory',
  'createTimeUnitsFactory',
  'createViewportUnitsFactory',
  'createViewportDynamicUnitsFactory',
  'createViewportLargeUnitsFactory',
  'createViewportSmallUnitsFactory',
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
    expect(typeof cjsUnitsPercent.createPercentUnitsFactory).toBe(
      'function',
    );
    expect(typeof cjsUnitsAbsolute.createAbsoluteUnitsFactory).toBe(
      'function',
    );
    expect(
      typeof cjsUnitsFontRelative.createFontRelativeUnitsFactory,
    ).toBe('function');
    expect(typeof cjsUnitsViewport.createViewportUnitsFactory).toBe(
      'function',
    );
    expect(
      typeof cjsUnitsViewportSmall.createViewportSmallUnitsFactory,
    ).toBe('function');
    expect(
      typeof cjsUnitsViewportLarge.createViewportLargeUnitsFactory,
    ).toBe('function');
    expect(
      typeof cjsUnitsViewportDynamic.createViewportDynamicUnitsFactory,
    ).toBe('function');
    expect(typeof cjsUnitsContainer.createContainerUnitsFactory).toBe(
      'function',
    );
    expect(typeof cjsUnitsAngle.createAngleUnitsFactory).toBe(
      'function',
    );
    expect(typeof cjsUnitsTime.createTimeUnitsFactory).toBe(
      'function',
    );
    expect(typeof cjsUnitsFrequency.createFrequencyUnitsFactory).toBe(
      'function',
    );
    expect(
      typeof cjsUnitsResolution.createResolutionUnitsFactory,
    ).toBe('function');
    expect(typeof cjsUnitsGrid.createGridUnitsFactory).toBe(
      'function',
    );
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
      'makeIntegerRefinement',
      'nonNegativeInteger',
      'nonPositiveInteger',
      'inRangeInteger',
      'makeFloatRefinement',
      'nonNegativeFloat',
      'nonPositiveFloat',
      'inRangeFloat',
      'createIntegerFactory',
      'createFloatFactory',
      'createRatioFactory',
      'createScalarBundleFactory',
      'createCalipersBundleFactory',
      ...groupFactoryNames,
      'getErrorConfig',
      'setErrorConfig',
      // colour value surface (re-exported from ./color)
      'color',
      'colorFormats',
      'createColorFactory',
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
