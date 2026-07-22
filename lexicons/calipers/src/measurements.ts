// The COLOUR-FREE measurement surface. This barrel re-exports everything the
// root entry does EXCEPT the colour value primitive, so a consumer who imports
// `@css-bookends/css-calipers/measurements` gets `m()` / `r()` / `i()` / `f()`,
// the refinements, and the unit helpers, with NO transitive dependency on
// `./color` (and therefore no `culori` in the graph).
//
// MUST NOT import `./color` (directly or transitively). The colour surface lives
// at the `./color` subpath and is opt-in only.
export * from './core';
// The bare default-instance helpers (`m`, refinements, unit-helper builders,
// error-config accessors) assembled via `createCalipersFactory()` at its defaults.
export * from './default';
// The measurement lexicon factory. Bind config once (even at defaults) and export
// the bound surface from your own module. `./factory` is colour-free.
export {
  type CalipersFactoryConfig,
  type CalipersInstance,
  createCalipersFactory,
} from './factory';
export * from './units/absolute';
export * from './units/angle';
export * from './units/container';
export * from './units/font-relative';
export * from './units/frequency';
export * from './units/grid';
export * from './units/percent';
export * from './units/resolution';
export * from './units/time';
export * from './units/viewport';
export * from './units/viewport-dynamic';
export * from './units/viewport-large';
export * from './units/viewport-small';
