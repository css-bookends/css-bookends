import { defineConfig } from 'tsup';

// Calipers (the codex) is built with tsup so the emitted JS and .d.ts are
// nodenext-clean (explicit extensions, no bare relative specifiers) and each
// entry is self-contained. csstype + culori are the only external runtime deps.
// Each entry mirrors a subpath in the package.json `exports` map. See
// docs/calipers-split.md — the slices bundle these same entries from source.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    factory: 'src/factory.ts',
    measurements: 'src/measurements.ts',
    ratio: 'src/ratio.ts',
    integer: 'src/integer.ts',
    float: 'src/float.ts',
    codex: 'src/codex.ts',
    'color/index': 'src/color/index.ts',
    'units/index': 'src/units/index.ts',
    'units/absolute': 'src/units/absolute.ts',
    'units/angle': 'src/units/angle.ts',
    'units/container': 'src/units/container.ts',
    'units/font-relative': 'src/units/font-relative.ts',
    'units/frequency': 'src/units/frequency.ts',
    'units/grid': 'src/units/grid.ts',
    'units/percent': 'src/units/percent.ts',
    'units/resolution': 'src/units/resolution.ts',
    'units/time': 'src/units/time.ts',
    'units/viewport': 'src/units/viewport.ts',
    'units/viewport-dynamic': 'src/units/viewport-dynamic.ts',
    'units/viewport-large': 'src/units/viewport-large.ts',
    'units/viewport-small': 'src/units/viewport-small.ts',
  },
  format: [
    'esm',
    'cjs',
  ],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: true,
  external: [
    'csstype',
    'culori',
  ],
});
