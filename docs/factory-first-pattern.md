# The factory-first pattern

This project has one rule and one recommendation about how you get a value.

- **The rule:** every value comes from a factory. You call `createCalipers()`,
  `createRatio()`, `createCalipersBundle()`, `publishBookColor()`,
  `publishCompendium()`, and so on, and use what they return, rather than
  importing a pre-bound instance.
- **The recommendation:** call the factory once in your own module, even at its
  defaults, and export the bound helpers from there. Your app imports from **your**
  module, **not** from the library.

The factory is already the supported construction path. A few pre-bound
convenience exports still exist while the beta finishes removing them; the
changelog tracks each removal with how to migrate. The recommendation is a
recommendation; you are free to ignore it and call a factory inline.

## Why every value comes from a factory

A pre-bound export locks in one set of choices at import time, for everyone,
forever. A factory hands those choices back to you. That buys four things.

### An override seam

Because you construct the surface yourself, you can wrap or replace any step, swap
an internal, or bind different config, with zero changes at the call sites. You
bind once, so the blast radius of a change is one place.

### Independent instances, no global state to fight

Two factories give you two independent surfaces: an `errorConfig: { stackHints: 'on' }`
instance next to a `stackHints: 'off'` one, or a `defaultUnit: 'rem'`
`m` next to a `defaultUnit: '%'` one. Neither leaks into the other, because there
is no shared mutable singleton.

### Config only makes sense through a factory

Options like `defaultUnit` and `hardening`, and the codex and compendium keyed
cascade (`own key -> global -> default`), all resolve at construction time. A bare
export has nowhere to put them.

### One construction path, so defaults cannot drift

The default surface is just the factory called with no config. It cannot fall out
of step with a configured instance, because both take the same path.

## Bind once, export from your own module

This is the recommended pattern (a recommendation, not a mandate; you may call a
factory inline). It looks like pointless indirection at first.

### The objection

"Why write `export const { m } = createCalipers()` in my own file instead of just
importing `m`?"

### Why it pays off

Your call sites import `m` from *your* module, not the library. The day the
library moves an internal, renames a path, splits a package, or a factory gains a
new option (as `defaultUnit` did), you edit that one binding file and every call
site is untouched. It is the same discipline as a single `db.ts` that configures a
client once and re-exports it, instead of `new Client()` scattered everywhere. The
indirection is exactly what turns a project-wide find-and-replace into a one-file
change.

### Why I insist on it

I once had to update hundreds of import paths across my own portfolio site after a
refactor, purely because I had imported values directly from their source
everywhere instead of routing them through one module I owned. That single owned
module is the whole idea, and it is cheap to set up early.

### See it in code

The runnable `lexicons/calipers/examples/bind-once/` project shows it end to end
(its README is a 30-second read): `calipers.ts` binds once and exports;
`components.css.ts` consumes it and also shows the allowed inline alternative.
`lexicons/calipers/examples/factory-wrapper.example.ts` uses the override seam to
reshape a helper in one place.

## Where this applies

Both layers obey the same rule. In calipers the factories are `createCalipers`,
`createRatio`, `createInteger`, `createFloat`, `createColor`, the per-group unit
factories, and the `createCalipersBundle` codex. In bookends they are the
`publishBook<Name>` factories and the `publishCompendium` bundle. Learn the
pattern once; it is the same everywhere.

## Using calipers on its own

This works standalone: the `bind-once` example uses only css-calipers. That said,
I would not write a whole stylesheet with calipers alone. Assembling every style
object from raw values by hand is tedious, even if perfectly possible. That is the
convenience gap I am building css-bookends to fill: a suite of helpers, on top of
these same typed values, for writing styles more ergonomically. See
[css-bookends](https://github.com/css-bookends/css-bookends).
