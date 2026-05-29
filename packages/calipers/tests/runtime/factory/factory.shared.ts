import { describe, expect, it } from 'vitest';
import type { IMediaQueryProps } from '../../../src/mediaQueries/mediaQueries';

type FactoryApi = {
  createCalipers: (config?: {
    errorConfig?: { stackHints?: 'auto' | 'on' | 'off' };
  }) => {
    m: (value: number, unit?: string) => { css: () => string };
    mPx: (value: number, context?: string) => { css: () => string };
    getErrorConfig: () => { stackHints: 'auto' | 'on' | 'off' };
    setErrorConfig: (next: { stackHints?: 'auto' | 'on' | 'off' }) => void;
    units: {
      mPx: (value: number, context?: string) => { css: () => string };
    };
    mediaQueries: {
      buildMediaQueryString: (props: IMediaQueryProps) => string;
    };
  };
};

const captureErrorMessage = (fn: () => void): string => {
  try {
    fn();
  } catch (error) {
    return (error as Error).message;
  }
  return '';
};

export const runFactoryTests = (
  label: string,
  api: FactoryApi,
): void => {
  describe(`CSS-Calipers factory (${label})`, () => {
    it('creates instances with independent error config', () => {
      const first = api.createCalipers({
        errorConfig: { stackHints: 'on' },
      });
      const second = api.createCalipers({
        errorConfig: { stackHints: 'off' },
      });

      expect(first.getErrorConfig().stackHints).toBe('on');
      expect(second.getErrorConfig().stackHints).toBe('off');

      first.setErrorConfig({ stackHints: 'off' });
      expect(first.getErrorConfig().stackHints).toBe('off');
      expect(second.getErrorConfig().stackHints).toBe('off');
    });

    it('exposes core, units, and mediaQueries helpers', () => {
      const instance = api.createCalipers();
      expect(instance.m(1).css()).toBe('1px');
      expect(instance.mPx(2).css()).toBe('2px');
      expect(instance.units.mPx(3).css()).toBe('3px');
      expect(
        instance.mediaQueries.buildMediaQueryString({}),
      ).toContain('screen');
    });

    it('scopes stack hint behavior per instance', () => {
      const withHints = api.createCalipers({
        errorConfig: { stackHints: 'on' },
      });
      const withoutHints = api.createCalipers({
        errorConfig: { stackHints: 'off' },
      });

      const withMessage = captureErrorMessage(() =>
        withHints.m(Number.NaN),
      );
      const withoutMessage = captureErrorMessage(() =>
        withoutHints.m(Number.NaN),
      );

      expect(withMessage).toContain('stack=');
      expect(withoutMessage).not.toContain('stack=');
    });
  });
};
