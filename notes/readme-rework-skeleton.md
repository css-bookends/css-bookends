# README rework: skeletal plan

Scope: a section-by-section outline for reworking the published `css-calipers`
README. This is a plan, not a rewrite. It reframes the package from
measurement-only to "the missing typed inputs for CSS."

Source files read for this plan:

- `lexicons/calipers/README.md` (current, partially reframed)
- `lexicons/calipers/docs/number-space.md` (scope decision: the scalar space)
- `lexicons/calipers/docs/css-number-value-types.md` (full MDN-verified catalogue)
- `lexicons/calipers/README_MEASUREMENT.md` (in-depth measurement doc)
- `lexicons/calipers/docs/{hardening,integration,errors}.md` (sub-docs)
- `lexicons/calipers/package.json` (name + exports)

Publishing constraint reminder: `lexicons/calipers/` is git-mirrored to a
standalone `css-calipers` repo and published to npm. The README is the
standalone package README. Use the published name `@css-bookends/css-calipers`
and in-package relative paths only (`docs/...`, `examples/...`,
`README_MEASUREMENT.md`). No `lexicons/` paths, no monorepo root files, no
links to the umbrella repo's internal layout.

---

## 1. The thesis (state it once, up front)

The single sentence the whole README hangs on:

> csstype types CSS property names and keyword values; css-calipers types the
> values, the numeric inputs csstype waves through.

That framing already exists in the current lead and in
`docs/number-space.md` ("the property layer is csstype's job, the value layer
is ours"). The rework promotes it from a buried line to the organizing spine.

The four typed primitives, in the order to introduce them:

1. `m()` measurements: number + unit. The mature core.
2. `r()` ratios: aspect-ratio, composes from the scalars.
3. `i()` integers: whole numbers (z-index, order, column-count).
4. `f()` floats: finite reals (opacity, line-height, flex-grow).

Plus two cross-cutting concerns layered on top:

- Hardening: bind a constraint once (`hardenFloat`, `hardenInteger`,
  refinements like `nonNegative` / `inRange`), reuse it.
- The future per-property helper layer (e.g. `opacity()` = a hardened float
  bound to csstype's `Property.Opacity`). Property name from csstype, value
  rule from calipers. This is deferred, tracked in `docs/number-space.md`.

---

## 2. Recommended section order

For each section: what it covers, and a rough target length.

### Title + badges
Package title, npm version / types / license badges. Keep as-is.
Target: unchanged.

### Lead hook (thesis paragraph + before/after snippet)
One bold line, then one paragraph stating the csstype/calipers split, then the
before/after code block (hand-rolled regex parse vs typed math). The current
lead is already close; tighten it to land the thesis in the first two
sentences.
Target: 1 bold line, 1 short paragraph (3-4 sentences), 1 code block.

### Install
`npm install @css-bookends/css-calipers`. Keep as-is.
Target: 1 code block.

### The four primitives at a glance (NEW, short)
A compact orientation block before the deep dives: one line per primitive
(`m` / `r` / `i` / `f`) plus the one-liner of what CSS shape each owns. Could be
a small table or a 4-item list. This is the map; the sections below are the
territory. Anchors the reader before any single primitive's quick start.
Target: 1 short intro sentence + a 4-row table OR 4 bullets. No code, or one
tiny combined snippet.

### Quick start: measurements (`m`)
The mature path. Default-to-px, named unit helpers (`mPx`, `mDeg`, ...),
unit-safe arithmetic, `.css()` at the edge. Keep the current quick start.
Link out to `README_MEASUREMENT.md` for depth rather than inlining it.
Target: 1-2 sentences + 1 code block + 1 sentence on unit helpers and subpaths.

### Ratios and plain numbers (`r`, `i`, `f`)
The new story. Not every CSS value carries a unit; csstype waves any number
through; calipers types those too. Show `r(16, 9)`, `i(3)`, `f(0.5)`, the
`hardenFloat` / `hardenInteger` bound-factory pattern, and that `r()` composes
from hardened scalars. The current "Ratios and plain numbers" section already
does most of this; keep it and link to `docs/number-space.md` for the
full CSS-value mapping.
Target: 2-3 sentences + 1 code block + 1 closing sentence with the
`docs/number-space.md` link.

### Value hardening
Restricted domains (padding `>= 0`, opacity `0..1`). Runtime check that also
hardens the type. Built-ins `nonNegative` / `nonPositive` / `inRange`; the
`is` / `ensure` / `check` / `hardenWith` surface. Note the two hardening
vocabularies coexist (measurement refinements vs scalar bound-factories) and
both narrow the type. Keep the current section; link to `docs/hardening.md`.
Target: 2 sentences + 1 code block + 1 sentence listing built-ins + link.

### The future helper layer (NEW, clearly marked "coming")
The per-property semantic layer: a named helper that is a hardened scalar under
the hood and ties to the matching csstype `Property.*` type. Canonical example:
`opacity()` as `hardenFloat({ min: 0, max: 1 })` bound to `Property.Opacity`.
Frame as the natural top of the stack: csstype names the property, calipers
hardens the value. Mark it explicitly as deferred / not yet shipped so it does
not read as a current API. (See open question 4.2 on whether to include now.)
Target: 2-3 sentences + at most 1 illustrative snippet clearly labelled as the
planned shape, OR no snippet (pseudocode risk). Link to
`docs/number-space.md` "out of scope here" section.

### Features
The bullet summary. Keep, but make sure it now reflects all four primitives
(the current list already mentions integers / floats / ratios). Re-order so the
typed-inputs framing leads.
Target: 6-7 bullets.

### Should I use this?
Good-fit / overkill guidance. Keep as-is.
Target: 2 short paragraphs.

### Errors
Fail-fast behaviour, structured codes (`CALIPERS_E_*`). Keep the short version;
link to `docs/errors.md`.
Target: 2 sentences + link. (Optional: 1 fenced error sample.)

### Factory entrypoint (optional)
`createCalipers` for instance-scoped config. Keep as-is.
Target: 1 sentence + 1 code block + link to the example.

### Philosophy / boundaries
What is in scope (typed numeric inputs) vs out (keywords, `var(--token)`,
`calc()`, shorthand strings). `.css()` is an edge, not a habit. Keep the short
version; link to `docs/integration.md`.
Target: 3-4 sentences + link.

### Media queries
Not part of calipers; lives in `@css-bookends/media-queries`. Keep as-is.
Target: 2 sentences.

### Status & support
Stable 1.0 core, TS 5.6+ / Node 18+, solo early-stage, buy-me-a-coffee.
Keep as-is but update the "core" description to name all four primitives, and
flag the helper layer as planned (not 1.0).
Target: 3 bullets + the coffee button.

### Docs index
Link list to every sub-doc. Keep; add nothing new unless a new sub-doc is
created. Current list already covers hardening, errors, integration,
README_MEASUREMENT, number-space, testing.
Target: the existing bulleted link list.

### Examples
The `examples/` folder sketches. Keep as-is.
Target: the existing bulleted link list.

---

## 3. Keep / cut-or-move / add

### Keep (already serving the new framing)
- Title + badges.
- The lead before/after snippet (regex parse vs typed math). Strong hook.
- Install.
- Measurements quick start.
- "Ratios and plain numbers" section (already added).
- Value hardening section.
- Features, Should I use this, Errors, Factory, Philosophy, Media queries,
  Status, Docs index, Examples.

### Cut from README or move into a sub-doc
Nothing needs deleting outright; the README is already lean. The depth already
lives in sub-docs (`README_MEASUREMENT.md`, `docs/integration.md`,
`docs/hardening.md`, `docs/errors.md`). Guard against RE-INLINING that depth
during the rework. Specifically:
- Do NOT pull the layout-tokens worked example into the README; it lives in
  `README_MEASUREMENT.md` and `docs/integration.md`. Link only.
- Do NOT inline the full CSS-value-to-primitive mapping; it lives in
  `docs/css-number-value-types.md` (via `docs/number-space.md`). Link only.
- Keep error detail in `docs/errors.md`, not the README.
(Removals from the current README require per-piece approval per project rule;
this plan proposes none, only "link, do not inline" discipline.)

### Add
- An at-a-glance "four primitives" map section (item 2 above).
- A clearly-marked "future helper layer" section for the `opacity()`-style
  per-property helpers (deferred), if the user wants it surfaced now.
- The csstype/calipers thesis promoted to the spine: stated in the lead, echoed
  in the at-a-glance map, and in the helper-layer section.
- Make sure Features, Status, and the lead all name the four primitives
  consistently (today some copy still leans measurement-first).

---

## 4. Narrative arc and positioning

The README should read as one argument, top to bottom:

1. Lead hook: CSS is code; treat it that way. The hand-rolled regex parse is
   the pain; typed math is the fix.
2. The thesis: csstype types the property name and keywords, and stops at the
   open numeric value. css-calipers types that value.
3. The four primitives, introduced as a set (the at-a-glance map), then each
   given a quick start: `m` (mature core), then `r` / `i` / `f` (the new
   scalar story).
4. Hardening: the constraint layer. Bind a real CSS domain once (`0..1`,
   `>= 0`), carry the proof in the type, reuse the bound factory.
5. The future helper layer: the semantic top of the stack, where a primitive
   plus a constraint plus a csstype property type become a named helper
   (`opacity()`). Marked as planned.
6. Boundaries and philosophy: what stays outside (keywords, `var`, `calc`,
   shorthand). `.css()` is an edge.
7. Status and support: maturity, support matrix, solo-project ask.

Positioning notes:
- Lead with the typed-inputs framing, not "a measurement library." Measurements
  are the first and most mature primitive, not the whole pitch.
- The csstype relationship is complementary, not competitive. css-calipers
  sits beside csstype and fills the value-layer hole; say so plainly.
- "Build-time-validated, no surprises at runtime" stays a recurring beat.

---

## 5. Open questions to settle before the full rewrite

### 5.1 Measurement depth: README vs README_MEASUREMENT.md
The README currently keeps measurements to a quick start and links out for
depth. Confirm that stays the split. Recommendation: yes, keep README's
measurement section to quick-start size and let `README_MEASUREMENT.md` carry
the worked examples, advanced typing, and error catalogue. Decision needed:
does the at-a-glance map change anything about how much `m` detail the README
carries?

### 5.2 Show the future helper layer now, or wait?
The `opacity()`-style per-property layer is deferred and tracked in
`docs/number-space.md` "out of scope here." Three options:
  a. Include a short "coming" section with a clearly-labelled planned-shape
     snippet (sets the vision, risks reading as shippable API).
  b. Include a one-paragraph "coming" mention with NO snippet (safer, less
     vivid).
  c. Omit from the README entirely; keep it only in `docs/number-space.md`.
Recommendation: (b). It establishes the stack's top without publishing
pseudocode that could drift from the eventual API. Per project rule, any
snippet shown must be runnable against the real API; a planned-but-unbuilt
helper cannot satisfy that, which argues against (a).

### 5.3 Badge and package-name consistency
Verified: `package.json` name is `@css-bookends/css-calipers`; the README
badges and install command already use it. Confirm the title casing stays
"CSS-Calipers" in prose while the package id stays lowercase
`@css-bookends/css-calipers`. Decision needed: is "CSS-Calipers" (prose) vs
`css-calipers` (repo/package) the intended split, and should the README H1 be
"CSS-Calipers" or the package id?

### 5.4 At-a-glance map: table or list?
The four-primitive map can be a 4-row table (Property shape -> primitive) or a
4-item bullet list. A table reads faster but adds width; a list is lighter.
Decision needed: which.

### 5.5 Naming: do the hardened-factory names ship as shown?
The README shows `hardenFloat` / `hardenInteger` and refinements
`nonNegative` / `inRange`. Confirm these exported names match the current
source before the rewrite locks copy around them (the code examples must be
runnable against the real API per project rule). This plan did not verify the
exports against `src/`; verify before drafting final copy.

### 5.6 How prominent should ratio be?
`r()` composes from `i()` / `f()` and is the only scalar with its own CSS data
type (`<ratio>` / aspect-ratio). Decision needed: present `r` as a peer of
`i` / `f`, or as a small composed-helper note after them? The number-space doc
treats it as a sibling family; leaning peer.
