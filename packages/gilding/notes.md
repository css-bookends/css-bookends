# gilding - notes

The build-time finisher: wraps a CSS post-processor (default core: Lightning CSS) to
complete browser compat (color fallbacks + vendor prefixes) over plain CSS. Output-edge
onion, sibling to the typesetter. Full design in the plan file + `todo.md`.

## Next (TDD)

- [ ] `createGilding(cfg) => (css) => css` factory + config separation: evergreen
      `targets` (browserslist) / `core` swap seam / `coreOptions` pass-through.
- [ ] `src/cores/lightningcss.ts` - the default core: resolve targets with
      `browserslistToTargets(browserslist(targets))`, run `lightningcss.transform`.
- [ ] First real test: oklch + old targets -> output has an `rgb(` fallback AND `oklch(`.

## Open decisions

- Root `browserslist` config (default targets) vs `targets` required per call.
- Library-only v1 vs also a thin CLI (like the typesetter).
- Factory name: `createGilding` (current) vs a `gild(css, cfg)` one-shot helper too.
