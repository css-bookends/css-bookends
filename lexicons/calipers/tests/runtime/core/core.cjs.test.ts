/* eslint-disable no-restricted-syntax -- this whole file drives the CoreApi harness
   from the BUILT cjs artifact (cjsModule.createCalipersBundleFactory()); the artifact bind
   is the subject under test. */
// Core tests against the built CommonJS artifact (dist, cjs output), driven
// through the codex bundle (the stable full CoreApi surface). The harness type is
// loose, so the built bundle is bridged to it the way core.src.test.ts is.
import type { CoreApi } from './core.shared';
import { runCoreTests } from './core.shared';

// Dynamic import works with CommonJS output and will fail fast if the artifact
// does not exist or its exports are wrong.
const cjsModule = await import('../../../dist/index.js');
const api =
  cjsModule.createCalipersBundleFactory() as unknown as CoreApi;

runCoreTests('cjs', api);
