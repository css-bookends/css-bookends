import { runFactoryTests } from './factory.shared';

const cjsModule = await import('../../../dist/factory.js');

runFactoryTests('cjs', {
  createCalipersFactory: cjsModule.createCalipersFactory,
});
