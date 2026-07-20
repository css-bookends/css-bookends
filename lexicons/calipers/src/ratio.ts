import { type IFloat, isFloat } from './float';
import { type IInteger, isInteger } from './integer';
import {
  createErrorConfigStore,
  createErrorHelpers,
  type ErrorConfig,
  type ErrorConfigStore,
} from './internal/errors';
import {
  isUnspecified,
  type IUnspecified,
  u,
} from './internal/unspecified';
import { type Scalar } from './scalar';

/** A value `ratio` can consume publicly: a raw number or a typed scalar primitive. */
export type RatioValue = Scalar;

/** A recovered ratio scalar: an explicit `i` / `f` comes back intact; a BARE number comes back as an
 *  unspecified `u` (no guessed integer / float type is stamped on a plain number). */
export type RatioScalar = IInteger | IFloat | IUnspecified;

// The internal operand type also allows an unspecified scalar, so a stored `u` can flow back through
// the constructor (e.g. via `withNumerator`, which re-passes the untouched side).
type RatioOperand = RatioValue | IUnspecified;

const ratioValueToNumber = (value: RatioOperand): number =>
  typeof value === 'number' ? value : value.valueOf();

const isRatioValue = (value: unknown): value is RatioValue =>
  typeof value === 'number' || isInteger(value) || isFloat(value);

/** Recover a typed scalar from a ratio operand: an explicit `i` / `f` / `u` comes back INTACT; a
 *  bare number becomes an unspecified `u` (a plain number carries no integer / float commitment). */
const toScalar = (value: RatioOperand): RatioScalar => {
  if (isInteger(value) || isFloat(value) || isUnspecified(value)) {
    return value;
  }
  return u(value);
};

export interface IRatio {
  css: () => string;
  toString: () => string;
  valueOf: () => number;
  numerator: () => number;
  denominator: () => number;
  /** the numerator recovered as a scalar: an explicit `i` / `f` intact, a bare number as `u`. */
  numeratorScalar: () => RatioScalar;
  /** the denominator recovered as a scalar: an explicit `i` / `f` intact, a bare number as `u`. */
  denominatorScalar: () => RatioScalar;
  withNumerator: (numerator: RatioValue) => IRatio;
  withDenominator: (denominator: RatioValue) => IRatio;
}

export type RatioParts = {
  numerator: number;
  denominator: number;
};

class RatioImpl implements IRatio {
  #numerator: number;
  #denominator: number;
  #numeratorScalar: RatioScalar;
  #denominatorScalar: RatioScalar;
  #omitDenominatorWhenOne: boolean;
  #errorStore?: ErrorConfigStore;

  constructor(
    numerator: RatioOperand,
    denominator: RatioOperand,
    options: {
      omitDenominatorWhenOne?: boolean;
      errorStore?: ErrorConfigStore;
    } = {},
  ) {
    // Set the error store FIRST so the structural throws below render through it.
    this.#errorStore = options.errorStore;
    const numeratorValue = ratioValueToNumber(numerator);
    const denominatorValue = ratioValueToNumber(denominator);
    if (
      !Number.isFinite(numeratorValue) ||
      !Number.isFinite(denominatorValue)
    ) {
      this.#throwScalar('Ratio values must be finite numbers.');
    }
    if (denominatorValue === 0) {
      this.#throwScalar('Ratio denominator cannot be zero.');
    }
    this.#numerator = numeratorValue;
    this.#denominator = denominatorValue;
    this.#numeratorScalar = toScalar(numerator);
    this.#denominatorScalar = toScalar(denominator);
    this.#omitDenominatorWhenOne =
      options.omitDenominatorWhenOne ?? false;
  }

  // Throw a scalar error through this instance's error store (or a default one
  // for the storeless free `r()` path), so `stackHints` decides the stack block.
  #throwScalar(message: string): never {
    const store = this.#errorStore ?? createErrorConfigStore();
    return createErrorHelpers(store).throwScalarError(message);
  }

  numerator(): number {
    return this.#numerator;
  }

  denominator(): number {
    return this.#denominator;
  }

  numeratorScalar(): RatioScalar {
    return this.#numeratorScalar;
  }

  denominatorScalar(): RatioScalar {
    return this.#denominatorScalar;
  }

  withNumerator(numerator: RatioValue): IRatio {
    return new RatioImpl(numerator, this.#denominatorScalar, {
      errorStore: this.#errorStore,
    });
  }

  withDenominator(denominator: RatioValue): IRatio {
    return new RatioImpl(this.#numeratorScalar, denominator, {
      errorStore: this.#errorStore,
    });
  }

  valueOf(): number {
    return this.#numerator / this.#denominator;
  }

  css(): string {
    if (this.#omitDenominatorWhenOne && this.#denominator === 1) {
      return String(this.#numerator);
    }
    return `${this.#numerator}/${this.#denominator}`;
  }

  toString(): string {
    return this.css();
  }
}

type RatioCreateOptions = {
  simplify?: boolean;
};

// The shared `r` body. Both the free `r()` export and the `createRatio` factory
// delegate here; the factory passes its per-instance `errorStore` so structural
// throws render the resolved `stackHints`, while the free path leaves it unset.
const makeRatio = (
  numeratorOrDenominator: RatioValue,
  denominatorOrOptions?: RatioValue | RatioCreateOptions,
  options?: RatioCreateOptions,
  errorStore?: ErrorConfigStore,
): IRatio => {
  let resolvedDenominator: RatioValue = 1;
  let resolvedOptions = options;
  if (isRatioValue(denominatorOrOptions)) {
    resolvedDenominator = denominatorOrOptions;
  } else if (denominatorOrOptions !== undefined) {
    resolvedOptions = denominatorOrOptions;
  }
  const ratio = new RatioImpl(
    numeratorOrDenominator,
    resolvedDenominator,
    { errorStore },
  );
  return resolvedOptions?.simplify ? simplifyRatio(ratio) : ratio;
};

export function r(
  denominator: RatioValue,
  options?: RatioCreateOptions,
): IRatio;
export function r(
  numerator: RatioValue,
  denominator: RatioValue,
  options?: RatioCreateOptions,
): IRatio;
export function r(
  numeratorOrDenominator: RatioValue,
  denominatorOrOptions?: RatioValue | RatioCreateOptions,
  options?: RatioCreateOptions,
): IRatio {
  return makeRatio(
    numeratorOrDenominator,
    denominatorOrOptions,
    options,
  );
}

export const isRatio = (value: unknown): value is IRatio => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'css' in value &&
    'numerator' in value &&
    'denominator' in value &&
    typeof (value as IRatio).css === 'function' &&
    typeof (value as IRatio).numerator === 'function' &&
    typeof (value as IRatio).denominator === 'function'
  );
};

/**
 * The ratio factory config. Ratio has NO hardening (its throws are structural,
 * not bound breaches), so it carries only the shared `errorConfig` (stack-hint
 * rendering) — enough for `createRatio` to build its own per-instance error
 * store like the other lexicon factories.
 */
export type RatioFactoryConfig = {
  errorConfig?: ErrorConfig;
};

/** The bound ratio surface a `createRatio` instance exposes. */
export interface RatioApi {
  r: typeof r;
  isRatio: (value: unknown) => value is IRatio;
}

/**
 * The ratio FACTORY: build a per-instance error store from `config.errorConfig`
 * and bind an `r` that threads it, so a `createRatio({ errorConfig })` instance
 * renders `stackHints` on its structural throws. Mirrors `createInteger` /
 * `createFloat` (minus hardening, which ratio has no bounds for).
 */
export const createRatio = (
  config: RatioFactoryConfig = {},
): RatioApi => {
  const errorStore = createErrorConfigStore(config.errorConfig ?? {});
  const boundR = ((
    numeratorOrDenominator: RatioValue,
    denominatorOrOptions?: RatioValue | RatioCreateOptions,
    options?: RatioCreateOptions,
  ): IRatio =>
    makeRatio(
      numeratorOrDenominator,
      denominatorOrOptions,
      options,
      errorStore,
    )) as typeof r;
  return {
    r: boundR,
    isRatio,
  };
};

export const parseRatio = (
  value: number | string | IRatio | IInteger | IFloat,
): RatioParts | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? { numerator: value, denominator: 1 }
      : null;
  }
  if (isInteger(value) || isFloat(value)) {
    const numeric = value.valueOf();
    return Number.isFinite(numeric)
      ? { numerator: numeric, denominator: 1 }
      : null;
  }
  if (isRatio(value)) {
    return {
      numerator: value.numerator(),
      denominator: value.denominator(),
    };
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes('/') || trimmed.includes(':')) {
    const delimiter = trimmed.includes('/') ? '/' : ':';
    const [
      left,
      right,
    ] = trimmed.split(delimiter);
    if (left === undefined || right === undefined) return null;
    const numerator = Number(left.trim());
    const denominator = Number(right.trim());
    if (
      !Number.isFinite(numerator) ||
      !Number.isFinite(denominator)
    ) {
      return null;
    }
    if (denominator === 0) return null;
    return { numerator, denominator };
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed)
    ? { numerator: parsed, denominator: 1 }
    : null;
};

export const normalizeRatio = (ratio: IRatio): IRatio => {
  let numerator = ratio.numerator();
  let denominator = ratio.denominator();

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    throw new Error('Ratio values must be finite numbers.');
  }
  if (denominator === 0) {
    throw new Error('Ratio denominator cannot be zero.');
  }

  if (
    !Number.isInteger(numerator) ||
    !Number.isInteger(denominator)
  ) {
    return new RatioImpl(numerator, denominator);
  }

  if (denominator < 0) {
    numerator = -numerator;
    denominator = Math.abs(denominator);
  }

  const gcd = (a: number, b: number): number => {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const next = x % y;
      x = y;
      y = next;
    }
    return x === 0 ? 1 : x;
  };

  const divisor = gcd(numerator, denominator);
  return new RatioImpl(numerator / divisor, denominator / divisor);
};

export const reduceRatio = (ratio: IRatio): IRatio =>
  normalizeRatio(ratio);
export const simplifyRatio = (ratio: IRatio): IRatio => {
  const reduced = normalizeRatio(ratio);
  return new RatioImpl(reduced.numerator(), reduced.denominator(), {
    omitDenominatorWhenOne: true,
  });
};

export const ratioToFloat = (ratio: IRatio): number =>
  ratio.numerator() / ratio.denominator();

export const toFloat = (ratio: IRatio): number => ratioToFloat(ratio);
