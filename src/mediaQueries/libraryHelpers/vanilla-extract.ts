import type { SelectorMap, StyleRule } from '../types';

export const mediaQueryOutputVanillaExtract = <
  TSelectorMap extends Record<string, unknown> = SelectorMap
>(
  media: StyleRule,
): TSelectorMap => ({
  '&': media,
}) as unknown as TSelectorMap;
