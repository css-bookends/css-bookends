import { throwBreach } from '../hardening';
import {
  resolveModifier,
  ScalarBase,
  type ScalarConfig,
  type ScalarConstraints,
  type ScalarOptions,
  suffix,
} from './scalarBase';

/**
 * The CHECKED scalar base: `ScalarBase` plus the machinery a BOUNDED value needs. It adds nothing
 * to the value surface; it simply OVERRIDES the construction hooks so the shared pipeline in
 * `ScalarBase` also enforces the stored bound (min / max), applies the modifier, and throws on a
 * breach. The bound lives in `#config` on the base (read back through
 * `constraints()`); this class only decides how construction populates and polices it.
 *
 * `IntegerImpl` / `FloatImpl` / `UnspecifiedImpl` all extend THIS, so every scalar today is
 * checked. (A later step moves the deliberately-unspecified `u` down to the bare `ScalarBase`.)
 */
export abstract class ScalarRestricted extends ScalarBase {
  // The `min > max` sanity check: an impossible bound is rejected up front, before any value work.
  protected checkBounds(options: ScalarOptions, label: string): void {
    const { min, max, context } = options;
    if (min !== undefined && max !== undefined && min > max) {
      this.throwScalar(
        `${label}: min (${min}) must be <= max (${max})${suffix(context)}`,
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

  // A range breach THROWS (a bounded value is enforced; there is no reaction config). The throw
  // routes through this instance's error store so `stackHints` can append a stack block. With no
  // breach the value is in range and the bound is returned unchanged for `finalizeConfig`.
  protected enforceBound(
    value: number,
    options: ScalarOptions,
    label: string,
  ): ScalarConstraints {
    const { min, max, context } = options;
    if (min !== undefined && value < min) {
      throwBreach(
        `${label}: ${value} is below the minimum ${min}${suffix(context)}`,
        (message) => this.throwScalar(message),
      );
    }
    if (max !== undefined && value > max) {
      throwBreach(
        `${label}: ${value} is above the maximum ${max}${suffix(context)}`,
        (message) => this.throwScalar(message),
      );
    }
    return { min, max };
  }

  // Assemble the frozen, normalized config with a SPREAD, not a hand-listed set: a future field
  // added to `ScalarOptions` flows in via `...options`; only the effective bounds are overridden by
  // name (they equal the input bounds now, since a breach throws rather than dropping an edge).
  protected finalizeConfig(
    options: ScalarOptions,
    effective: ScalarConstraints,
  ): ScalarConfig {
    return {
      ...options,
      min: effective.min,
      max: effective.max,
    };
  }
}
