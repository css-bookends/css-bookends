import { runFactoryTests } from './factory.shared';

const cjsModule = await import('../../../dist/cjs/factory.js');

runFactoryTests('cjs', {
  createCalipers: cjsModule.createCalipers,
});
