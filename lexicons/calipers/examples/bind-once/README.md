# Bind once, export from your own module

The recommended way to use css-calipers. It is a recommendation, not a mandate.

- **The rule:** every value comes from a factory.
- **The recommendation:** call the factories ONCE in one module, export the bound
  helpers, and import from that module everywhere else.

## The files

- **`calipers.ts`** — the single binding module. It calls the codex bundle once
  with NO config (everything at its defaults) and exports the bound helpers.
- **`components.css.ts`** — a media card built from those bare helpers, covering
  every lexicon: `m` (lengths and `mPercent`), `r` (aspect-ratio), `i` (z-index),
  `f` (line-height), and `color`. It also shows the NOT-recommended alternative: a
  config override done inline (a rem-first `m`) instead of set in the binding
  module.

## Why the extra file

Every call site imports `m`, `color`, ... from `calipers.ts`, not from the
library. When the library moves a path, splits a package, or you reconfigure, you
edit that one file and every call site is untouched.

Full rationale: [the factory-first pattern](https://github.com/css-bookends/css-bookends/blob/main/docs/factory-first-pattern.md).

---

This example uses only css-calipers, so it works fully standalone. That said, I
would not write a whole stylesheet with calipers alone: assembling every style
object from raw values by hand is tedious, even if possible. That is the convenience
gap I am building css-bookends to fill, a suite of helpers on top of these same
typed values. See [css-bookends](https://github.com/css-bookends/css-bookends).
