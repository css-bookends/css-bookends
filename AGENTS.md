# AGENTS.md

Guidance for agents working in CSS-Bookends. See `ARCHITECTURE.md` for the full
factory + book model, and each package's `design.md` / `notes.md` for specifics.

## Global rules

### Output is always `.css()` (absolute)

Every helper in CSS-Bookends, lexicon or book, renders its final output through a
single `.css()` terminal. This is universal and not negotiable per helper.

- **`.css()` is the only renderer.** Rendering to a CSS string ALWAYS happens
  through `.css()`. No method may return a rendered string per format (no
  `.hex(): string`, `.toLong(): string`, etc.).
- **The variant is a typed object, never a magic string.** Each book exports a
  named preset namespace of typed format objects (e.g. colours `colorFormats.hex`,
  `colorFormats.rgbLegacy`; a true book would have `borderFormats.long`). The
  format type is a discriminated union, so each variant can carry its own typed
  options. Do NOT accept a bare string literal as the format.
- **The variant is chosen by factory config.** The output format is set at factory
  time via the press config (`output: colorFormats.hex`). `.css()` with no
  argument renders the configured variant.
- **Two ways to pick a one-off variant, both ending in `.css()`:**
  - **As an argument:** `colour(x).css(colorFormats.hex)`.
  - **As a format selector:** a method like `colour(x).hex()` that returns the
    navigable result configured to that format (it does NOT render), so you still
    finish with `.css()`: `colour(x).hex().css()`. Selectors return the helper's
    resolved type, never a string, and the chosen format persists through later
    modifications. This is the line that keeps selectors compatible with the rule.
  The configured default still wins when no override is given.
- **Intermediate values may still be navigated** (drill into a resolved result,
  chain modifications), but the moment you render to CSS, it goes through `.css()`.

Why: a single, predictable output seam is what lets the internals of any helper be
rewritten without touching call sites (the whole point of the factory model). It
also keeps every helper consistent, so a consumer never has to learn a different
render method per package.

Examples:

```ts
borders(spec).css();                       // configured variant per factory config
colour('#3366cc').css();                   // configured format (default colorFormats.css)
colour('#3366cc').css(colorFormats.hex);   // one-off override (argument) -> '#3366cc'
colour('#3366cc').hex().css();             // one-off override (selector) -> '#3366cc'
colour('red').darken(0.2).css();           // navigate/modify, then render via .css()
```
