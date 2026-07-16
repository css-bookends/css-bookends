// Shared matchers, defined once so the two selectors / three import groups below
// cannot drift apart.
const ZERO_ARG_FACTORY =
  '^create([A-Za-z]*Bundle|Calipers|Color|Integer|Float|Ratio|[A-Za-z]*Units)$';
// Every place a calipers value/type could be imported BARE (the bind-once sources).
const CALIPERS_SOURCES = [
  '@css-bookends/css-calipers',
  '@css-bookends/css-calipers/*',
  '**/src/**',
  '**/dist/**',
];
// Package-only (for the TYPE pattern): src/dist are excluded so tsd tests can import
// types from dist and internals tests from src.
const CALIPERS_PACKAGE = [
  '@css-bookends/css-calipers',
  '@css-bookends/css-calipers/*',
];

module.exports = [
  // Build-tool config: not part of the linted source project (no tsconfig include).
  {
    ignores: [
      'tsup.config.ts',
    ],
  },
  ...require('@css-bookends/eslint-config')(),

  // ── Bind-once enforcement (examples + tests) ────────────────────────────────
  // The rule: a bound VALUE comes from a binder module (calipers_examples.ts /
  // calipers_tests.src.ts / calipers_tests.dist.ts), never inline and never bare.
  // Two ways to break it, two guards:
  {
    files: [
      'examples/**/*.ts',
      'tests/**/*.ts',
    ],
    rules: {
      // (1) A zero-arg factory call means "I want defaults" -> use the binder.
      //     A call WITH config is the legitimate exception and passes.
      'no-restricted-syntax': [
        'error',
        {
          // direct call: createCalipersBundle() / createScalarBundle() / createRatio()
          // `[A-Za-z]*Bundle` catches every family/master bundle (same pattern all the
          // way down), so a new family factory needs no rule edit.
          selector: `CallExpression[callee.name=/${ZERO_ARG_FACTORY}/][arguments.length=0]`,
          message:
            'Zero-arg factory call: import the bound helper from a binder (calipers_examples.ts / calipers_tests.src|dist.ts) instead of binding inline. Calls with config are fine.',
        },
        {
          // member call: mod.createCalipersBundle() / Units.createViewportUnits()
          selector: `CallExpression[callee.type="MemberExpression"][callee.property.name=/${ZERO_ARG_FACTORY}/][arguments.length=0]`,
          message:
            'Zero-arg factory call via a namespace/member: import the bound helper from a binder instead of binding inline. Calls with config are fine.',
        },
      ],
      // (2) A calipers VALUE imported straight from src / dist / the package is bare;
      //     it must come from a binder. This covers bound helpers (m/i/f/r/color/...),
      //     the per-instance-adjacent statics that a consumer treats like values
      //     (colorFormats, the ratio math functions), and — via the `^[A-Z]` pattern
      //     below, package-only — every TYPE. The ONLY calipers thing importable
      //     directly is a `create*` factory (lowercase), the configurable entry point.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: CALIPERS_SOURCES,
              importNames: [
                'm',
                'i',
                'f',
                'r',
                'color',
                'colorFormats',
                'isMeasurement',
                'isPercentMeasurement',
                'isFloat',
                'isInteger',
                'isRatio',
                'nonNegative',
                'nonPositive',
                'inRange',
                'assertMatchingUnits',
                'assertUnit',
                'assertCondition',
                'assertPercentMeasurement',
                'hardenFloat',
                'hardenInteger',
                'measurementMin',
                'measurementMax',
                'measurementUnitMetadata',
                'makeUnitHelper',
                'makeUnitHelperFromDefinition',
                'makeUnitGuard',
                'makeUnitAssert',
                'makeMeasurementRefinement',
                'hasCssMethod',
                'getErrorConfig',
                'setErrorConfig',
                // ratio math statics: consumed like values, so route through a binder
                // too (same path-safety reason). A source-tier subject test that IS
                // about this math imports from src with an inline disable.
                'normalizeRatio',
                'parseRatio',
                'reduceRatio',
                'simplifyRatio',
                'ratioToFloat',
                'toFloat',
              ],
              message:
                'Bare calipers-value import: get this from a binder (calipers_examples.ts / calipers_tests.src|dist.ts), not from src/dist/the package. Only `create*` factories import directly.',
            },
            {
              group: CALIPERS_SOURCES,
              importNamePattern: '^m[A-Z]',
              message:
                'Bare unit-helper import (mPx, mVh, ...): get it from a binder, not from src/dist/the package.',
            },
            {
              // Every PascalCase name from the PACKAGE = a TYPE (or a PascalCase static
              // const), routed through a binder too (same path-safety reason as values).
              // `^[A-Z]` closes the gap for good instead of enumerating type families:
              // factories are lowercase `create*` so they pass; only uppercase-initial
              // names are caught. Scoped to the package ONLY — tsd tests legitimately
              // import types from dist to verify the surface (their subject), and
              // internals tests from src, so neither src nor dist is in this group.
              group: CALIPERS_PACKAGE,
              importNamePattern: '^[A-Z]',
              message:
                'Calipers TYPE (or PascalCase static) imported from the package: get it from a binder (e.g. calipers_examples.ts) too, not the package. Same path-safety reason as values. Only `create*` factories import directly.',
            },
          ],
        },
      ],
    },
  },

  // Exceptions carry an inline `// eslint-disable-next-line <rule> -- <reason>` at the exact
  // call/import, so the reason is written at the site and a NEW violation elsewhere in the same
  // file is still caught. A whole-file `/* eslint-disable <rule> -- <reason> */` is used ONLY
  // where the ENTIRE file is the subject (e.g. the scalar-factories / scalar-bundle tests, whose
  // every `create*()` call is under test, and the binders' own single bind).
];
