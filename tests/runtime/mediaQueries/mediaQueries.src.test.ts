import { describe, expect, it } from "vitest";
import { runMediaQueryTests } from "./mediaQueries.shared";

import { mDpi, mPx, r } from "../../../src";
import {
  buildMediaQueryFromFeatures,
  buildMediaQueryString,
  createMediaQueryBuilder,
  emitCustomFeatures,
  emitDimensionsFeatures,
  emitResolutionFeatures,
  mediaQueryFactory,
} from "../../../src/mediaQueries";
import {
  mediaQueryOutputVanillaExtract,
  preprocessorVanillaExtract,
} from "../../../src/mediaQueries/libraryHelpers/vanilla-extract";
import type { StyleRule } from "../../../src/mediaQueries/types";

runMediaQueryTests("src", {
  buildMediaQueryFromFeatures,
  buildMediaQueryString,
  createMediaQueryBuilder,
  emitCustomFeatures,
  emitDimensionsFeatures,
  emitResolutionFeatures,
  mediaQueryFactory,
  mDpi,
  mPx,
  r,
});

describe("mediaQueries (src) factory output mappers", () => {
  it("wraps output for vanilla-extract", () => {
    const factory = mediaQueryFactory({
      queries: {
        desktop: { minWidth: mPx(640) },
      },
      config: {
        label: "vanilla-extract",
        errorHandling: { invalidValueMode: "throw", lintingMode: "log" },
        output: mediaQueryOutputVanillaExtract,
      },
    });

    const result = factory({
      desktop: { color: "red" },
    });

    expect(result).toEqual({
      "&": {
        "@media": {
          "screen and (min-width: 640px)": { color: "red" },
        },
      },
    });
  });

  it("supports preProcessor output for vanilla-extract", () => {
    const factory = mediaQueryFactory({
      queries: {
        compact: { maxWidth: mPx(640) },
      },
      config: {
        label: "vanilla-extract-preprocessor",
        errorHandling: { invalidValueMode: "throw", lintingMode: "log" },
        preProcessor: preprocessorVanillaExtract,
        output: mediaQueryOutputVanillaExtract,
      },
    });

    const result = factory({
      compact: {
        color: "red",
        selectors: {
          "&[data-x]": {
            color: "blue",
          },
        },
      },
    });

    expect(result).toEqual({
      "&": {
        "@media": {
          "screen and (max-width: 640px)": { color: "red" },
        },
      },
      "&[data-x]": {
        "@media": {
          "screen and (max-width: 640px)": { color: "blue" },
        },
      },
    });
  });

  it("supports a custom output mapper", () => {
    const factory = mediaQueryFactory({
      queries: {
        desktop: { minWidth: mPx(640) },
      },
      config: {
        label: "custom-output",
        errorHandling: { invalidValueMode: "throw", lintingMode: "log" },
        output: (media) => ({
          level1: {
            level2: media,
            extraCss: "someValue",
          },
        }),
      },
    });

    const result = factory({
      desktop: { color: "red" },
    });

    expect(result).toEqual({
      level1: {
        level2: {
          "@media": {
            "screen and (min-width: 640px)": { color: "red" },
          },
        },
        extraCss: "someValue",
      },
    });
  });

  it("runs preProcessor before output", () => {
    const factory = mediaQueryFactory({
      queries: {
        desktop: { minWidth: mPx(640) },
      },
      config: {
        label: "pre-processor",
        errorHandling: { invalidValueMode: "throw", lintingMode: "log" },
        preProcessor: (media) => ({
          "@media": {
            "screen and (min-width: 640px)": { color: "blue" },
          },
        }),
        output: (media) => ({
          wrapped: media,
        }),
      },
    });

    const result = factory({
      desktop: { color: "red" },
    });

    expect(result).toEqual({
      wrapped: {
        "@media": {
          "screen and (min-width: 640px)": { color: "blue" },
        },
      },
    });
  });

  it("flattens nested selectors recursively", () => {
    const media: StyleRule = {
      "@media": {
        "screen and (min-width: 640px)": {
          color: "red",
          selectors: {
            "&[data-x]": {
              background: "blue",
              selectors: {
                "&:hover": {
                  color: "green",
                },
                ".child": {
                  color: "purple",
                },
              },
            },
          },
        },
      },
    };

    const result = preprocessorVanillaExtract(media);

    expect(result).toEqual({
      "&": {
        "@media": {
          "screen and (min-width: 640px)": { color: "red" },
        },
      },
      "&[data-x]": {
        "@media": {
          "screen and (min-width: 640px)": { background: "blue" },
        },
      },
      "&[data-x]:hover": {
        "@media": {
          "screen and (min-width: 640px)": { color: "green" },
        },
      },
      "&[data-x] .child": {
        "@media": {
          "screen and (min-width: 640px)": { color: "purple" },
        },
      },
    });
  });
});
