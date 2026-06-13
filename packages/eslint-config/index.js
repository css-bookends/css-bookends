const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const importPlugin = require('eslint-plugin-import');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const unusedImports = require('eslint-plugin-unused-imports');
const promisePlugin = require('eslint-plugin-promise');
const prettier = require('eslint-config-prettier');

const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  URL: 'readonly',
  module: 'readonly',
  require: 'readonly',
};

const DEFAULT_IGNORES = [
  'dist/**',
  'coverage/**',
  'node_modules/**',
  // Scratch folder, intentionally outside every tsconfig (holds deliberate
  // type errors for manual editor checks); never linted.
  'demo/**',
  // VitePress internals (config.mts + build output) are tooling outside the
  // package tsconfig, not library code; Prettier still formats them.
  'docs/.vitepress/**',
];

// TypeScript files intentionally outside the package tsconfig: tsd-style
// `*.test-d.ts` type tests under tests/types, and `examples/**` (which the
// build/typecheck tsconfig does not include). Type-aware linting can't
// resolve a project for these, so they run untyped.
const NO_PROJECT_TS = [
  '**/*.test-d.ts',
  'tests/types/**',
  'examples/**',
  // Build/tooling scripts (e.g. emit-esm-package.mts) live outside the
  // package tsconfig, so they lint untyped.
  'scripts/**',
];

// TypeScript sources, including the .mts/.cts module variants this repo uses
// for tooling scripts.
const TS_FILES = [
  '**/*.{ts,mts,cts}',
];

// Everything ESLint lints: TypeScript plus JS module variants.
const LINT_FILES = [
  '**/*.{ts,mts,cts,js,cjs,mjs}',
];

/**
 * Shared ESLint flat config for CSS-Bookends packages.
 *
 * @param {{ ignores?: string[] }} [options] `ignores` overrides the
 *   default ignore globs (e.g. packages without a VitePress `docs/`
 *   tree can pass a narrower list).
 * @returns {import('eslint').Linter.Config[]}
 */
module.exports = function bookendsEslintConfig(options = {}) {
  const ignores = options.ignores ?? DEFAULT_IGNORES;
  return [
    { ignores },

    js.configs.recommended,

    // Type-checked TypeScript rules, scoped to TS files so the type-aware
    // parser is never pointed at JS config/script files.
    ...tseslint.configs.recommendedTypeChecked.map((config) => ({
      ...config,
      files: TS_FILES,
    })),

    // Point the type-aware parser at each package's own tsconfig. eslint
    // runs per-package (`eslint .` in the package dir), so cwd is the
    // package root and projectService finds the nearest tsconfig.json.
    {
      files: TS_FILES,
      languageOptions: {
        globals: nodeGlobals,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: process.cwd(),
          sourceType: 'module',
        },
      },
      rules: {
        'no-undef': 'off',
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'error',
        // unused-imports (below) owns unused-var reporting.
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },

    // Import hygiene: deterministic sort, cycle detection, dead-import
    // removal (with `_` opt-out for intentionally unused bindings).
    {
      files: LINT_FILES,
      plugins: {
        import: importPlugin,
        'simple-import-sort': simpleImportSort,
        'unused-imports': unusedImports,
      },
      rules: {
        'import/no-cycle': [
          'error',
          { maxDepth: 1, ignoreExternal: true },
        ],
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
          'error',
          {
            vars: 'all',
            varsIgnorePattern: '^_',
            args: 'after-used',
            argsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
      },
    },

    // Promise best practices.
    {
      ...promisePlugin.configs['flat/recommended'],
      files: LINT_FILES,
    },

    // Declaration files: relax any/unused.
    {
      files: [
        '**/*.d.ts',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'unused-imports/no-unused-vars': 'off',
      },
    },

    // Tests + examples: relax unused, and the type-aware "unsafe any"
    // family. Runtime/api-surface tests deliberately exercise the built
    // (untyped) output via require(), so `any` flow is expected here.
    {
      files: [
        'examples/**',
        'tests/**',
      ],
      rules: {
        'unused-imports/no-unused-vars': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
      },
    },

    // TypeScript files with no owning project: drop type-aware linting.
    {
      files: NO_PROJECT_TS,
      ...tseslint.configs.disableTypeChecked,
    },

    // JS config/script files: Node globals, default (non-type-aware) parser.
    {
      files: [
        '**/*.{js,cjs,mjs}',
      ],
      languageOptions: {
        globals: nodeGlobals,
      },
      rules: {
        'no-undef': 'off',
      },
    },

    // eslint-config-prettier disables stylistic conflicts. Keep last.
    prettier,
  ];
};
