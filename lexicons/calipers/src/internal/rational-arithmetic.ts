import type { RatioParts } from '../ratio';

/**
 * Pure rational arithmetic on {@link RatioParts}, the runtime core of the exact-value engine (see
 * docs/pure-values.md). Every result is GCD-reduced with the sign normalized onto the numerator (the
 * denominator is kept positive). Each binary op returns `null` when a numerator or denominator leaves
 * safe-integer range, which is the signal for the scalar layer to TAINT back to a plain double rather
 * than trust a lossy product.
 */

/** Euclid's GCD on the magnitudes; never returns 0 (a 0/0 input yields 1 so a reduce is always safe). */
export const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x === 0 ? 1 : x;
};

/** Reduce by the GCD and normalize the sign onto the numerator. Inputs are assumed to be integers. */
export const reduceParts = (parts: RatioParts): RatioParts => {
  let numerator = parts.numerator;
  let denominator = parts.denominator;
  if (denominator < 0) {
    numerator = -numerator;
    denominator = -denominator;
  }
  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
};

// Build a reduced result, or `null` when it cannot be trusted as an exact rational: a zero denominator,
// or a numerator/denominator past safe-integer range (2^53), where the raw product is already lossy.
const build = (
  numerator: number,
  denominator: number,
): RatioParts | null =>
  denominator !== 0 &&
  Number.isSafeInteger(numerator) &&
  Number.isSafeInteger(denominator)
    ? reduceParts({ numerator, denominator })
    : null;

export const addParts = (
  a: RatioParts,
  b: RatioParts,
): RatioParts | null =>
  build(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );

export const subtractParts = (
  a: RatioParts,
  b: RatioParts,
): RatioParts | null =>
  build(
    a.numerator * b.denominator - b.numerator * a.denominator,
    a.denominator * b.denominator,
  );

export const multiplyParts = (
  a: RatioParts,
  b: RatioParts,
): RatioParts | null =>
  build(a.numerator * b.numerator, a.denominator * b.denominator);

export const divideParts = (
  a: RatioParts,
  b: RatioParts,
): RatioParts | null =>
  build(a.numerator * b.denominator, a.denominator * b.numerator);

/**
 * Auto-detect a clean decimal literal as its exact rational (see docs/pure-values.md, PV3): read the
 * value's shortest round-trip string and, when it is a plain terminating decimal (no exponent) with at
 * most `maxDigits` fractional digits, return `digits / 10^k` reduced. Otherwise `undefined` — float-noise
 * and irrationals stay impure doubles, with NO fraction-guessing (`0.3333333333333333` never becomes
 * `1/3`). The safe-integer guard is a backstop: a numerator/denominator past 2^53 cannot be trusted, so it
 * stays impure even if `maxDigits` was set high.
 */
export const detectCleanRational = (
  value: number,
  maxDigits: number,
): RatioParts | undefined => {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.toString());
  if (!match) return undefined; // scientific notation, NaN, Infinity: not a plain decimal
  const [
    ,
    sign,
    whole,
    frac = '',
  ] = match;
  if (frac.length > maxDigits) return undefined;
  const denominator = 10 ** frac.length;
  const numerator = Number(`${sign}${whole}${frac}`);
  if (
    !Number.isSafeInteger(numerator) ||
    !Number.isSafeInteger(denominator)
  ) {
    return undefined;
  }
  return reduceParts({ numerator, denominator });
};
