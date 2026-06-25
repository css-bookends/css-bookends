import { describe, expect, it } from 'vitest';

import { createGilding, type PostProcessCore } from '../src/index';

/**
 * The onion seam: the wrapped core is swappable. A consumer (or a future us) can pass a
 * different `core` and the finisher never touches Lightning CSS. The evergreen config
 * (`targets`) is forwarded to whatever core is active; impl-specific `coreOptions` pass
 * through verbatim. This is what keeps the surface stable across implementations.
 */
describe('createGilding - the swappable core seam', () => {
  it('uses a supplied core instead of Lightning CSS', () => {
    const fakeCore: PostProcessCore = {
      name: 'fake',
      finish: (css) => `/* fake */ ${css}`,
    };
    const gild = createGilding({ core: fakeCore });
    expect(gild('.a {}')).toBe('/* fake */ .a {}');
  });

  it('forwards evergreen targets and pass-through coreOptions to the core', () => {
    const seen: { ev?: unknown; opts?: unknown } = {};
    const spyCore: PostProcessCore<{ flag: number }> = {
      name: 'spy',
      finish: (css, ev, opts) => {
        seen.ev = ev;
        seen.opts = opts;
        return css;
      },
    };
    const gild = createGilding({
      core: spyCore,
      targets: [
        'chrome 90',
      ],
      coreOptions: { flag: 42 },
    });
    gild('.a {}');
    expect(seen.ev).toEqual({
      targets: [
        'chrome 90',
      ],
    });
    expect(seen.opts).toEqual({ flag: 42 });
  });
});
