/**
 * `@css-bookends/e2e` - private, test-only package.
 *
 * This package ships no runtime API. It exists to host END-TO-END tests that prove the
 * gilding pipeline works as a whole (books emit plain CSS, calipers colour formats carry
 * their fallbacks, gilding's Lightning CSS core finishes the result for a target set),
 * kept SEPARATE from the gilding unit tests. The tests live in `tests/e2e/`.
 *
 * The export below is a marker only, so `build` / `test:tsc` have a `src` entry to
 * compile. Nothing here is meant to be consumed.
 */
export const E2E_PACKAGE = '@css-bookends/e2e' as const;
