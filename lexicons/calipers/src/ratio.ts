import { type IFloat, isFloat } from './float';
import { type IInteger, isInteger } from './integer';
import {
  createErrorConfigStore,
  createErrorHelpers,
  type ErrorCode,
  type ErrorConfig,
  type ErrorConfigStore,
} from './internal/errors';
import { ScalarBase } from './internal/scalarBase';
import { type IUnspecified, u } from './internal/unspecified';
import { type Scalar } from './scalar';

/** A value `ratio` can consume publicly: a raw number or a typed scalar primitive. */
export type RatioValue = Scalar;

/** A recovered ratio scalar: an explicit `i` / `f` comes back intact; a BARE number comes back as an
 *  unspecified `u` (no guessed integer / float type is stamped on a plain number). */
export type RatioScalar = IInteger | IFloat | IUnspecified;

// The internal operand type also allows an unspecified scalar, so a stored `u` can flow back through
// the constructor (e.g. via `withNumerator`, which re-passes the untouched side).
type RatioOperand = RatioValue | IUnspecified;

const isRatioValue = (value: unknown): value is RatioValue =>
  typeof value === 'number' || isInteger(value) || isFloat(value);

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
    // Set the error store FIRST so the throws below render through it.
    this.#errorStore = options.errorStore;
    // A ratio is TWO scalars: embed each operand under the `r` wrapper (mirrors m's embedUnder), so
    // errors read `r(<subtype>): ...` and finiteness is DELEGATED to the scalar (a non-finite raw
    // operand throws `r(u): expected a finite number` with CALIPERS_E_NONFINITE at construction).
    // The scalars are the source of truth; numeric values are read back through `.value()`.
    this.#numeratorScalar = this.#embedOperand(numerator);
    this.#denominatorScalar = this.#embedOperand(denominator);
    // The one rule a bare scalar does NOT enforce (0 is a valid scalar; only a ratio forbids it as
    // a denominator): reject a zero denominator, prefixed with its own subtype (`r(<subtype>)`).
    if (this.#denominatorScalar.value() === 0) {
      this.#throwScalar(
        `r(${this.#denominatorScalar.kind()}): denominator cannot be zero`,
        'CALIPERS_E_DIVIDE_BY_ZERO',
      );
    }
    this.#omitDenominatorWhenOne =
      options.omitDenominatorWhenOne ?? false;
  }

  // Embed a ratio operand as a scalar under the `r` wrapper: an ingested i / f / u is re-labelled
  // intact (its errors become `r(i): ...`), a raw number becomes a `u` carrying the ratio's error
  // store, which validates finiteness at construction (`r(u): expected a finite number`).
  #embedOperand(value: RatioOperand): RatioScalar {
    if (value instanceof ScalarBase) {
      return value.embedUnder('r') as unknown as RatioScalar;
    }
    return u(value as number, {
      errorStore: this.#errorStore,
      wrapperLabel: 'r',
    });
  }

  // Throw a scalar error through this instance's error store (or a default one for the storeless
  // free `r()` path), so `stackHints` decides the stack block and an optional code is appended.
  #throwScalar(message: string, code?: ErrorCode): never {
    const store = this.#errorStore ?? createErrorConfigStore();
    return createErrorHelpers(store).throwScalarError(message, code);
  }

  numerator(): number {
    return this.#numeratorScalar.value();
  }

  denominator(): number {
    return this.#denominatorScalar.value();
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
    return (
      this.#numeratorScalar.value() / this.#denominatorScalar.value()
    );
  }

  css(): string {
    const numerator = this.#numeratorScalar.value();
    const denominator = this.#denominatorScalar.value();
    if (this.#omitDenominatorWhenOne && denominator === 1) {
      return String(numerator);
    }
    return `${numerator}/${denominator}`;
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
 * The ratio factory config. Ratio has NO bound (its throws are structural,
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
 * `createFloat` (minus the bound, which ratio has none of).
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

  // Re-validation is DELEGATED to the RatioImpl constructor built below (and the non-integer early
  // return): it embeds each operand as a scalar, so a non-finite value or a zero denominator throws
  // `r(<subtype>): ...` WITH a code through the error store, never a bare, store-bypassing Error.
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
