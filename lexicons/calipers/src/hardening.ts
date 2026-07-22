// The SHARED bound surface. One module, imported everywhere (m / i / f and both
// bundle configs), never redefined.
//
// A "bound" is a carried range (min / max). This module owns the pure helpers for
// reading and checking a bound, plus the throw a breach raises. There is NO reaction
// config: a breached bound always THROWS. (The `hardening: 'warn' | 'fail'` reaction
// knob was retired 2026-07-21 — `warn` was dominated by `u` / `fail` / `clamp`; if you
// do not want enforcement, use `u`. See docs/foundations.md.)

/** A carried range bound. Empty (`{}`) when the value is unbounded. */
export type Constraints = {
  min?: number;
  max?: number;
};

/** Strip `undefined` bounds, so an unbounded value reports `{}`. */
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
 * Throw for a broken bound: a breached bound always throws (there is no reaction
 * config). `onFail` routes the throw through the caller's per-instance error store
 * (so the resolved `stackHints` config can append a `[stack=...]` block); when omitted
 * the throw is a plain `Error`.
 */
export const throwBreach = (
  message: string,
  onFail?: (message: string) => never,
): never => {
  if (onFail) onFail(message);
  throw new Error(message);
};
