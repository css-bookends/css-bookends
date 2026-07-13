// Per-primitive subpath contract (src level). Each entry must expose only the
// surface it owns. The measurements / ratio / integer / float entries MUST be
// colour-free (no `color`, no `createColor`), so a consumer who imports them
// never pulls in culori. The `codex` lazy-defaults entry re-exports the full
// default set, so it MUST expose BOTH `m` and `color`.
import { describe, expect, it } from 'vitest';

import * as codex from '../../../src/codex';
import { createFloat, f as fEntry } from '../../../src/float';
import { createInteger, i as iEntry } from '../../../src/integer';
import * as meas from '../../../src/measurements';
import { createRatio, r as rEntry } from '../../../src/ratio';

describe('per-primitive subpaths (src)', () => {
  it('measurements entry exposes a working `m`', () => {
    expect(typeof meas.m).toBe('function');
    expect(meas.m(8).css()).toBe('8px');
  });

  it('measurements entry leads with the createCalipers factory', () => {
    expect(typeof meas.createCalipers).toBe('function');
    expect(meas.createCalipers().m(8).css()).toBe('8px');
    // the configurable default unit reaches through the slice factory
    expect(
      meas.createCalipers({ defaultUnit: '%' }).m(50).css(),
    ).toBe('50%');
  });

  it('measurements entry is colour-free', () => {
    expect('color' in meas).toBe(false);
    expect('createColor' in meas).toBe(false);
  });

  it('ratio entry exposes `r` and is colour-free', async () => {
    expect(typeof rEntry).toBe('function');
    expect(typeof createRatio).toBe('function');
    expect(rEntry(16, 9).css()).toBe('16/9');
    const ratioModule = await import('../../../src/ratio');
    expect('color' in ratioModule).toBe(false);
    expect('createColor' in ratioModule).toBe(false);
  });

  it('integer entry exposes `i` and is colour-free', async () => {
    expect(typeof iEntry).toBe('function');
    expect(typeof createInteger).toBe('function');
    expect(iEntry(3).css()).toBe('3');
    const integerModule = await import('../../../src/integer');
    expect('color' in integerModule).toBe(false);
    expect('createColor' in integerModule).toBe(false);
  });

  it('float entry exposes `f` and is colour-free', async () => {
    expect(typeof fEntry).toBe('function');
    expect(typeof createFloat).toBe('function');
    expect(fEntry(1.5).css()).toBe('1.5');
    const floatModule = await import('../../../src/float');
    expect('color' in floatModule).toBe(false);
    expect('createColor' in floatModule).toBe(false);
  });

  it('codex entry exposes BOTH `m` and `color` (full default set)', () => {
    expect('m' in codex).toBe(true);
    expect('color' in codex).toBe(true);
    expect(typeof codex.m).toBe('function');
    expect(typeof codex.color).toBe('function');
    expect(codex.m(8).css()).toBe('8px');
  });

  it('codex also exposes the factories', () => {
    expect(typeof codex.createCalipers).toBe('function');
    expect(typeof codex.createColor).toBe('function');
  });

  it('codex DEFAULT-exports the master factory and binds everything at defaults', () => {
    // the default export is the master factory (same fn as the named export).
    expect(typeof codex.default).toBe('function');
    expect(codex.default).toBe(codex.createCalipersBundle);
    // a bare call binds the whole calipers surface at defaults.
    const c = codex.createCalipersBundle();
    expect(c.m(8).css()).toBe('8px');
    expect(typeof c.color).toBe('function');
    expect(c.color('#3366cc').css()).toBe('#3366cc');
    // the keyed config threads through to the sub-factory.
    const strict = codex.createCalipersBundle({
      measurements: { errorConfig: { stackHints: 'off' } },
    });
    expect(strict.m(8).css()).toBe('8px');
  });
});
