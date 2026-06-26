import type { Property } from 'csstype';
import { expectAssignable, expectError, expectType } from 'tsd';

import {
  createCssValues,
  type CssValue,
  fontWeight,
  opacity,
  zIndex,
} from '../../dist/esm';

// `.css()` is typed against the property's csstype value type.
expectAssignable<Property.Opacity>(opacity(0.5).css());
expectAssignable<Property.ZIndex>(zIndex(2).css());
expectAssignable<Property.FontWeight>(fontWeight(700).css());

// the value object shape.
const value = opacity(0.5);
expectType<CssValue<'Opacity'>>(value);
expectAssignable<number | string>(value.value());
expectAssignable<string>(value.toString());

// the keyword union is accepted.
expectAssignable<Property.ZIndex>(zIndex('auto').css());
expectAssignable<Property.FontWeight>(fontWeight('bold').css());

// a non-keyword string is rejected.
expectError(zIndex('nope'));
expectError(fontWeight('heavy'));
// a keyword that belongs to a different property is rejected.
expectError(zIndex('normal'));
// opacity has no keywords, so any string is rejected.
expectError(opacity('auto'));

// the factory returns the same helper surface.
const instance = createCssValues({ outOfRange: 'clamp' });
expectAssignable<Property.Opacity>(instance.opacity(1.5).css());
expectError(instance.zIndex('nope'));

// per-call options are accepted.
expectAssignable<Property.Opacity>(
  opacity(1.5, { outOfRange: 'clamp' }).css(),
);
// an unknown option key is rejected.
expectError(opacity(0.5, { nope: true }));
