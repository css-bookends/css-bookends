# @css-bookends/self-publish

The engine that binds books.

## Vocabulary

- **lexicon** : primitives for CSS use (measurement, color, spacing). The raw
  vocabulary other packages build on.
- **book** : a workable library for one CSS concern (borders, shadows, ...),
  built by combining three steps.
- **manuscript** : the definition of a book, its three steps plus config defaults.
- **publishBook** : the factory in this package. Give it a manuscript, get a factory
  that binds a book, able to replace or wrap (onion) any step, or the whole manuscript.

## The three steps of every book

1. **input** : accept many raw shapes, parse them into the canonical store.
2. **storage** : normalize the canonical store (defaults, merges, resolution).
3. **output** : render the store into the book's result, which exposes `.css()`.

See [`/ARCHITECTURE.md`](../ARCHITECTURE.md) for the full model.

## Usage

```ts
import { publishBook, type Manuscript } from '@css-bookends/self-publish';

const bordersManuscript: Manuscript<Raw, Store, Out, Cfg> = {
  defaults: { unit: 'px' },
  input: (raw, cfg) => /* raw -> store */,
  storage: (store, cfg) => /* store -> normalized store */,
  output: (store, cfg) => /* store -> result that exposes .css() */,
};

export const publishBookBorders = publishBook(bordersManuscript);

const borders = publishBookBorders();                            // defaults
const rem     = publishBookBorders({ config: { unit: 'rem' } }); // config override
const custom  = publishBookBorders({ storage: myStorage });      // replace one step
const wrapped = publishBookBorders({                             // wrap a step (onion)
  wrap: { output: (base) => (store, cfg) => base(store, cfg) },
});

borders(input).css();   // input -> storage -> output, then render
borders.store(input);   // input + storage only, to compose across books
borders.manuscript;     // the resolved manuscript, to re-publish with more overrides
```

## Compiler-agnostic

self-publish has no runtime dependencies and imports no CSS compiler. A book's steps
return plain data and strings; tools consume them. This is a hard rule across CSS-Bookends.
