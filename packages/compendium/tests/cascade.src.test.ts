// The cascade reaches calipers PRIMITIVES through the compendium. A primitive
// resolves a setting as own key (calipers.<unit>) -> codex.global
// (calipers.global) -> compendium.global -> factory default. Worked example:
// the shared `errorConfig` (a thrown error renders a `stack=` hint iff the
// resolved errorConfig.stackHints is 'on'). Tested at src level (only calipers
// needs building); the configured bundle must be spread so the compendium's
// i / f / m honour the config, not the bare defaults.
import { describe, expect, it } from 'vitest';

import { publishCompendium } from '../src/index';

// A thrown calipers error renders a `stack=` block iff its resolved
// errorConfig.stackHints is 'on'. Divide-by-zero is a reliable throw.
const messageOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (error) {
    return (error as Error).message;
  }
  return '';
};

describe('compendium config cascade -> calipers primitives', () => {
  it('compendium.global reaches the primitives (i)', () => {
    const c = publishCompendium({
      global: { errorConfig: { stackHints: 'on' } },
    });
    expect(messageOf(() => c.i(2).divide(0))).toContain('stack=');
  });

  it('the nested calipers key configures a primitive (integer)', () => {
    const c = publishCompendium({
      calipers: { integer: { errorConfig: { stackHints: 'on' } } },
    });
    expect(messageOf(() => c.i(2).divide(0))).toContain('stack=');
  });

  it('codex global (calipers.global) overrides compendium global', () => {
    const c = publishCompendium({
      global: { errorConfig: { stackHints: 'off' } },
      calipers: { global: { errorConfig: { stackHints: 'on' } } },
    });
    // codex global 'on' wins over compendium global 'off'.
    expect(messageOf(() => c.i(2).divide(0))).toContain('stack=');
  });

  it('a bounded primitive throws on breach through the compendium', () => {
    const c = publishCompendium();
    expect(() => c.i(8, { min: 0, max: 10 }).multiply(2)).toThrow(
      /maximum/,
    );
  });

  it('compendium.global.errorConfig reaches m error rendering', () => {
    // divide-by-zero always throws through the instance store, so it renders a
    // stack hint iff the resolved errorConfig says so -- proving the global reaches m.
    const on = publishCompendium({
      global: { errorConfig: { stackHints: 'on' } },
    });
    expect(messageOf(() => on.m(2, 'px').divide(0))).toContain(
      'stack=',
    );
  });
});
