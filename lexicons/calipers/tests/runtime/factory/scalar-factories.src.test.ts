/* eslint-disable no-restricted-syntax -- this whole file tests the scalar factories;
   every create{Integer,Float,Ratio}() call is the subject under test. */
// Direct behavioral tests for the scalar factories `createInteger` / `createFloat`.
// They were only reached indirectly through the bundle cascade; the split turns each
// into its own package, so drive the factory directly here: the configured hardening
// reaction must reach both the bound `i` / `f` helper and the `hardenInteger` /
// `hardenFloat` bound-constraint builders it returns.
import { describe, expect, it } from 'vitest';

import { createFloat } from '../../../src/float';
import { createInteger } from '../../../src/integer';
import { createRatio } from '../../../src/ratio';

describe('createInteger (direct factory behavior)', () => {
  it('binds an i carrying the configured hardening reaction', () => {
    const strict = createInteger({ hardening: 'fail' });
    expect(() =>
      strict.i(8, { min: 0, max: 10 }).multiply(2),
    ).toThrow(/maximum/);

    const loose = createInteger({ hardening: 'warn' });
    expect(loose.i(8, { min: 0, max: 10 }).multiply(2).value()).toBe(
      16,
    );
  });

  it('propagates the reaction to its hardenInteger builder', () => {
    const loose = createInteger({ hardening: 'warn' });
    const fontWeight = loose.hardenInteger({ min: 0, max: 10 });
    expect(fontWeight(8).multiply(2).value()).toBe(16);
  });

  it('defaults to fail when no reaction is configured', () => {
    const c = createInteger();
    expect(() => c.i(8, { min: 0, max: 10 }).multiply(2)).toThrow(
      /maximum/,
    );
  });
});

describe('createFloat (direct factory behavior)', () => {
  it('binds an f carrying the configured hardening reaction', () => {
    const strict = createFloat({ hardening: 'fail' });
    expect(() =>
      strict.f(0.6, { min: 0, max: 1 }).multiply(2),
    ).toThrow(/maximum/);

    const loose = createFloat({ hardening: 'warn' });
    expect(loose.f(0.6, { min: 0, max: 1 }).multiply(2).value()).toBe(
      1.2,
    );
  });

  it('propagates the reaction to its hardenFloat builder', () => {
    const loose = createFloat({ hardening: 'warn' });
    const alpha = loose.hardenFloat({ min: 0, max: 1 });
    expect(alpha(0.6).multiply(2).value()).toBe(1.2);
  });

  it('defaults to fail when no reaction is configured', () => {
    const c = createFloat();
    expect(() => c.f(0.6, { min: 0, max: 1 }).multiply(2)).toThrow(
      /maximum/,
    );
  });
});

describe('createRatio (direct factory behavior)', () => {
  it('binds an r that builds ratios', () => {
    const { r } = createRatio();
    expect(r(16, 9).css()).toBe('16/9');
  });

  it('tolerates an empty config and exposes isRatio', () => {
    const c = createRatio({});
    expect(c.isRatio(c.r(16, 9))).toBe(true);
    expect(c.isRatio(42)).toBe(false);
  });
});

describe('scalar errorConfig (stackHints) rendering', () => {
  const captureMessage = (fn: () => void): string => {
    try {
      fn();
    } catch (error) {
      return (error as Error).message;
    }
    return '';
  };

  it('createInteger renders a stack hint when stackHints is "on"', () => {
    const c = createInteger({ errorConfig: { stackHints: 'on' } });
    expect(
      captureMessage(() => c.i(8, { min: 0, max: 10 }).multiply(2)),
    ).toContain('stack=');
  });

  it('createInteger omits the stack hint when stackHints is "off"', () => {
    const c = createInteger({ errorConfig: { stackHints: 'off' } });
    expect(
      captureMessage(() => c.i(8, { min: 0, max: 10 }).multiply(2)),
    ).not.toContain('stack=');
  });

  it('createFloat renders a stack hint when stackHints is "on"', () => {
    const c = createFloat({ errorConfig: { stackHints: 'on' } });
    expect(
      captureMessage(() => c.f(0.6, { min: 0, max: 1 }).multiply(2)),
    ).toContain('stack=');
  });

  it('createRatio renders a stack hint on a structural error when stackHints is "on"', () => {
    const c = createRatio({ errorConfig: { stackHints: 'on' } });
    // a zero denominator is a structural ratio error (always throws).
    expect(captureMessage(() => c.r(1, 0))).toContain('stack=');
  });
});
