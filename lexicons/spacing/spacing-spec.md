# spacing coverage — the value model + the padding/margin split

The source of truth for the `spacing` LEXICON. spacing is shared input guts; it is
**never used alone**. The padding and margin BOOKS each call `parseSpacing` (with their
own value-domain policy) inside their input step. spacing has no storage/output of its
own - the books own output.

## Interface (mirrors borders)

- **Scalar = the shorthand** (no `all` key): a bare value means all four sides.
- Object form: axes **`x`** (left + right), **`y`** (top + bottom); sides
  `top/right/bottom/left`. Side > axis is the intended precedence.

## Where the work lives (input vs storage)

- **LEXICON = INPUT only.** `parseSpacing(input, policy)` VALIDATES the shape and each
  value (against the policy) and **returns the input unchanged - shorthand intact.** It
  does NOT spell anything out.
- **STORAGE = the books.** Spelling the input out into the fully-split four sides (no
  shorthand, every prop separate, applying side > axis precedence) is each book's
  STORAGE step. It differs slightly between padding and margin, so it lives in the
  books, not the lexicon.

```
parseSpacing(m(8))                 // -> m(8)            (validated; unchanged)
parseSpacing({ x: m(4), y: m(8) }) // -> { x:m(4), y:m(8) } (validated; unchanged)
parseSpacing('huge')               // throws (invalid value)
parseSpacing('auto', { auto:false })   // throws (padding policy)
// spelling { x, y } out into { top, right, bottom, left } = the book's storage step
```

## Value model

A single value is `IMeasurement | <keyword> | 0`. Keywords split in two:

- `CssWideKeyword` = `inherit | initial | unset | revert | revert-layer` — valid on any
  property (and on both padding + margin).
- `auto` — valid on margin, NOT on padding.

## padding vs margin — value domain (researched: MDN / CSS spec)

Grammar: `padding-top = <length-percentage [0,∞]>` (non-negative);
`margin-top = <length-percentage> | auto | <anchor-size()>`.

| Value | `padding` | `margin` |
| --- | :---: | :---: |
| `<length>` (px/em/rem/…) | yes | yes |
| `<percentage>` (vs containing-block inline-size) | yes | yes |
| `0` | yes | yes |
| `calc()` / `<length-percentage>` | yes | yes |
| CSS-wide keywords (`CssWideKeyword`) | yes | yes |
| **negative values** | NO (spec clamps to >= 0) | yes |
| **`auto`** | NO | yes |
| **`anchor-size()`** (newer; out of scope here) | NO | yes |

So the books are **not** value-symmetric. The two real differences in our model:
**`auto`** and **negative measurements** (both margin-only). `anchor-size()` is out of
scope.

## Expandable lexicon

The value types are generic over the keyword set `K` and extra value kinds `F`
(`anchor-size()`), and `parseSpacing` takes a runtime policy, so each book narrows the
lexicon to its spec at both the type level and runtime:

```ts
parseSpacing<K extends SpacingKeyword, F extends AnchorSize>(
  input: SpacingInput<K, F>,
  policy?: { auto?: boolean; negative?: boolean; anchorSize?: boolean }, // default: all allowed
): SpacingInput<K, F>   // validated, unchanged (spell-out is the book's storage)
```

- **margin book**: `SpacingInput<SpacingKeyword, AnchorSize>` (incl. `auto` +
  `anchor-size()`), policy `{ auto: true, negative: true, anchorSize: true }` (the
  permissive default).
- **padding book**: `SpacingInput<CssWideKeyword, never>` (NO `auto`/`anchor-size()` at
  the type level), policy `{ auto: false, negative: false, anchorSize: false }`.

Policy violations throw (strict). Type-level, `auto` and `anchor-size()` are simply
absent from padding's input.

## Status / staging

- **Done:** spacing lexicon INPUT (`parseSpacing` validate-only + the contract +
  `anchorSize()`), expandable. The lexicon has NO storage/output.
- **Next:** padding + margin BOOKS — STEP 1 (input) only, each calling `parseSpacing`
  with its policy. Their STORAGE (spell-out to the four sides) + output are later.
- **Deferred:** `books/positioning` (imports the old `margins()`; breaks on the new
  contract — left deferred, like borders).

## Sources
- MDN `padding`: https://developer.mozilla.org/en-US/docs/Web/CSS/padding
- MDN `margin`: https://developer.mozilla.org/en-US/docs/Web/CSS/margin
- CSS Box Model Level 3: https://www.w3.org/TR/css-box-3/
