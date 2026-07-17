// The SHARED hardening surface. One module, one type, imported everywhere
// (m / i / f and both bundle configs — codex, compendium); never redefined.
//
// "Hardening" is a carried range bound (min / max). This module owns the ONE
// config that decides what a value type does when an operation would BREAK that
// bound, plus the small pure helpers for reading and checking a bound.

/**
 * The reaction when an operation breaks a hardened bound:
 * - `warn` — warn, drop the broken bound, and proceed
 * - `fail` — throw (disallow the breaking operation)
 *
 * There is no silent "ignore" mode: dropping a bound silently is the same as never bounding the
 * value, so use an unbounded value instead.
 *
 * This is the single config the whole stack shares: `m` / `i` / `f` factory
 * configs, the codex (`createCalipersBundle`) and the compendium
 * (`publishCompendium`) all reference THIS type, never a local copy.
 */
export type Hardening = 'warn' | 'fail';

/**
 * Built-in default. `fail` preserves `i` / `f`'s existing throw-on-breach
 * behaviour; opt into `warn` per instance or via a bundle `global`.
 */
export const DEFAULT_HARDENING: Hardening = 'fail';

/**
 * The shared per-unit factory config slice. The `m` / `i` / `f` factories each
 * include it, so the three configs are identical for the hardening field.
 */
export type HardeningConfig = {
  hardening?: Hardening;
};

/** A carried range bound. Empty (`{}`) when the value is unhardened. */
export type Constraints = {
  min?: number;
  max?: number;
};

/** Strip `undefined` bounds, so an unhardened value reports `{}`. */
export const normalizeConstraints = (c: Constraints): Constraints => {
  const out: Constraints = {};
  if (c.min !== undefined) out.min = c.min;
  if (c.max !== undefined) out.max = c.max;
  return out;
};

/** Whether `value` falls outside an (optional) min / max bound. */
export const violatesConstraints = (
  value: number,
  c: Constraints,
): boolean =>
  (c.min !== undefined && value < c.min) ||
  (c.max !== undefined && value > c.max);

/** Human-readable bound, e.g. `[0, 10]`, `[0, ∞)`, `(-∞, 1]`. */
export const describeBound = (c: Constraints): string => {
  const lo = c.min === undefined ? '(-∞' : `[${c.min}`;
  const hi = c.max === undefined ? '∞)' : `${c.max}]`;
  return `${lo}, ${hi}`;
};

/**
 * React to a broken bound per the mode. The `i` / `f`-side helper: `fail`
 * throws a plain `Error` and `warn` logs. (`m` uses its own
 * coded-error infra for `fail` but the same `Hardening` type.)
 *
 * `onFail` lets the caller route the `fail` throw through its own per-instance
 * error store (so the resolved `stackHints` config can append a `[stack=...]`
 * block); when omitted the throw is a plain `Error`, unchanged.
 */
export const reactToBreach = (
  mode: Hardening,
  message: string,
  onFail?: (message: string) => never,
): void => {
  if (mode === 'fail') {
    if (onFail) onFail(message);
    throw new Error(message);
  }
  if (mode === 'warn') console.warn(message);
};
