// Subject: createColorFactory's CONFIG. Colour is the config-driven colour LEXICON, so its factory
// carries the FULL colour config (formats + output + strictness + transparent + omitOpaqueAlpha)
// as INSTANCE defaults, not just `formats` — a per-call config still overrides. This is what
// makes the colour book redundant. See docs/config-flow.md (the `color` row) + docs/foundations.md.
import { describe, expect, it } from 'vitest';

// eslint-disable-next-line no-restricted-imports -- this file's subject IS createColorFactory's config; colorFormats specifies the output format under test.
import { colorFormats, createColorFactory } from '../../../src/color';

describe('createColorFactory carries the full colour config (instance defaults)', () => {
  it('applies a configured default output format', () => {
    const oklch = createColorFactory({
      formats: [],
      output: colorFormats.oklch,
    });
    expect(oklch('#3366cc').css()).toMatch(/^oklch\(/);
  });

  it('a per-call config still overrides the instance default', () => {
    const oklch = createColorFactory({
      formats: [],
      output: colorFormats.oklch,
    });
    expect(oklch('#3366cc', { output: colorFormats.hex }).css()).toBe(
      '#3366cc',
    );
  });

  it('applies configured strictness at the instance level', () => {
    // 'silent' instance strictness: a lossy hex render (dropping the alpha) does not throw.
    const silent = createColorFactory({
      formats: [],
      strictness: 'silent',
    });
    expect(() => silent('#33336680').hex().css()).not.toThrow();
  });
});
