# The scalar lexicons: `i`, `f`, and `u`

calipers' unitless number lexicons, the counterpart to `m()` (unit-bearing measurements) and `r()`
(ratios). This is the one place that ties the scalar family together; the deep-dives it links cover
each feature in full.

## The three scalars

- **`i()` — a secure integer.** Validated whole at construction, and it ENFORCES integer-ness through
  arithmetic: a result that is no longer whole throws. This is CSS `<integer>` (z-index, font-weight,
  order, and the like).
- **`f()` — a secure number.** Accepts any finite value (CSS `<number>`: opacity, line-height,
  flex-grow). The name is "float," but it does not require a fraction; it is the "any finite number"
  lexicon.
- **`u` — the unspecified number (internal).** A bare number with NO type security. It is what `m`
  wraps a plain number in, and what `r` recovers a bare operand as. It has NO public builder: you
  RECEIVE an `IUnspecified` (from ratio, and later from measurements), you never construct one. To
  give it a secure type, mint a fresh `i`/`f` from its value.

## Value-based vs type-secure (an important distinction)

Two different questions, and they can disagree on a `u`:

- **"Is the current value whole?"** — the value-based instance methods `isInt()` / `isFloat()`. On a
  `u` of `5`, `isInt()` is `true`.
- **"Is this a secure integer?"** — the type guards `isInteger()` / `isFloat(x)`. On that same `u`,
  `isInteger(u)` is `false`.

That gap, a value that reads whole but carries no integer guarantee, is exactly what "unspecified"
means.

## The scalar config, at a glance

`i` / `f` are the config-bearing scalars: they extend the checked base (`ScalarRestricted`) and hold
the numeric config (set ONCE at construction; to change it, mint a fresh value). `u` extends the BARE
base (`ScalarBase`) and carries NONE of it, it is finite math only. So the config below is `i` / `f`:

- **Bounds** (`min` / `max`); a broken bound **throws** (there is no reaction knob — the planned
  `clamp` will add absorb-to-limit). See [`hardening.md`](./hardening.md).
- **The modifier** (`'floor'` / `'ceil'` / `'round'` or a function) and the opt-in
  **`warnOnNonIntegerInput`** diagnostic. See [`value-modifier.md`](./value-modifier.md).
- **The `InRange` compile-time brands** (a runtime bound surfaced as a type-level proof). See
  [`hardening.md`](./hardening.md).

All three share the finite-math core and immutability: **`clone()`** is a config-preserving copy, and
every operation returns a NEW value without mutating the source, so a value's `isInt()` can never go
stale.

## Why `u` exists

Two reasons, both about honesty:

1. **Config-neutrality.** A plain number must never silently inherit an `f`/`i` lexicon's config. If a
   bare number were wrapped in `f`, and that `f` carried a modifier (say a bundle set
   `createCalipersBundleFactory({ float: { modifier: 'floor' } })`, or a future `f` default), then a plain
   `m(5)` would get a transformation the author never asked for. `u` is deliberately NOT `f`: it is
   config-neutral, carrying ONLY what it is explicitly handed, so a bare number stays untouched.
   (Measurements embedding `u` is the pending step; this is what `u` is FOR.)
2. **Recovery honesty.** Hand a bare number to a ratio (`r(16, 9)`) and recovering its numerator as
   `i(16)` would falsely stamp integer security on a plain number. `r` wraps a bare operand in `u`
   instead, so `numeratorScalar()` returns an `IUnspecified`: the value is preserved, with no guessed
   `i`/`f` type. An explicit `i`/`f` operand still comes back intact.

## Committing an unspecified value to a secure type

You do not "upgrade" or mutate a `u`. Mint a fresh secure value from it:

```ts
const secure = i(theUnspecified.value()); // now a proven integer (throws if not whole)
```

Minting is the way: config is set once, and scalars are immutable, so a new value with the type and
config you want is always one construction away.

## See also

- [`number-space.md`](./number-space.md) — where scalars fit in the CSS number space.
- [`value-modifier.md`](./value-modifier.md) — the modifier and the `warnOnNonIntegerInput` diagnostic.
- [`hardening.md`](./hardening.md) — bounds (throw on breach), refinements, and the brands.
- Examples: `examples/integers-floats.example.ts`, `examples/integer-modifier.example.ts`,
  `examples/constraint-brands.example.ts`, `examples/named-domain-teaching.example.ts`.
