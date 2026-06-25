import { describe, expect, it } from 'vitest';

import { createGilding } from '../src/index';

/**
 * The finisher wraps Lightning CSS (the default core). Under old browser targets, a
 * wide/modern color function is downleveled: a fallback declaration is added while the
 * modern value is kept for browsers that understand it (progressive enhancement). The
 * finisher never reasons about color itself; it just runs the core over plain CSS.
 */
describe('createGilding - Lightning CSS core', () => {
  const gild = createGilding({
    targets: [
      'chrome 90',
    ],
  });

  it('downlevels a wide-gamut color under old targets: sRGB fallback + a modern value', () => {
    const out = gild('.a { color: oklch(0.7 0.15 200); }');
    // a fallback declaration was added alongside the modern one (cascade)
    const colorDecls = out.match(/color:/g) ?? [];
    expect(colorDecls.length).toBe(2);
    // the floor is a universal sRGB form (hex or rgb); the modern value is kept after it
    expect(out).toMatch(/color:\s*(#|rgb)/);
  });

  it('is a no-op-ish passthrough for plain sRGB (nothing to downlevel)', () => {
    const out = gild('.a { color: #336; }');
    const colorDecls = out.match(/color:/g) ?? [];
    expect(colorDecls.length).toBe(1);
  });

  it('adds the vendor prefix a target needs', () => {
    const prefixed = createGilding({
      targets: [
        'safari 13',
      ],
    });
    const out = prefixed('.a { backdrop-filter: blur(4px); }');
    expect(out).toContain('-webkit-backdrop-filter');
  });
});
