// S1 of the author-time magnitude layer (D4): the type-level integer arithmetic primitives.
// Pins their contract AND the measured ceiling. Integer-only, tuple-based (see docs/magnitude.md D6).
import { expectType } from 'tsd';

import type {
  GreaterThan,
  Multiply,
} from '../../src/internal/magnitude-arithmetic';

// --- Multiply: A * B as a number literal --------------------------------------------------
expectType<15>(0 as unknown as Multiply<5, 3>);
expectType<0>(0 as unknown as Multiply<0, 9>);
expectType<7>(0 as unknown as Multiply<7, 1>);

// --- GreaterThan: strict A > B ------------------------------------------------------------
expectType<true>(false as unknown as GreaterThan<15, 10>); // overflow
expectType<false>(false as unknown as GreaterThan<8, 10>); // in range
expectType<false>(false as unknown as GreaterThan<10, 10>); // equal is NOT greater

// --- the measured ceiling: ~10,000 (TS tuple-length wall) ---------------------------------
expectType<4900>(0 as unknown as Multiply<70, 70>); // under the ceiling: fine
// @ts-expect-error product 10,000 exceeds TS's tuple-length ceiling ("too large to represent")
type _TooLarge = Multiply<100, 100>;
