import type { Property } from 'csstype';

/* ---------- the input ---------- */

/**
 * A scale input: the keyword `'none'`, or one to three number factors as a
 * tuple (negatives allowed; the percentage form is out of scope). The book takes
 * a single value, so the engine's variadic `scale(x, y?, z?)` is modelled here as
 * a factor tuple that the book spreads back into `scale(...)`.
 */
export type ScaleInput =
  | 'none'
  | readonly [
      x: number,
      y?: number,
      z?: number,
    ];

/* ---------- factory config ---------- */

/** The book's defaults: the value a bare call (or `undefined`) renders. */
export interface ScaleConfig {
  /** the scale a bare call renders (the keyword or a factor tuple). */
  value: ScaleInput;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a scale book. "Typed token in, plain CSS out": render
 * with `.css()`, typed against csstype's `Property.Scale`, or read the raw
 * rendered string via `.value()`.
 */
export interface ResolvedScale {
  /** the scale as a CSS value, typed against `Property.Scale`. */
  css(): Property.Scale;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A scale book: callable bare (the configured default) or with a scale input. */
export type Scale = (input?: ScaleInput) => ResolvedScale;
