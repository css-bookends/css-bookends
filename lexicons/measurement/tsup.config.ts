import { defineConfig } from 'tsup';

// Bundle the measurement slice self-contained: inline calipers' measurement code
// (noExternal), keep csstype external. culori is never reached from the measurement
// subpath, so it tree-shakes out and never enters this package's graph.
export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  format: [
    'esm',
    'cjs',
  ],
  // The slice points at calipers' SOURCE (a relative path), so tsup treats it as
  // local and inlines both the JS and the .d.ts, self-contained. csstype stays
  // external (a real dep); culori is never reached from measurement, so it is
  // tree-shaken out entirely.
  dts: true,
  clean: true,
  treeshake: true,
  external: [
    'csstype',
  ],
});
