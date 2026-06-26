import type { NumberOrLength } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- the input ---------- */

/**
 * A tab-size input: a non-negative `<number>` (NOT restricted to an integer;
 * `2.5` is valid), or a length supplied as an `IMeasurement` from calipers. The
 * percentage form is out of scope. This is the css-value-core `NumberOrLength`
 * shape, re-exported so the book input matches the engine helper exactly.
 */
export type TabSizeInput = NumberOrLength;
export type { NumberOrLength };

/* ---------- factory config ---------- */

/** The book's defaults: the value a bare call (or `undefined`) renders. */
export interface TabSizeConfig {
  /** the tab size a bare call renders (a number or a length measurement). */
  value: TabSizeInput;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a tab-size book. "Typed token in, plain CSS out": render
 * with `.css()`, typed against csstype's `Property.TabSize`, or read the raw
 * rendered string via `.value()`.
 */
export interface ResolvedTabSize {
  /** the tab size as a CSS value, typed against `Property.TabSize`. */
  css(): Property.TabSize;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A tab-size book: callable bare (the configured default) or with an input. */
export type TabSize = (input?: TabSizeInput) => ResolvedTabSize;
