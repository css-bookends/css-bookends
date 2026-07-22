// CODEX: the css-calipers FULL-SURFACE entry. It re-exports the entire package
// surface (`export * from './index'`, which itself surfaces the master factory
// from `./bundle`) plus the sub-factories, so a consumer who wants everything in
// one import (`@css-bookends/css-calipers/codex`) gets it. A bare
// `createCalipersBundleFactory()` binds the whole calipers surface at defaults; it is
// also this module's DEFAULT export (re-exported from `./bundle`).
//
// The master factory itself lives in `./bundle` (cycle-free) so the package ROOT
// can surface it too, exactly like `createColorFactory`. Configuration always goes
// through a factory; this entry is the convenience layer on top.
import { createCalipersFactory } from './factory';

export * from './index';
// `createCalipersFactory` lives on the `./factory` real path and is not re-exported by the root;
// surface it here so the codex exposes both sub-factories (`createCalipersFactory` / `createColorFactory`).
export { createCalipersFactory };
export { default } from './bundle';
export type {
  CalipersFactoryConfig,
  CalipersInstance,
} from './factory';
