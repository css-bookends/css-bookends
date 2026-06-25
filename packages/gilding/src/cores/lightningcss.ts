import browserslist from 'browserslist';
import { browserslistToTargets, transform } from 'lightningcss';

import type { PostProcessCore } from '../types';

/**
 * The impl-specific options the Lightning CSS core forwards to `transform`. Narrow on
 * purpose: the finisher owns `filename`, `code`, and `targets` (the evergreen part);
 * everything else Lightning CSS exposes can be passed through here.
 */
export interface LightningOptions {
  /** minify the output (collapse whitespace, shorten values). Off by default. */
  minify?: boolean;
  /** opt into draft-spec syntax lowering (e.g. nesting, custom media). */
  drafts?: { customMedia?: boolean };
}

/**
 * The default core: a thin onion around Lightning CSS. It resolves the evergreen
 * browserslist targets itself, then runs `lightningcss.transform`, which adds the
 * older-browser fallbacks and vendor prefixes those targets require.
 */
export const lightningCore: PostProcessCore<LightningOptions> = {
  name: 'lightningcss',
  finish(css, evergreen, options) {
    const { targets: query } = evergreen;
    const targets =
      query === undefined
        ? undefined
        : browserslistToTargets(
            browserslist(
              typeof query === 'string'
                ? query
                : [
                    ...query,
                  ],
            ),
          );

    const { code } = transform({
      filename: 'gilding.css',
      code: Buffer.from(css),
      targets,
      ...options,
    });

    return Buffer.from(code).toString('utf8');
  },
};
