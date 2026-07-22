/* eslint-disable no-restricted-syntax -- this whole file tests factory-instance isolation;
   every createIntegerFactory / createCalipersBundleFactory call here is the subject under test. */
// Independent factory instances: multiple createIntegerFactory / bundle instances with DIFFERENT configs
// coexist with NO shared global state (the factory-first property). Two instances configured
// differently side by side never interfere. Exercises isolation at the factory tier and the bundle
// tier via `errorConfig` (stackHints), and at the per-value tier via the bound.
import { describe, expect, it } from 'vitest';

import {
  createCalipersBundleFactory,
  createIntegerFactory,
} from '../../../src';

const bounded = { min: 0, max: 10 };

// A thrown error renders a `stack=` block iff the resolved errorConfig.stackHints is 'on'.
const messageOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (error) {
    return (error as Error).message;
  }
  return '';
};

describe('independent factory instances (no global state)', () => {
  it('two createIntegerFactory instances with different errorConfig never interfere', () => {
    const verbose = createIntegerFactory({
      errorConfig: { stackHints: 'on' },
    });
    const quiet = createIntegerFactory({
      errorConfig: { stackHints: 'off' },
    });
    // both breach the bound (16 > 10) and throw; only `verbose` renders the stack hint
    expect(
      messageOf(() => verbose.i(8, bounded).multiply(2)),
    ).toContain('stack=');
    expect(
      messageOf(() => quiet.i(8, bounded).multiply(2)),
    ).not.toContain('stack=');
    // verbose is unaffected after the quiet instance was used
    expect(
      messageOf(() => verbose.i(8, bounded).multiply(2)),
    ).toContain('stack=');
  });

  it('per-value bounds are independent within one factory', () => {
    const { i } = createIntegerFactory();
    // same factory, same starting value, different per-value bounds -> independent outcomes
    expect(() => i(8, { min: 0, max: 10 }).multiply(2)).toThrow(); // 16 > 10
    expect(i(8, { min: 0, max: 100 }).multiply(2).value()).toBe(16); // 16 <= 100
  });

  it('two bundles forward their integer errorConfig independently', () => {
    const verbose = createCalipersBundleFactory({
      integer: { errorConfig: { stackHints: 'on' } },
    });
    const quiet = createCalipersBundleFactory();
    expect(
      messageOf(() => verbose.i(8, bounded).multiply(2)),
    ).toContain('stack=');
    // quiet bundle: default (auto -> no stack) -- identical call, different bundle
    expect(
      messageOf(() => quiet.i(8, bounded).multiply(2)),
    ).not.toContain('stack=');
  });
});
