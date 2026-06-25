import {
  type ColorConfig,
  type ColorInput,
  type ColorStore as Store,
  defaultColorConfig,
  parseColor,
  resolveColor as resolve,
  type ResolvedColor,
  storeColor,
} from '@css-bookends/css-calipers';
import type { Manuscript } from '@css-bookends/self-publish';
import { publishBook } from '@css-bookends/self-publish';

/* The colour VALUE primitive (parse / store / resolve, formats, types) now lives in
 * `@css-bookends/css-calipers/color`, where colour is a native typed input alongside
 * `m()` / `r()` / `i()` / `f()`. This package keeps only the `publishBook`-based colour
 * BOOK; `index.ts` re-exports the calipers value surface so the public API is unchanged. */

/** The color book's manuscript: input -> storage -> output. */
export const colorManuscript: Manuscript<
  ColorInput,
  Store,
  ResolvedColor,
  ColorConfig
> = {
  defaults: defaultColorConfig,
  input: (raw) => {
    if (raw === undefined) {
      throw new Error('color: an input color is required');
    }
    return parseColor(raw);
  },
  storage: (store) => storeColor(store),
  output: (store, cfg) => resolve(store, cfg),
};

/** The color factory: `publishBookColor({ config })` binds a color book. */
export const publishBookColor = publishBook(colorManuscript);
