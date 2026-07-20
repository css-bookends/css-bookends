import { type Scalar } from '../scalar';
import {
  type ScalarConstraints,
  ScalarImpl,
  type ScalarOptions,
} from './scalarImpl';

/**
 * `IUnspecified` — the PUBLIC type of an "unspecified number": a value that could be whole or
 * fractional but carries NO type security (unlike a proven `i` / `f`). It is exposed so `ratio` (and
 * later `m`) can hand one back HONESTLY, without stamping a guessed integer / float type onto a bare
 * number. There is NO public builder: you never construct a `u`, you only RECEIVE one, so there is no
 * `u()`-vs-`f()` confusion. To commit an unspecified value to a secure type, MINT a fresh one from
 * its value (`i(x.value())` / `f(x.value())`).
 */
export interface IUnspecified {
  css: () => string;
  toString: () => string;
  valueOf: () => number;
  value: () => number;
  /** The scalar's kind label (`'u'`). Distinct from the value-based `isInt()` / `isFloat()`. */
  kind: () => string;
  unit: () => string;
  constraints: () => ScalarConstraints;
  /** Whether the CURRENT value is whole / fractional. Value-based, NOT a type guarantee. */
  isInt: () => boolean;
  isFloat: () => boolean;
  withValue: (value: number) => IUnspecified;
  add: (delta: Scalar) => IUnspecified;
  subtract: (delta: Scalar) => IUnspecified;
  multiply: (factor: Scalar) => IUnspecified;
  divide: (divisor: Scalar) => IUnspecified;
  clone: () => IUnspecified;
}

/**
 * `u` — the internal "unspecified number" implementation. A sibling of `i` / `f` on the shared
 * `ScalarImpl` base. The TYPE (`IUnspecified`) is public, but this CLASS and the `u` builder stay
 * INTERNAL (absent from the package's value exports and its `exports` map): `u` is `m`'s neutral wrap
 * for a plain number and `ratio`'s wrap for a bare operand, never something a consumer constructs. It
 * accepts any finite value (no integer rule, like `f`) and is config-NEUTRAL: it carries ONLY the
 * options it is handed, never an `i` / `f` lexicon config or any ambient default.
 */
export class UnspecifiedImpl
  extends ScalarImpl
  implements IUnspecified
{
  protected label(): string {
    return 'u';
  }

  protected validateInput(): void {
    // Unspecified: any finite value is accepted; the base's finiteness check is enough. There is no
    // integer rule (that is `i`'s job), and there is no lexicon config (that keeps `u` neutral).
  }

  protected rebuildWith(value: number): this {
    return new UnspecifiedImpl(value, this.options()) as this;
  }
}

/** Runtime guard for an unspecified scalar. Internal (used by `ratio` to detect a stored `u`). */
export const isUnspecified = (
  value: unknown,
): value is IUnspecified => value instanceof UnspecifiedImpl;

/**
 * Build an internal unspecified number. NOT public; `m`'s / `ratio`'s neutral wrap for a plain
 * number, carrying only the options it is handed.
 */
export const u = (
  value: number,
  options: ScalarOptions = {},
): UnspecifiedImpl => new UnspecifiedImpl(value, options);
