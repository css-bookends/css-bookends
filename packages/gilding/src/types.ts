/**
 * The gilding config contract. The point of the split: a STABLE evergreen surface
 * (browser targets) that any post-processor understands, kept separate from the
 * IMPL-SPECIFIC pass-through, so the wrapped core can be swapped (by us via the onion,
 * or by a consumer) without changing the surface a consumer learns.
 */

/** The evergreen, implementation-agnostic config: stable across any core. */
export interface EvergreenConfig {
  /**
   * Browser targets as a browserslist query (e.g. `'>0.2%, not dead'`) or an array of
   * queries (e.g. `['chrome 90', 'safari 15']`). The only thing a consumer must learn.
   */
  targets?: string | readonly string[];
}

/**
 * A swappable post-processor core: a thin adapter around a real tool. The default is
 * the Lightning CSS core; a consumer can supply their own. We never pass the wrapped
 * tool off as ours, hence the explicit `name`.
 */
export interface PostProcessCore<Opts = unknown> {
  /** the wrapped tool's name, e.g. `'lightningcss'`. */
  readonly name: string;
  /** translate the evergreen config + pass-through options, run the tool, return CSS. */
  finish(
    css: string,
    evergreen: EvergreenConfig,
    options?: Opts,
  ): string;
}

/** The finisher config: the evergreen surface, plus the swap seam and pass-through. */
export interface FinishConfig<
  Opts = unknown,
> extends EvergreenConfig {
  /** swap the core (the onion's center). Defaults to the Lightning CSS core. */
  core?: PostProcessCore<Opts>;
  /** opaque options forwarded verbatim to the active core (impl-specific). */
  coreOptions?: Opts;
}
