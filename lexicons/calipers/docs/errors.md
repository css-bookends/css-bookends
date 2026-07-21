# Errors and error handling

How CSS-Calipers reports problems, the common error codes, and how to configure error
output. For the README overview, see ["Errors"](../README.md#errors).

## Error behavior

- Operations are fail-fast: when you call helpers like `add`, `divide`, `clamp`,
  `measurementMin` / `measurementMax`, or the assertion helpers with invalid input (for
  example, mismatched units or non-finite values), CSS-Calipers throws a normal `Error`.
- Error messages include the operation name (for example,
  `css-calipers.Measurement.divide` or `css-calipers.assertMatchingUnits`), the relevant
  values/units, and any context string you pass in.
- The library does not catch these errors for you. You choose where to place assertions and
  where (if anywhere) to catch and handle exceptions.
- In production, a common pattern is to wrap assertions in dev-only guards (such as
  `if (process.env.NODE_ENV !== 'production')`) or to enforce invariants in tests, so checks
  stay cheap and predictable at runtime.

For concrete uses of these errors in tests and dev-only guards, see `TESTING.md` and the
validation examples:
[validation-unit-tests](../examples/validation-unit-tests.example.ts) and
[validation-and-runtime-checks](../examples/validation-and-runtime-checks.example.ts).

## Common errors

### Non-finite value

```
m(u): expected a finite number (got Infinity) [code=CALIPERS_E_NONFINITE]
```

- **Means:** a value was built from `undefined`, `NaN`, or `Infinity`. The check lives in the
  scalar core, so it fires for `m`, `i`, `f`, `u`, and a ratio operand alike (a measurement's
  prefix names its embedded scalar, e.g. `m(u)` / `m(i)`).
- **Fix:** provide a real numeric value (`m(12)`, `i(3)`, `f(2.5)`). Add a context label so the
  error points to the calling helper or token (`m(12, { context: "tokens.cardWidth" })`).

### Non-finite result

```
f: non-finite result dividing 1.7976931348623157e+308 by 1e-300 [code=CALIPERS_E_NONFINITE_RESULT]
```

- **Means:** a finite operation overflowed to `Infinity` (for example dividing or multiplying
  very large magnitudes). The scalar re-validates every arithmetic result, so this is caught at
  the operation site rather than propagated into a render.
- **Fix:** bound the inputs, or `clamp` into a safe range before the operation.

### Unit mismatch

```
css-calipers.assertMatchingUnits: measurement unit mismatch: px vs em [code=CALIPERS_E_UNIT_MISMATCH]
```

- **Means:** you mixed units without an explicit conversion.
- **Fix:** normalize units at the source, or add an `assertMatchingUnits` call where the
  values enter your system.

### Divide by zero

```
css-calipers.Measurement.divide: Cannot divide 10px by zero [code=CALIPERS_E_DIVIDE_BY_ZERO]
```

- **Means:** you attempted to divide by zero in a measurement operation.
- **Fix:** guard inputs before dividing or replace zero with a safe fallback.

### Clamp bounds

```
css-calipers.Measurement.clamp: clamp: min (20px) must be <= max (12px) [code=CALIPERS_E_CLAMP_INVALID_RANGE]
```

- **Means:** the clamp minimum is greater than the clamp maximum.
- **Fix:** ensure min and max come from the same source or swap them before calling clamp.

### Value constraint

```
css-calipers.refinement.ensure: expected a measurement >= 0 (got -4px) [code=CALIPERS_E_CONSTRAINT]
```

- **Means:** a value-hardening refinement (`nonNegative`, `nonPositive`, `inRange`) rejected
  a value. See [Value hardening](./hardening.md).
- **Fix:** use `is` / `check` / `hardenWith` instead of `ensure` when the value may be
  invalid and you want to branch or fall back rather than throw.

## Stack hints and configuration

For `m` and the unit helpers, errors include a trimmed stack hint in non-production by
default. Stack hints are configured PER INSTANCE through the factory. There is no
process-global error config: the cascade is the only path in (see
[`docs/config-flow.md`](../../../docs/config-flow.md)).

```ts
import { createCalipers } from "@css-bookends/css-calipers";

// Force stack hints on for THIS instance (useful in dev or tests).
const strict = createCalipers({ errorConfig: { stackHints: "on" } });

// Disable them for THIS instance (e.g. production).
const quiet = createCalipers({ errorConfig: { stackHints: "off" } });
```

`stackHints` also flows through the bundle cascade: set it once via
`createCalipersBundle({ global: { errorConfig: { stackHints: "off" } } })` and every unit
inherits it, while a unit's own `errorConfig` key overrides.

The bare package exports `getErrorConfig` / `setErrorConfig` are the DEFAULT INSTANCE's
accessors: they read/mutate that one instance's store, not a global. A custom
`createCalipers(...)` instance carries its own independent config, so two instances never
collide.
