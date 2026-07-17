// The SHARED value-constraint brands, in a lexicon-neutral module so measurement (`core.ts`)
// AND the scalars (`integer.ts` / `float.ts`) can apply them without any lexicon depending on
// another's file. Each brand is keyed by a module-private `unique symbol`, so the tag cannot be
// forged from outside this module: the only way to obtain a branded value is to pass it through a
// refinement (which runs the check first). The brands are ADDITIVE over the value type and are
// DROPPED by arithmetic (a result can cross a bound), so a derived value must be re-checked.
declare const greaterOrEqualToZeroBrand: unique symbol;
declare const smallerOrEqualToZeroBrand: unique symbol;
declare const inRangeBrand: unique symbol;

export type GreaterOrEqualToZeroBrand = {
  readonly [greaterOrEqualToZeroBrand]: true;
};
export type SmallerOrEqualToZeroBrand = {
  readonly [smallerOrEqualToZeroBrand]: true;
};
export type InRangeBrand<
  Min extends number = number,
  Max extends number = number,
> = {
  readonly [inRangeBrand]: { readonly min: Min; readonly max: Max };
};
