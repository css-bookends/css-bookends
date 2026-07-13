module.exports = [
  // Build-tool config: not part of the linted source project (no tsconfig include).
  {
    ignores: [
      'tsup.config.ts',
    ],
  },
  ...require('@css-bookends/eslint-config')(),
];
