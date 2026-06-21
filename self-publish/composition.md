# Step composition: overriding without overwriting

> **Status: IMPLEMENTED.** The wrap channel below now ships as
> `ManuscriptWrap` / `ManuscriptOverrides.wrap` in `types.ts` + `publishBook.ts`
> (onion, newest ring outermost). This doc is kept as the design record + survey.

A design record for two self-publish questions (now resolved):

- **a)** how to override a step (input / storage / output) without overwriting the
  whole thing, and
- **b)** how that mechanism fits into `publishBook` (the factory).

Backed by a survey of how mainstream libraries solve the same problem. Sources are
listed once at the bottom; inline pointers reference them by name.

## The problem

`publishBook` originally resolved overrides replace-only:

```
input:   over.input ?? base.input        // whole step swapped
storage: over.storage ?? base.storage    // whole step swapped
output:  over.output ?? base.output      // whole step swapped
config:  { ...base.defaults, ...over.config }   // shallow merge
```

So to "accept one extra input shape" you had to reimplement the entire input step.
`ARCHITECTURE.md` promises composable steps ("accept a different or extra set of
shapes, keeping the standard store"); the wrap channel is the mechanism for
*extending* a step rather than replacing it.

## What best practice says

**Extend-without-replace is the decorator / "onion" pattern.** A wrapper receives
the base function and decides whether to run before it, after it, or instead of it
(fallback). This is the consistent answer across the decorator and pipeline
literature. (Decorator pattern, Pipeline pattern, Wrap/augment/override.)

**Order is the one thing you must make explicit.** "The order in which you wrap
decorators matters" is the repeated warning. Compose at creation time, driven by
config. (Pipeline pattern, LangChain middleware.)

**The wrap primitive already has a battle-tested shape: the Redux store enhancer**,
`(createStore) => createStore'` — a higher-order function that wraps the creation
step with access to the original. Our proposed `(base) => newPage` is the same
shape applied per step. Redux also settled composition: multiple enhancers compose
right-to-left via `compose`. (Redux store enhancers, Redux compose.)

**Two hook styles, offer the wrapping one.** LangChain splits simple `before_*`
hooks from `wrap_*` hooks (used when you must wrap the whole call). The `(base) =>
step` form covers both: call `base` first = decorator; call `base` in the `else`
= fallback. So the author picks per step; we do not have to choose a default.
(LangChain middleware.)

**Plain values stay a `Partial` merge.** For config / defaults, the sanctioned
pattern is `Partial<T>` + factory merge (override the parts you name, keep the
rest), which is what we already do. Only the *steps* need the enhancer form.
(Mock-factory-pattern, Extendable factory pattern.)

## Decision

1. **Keep pure-replace, add a wrap channel.** A step override may be a step (replace,
   today's behaviour) or `(base) => step` (wrap). Both are sanctioned: replace =
   factory-method override; wrap = decorator / enhancer.
2. **The wrap primitive is the enhancer shape** `(base) => step`, one shape for
   input, storage, and output.
3. **Decorator-vs-fallback is the author's choice**, expressed by where they call
   `base` inside the wrapper. self-publish does not impose a default.
4. **Composition order = re-publish stacking.** `publishBook(book.manuscript)(...)` is the
   compose step; each re-publish adds one onion layer, newest outermost. Document
   this, because order is the #1 decorator footgun.
5. **Config keeps shallow `Partial` merge.** Only steps get the enhancer form.

## Open follow-ups

- (Shipped) The `ManuscriptOverrides` surface uses a parallel `wrap` field (not a union on
  the existing step keys), sketched against `types.ts` + `publishBook.ts`.

## Sources

- Redux store enhancers: https://deepwiki.com/reduxjs/redux-fundamentals-example-app/4.1-store-enhancers
- Redux `compose()`: https://paulkogel.gitbooks.io/redux-docs/content/docs/api/compose.html
- Decorator pattern is sometimes helpful (Jeremy Miller): https://jeremydmiller.com/2024/04/29/the-decorator-pattern-is-sometimes-helpful/
- The Pipeline design pattern (Guillaume Bonnot): https://medium.com/@bonnotguillaume/software-architecture-the-pipeline-design-pattern-from-zero-to-hero-b5c43d8a4e60
- LangChain custom middleware (wrap vs before hooks): https://docs.langchain.com/oss/python/langchain/middleware/custom
- Wrap, augment, and override functions (dev.to): https://dev.to/alexrustic/wrap-augment-and-override-functions-and-methods-3038
- Extendable factory pattern for React using TypeScript: https://betterprogramming.pub/extendable-factory-pattern-for-react-using-typescript-3298c59fefd8
- Mock-factory-pattern in TypeScript (Partial + factory): https://dev.to/davelosert/mock-factory-pattern-in-typescript-44l9
