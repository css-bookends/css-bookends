// The calipers check sequence, as a readable ordered list instead of a long `&& npm run`
// chain in package.json. Runs each npm script in order, streaming its output, and fails fast
// on the first non-zero exit. Run via `npm test` (which is just `node scripts/test.mts`).
import { spawnSync } from 'node:child_process';

// Order matters: build first (the dist tests read dist/), then the source suites, the built
// (dist / nodenext) suites, the type checks, lint, and the internal-tooling checks last.
const SEQUENCE: readonly string[] = [
  'build',
  'test:core',
  'test:units',
  'test:refinement',
  'test:ratio',
  'test:integer',
  'test:float',
  'test:hardening',
  'test:scalar-refinement',
  'test:codex',
  'test:value-surface',
  'test:factory',
  'test:scalar-factories',
  'test:scalar-bundle',
  'test:subpaths',
  'test:color',
  'test:audit',
  'test:dist',
  'test:types',
  'test:tsc',
  'test:nodenext',
  'lint',
  'test:internal',
  'test:internal:run',
];

for (const script of SEQUENCE) {
  console.log(`\n▶ npm run ${script}`);
  const { status } = spawnSync(
    'npm',
    [
      'run',
      script,
    ],
    {
      stdio: 'inherit',
    },
  );
  if (status !== 0) {
    console.error(
      `\n✖ ${script} failed (exit ${status ?? 'signal'})`,
    );
    process.exit(status ?? 1);
  }
}

console.log('\n✓ all calipers checks passed');
