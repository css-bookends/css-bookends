import { runFactoryTests } from './factory.shared';

const esmModule = await import('../../../dist/esm/factory.js');

runFactoryTests('esm', {
  createCalipers: esmModule.createCalipers,
});
