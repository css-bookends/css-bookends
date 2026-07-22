// Per-primitive subpath contract against the BUILT CJS bundle. Mirror of the ESM
// dist test: confirms the new entries resolve in `dist/cjs` and carry the right
// surface.
import { describe, expect, it } from 'vitest';

const cjsMeasurements = await import('../../../dist/measurements.js');
const cjsRatio = await import('../../../dist/ratio.js');
const cjsInteger = await import('../../../dist/integer.js');
const cjsFloat = await import('../../../dist/float.js');
const cjsCodex = await import('../../../dist/codex.js');

describe('per-primitive subpaths (CJS dist)', () => {
  it('measurements entry exposes `m` and is colour-free', () => {
    expect(typeof cjsMeasurements.m).toBe('function');
    expect(cjsMeasurements.m(8).css()).toBe('8px');
    expect('color' in cjsMeasurements).toBe(false);
    expect('createColorFactory' in cjsMeasurements).toBe(false);
  });

  it('ratio entry exposes `r` and is colour-free', () => {
    expect(typeof cjsRatio.r).toBe('function');
    expect('color' in cjsRatio).toBe(false);
    expect('createColorFactory' in cjsRatio).toBe(false);
  });

  it('integer entry exposes `i` and is colour-free', () => {
    expect(typeof cjsInteger.i).toBe('function');
    expect('color' in cjsInteger).toBe(false);
    expect('createColorFactory' in cjsInteger).toBe(false);
  });

  it('float entry exposes `f` and is colour-free', () => {
    expect(typeof cjsFloat.f).toBe('function');
    expect('color' in cjsFloat).toBe(false);
    expect('createColorFactory' in cjsFloat).toBe(false);
  });

  it('codex entry exposes BOTH `m` and `color`', () => {
    expect(typeof cjsCodex.m).toBe('function');
    expect(typeof cjsCodex.color).toBe('function');
    expect(typeof cjsCodex.createCalipersFactory).toBe('function');
    expect(typeof cjsCodex.createColorFactory).toBe('function');
  });
});
