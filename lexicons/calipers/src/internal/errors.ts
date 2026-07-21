import type { IMeasurement } from '../core';

export type ErrorCode =
  | 'CALIPERS_E_UNIT_MISMATCH'
  | 'CALIPERS_E_ASSERT_UNIT'
  | 'CALIPERS_E_ASSERT_CONDITION'
  | 'CALIPERS_E_ASSERT_PREDICATE'
  | 'CALIPERS_E_CONSTRAINT'
  | 'CALIPERS_E_CLAMP_NONFINITE_BOUNDS'
  | 'CALIPERS_E_CLAMP_INVALID_RANGE'
  | 'CALIPERS_E_HARDENING_BREACH'
  // The scalar arithmetic contract, emitted by the scalar core for m / i / f / u AND ratio.
  | 'CALIPERS_E_NONFINITE'
  | 'CALIPERS_E_NONFINITE_RESULT'
  | 'CALIPERS_E_DIVIDE_BY_ZERO';

export interface ErrorDetails {
  code?: ErrorCode;
  helper?: string;
  inputSummary?: string;
  stackHint?: string;
}

export type StackHintMode = 'auto' | 'on' | 'off';

export interface ErrorConfig {
  stackHints?: StackHintMode;
}

export type ErrorConfigStore = {
  getErrorConfig: () => Required<ErrorConfig>;
  setErrorConfig: (next: ErrorConfig) => void;
};

export interface MeasurementMethodErrorContext {
  /** Operation name (for example, "add", "divide", "clamp"). */
  operation: string;
  /** Receiver of the method call. */
  caller: IMeasurement<string>;
  /** Other measurements involved (for example, delta, min, max). */
  params: IMeasurement<string>[];
  /** Core human-readable description of what went wrong. */
  message: string;
  /** Optional caller-supplied context prefix. */
  context?: string;
  /** Optional extra details for error formatting. */
  details?: ErrorDetails;
  /** Override the stack hint config for this error. */
  includeStackHint?: boolean;
}

export interface HelperErrorContext {
  /** Operation name (for example, "assertMatchingUnits"). */
  operation: string;
  /**
   * Measurements involved in the helper call (for example, left/right, min/max).
   * Optional: the scalar surfaces (i / f / r) render through this same thrower but
   * carry no measurement params.
   */
  params?: IMeasurement<string>[];
  /** Core human-readable description of what went wrong. */
  message: string;
  /** Optional caller-supplied context prefix. */
  context?: string;
  /** Optional extra details for error formatting. */
  details?: ErrorDetails;
  /** Override the stack hint config for this error. */
  includeStackHint?: boolean;
}

const DEFAULT_ERROR_CONFIG: Required<ErrorConfig> = {
  stackHints: 'auto',
};

// NO process-global error config exists (see docs/config-flow.md "The map"): the
// cascade is the only path in. Every factory builds ONE per-instance store here and
// throws through the helpers bound to it; there is no module-level config to read.
export const createErrorConfigStore = (
  initial: ErrorConfig = {},
): ErrorConfigStore => {
  let config: Required<ErrorConfig> = {
    ...DEFAULT_ERROR_CONFIG,
    ...initial,
  };
  return {
    getErrorConfig: () => config,
    setErrorConfig: (next: ErrorConfig) => {
      config = { ...config, ...next };
    },
  };
};

export const createErrorHelpers = (store: ErrorConfigStore) => {
  const getConfig = (): Required<ErrorConfig> =>
    store.getErrorConfig();
  const throwMeasurementMethodError = (
    ctx: MeasurementMethodErrorContext,
  ): never => {
    const includeStack = shouldIncludeStackHint(
      ctx.includeStackHint,
      getConfig(),
    );
    const stackHint = includeStack
      ? extractStackHint(new Error().stack)
      : undefined;
    throw new Error(
      formatErrorMessage(ctx.operation, ctx.message, ctx.context, {
        ...ctx.details,
        stackHint,
      }),
    );
  };
  const throwHelperError = (ctx: HelperErrorContext): never => {
    const includeStack = shouldIncludeStackHint(
      ctx.includeStackHint,
      getConfig(),
    );
    const stackHint = includeStack
      ? extractStackHint(new Error().stack)
      : undefined;
    throw new Error(
      formatErrorMessage(ctx.operation, ctx.message, ctx.context, {
        ...ctx.details,
        stackHint,
      }),
    );
  };
  // The SCALAR (i / f / u / r) thrower. The scalar ARITHMETIC CONTRACT (non-finiteness,
  // divide-by-zero) passes a machine-readable `code`, matching the measurement core; DESCRIPTIVE
  // messages (a bound's `min <= max`, colour parse failures) pass none (see
  // tests/runtime/audit/error-codes). The message is already fully formed, so this appends the
  // optional `[code=...]` and `[stack=...]` blocks per the instance's resolved config.
  const throwScalarError = (
    message: string,
    code?: ErrorCode,
  ): never => {
    const includeStack = shouldIncludeStackHint(
      undefined,
      getConfig(),
    );
    const stackHint = includeStack
      ? extractStackHint(new Error().stack)
      : undefined;
    throw new Error(
      `${message}${formatDetailBlock({ code, stackHint })}`,
    );
  };
  return {
    throwMeasurementMethodError,
    throwHelperError,
    throwScalarError,
  };
};

const isProductionEnv = (): boolean => {
  if (typeof globalThis === 'undefined') return false;
  const maybeProcess = (
    globalThis as { process?: { env?: { NODE_ENV?: string } } }
  ).process;
  return maybeProcess?.env?.NODE_ENV === 'production';
};

const shouldIncludeStackHint = (
  override: boolean | undefined,
  config: Required<ErrorConfig>,
): boolean => {
  if (override === false) return false;
  if (config.stackHints === 'off') return false;
  if (config.stackHints === 'on') return true;
  if (override === true) return !isProductionEnv();
  return false;
};

const formatDetailBlock = (details?: ErrorDetails): string => {
  if (!details) return '';
  const parts: string[] = [];
  if (details.code) parts.push(`code=${details.code}`);
  if (details.helper) parts.push(`helper=${details.helper}`);
  if (details.inputSummary)
    parts.push(`inputs=${details.inputSummary}`);
  if (details.stackHint) parts.push(`stack=${details.stackHint}`);
  return parts.length > 0 ? ` [${parts.join(' | ')}]` : '';
};

const formatErrorMessage = (
  operation: string,
  message: string,
  context?: string,
  details?: ErrorDetails,
): string => {
  const core = `${operation}: ${message}`;
  const base = context ? `${context}: ${core}` : core;
  return `${base}${formatDetailBlock(details)}`;
};

const extractStackHint = (stack?: string): string | undefined => {
  if (!stack) return undefined;
  const lines = stack
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1);
  if (lines.length === 0) return undefined;
  const filtered = lines.filter(
    (line) =>
      !line.includes('/src/internal/errors') &&
      !line.includes('throwHelperError') &&
      !line.includes('throwMeasurementMethodError'),
  );
  const hint = filtered[0] ?? lines[0];
  return hint.replace(/^at\s+/, '');
};
