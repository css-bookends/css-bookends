import { mPx } from '@css-bookends/css-calipers';
import type { Property } from 'csstype';
import { expectAssignable, expectError, expectType } from 'tsd';

import {
  borderImageOutset,
  borderImageSlice,
  borderImageWidth,
  counterIncrement,
  counterReset,
  counterSet,
  gridColumnEnd,
  gridColumnStart,
  gridRowEnd,
  gridRowStart,
  maskBorderOutset,
  maskBorderSlice,
  maskBorderWidth,
  type MultiCssValue,
  scale,
  span,
  strokeDasharray,
  strokeDashoffset,
  strokeWidth,
  tabSize,
} from '../../dist/esm';

// `.css()` is typed against the property's csstype value type.
expectAssignable<Property.CounterReset>(counterReset('page').css());
expectAssignable<Property.CounterIncrement>(
  counterIncrement([
    'page',
    2,
  ]).css(),
);
expectAssignable<Property.CounterSet>(counterSet('page').css());
expectAssignable<Property.GridRowStart>(gridRowStart(2).css());
expectAssignable<Property.GridRowEnd>(gridRowEnd('auto').css());
expectAssignable<Property.GridColumnStart>(
  gridColumnStart('main-start').css(),
);
expectAssignable<Property.GridColumnEnd>(
  gridColumnEnd(span(2)).css(),
);
expectAssignable<Property.Scale>(scale(1, 2, 3).css());
expectAssignable<Property.TabSize>(tabSize(4).css());
expectAssignable<Property.TabSize>(tabSize(mPx(8)).css());

// the value-object shape carries its property key.
const counter = counterReset('page');
expectType<MultiCssValue<'CounterReset'>>(counter);
expectType<string>(counter.value());
expectType<string>(counter.toString());

// counters: string ident, [ident, number] tuple, or the none keyword.
expectAssignable<Property.CounterReset>(
  counterReset('a', [
    'b',
    1,
  ]).css(),
);
// a tuple with a non-number second slot is rejected.
expectError(
  counterReset([
    'b',
    'x',
  ]),
);
// (none cannot be combined with entries: a runtime guard, not a type-level one.)

// scale: 'none' or one-to-three numbers; a number cannot follow 'none'.
expectAssignable<Property.Scale>(scale('none').css());
expectError(scale('none', 2));
// a fourth scale factor is rejected.
expectError(scale(1, 2, 3, 4));

// tab-size accepts a number or a measurement, not an arbitrary string.
expectError(tabSize('4'));

// span builds a SpanInput, accepted by grid-line helpers.
expectAssignable<Property.GridRowStart>(
  gridRowStart(span(3, 'main')).css(),
);

// --- number-or-length tier ------------------------------------------------

// `.css()` is typed against each property's csstype value type.
expectAssignable<Property.BorderImageWidth>(
  borderImageWidth(1, 2).css(),
);
expectAssignable<Property.BorderImageWidth>(
  borderImageWidth('auto', mPx(4)).css(),
);
expectAssignable<Property.BorderImageOutset>(
  borderImageOutset(1, mPx(2)).css(),
);
expectAssignable<Property.BorderImageSlice>(
  borderImageSlice(10, 20, 'fill').css(),
);
expectAssignable<Property.MaskBorderWidth>(
  maskBorderWidth('auto').css(),
);
expectAssignable<Property.MaskBorderOutset>(
  maskBorderOutset(1).css(),
);
expectAssignable<Property.MaskBorderSlice>(
  maskBorderSlice(5, 'fill').css(),
);
expectAssignable<Property.StrokeWidth>(strokeWidth(2).css());
expectAssignable<Property.StrokeWidth>(strokeWidth(mPx(3)).css());
expectAssignable<Property.StrokeDashoffset>(
  strokeDashoffset(-5).css(),
);
expectAssignable<Property.StrokeDashoffset>(
  strokeDashoffset(mPx(8)).css(),
);
expectAssignable<Property.StrokeDasharray>(
  strokeDasharray(4, 2).css(),
);
expectAssignable<Property.StrokeDasharray>(
  strokeDasharray('none').css(),
);

// the value-object shape carries its property key.
expectType<MultiCssValue<'StrokeWidth'>>(strokeWidth(2));

// the single-value helpers accept a number or an IMeasurement, not a string
// (they carry no keywords).
expectError(strokeWidth('2'));
// the edge helpers accept a number, IMeasurement, or keyword string, but not a
// non-string/non-number value such as a boolean.
expectError(borderImageOutset(true));
// slice is number-only: an IMeasurement is rejected.
expectError(borderImageSlice(mPx(10)));
// 'none' takes no further entries on stroke-dasharray.
expectError(strokeDasharray('none', 4));
