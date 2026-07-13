// Core tests against the built ESM artifact (dist, esm output), driven through
// the codex bundle (the stable full CoreApi surface).
import type { CoreApi } from './core.shared';
import { runCoreTests } from './core.shared';

// Dynamic import will fail fast if the ESM artifact does not exist or its exports
// are wrong.
const esmModule = await import('../../../dist/index.mjs');
const api = esmModule.createCalipersBundle() as unknown as CoreApi;

runCoreTests('esm', api);
