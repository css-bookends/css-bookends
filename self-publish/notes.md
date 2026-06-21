# Notes & improvement ideas — @css-bookends/self-publish

A running list of known debt and ideas for this package.

## storage default  (idea)

`storage` is required today. Many books pass `(s) => s`. Consider defaulting it to
identity so a manuscript can omit it when input already yields the canonical store.

## Resolved

- **Single output.** The earlier `outputs` map + `default` key was replaced by a single
  `output:` step, so the per-call output-selection question is moot.
- **Step wrapping (onion).** `ManuscriptOverrides.wrap` lets a re-publish decorate a step
  instead of replacing it (newest ring outermost).
- **Shelf composition.** `publishShelf()` (in `@css-bookends/shelf`) is the project-level
  composition root, binding many books with shared config.
