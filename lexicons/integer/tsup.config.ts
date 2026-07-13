import { defineConfig } from 'tsup';

// Self-contained integer slice: inline the source, tree-shake everything else.
export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  format: [
    'esm',
    'cjs',
  ],
  dts: true,
  clean: true,
  treeshake: true,
  external: [
    'csstype',
  ],
});
