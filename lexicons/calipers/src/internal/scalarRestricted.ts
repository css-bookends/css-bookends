import { throwBreach } from '../hardening';
import {
  edgeSnaps,
  edgeValue,
  resolveModifier,
  ScalarBase,
  type ScalarOptions,
  suffix,
} from './scalarBase';

/**
 * The CHECKED scalar base: `ScalarBase` plus the machinery a BOUNDED value needs. It adds nothing
 * to the value surface; it simply OVERRIDES the construction hooks so the shared pipeline in
 * `ScalarBase` also enforces the stored bound (min / max), applies the modifier, and reacts to a
 * breach: THROW by default, or ABSORB the value to the limit when that edge opts into `snap`. The
 * bound lives in `#config` on the base (read back through `constraints()`); this class only decides
 * how construction polices it. The raw edge form (`number | { value, snap }`) stays in the config,
 * so `clone` / arithmetic re-resolve the same policy (base `finalizeConfig` spreads it, unchanged).
 *
 * `IntegerImpl` / `FloatImpl` / `UnspecifiedImpl` all extend THIS, so every scalar today is
 * checked. (A later step moves the deliberately-unspecified `u` down to the bare `ScalarBase`.)
 */
export abstract class ScalarRestricted extends ScalarBase {
  // The `min > max` sanity check: an impossible bound is rejected up front, before any value work.
  // Resolves each edge's value from the `{ value, snap }` object form or a bare number.
  protected checkBounds(options: ScalarOptions, label: string): void {
    const min = edgeValue(options.min);
    const max = edgeValue(options.max);
    if (min !== undefined && max !== undefined && min > max) {
      this.throwScalar(
        `${label}: min (${min}) must be <= max (${max})${suffix(options.context)}`,
      );
    }
  }

  // Apply the optional intake modifier, then re-check finiteness so a modifier that yields a
  // non-finite value fails loudly. With no modifier the value passes through unchanged.
  protected applyModifier(
    value: number,
    options: ScalarOptions,
    label: string,
  ): number {
    const finalValue =
      options.modifier !== undefined
        ? resolveModifier(options.modifier)(value)
        : value;
    if (!Number.isFinite(finalValue)) {
      this.throwScalar(
        `${label}: modifier produced a non-finite value (${finalValue})${suffix(options.context)}`,
        'CALIPERS_E_NONFINITE_RESULT',
      );
    }
    return finalValue;
  }

  // A range breach either THROWS (the default) or, when that edge opts into `snap`, ABSORBS the value
  // to the limit (silently) and returns it. The throw routes through this instance's error store so
  // `stackHints` can append a stack block. Per-edge: min and max resolve their snap policy
  // independently (the edge's own `snap`, else the blanket, else off). No breach -> value unchanged.
  protected enforceBound(
    value: number,
    options: ScalarOptions,
    label: string,
  ): number {
    const context = options.context;
    const min = edgeValue(options.min);
    const max = edgeValue(options.max);
    if (min !== undefined && value < min) {
      if (edgeSnaps(options.min, options.snap)) return min;
      throwBreach(
        `${label}: ${value} is below the minimum ${min}${suffix(context)}`,
        (message) => this.throwScalar(message),
      );
    }
    if (max !== undefined && value > max) {
      if (edgeSnaps(options.max, options.snap)) return max;
      throwBreach(
        `${label}: ${value} is above the maximum ${max}${suffix(context)}`,
        (message) => this.throwScalar(message),
      );
    }
    return value;
  }
}
