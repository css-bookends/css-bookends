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
          // direct call: createCalipersBundle()
          selector:
            'CallExpression[callee.name=/^create(CalipersBundle|Calipers|Color|Integer|Float|Ratio|[A-Za-z]*Units)$/][arguments.length=0]',
          message:
            'Zero-arg factory call: import the bound helper from a binder (calipers_examples.ts / calipers_tests.src|dist.ts) instead of binding inline. Calls with config are fine.',
        },
        {
          // member call: mod.createCalipersBundle() / Units.createViewportUnits()
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name=/^create(CalipersBundle|Calipers|Color|Integer|Float|Ratio|[A-Za-z]*Units)$/][arguments.length=0]',
          message:
            'Zero-arg factory call via a namespace/member: import the bound helper from a binder instead of binding inline. Calls with config are fine.',
        },
      ],
      // (2) A bound VALUE imported straight from src / dist / the package is bare;
      //     it must come from a binder. Factories (create*), statics (colorFormats,
      //     ratio math, parse/store), and TYPES are NOT bound values and pass.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@css-bookends/css-calipers',
                '@css-bookends/css-calipers/*',
                '**/src/**',
                '**/dist/**',
              ],
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
              ],
              message:
                'Bare bound-value import: get this from a binder (calipers_examples.ts / calipers_tests.src|dist.ts), not from src/dist/the package. Factories, statics, and types are fine.',
            },
            {
              group: [
                '@css-bookends/css-calipers',
                '@css-bookends/css-calipers/*',
                '**/src/**',
                '**/dist/**',
              ],
              importNamePattern: '^m[A-Z]',
              message:
                'Bare unit-helper import (mPx, mVh, ...): get it from a binder, not from src/dist/the package.',
            },
            {
              // Calipers TYPES from the PACKAGE: consumers route these through a binder
              // too (same path-safety reason as values). Scoped to the package ONLY —
              // tsd tests legitimately import types from dist to verify the surface
              // (their subject), and internals tests from src. Factories (create*) and
              // colour statics don't match these patterns, so they still pass.
              group: [
                '@css-bookends/css-calipers',
                '@css-bookends/css-calipers/*',
              ],
              importNamePattern:
                '^Color[A-Z]|Measurement$|^Measurement[A-Z]',
              message:
                'Calipers TYPE imported from the package: get it from a binder (e.g. calipers_examples.ts) too, not the package. Same path-safety reason as values.',
            },
          ],
        },
      ],
    },
  },

  // No file-level allowlists on purpose. Every legitimate exception (a binder's own
  // bind, a construction-subject test, an export-surface check) carries an inline
  // `// eslint-disable-next-line <rule> -- <reason>` at the exact call/import, so the
  // reason is written at the site, stays visible in review, and a NEW violation
  // elsewhere in the same file is still caught (a file-level allowlist would hide it).
];
