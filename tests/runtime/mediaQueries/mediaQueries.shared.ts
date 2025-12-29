import { describe, expect, it } from 'vitest';

type MeasurementLike = {
  css: () => string;
  getValue: () => number;
};

type MediaQueriesApi = {
  buildMediaQueryFromFeatures: (
    features: Record<string, MeasurementLike | string | number>,
  ) => string;
  createMediaQueryBuilder: (options: {
    emitBase: (props: unknown, helpers: unknown) => void;
    config?: { errorHandling?: { invalidValueMode?: 'allow' | 'log' | 'throw' } };
  }) => (props: unknown) => string;
  buildMediaQueryString: (props: {
    minWidth?: MeasurementLike;
    maxWidth?: MeasurementLike;
    width?: MeasurementLike;
    minHeight?: MeasurementLike;
    orientation?: 'landscape' | 'portrait';
    minResolution?: MeasurementLike;
    maxResolution?: MeasurementLike;
  }) => string;
  emitDimensionsFeatures: (props: unknown, helpers: unknown) => void;
  emitCustomFeatures: (props: unknown, helpers: unknown) => void;
  emitResolutionFeatures: (props: unknown, helpers: unknown) => void;
  mDpi: (value: number) => MeasurementLike;
  mPx: (value: number) => MeasurementLike;
};

export const runMediaQueryTests = (
  label: string,
  api: MediaQueriesApi,
): void => {
  describe(`mediaQueries (${label})`, () => {
    it('builds a min-width query with the default media type', () => {
      const result = api.buildMediaQueryString({ minWidth: api.mPx(480) });
      expect(result).toBe('screen and (min-width: 480px)');
    });

    it('builds a max-width query', () => {
      const result = api.buildMediaQueryString({ maxWidth: api.mPx(1024) });
      expect(result).toBe('screen and (max-width: 1024px)');
    });

    it('builds a min/max width range query', () => {
      const result = api.buildMediaQueryString({
        minWidth: api.mPx(480),
        maxWidth: api.mPx(1024),
      });
      expect(result).toBe(
        'screen and (min-width: 480px) and (max-width: 1024px)',
      );
    });

    it('builds a height query with max height', () => {
      const result = api.buildMediaQueryString({
        height: api.mPx(720),
        maxHeight: api.mPx(900),
      });
      expect(result).toBe(
        'screen and (height: 720px) and (max-height: 900px)',
      );
    });

    it('builds an aspect ratio query with min and max values', () => {
      const result = api.buildMediaQueryString({
        aspectRatio: '16/9',
        minAspectRatio: '4/3',
        maxAspectRatio: '21/9',
      });
      expect(result).toBe(
        'screen and (aspect-ratio: 16/9) and (min-aspect-ratio: 4/3) and (max-aspect-ratio: 21/9)',
      );
    });

    it('builds a dimensions query with width and orientation', () => {
      const result = api.buildMediaQueryString({
        width: api.mPx(600),
        minHeight: api.mPx(320),
        orientation: 'landscape',
      });
      expect(result).toBe(
        'screen and (width: 600px) and (min-height: 320px) and (orientation: landscape)',
      );
    });

    it('builds a resolution range query', () => {
      const result = api.buildMediaQueryString({
        minResolution: api.mDpi(96),
        maxResolution: api.mDpi(192),
      });
      expect(result).toBe(
        'screen and (min-resolution: 96dpi) and (max-resolution: 192dpi)',
      );
    });

    it('builds an exact resolution query', () => {
      const result = api.buildMediaQueryString({
        resolutionValue: api.mDpi(144),
      });
      expect(result).toBe('screen and (resolution: 144dpi)');
    });

    it('builds a query from a feature map', () => {
      const result = api.buildMediaQueryFromFeatures({
        'min-width': api.mPx(720),
      });
      expect(result).toBe('screen and (min-width: 720px)');
    });

    it('rejects empty custom feature names', () => {
      expect(() =>
        api.buildMediaQueryString({
          customFeatures: {
            '   ': api.mPx(320),
          },
        }),
      ).toThrow('Custom feature name must be non-empty.');
    });

    it('rejects invalid custom feature values', () => {
      expect(() =>
        api.buildMediaQueryString({
          customFeatures: {
            'custom-feature': { bad: true },
          },
        }),
      ).toThrow('Custom feature "custom-feature" must be a primitive or a measurement.');
    });

    it('rejects invalid aspect ratio formats', () => {
      const strictBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitDimensionsFeatures,
        config: { errorHandling: { invalidValueMode: 'throw' } },
      });
      expect(() =>
        strictBuilder({ aspectRatio: '0/0' }),
      ).toThrow('aspectRatio must be a valid ratio greater than 0');

      expect(() =>
        strictBuilder({ minAspectRatio: 'abc' }),
      ).toThrow('minAspectRatio must be a valid ratio greater than 0');
    });

    it('mixes core and interaction features', () => {
      const result = api.buildMediaQueryString({
        minWidth: api.mPx(640),
        hover: 'hover',
      });
      expect(result).toBe('screen and (min-width: 640px) and (hover: hover)');
    });

    it('mixes multiple core feature groups', () => {
      const result = api.buildMediaQueryString({
        minWidth: api.mPx(640),
        minHeight: api.mPx(480),
        minResolution: api.mDpi(96),
        orientation: 'portrait',
      });
      expect(result).toBe(
        'screen and (min-width: 640px) and (min-height: 480px) and (orientation: portrait) and (min-resolution: 96dpi)',
      );
    });

    it('mixes multiple custom feature groups', () => {
      const result = api.buildMediaQueryString({
        customFeatures: {
          'prefers-feature-x': 'enabled',
          'min-custom-width': api.mPx(720),
          'custom-contrast': 'high',
          'custom-level': 2,
        },
      });
      expect(result).toBe(
        'screen and (prefers-feature-x: enabled) and (min-custom-width: 720px) and (custom-contrast: high) and (custom-level: 2)',
      );
    });

    it('mixes custom features with core features', () => {
      const result = api.buildMediaQueryString({
        minWidth: api.mPx(800),
        minHeight: api.mPx(600),
        minResolution: api.mDpi(120),
        orientation: 'landscape',
        customFeatures: {
          'prefers-feature-x': 'enabled',
          'max-custom-width': api.mPx(1200),
          'custom-tier': 3,
        },
      });
      expect(result).toBe(
        'screen and (min-width: 800px) and (min-height: 600px) and (orientation: landscape) and (min-resolution: 120dpi) and (prefers-feature-x: enabled) and (max-custom-width: 1200px) and (custom-tier: 3)',
      );
    });

    it('respects invalid value mode for validation', () => {
      const allowBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitDimensionsFeatures,
        config: { errorHandling: { invalidValueMode: 'allow' } },
      });
      const logBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitDimensionsFeatures,
        config: { errorHandling: { invalidValueMode: 'log' } },
      });
      const throwBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitDimensionsFeatures,
        config: { errorHandling: { invalidValueMode: 'throw' } },
      });

      expect(() => allowBuilder({ aspectRatio: '0/0' })).not.toThrow();
      expect(() => logBuilder({ aspectRatio: '0/0' })).not.toThrow();
      expect(() => throwBuilder({ aspectRatio: '0/0' })).toThrow(
        'aspectRatio must be a valid ratio greater than 0',
      );
    });

    it('respects linting mode for redundancy', () => {
      const allowBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitDimensionsFeatures,
        config: { errorHandling: { lintingMode: 'allow' } },
      });
      const logBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitDimensionsFeatures,
        config: { errorHandling: { lintingMode: 'log' } },
      });
      const throwBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitDimensionsFeatures,
        config: { errorHandling: { lintingMode: 'throw' } },
      });

      const redundant = { width: api.mPx(640), minWidth: api.mPx(320) };
      expect(() => allowBuilder(redundant)).not.toThrow();
      expect(() => logBuilder(redundant)).not.toThrow();
      expect(() => throwBuilder(redundant)).toThrow(
        'width should not be combined with minWidth or maxWidth',
      );
    });

    it('respects linting mode for duplicate emissions from custom features', () => {
      const makeBuilder = (lintingMode: 'allow' | 'log' | 'throw') =>
        api.createMediaQueryBuilder({
          emitBase: (props, helpers) => {
            helpers.addFeature('min-width', api.mPx(320));
            api.emitCustomFeatures(props, helpers);
          },
          config: { errorHandling: { lintingMode } },
        });
      const allowBuilder = makeBuilder('allow');
      const logBuilder = makeBuilder('log');
      const throwBuilder = makeBuilder('throw');

      const overlapping = {
        customFeatures: {
          'min-width': api.mPx(480),
        },
      };

      expect(() => allowBuilder(overlapping)).not.toThrow();
      expect(() => logBuilder(overlapping)).not.toThrow();
      expect(() => throwBuilder(overlapping)).toThrow(
        'Media query feature "min-width" was emitted more than once.',
      );
    });

    it('respects linting mode for explicit duplicate emissions', () => {
      const makeBuilder = (lintingMode: 'allow' | 'log' | 'throw') =>
        api.createMediaQueryBuilder({
          emitBase: (_props, helpers) => {
            helpers.addFeature('min-width', api.mPx(320));
            helpers.addFeature('min-width', api.mPx(480));
          },
          config: { errorHandling: { lintingMode } },
        });

      expect(() => makeBuilder('allow')({})).not.toThrow();
      expect(() => makeBuilder('log')({})).not.toThrow();
      expect(() => makeBuilder('throw')({})).toThrow(
        'Media query feature "min-width" was emitted more than once.',
      );
    });

    it('covers mixed validation and linting modes', () => {
      const modes = ['allow', 'log', 'throw'] as const;

      modes.forEach((invalidValueMode) => {
        modes.forEach((lintingMode) => {
          const builder = api.createMediaQueryBuilder({
            emitBase: api.emitDimensionsFeatures,
            config: { errorHandling: { invalidValueMode, lintingMode } },
          });

          const props = {
            aspectRatio: '0/0',
            width: api.mPx(640),
            minWidth: api.mPx(320),
          };

          if (lintingMode === 'throw') {
            expect(() => builder(props)).toThrow(
              'width should not be combined with minWidth or maxWidth',
            );
            return;
          }

          if (invalidValueMode === 'throw') {
            expect(() => builder(props)).toThrow(
              'aspectRatio must be a valid ratio greater than 0',
            );
            return;
          }

          expect(() => builder(props)).not.toThrow();
        });
      });
    });

    it('does not throw in log mode when validation fails', () => {
      const logBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitDimensionsFeatures,
        config: { errorHandling: { invalidValueMode: 'log' } },
      });

      expect(() => logBuilder({ aspectRatio: '0/0' })).not.toThrow();
    });

    it('handles multiple factory instances with independent configs', () => {
      const invalidModes = ['allow', 'log', 'throw'] as const;
      const lintModes = ['allow', 'log', 'throw'] as const;

      const props = {
        aspectRatio: '0/0',
        width: api.mPx(640),
        minWidth: api.mPx(320),
      };

      invalidModes.forEach((invalidValueMode) => {
        lintModes.forEach((lintingMode) => {
          const builder = api.createMediaQueryBuilder({
            emitBase: api.emitDimensionsFeatures,
            config: { errorHandling: { invalidValueMode, lintingMode } },
          });

          if (lintingMode === 'throw') {
            expect(() => builder(props)).toThrow(
              'width should not be combined with minWidth or maxWidth',
            );
            return;
          }

          if (invalidValueMode === 'throw') {
            expect(() => builder(props)).toThrow(
              'aspectRatio must be a valid ratio greater than 0',
            );
            return;
          }

          expect(() => builder(props)).not.toThrow();
        });
      });
    });

    it('respects factory config when using resolution module alone', () => {
      const throwBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitResolutionFeatures,
        config: { errorHandling: { invalidValueMode: 'throw' } },
      });
      const logBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitResolutionFeatures,
        config: { errorHandling: { invalidValueMode: 'log' } },
      });

      expect(() =>
        throwBuilder({ minResolution: api.mDpi(-1) }),
      ).toThrow('minResolution must be greater than 0');
      expect(() =>
        logBuilder({ minResolution: api.mDpi(-1) }),
      ).not.toThrow();
    });

    it('respects factory config when using custom module alone', () => {
      const throwBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitCustomFeatures,
        config: { errorHandling: { lintingMode: 'throw' } },
      });
      const allowBuilder = api.createMediaQueryBuilder({
        emitBase: api.emitCustomFeatures,
        config: { errorHandling: { lintingMode: 'allow' } },
      });

      const overlapping = {
        customFeatures: {
          'min-width': api.mPx(320),
        },
      };

      const emitWithDuplicate = (props: unknown, helpers: unknown) => {
        api.emitCustomFeatures(props, helpers);
        api.emitCustomFeatures(props, helpers);
      };

      const allowDuplicateBuilder = api.createMediaQueryBuilder({
        emitBase: emitWithDuplicate,
        config: { errorHandling: { lintingMode: 'allow' } },
      });
      const throwDuplicateBuilder = api.createMediaQueryBuilder({
        emitBase: emitWithDuplicate,
        config: { errorHandling: { lintingMode: 'throw' } },
      });

      expect(() => allowDuplicateBuilder(overlapping)).not.toThrow();
      expect(() => throwDuplicateBuilder(overlapping)).toThrow(
        'Media query feature "min-width" was emitted more than once.',
      );

      expect(() => allowBuilder(overlapping)).not.toThrow();
      expect(() => throwBuilder(overlapping)).not.toThrow();
    });

    it('builds an interaction query', () => {
      const result = api.buildMediaQueryString({
        hover: 'hover',
        anyHover: 'none',
        pointer: 'coarse',
        anyPointer: 'fine',
        update: 'fast',
      });
      expect(result).toBe(
        'screen and (hover: hover) and (any-hover: none) and (pointer: coarse) and (any-pointer: fine) and (update: fast)',
      );
    });

    it('builds a preferences query', () => {
      const result = api.buildMediaQueryString({
        colorScheme: 'dark',
        reducedMotion: 'reduce',
        reducedData: 'reduce',
        contrast: 'more',
        forcedColors: 'active',
      });
      expect(result).toBe(
        'screen and (prefers-color-scheme: dark) and (prefers-reduced-motion: reduce) and (prefers-reduced-data: reduce) and (prefers-contrast: more) and (forced-colors: active)',
      );
    });

    it('builds a display query', () => {
      const result = api.buildMediaQueryString({
        colorGamut: 'p3',
        dynamicRange: 'high',
        invertedColors: 'inverted',
      });
      expect(result).toBe(
        'screen and (color-gamut: p3) and (dynamic-range: high) and (inverted-colors: inverted)',
      );
    });

    it('builds an environment query', () => {
      const result = api.buildMediaQueryString({
        scripting: 'enabled',
        overflowBlock: 'scroll',
        overflowInline: 'scroll',
      });
      expect(result).toBe(
        'screen and (scripting: enabled) and (overflow-block: scroll) and (overflow-inline: scroll)',
      );
    });
  });
};
