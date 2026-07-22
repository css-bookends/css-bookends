# The value modifier (and the non-integer reaction)

`i()` and `f()` each take an optional `modifier`: a value transform applied at INTAKE, before the kind
check and the bound, and carried through arithmetic and clone. It is mechanism, not policy. The library
ships no built-in normalization decisions; you pass the transform where you need it. `m` and the unit
helpers carry no modifier of their own; a measurement gets one only via the `i` / `f` it embeds
(`m(f(deg, { modifier: wrap360 }), 'deg')`). This is a sibling to [hardening](./hardening.md) (which
governs the range bound) and covers the transform-on-the-way-in that hardening does not. For the scalar
family as a whole (`i` / `f` / `u`, their config, and the brands), see the overview in
[`scalars.md`](./scalars.md).

## The shape

```ts
i(value, { modifier: 'floor' | 'ceil' | 'round' | ((n: number) => number) })
```

The three named shortcuts reuse the JS rounding built-ins directly (`'floor'` is `Math.floor`,
`'ceil'` is `Math.ceil`, `'round'` is `Math.round`), for the common case. A function does anything
else, for example a grid snap:

```ts
// A font weight locked to multiples of 100.
const snapTo100 = (n) => Math.round(n / 100) * 100;
i(220, { modifier: snapTo100 }).value(); // 200
```

The modifier ALWAYS runs when it is defined, on every value the builder mints, including arithmetic
results (the config is carried), so a bounded or typed domain stays normalized. The named rounders
are no-ops on values that are already whole; a custom snap still fires on whole values (that is the
point of the grid example: `220` is already an integer, yet it snaps to `200`).

## The default is fail-loud

With NO modifier, a non-integer is a hard error on `i`:

```ts
i(5).multiply(0.5); // throws: 2.5 is not an integer, and nothing rounds it
```

A modifier is a strictly opt-in escape from that default. It never softens it by accident: you only
get coercion when you ask for it, by supplying a modifier.

## `i`'s integer guarantee is absolute

The integer check runs AFTER the modifier and no config can bypass it. A modifier that returns a
non-integer still throws:

```ts
i(5.5, { modifier: (n) => n }); // throws: the modifier did not yield an integer
```

So an `i` can never hold a non-integer, whatever you configure. `f` has no such check: a float takes
whatever the modifier returns, bounded only by `min` / `max`.

## `warnOnNonIntegerInput` (integer-only, default off)

A separate opt-in diagnostic: `console.warn` when the RAW value (before the modifier) is not an
integer. It surfaces the messy inputs a modifier would otherwise clean up silently. It never changes
the result, and it never softens the fail-loud default (without a modifier, a non-integer still
throws before anything could warn).

```ts
i(5, { modifier: 'floor', warnOnNonIntegerInput: true }).multiply(4.44); // warns, then floors to 22
i(220, { modifier: snapTo100, warnOnNonIntegerInput: true });            // clean integer input, no warning
```

You can fix silently (a modifier alone) or fix-and-warn (add the flag). The two knobs are
independent.

## Where it lives

The modifier is available per value (`i(v, { modifier })`) and baked on the factory
(`createIntegerFactory({ modifier })`), so a whole named domain can carry it; a per-call modifier overrides
the factory's. It is stored in the value's single frozen config, so it survives clone and every
arithmetic step.

## Runnable examples

- [`examples/integer-modifier.example.ts`](../examples/integer-modifier.example.ts) — the shortcuts,
  a grid snap, the fail-loud default, and a float modifier.
- [`examples/warn-non-integer-input.example.ts`](../examples/warn-non-integer-input.example.ts) —
  the dirty-input diagnostic.
- [`examples/m-modifier.example.ts`](../examples/m-modifier.example.ts) — a modifier riding on the `f`
  handed to `m()` (a wrapping angle); `m` only attaches the unit.
