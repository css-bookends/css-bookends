import { ScalarImpl, type ScalarOptions } from './scalarImpl';

/**
 * `u` — the internal "unspecified number" scalar. A sibling of `i` / `f` on the shared `ScalarImpl`
 * base, used ONLY by `m` to wrap a plain number. It accepts any finite value (no integer check, like
 * `f`), and it is config-NEUTRAL: it has no factory / lexicon config of its own, so it carries ONLY
 * the options `m` explicitly hands it, never an `i` / `f` lexicon config or any ambient default. It
 * is NOT exported from the package (absent from `index.ts` and the `exports` map), so it is as
 * non-public as `ScalarImpl` itself; it exists only to be `m`'s neutral wrap for a plain number.
 */
export class UnspecifiedImpl extends ScalarImpl {
  protected label(): string {
    return 'u';
  }

  protected validateInput(): void {
    // Unspecified: any finite value is accepted; the base's finiteness check is enough. There is no
    // integer rule (that is `i`'s job), and there is no lexicon config (that keeps `u` neutral).
  }

  protected rebuildWith(value: number): this {
    return new UnspecifiedImpl(value, this.options()) as this;
  }
}

/**
 * Build an internal unspecified number. NOT public; this is `m`'s neutral wrap for a plain number,
 * carrying only the options `m` hands it.
 */
export const u = (
  value: number,
  options: ScalarOptions = {},
): UnspecifiedImpl => new UnspecifiedImpl(value, options);
