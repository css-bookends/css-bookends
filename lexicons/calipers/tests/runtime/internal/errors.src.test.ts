import { describe, expect, it } from 'vitest';

import {
  createErrorConfigStore,
  createErrorHelpers,
  type ErrorConfig,
} from '../../../src/internal/errors';

/*
 * NO process-global error config exists (see docs/config-flow.md "The map"): the
 * cascade is the only path in, and every error is thrown through the helpers bound to
 * ONE per-instance store. This file drives each stack-hint branch (auto / on / off ×
 * per-call override) through `createErrorHelpers(createErrorConfigStore(cfg))` and
 * asserts the message / detail-block shape actually produced (verified by running).
 */

const baseParams: never[] = [];

// A fresh, isolated store + helpers for a given config; there is no shared state to
// restore between tests because nothing is global.
const helpersFor = (config: ErrorConfig = {}) =>
  createErrorHelpers(createErrorConfigStore(config));

const messageOf = (fn: () => void): string => {
  try {
    fn();
  } catch (error) {
    return (error as Error).message;
  }
  return '';
};

describe('errors — throwHelperError (per-instance store)', () => {
  it('builds the operation/message/context + detail block (no stack hint by default)', () => {
    const { throwHelperError } = helpersFor({ stackHints: 'auto' });
    const message = messageOf(() =>
      throwHelperError({
        operation: 'unitGuard',
        params: baseParams,
        message: 'Expected unit "px".',
        context: 'tokens.gap',
        details: { code: 'CALIPERS_E_ASSERT_UNIT' },
      }),
    );
    // auto + no override -> no stack hint; the base shape is context: op: msg [details].
    expect(message).toBe(
      'tokens.gap: unitGuard: Expected unit "px". [code=CALIPERS_E_ASSERT_UNIT]',
    );
    expect(message).not.toContain('stack=');
  });

  it('appends a stack hint when stackHints is "on"', () => {
    const { throwHelperError } = helpersFor({ stackHints: 'on' });
    const message = messageOf(() =>
      throwHelperError({
        operation: 'unitGuard',
        params: baseParams,
        message: 'boom',
      }),
    );
    // 'on' forces the stack-hint branch regardless of override.
    expect(message).toContain('unitGuard: boom');
    expect(message).toContain('stack=');
  });

  it('omits the stack hint when the per-call override is false even though config is "on"', () => {
    const { throwHelperError } = helpersFor({ stackHints: 'on' });
    const message = messageOf(() =>
      throwHelperError({
        operation: 'unitGuard',
        params: baseParams,
        message: 'boom',
        includeStackHint: false,
      }),
    );
    expect(message).not.toContain('stack=');
  });

  it('omits the stack hint when stackHints is "off"', () => {
    const { throwHelperError } = helpersFor({ stackHints: 'off' });
    const message = messageOf(() =>
      throwHelperError({
        operation: 'unitGuard',
        params: baseParams,
        message: 'boom',
        includeStackHint: true,
      }),
    );
    expect(message).not.toContain('stack=');
  });
});

describe('errors — throwMeasurementMethodError (per-instance store)', () => {
  it('builds the message and appends a stack hint when stackHints is "on"', () => {
    const { throwMeasurementMethodError } = helpersFor({
      stackHints: 'on',
    });
    const message = messageOf(() =>
      throwMeasurementMethodError({
        operation: 'divide',
        caller: { getUnit: () => 'px' } as never,
        params: baseParams,
        message: 'cannot divide by zero',
        details: { code: 'CALIPERS_E_DIVIDE_BY_ZERO' },
      }),
    );
    expect(message).toContain('divide: cannot divide by zero');
    expect(message).toContain('code=CALIPERS_E_DIVIDE_BY_ZERO');
    expect(message).toContain('stack=');
  });

  it('omits the stack hint by default (auto + override true is gated by NODE_ENV, default false)', () => {
    const { throwMeasurementMethodError } = helpersFor({
      stackHints: 'auto',
    });
    const message = messageOf(() =>
      throwMeasurementMethodError({
        operation: 'add',
        caller: { getUnit: () => 'px' } as never,
        params: baseParams,
        message: 'unit mismatch',
      }),
    );
    // auto with no override resolves to no stack hint.
    expect(message).toBe('add: unit mismatch');
  });

  it('includes a stack hint under auto when the per-call override is true (dev env)', () => {
    const { throwMeasurementMethodError } = helpersFor({
      stackHints: 'auto',
    });
    const message = messageOf(() =>
      throwMeasurementMethodError({
        operation: 'clamp',
        caller: { getUnit: () => 'px' } as never,
        params: baseParams,
        message: 'invalid range',
        includeStackHint: true,
      }),
    );
    // auto + override true -> stack hint, because the test env is not production.
    expect(message).toContain('clamp: invalid range');
    expect(message).toContain('stack=');
  });
});

describe('errors — throwScalarError (per-instance store, no code)', () => {
  it('appends only a stack hint (never a code) per the store config', () => {
    const on = helpersFor({ stackHints: 'on' });
    const off = helpersFor({ stackHints: 'off' });
    // the message is already fully formed; the scalar thrower never adds a code.
    expect(
      messageOf(() =>
        on.throwScalarError('r: denominator cannot be zero'),
      ),
    ).toContain('stack=');
    expect(
      messageOf(() =>
        off.throwScalarError('r: denominator cannot be zero'),
      ),
    ).toBe('r: denominator cannot be zero');
  });
});

describe('errors — config stores are independent (no shared global)', () => {
  it('two stores hold their own config, isolated from each other', () => {
    const first = createErrorConfigStore({ stackHints: 'on' });
    const second = createErrorConfigStore({ stackHints: 'off' });
    expect(first.getErrorConfig().stackHints).toBe('on');
    expect(second.getErrorConfig().stackHints).toBe('off');
    // mutating one store never leaks into the other.
    first.setErrorConfig({ stackHints: 'off' });
    expect(first.getErrorConfig().stackHints).toBe('off');
    expect(second.getErrorConfig().stackHints).toBe('off');
  });

  it('createErrorHelpers throws with the store config (stack hint on)', () => {
    const { throwHelperError } = helpersFor({ stackHints: 'on' });
    const message = messageOf(() =>
      throwHelperError({
        operation: 'storeOp',
        params: baseParams,
        message: 'boom',
      }),
    );
    expect(message).toContain('storeOp: boom');
    expect(message).toContain('stack=');
  });
});
