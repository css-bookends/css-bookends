// S2 of the author-time magnitude layer (D4): a BOUNDED `i` captures its literal value on the type, so a
// later overflow check (S3+) can read it off `this`. No check yet: the value just rides alongside the
// bound brand. ONLY when bounded (a bound is what the check compares against), and `f` never captures
// (floats are unencodable; D6). All-src on purpose: `ValueBrand` is internal, so its `unique symbol` only
// lines up with an src `InRangeInteger`, never a built dist one. See docs/magnitude.md and `ValueBrand`.
import { expectType } from 'tsd';

import type { InRangeFloat } from '../../src/float';
import type { IInteger, InRangeInteger } from '../../src/integer';
import type { ValueBrand } from '../../src/internal/magnitude-arithmetic';
import { f, i } from '../support/calipers_tests.src';

// --- NEW behaviour (RED until S2 lands): a bounded literal captures its value ------------------
// The phantom rides alongside the bound brand, so an S3+ check can read the literal 5 off `this`.
expectType<InRangeInteger<0, 10> & ValueBrand<5>>(
  i(5, { min: 0, max: 10 }),
);

// --- boundaries that must hold (GREEN before and after) ---------------------------------------
// only-when-bounded: an unbounded `i` has no bound to check against, so no value phantom.
expectType<IInteger>(i(5));

// non-literal: a runtime value cannot be captured, so a bounded `i` over a variable stays plain InRange.
declare const dynamic: number;
expectType<InRangeInteger<0, 10>>(i(dynamic, { min: 0, max: 10 }));

// the value THREADS through arithmetic now (S4 multiply, S5 add/subtract): `add` carries the new value,
// so a chain keeps checking. 5 + 1 = 6, so the result is the bound brand intersected with `ValueBrand<6>`.
expectType<InRangeInteger<0, 10> & ValueBrand<6>>(
  i(5, { min: 0, max: 10 }).add(1),
);

// `f` NEVER captures (floats are unencodable; D6): a bounded float stays brand-only.
expectType<InRangeFloat<0, 1>>(f(0.5, { min: 0, max: 1 }));
