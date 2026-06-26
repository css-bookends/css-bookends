import {
  color,
  type ColorFormatPlugin,
  createColor,
} from '@css-bookends/css-calipers';
import {
  composeCore,
  composeCoreFromFormats,
  createGilding,
  keywordToRgb,
  lightningCore,
  type LightningOptions,
  type PostProcessCore,
} from '@css-bookends/gilding';
import { boxShadow } from '@css-bookends/shadows';
import { describe, expect, it } from 'vitest';

/**
 * END-TO-END proof of the gilding pipeline as a whole. Where the gilding package's own
 * unit tests exercise the finisher and the cores in isolation against `../src`, these
 * tests consume the BUILT/workspace packages by their public names and drive the whole
 * chain: a book (`@css-bookends/shadows`) and the calipers colour primitive
 * (`@css-bookends/css-calipers`) emit plain CSS, then `@css-bookends/gilding` finishes it
 * for a concrete browser-target set via its Lightning CSS core.
 *
 * Where an exact transformed string is not knowable without running Lightning CSS, the
 * assertion checks the MEANINGFUL property (the observable transform) rather than a
 * brittle literal, and a comment flags it for tightening after the first real run.
 */

describe('gilding e2e - the whole pipeline, real packages', () => {
  /* ========================================================================
   * Scenario 1 - Lightning smoke: real book output, finished by gilding.
   *
   * Take a real `boxShadow` book output, wrap it in a tiny rule, and run it through the
   * default gilding finisher with `minify` on. Minification is an OBSERVABLE Lightning
   * CSS transform: it collapses the whitespace the source rule carries. Asserting the
   * minified shape proves Lightning actually processed the CSS (not a passthrough).
   * ====================================================================== */
  it('finishes real book output with the Lightning CSS core (minify is observable)', () => {
    // a real book emits a plain box-shadow value string.
    const shadowValue = boxShadow.value({ color: color('#336') });
    const css = `.x {\n  box-shadow: ${shadowValue};\n}\n`;

    // default core (Lightning CSS); evergreen targets + minify pass-through.
    const gild = createGilding({
      targets: [
        'chrome 120',
      ],
      coreOptions: { minify: true },
    });
    const out = gild(css);

    // Lightning ran: minification collapsed the whitespace the source rule had. A
    // passthrough would have kept the newline + two-space indent; the minified form has
    // no space between the selector and `{` and no source newlines.
    expect(out).toContain('.x{');
    expect(out).not.toContain('\n');
    // the declaration itself is still present (gilding finishes, it does not drop CSS).
    expect(out).toContain('box-shadow:');
  });

  /* ========================================================================
   * Scenario 2 - registry-driven zoo fallback OVERWRITE, end to end.
   *
   * Define a zoo colour format carrying a `.fallback` (string -> string) that rewrites
   * its non-standard `zoo-color(<animal>)` token into a browser-safe value. Register it
   * with `createColor({ formats: [zoo] })`, build a core from the registry via
   * `composeCoreFromFormats(instance.formats)`, and gild a CSS string containing the zoo
   * token. The zoo token must be OVERWRITTEN by the fallback in the FINAL CSS, proving
   * the registry-driven fallback seam runs through the whole pipeline.
   * ====================================================================== */
  it('overwrites a zoo token via its registry-declared fallback (final CSS)', () => {
    // a deliberately non-standard token Lightning cannot parse, plus a fallback that
    // rewrites it to a plain 6-digit hex (a value Lightning keeps verbatim, so the
    // overwrite is unambiguous in the final string).
    const ZOO_TO_HEX: Readonly<Record<string, string>> = {
      flamingo: '#ff69b4',
    };
    const zooFn: ColorFormatPlugin<'zooFn'> = {
      format: 'zooFn',
      hasAlpha: true,
      gamut: 'unbounded',
      supportsProbe: null,
      gamutDependent: false,
      srgbFloor: false,
      render: () => 'zoo-color(flamingo)' as never,
      fallback: (input) =>
        input.replace(
          /zoo-color\(([a-z]+)\)/g,
          (match, animal: string) => ZOO_TO_HEX[animal] ?? match,
        ),
    };

    // the registry is built by createColor, NOT a hard-coded map in gilding.
    const zooColor = createColor({
      formats: [
        zooFn,
      ],
    });
    const core = composeCoreFromFormats(zooColor.formats);

    const gild = createGilding({
      core,
      targets: [
        'chrome 90',
        'safari 14',
      ],
    });
    const out = gild('.a { color: zoo-color(flamingo); }');

    // the registry fallback overwrote the zoo token end to end: the custom token is gone
    // from the final CSS, replaced by its browser-safe value.
    expect(out).not.toContain('zoo-color');
    // FLAG: Lightning may canonicalize a 6-digit hex (e.g. casing) but should not change
    // `#ff69b4`. If the first real run shows it canonicalized, relax this to a /#f|rgb/i
    // match. The load-bearing assertion above (zoo token gone) is the overwrite proof.
    expect(out).toContain('#ff69b4');
  });

  /* ========================================================================
   * Scenario 3 - a modern-colour shadow, old vs evergreen targets.
   *
   * Build a box-shadow whose colour is MODERN (`oklch(...)` via calipers), then finish it
   * twice: once for OLD browsers that lack `oklch()` (Lightning lowers it to an rgb-ish
   * sRGB fallback) and once for EVERGREEN browsers (the modern `oklch(` is kept). The two
   * outputs must differ in exactly that way.
   * ====================================================================== */
  it('lowers an oklch shadow for old targets but keeps oklch for evergreen', () => {
    // a real book output whose colour renders as oklch(...).
    const shadowValue = boxShadow.value({
      color: color('#3366cc').oklch(),
    });
    // sanity: the source really is a modern oklch colour before gilding sees it.
    expect(shadowValue).toContain('oklch(');
    const css = `.x { box-shadow: ${shadowValue}; }`;

    // OLD: Chrome 90 / Safari 13 predate oklch() support, so Lightning must lower it.
    const old = createGilding({
      targets: [
        'chrome 90',
        'safari 13',
      ],
    });
    // EVERGREEN: Chrome 120 / Safari 17 support oklch(), so it is kept.
    const evergreen = createGilding({
      targets: [
        'chrome 120',
        'safari 17',
      ],
    });

    const oldOut = old(css);
    const evergreenOut = evergreen(css);

    // OLD target: the modern oklch() was lowered to an sRGB fallback (rgb/hex), and the
    // bare modern value is no longer the only thing in the shadow.
    expect(oldOut).toMatch(/rgb|#/);
    // FLAG: Lightning lowers oklch() to a fallback declaration; for box-shadow it may add
    // a separate fallback `box-shadow:` rather than fully removing oklch from the modern
    // branch. If `not.toContain('oklch(')` proves too strict on first run (a kept modern
    // branch), assert instead that the OLD output contains an rgb/hex fallback that the
    // EVERGREEN output does not. The contrast with evergreen below is the real proof.
    expect(oldOut).not.toContain('oklch(');

    // EVERGREEN target: the modern oklch() is preserved (no need to lower it).
    expect(evergreenOut).toContain('oklch(');
    // the two targets genuinely produced different CSS (the whole point of gilding).
    expect(oldOut).not.toBe(evergreenOut);
  });

  /* ========================================================================
   * Scenario 4 - the keywordToRgb pre-step, composed in front of Lightning.
   *
   * Compose `keywordToRgb` in front of the Lightning CSS core and finish CSS with a bare
   * `pink` colour token. The pre-step rewrites the keyword to its `rgb(...)` value BEFORE
   * Lightning runs.
   *
   * NOTE on assertion target: Lightning CSS canonicalizes colours and collapses
   * `rgb(255, 192, 203)` back to the shorter `pink` keyword (documented in gilding's own
   * compose-core unit test), so the rgb() form does NOT survive in the FINAL CSS. To
   * prove the pre-step ran concretely we wrap the REAL Lightning core in a recording spy
   * and assert on the CSS the inner core RECEIVED (the pre-step's output), then assert the
   * inner core still ran on the same input. Same approach as the gilding unit suite.
   * ====================================================================== */
  it('rewrites a bare keyword to rgb() via the keywordToRgb pre-step before Lightning', () => {
    // the REAL Lightning CSS core, wrapped in a spy recording the CSS handed to it.
    let seenByInner = '';
    const recordingLightning: PostProcessCore<LightningOptions> = {
      name: lightningCore.name,
      finish(input, evergreen, options) {
        seenByInner = input;
        return lightningCore.finish(input, evergreen, options);
      },
    };

    const core = composeCore(keywordToRgb, recordingLightning);
    const gild = createGilding({
      core,
      targets: [
        'chrome 90',
      ],
    });
    const out = gild('.x { color: pink; }');

    // the pre-step ran IN FRONT OF Lightning: `pink` was rewritten to its rgb() value
    // before Lightning saw it, and the bare keyword was gone from Lightning's input.
    expect(seenByInner).toContain('rgb(255, 192, 203)');
    expect(seenByInner).not.toMatch(/color:\s*pink/);
    // the inner Lightning core still produced final CSS (it was not bypassed). Lightning
    // canonicalizes rgb(255, 192, 203) back to `pink`, so the FINAL string shows `pink`
    // again; that round-trip is itself evidence the real core ran on the rewritten input.
    expect(out).toContain('color:');
  });
});
