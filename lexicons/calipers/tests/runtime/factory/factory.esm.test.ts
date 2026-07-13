import { runFactoryTests } from './factory.shared';

const esmModule = await import('../../../dist/factory.mjs');

runFactoryTests('esm', {
  createCalipers: esmModule.createCalipers,
});
