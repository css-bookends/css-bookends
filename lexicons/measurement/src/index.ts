// @css-bookends/measurement is a SLICE of css-calipers: it re-exports the measurement
// subpath, and the bundler inlines calipers' measurement code so this package ships
// self-contained (external: csstype only, NO culori). See docs/calipers-split.md.
export * from '../../calipers/src/measurements';
