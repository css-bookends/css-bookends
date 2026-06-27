import { describe, expect, it } from 'vitest';

import {
  createCssValues,
  fontWeight,
  lineClamp,
  opacity,
  zIndex,
} from '../../src';

describe('CSS-value helper layer (src)', () => {
  it('renders the object form by default (format: object)', () => {
    expect(opacity(0.5).css()).toEqual({ opacity: '0.5' });
    expect(zIndex(10).css()).toEqual({ zIndex: '10' });
    // styleKey override: line-clamp's CSS-in-JS key is WebkitLineClamp.
    expect(lineClamp(3).css()).toEqual({ WebkitLineClamp: '3' });
  });

  it('exposes both forms + raw + unit on every result', () => {
    const o = opacity(0.5);
    expect(o.css()).toEqual({ opacity: '0.5' }); // configured default (object)
    expect(o.value.css()).toBe('0.5'); // bare value string
    expect(o.style.css()).toEqual({ opacity: '0.5' }); // style object
    expect(o.value()).toBe(0.5); // raw scalar
    expect(o.unit()).toBe(''); // unitless scalar property
  });

  it('renders the bare string when format is string', () => {
    const v = createCssValues({ format: 'string' });
    expect(v.opacity(0.5).css()).toBe('0.5');
    // both forms stay reachable regardless of the configured default.
    expect(v.opacity(0.5).style.css()).toEqual({ opacity: '0.5' });
    // a per-call override beats the instance default.
    expect(opacity(0.5, { format: 'string' }).css()).toBe('0.5');
  });

  it('renders boundary floats', () => {
    expect(opacity(0).value.css()).toBe('0');
    expect(opacity(1).value.css()).toBe('1');
  });

  it('throws on an out-of-range number by default', () => {
    expect(() => opacity(1.5)).toThrow(/above the maximum/);
    expect(() => opacity(-0.5)).toThrow(/below the minimum/);
  });

  it('clamps a number when asked per-call', () => {
    expect(opacity(1.5, { outOfRange: 'clamp' }).value.css()).toBe(
      '1',
    );
    expect(opacity(-0.5, { outOfRange: 'clamp' }).value.css()).toBe(
      '0',
    );
    // in-range values are untouched by clamp.
    expect(opacity(0.25, { outOfRange: 'clamp' }).value.css()).toBe(
      '0.25',
    );
  });

  it('passes keywords through untouched', () => {
    expect(zIndex('auto').value.css()).toBe('auto');
    expect(zIndex('auto').value()).toBe('auto');
    expect(zIndex('auto').style.css()).toEqual({ zIndex: 'auto' });
  });

  it('rejects an unknown keyword at runtime', () => {
    // @ts-expect-error - 'nope' is not a zIndex keyword
    expect(() => zIndex('nope')).toThrow(/not a valid keyword/);
  });

  it('enforces integer-ness on int rows', () => {
    expect(zIndex(2).value.css()).toBe('2');
    expect(zIndex(-3).value.css()).toBe('-3');
    expect(() => zIndex(2.5)).toThrow(/expected an integer/);
  });

  it('enforces a specific range (font-weight)', () => {
    expect(fontWeight(700).value.css()).toBe('700');
    expect(fontWeight(1).value.css()).toBe('1');
    expect(fontWeight(1000).value.css()).toBe('1000');
    expect(() => fontWeight(1200)).toThrow(/above the maximum/);
    expect(() => fontWeight(0)).toThrow(/below the minimum/);
  });

  it('accepts font-weight keywords', () => {
    expect(fontWeight('bold').value.css()).toBe('bold');
    expect(fontWeight('normal').value.css()).toBe('normal');
  });

  it('takes its out-of-range policy from the instance default', () => {
    const clamped = createCssValues({ outOfRange: 'clamp' });
    // instance default clamps.
    expect(clamped.opacity(1.5).value.css()).toBe('1');
    expect(clamped.opacity(-0.5).value.css()).toBe('0');
    // a per-call override beats the instance default.
    expect(() =>
      clamped.opacity(1.5, { outOfRange: 'throw' }),
    ).toThrow(/above the maximum/);
  });

  it('defaults to throw when no config is given', () => {
    const strict = createCssValues();
    expect(() => strict.opacity(1.5)).toThrow(/above the maximum/);
    expect(strict.opacity(0.5).value.css()).toBe('0.5');
  });

  it('clamps to whichever single bound exists (one-directional)', () => {
    const instance = createCssValues({ outOfRange: 'clamp' });
    // flexGrow has min 0 and no max: a high value has no max to clamp to, so
    // it stays as-is (nothing to clamp the high side against).
    expect(instance.flexGrow(5).value.css()).toBe('5');
    // below the min clamps UP to the min: the bound on that side exists, so
    // clamp pulls the value to it (one-directional, the sensible direction).
    expect(instance.flexGrow(-1).value.css()).toBe('0');
    // clamp fixes RANGE, not integer-ness: an in-range non-integer on an int
    // row still throws, because clamping it makes no sense (throw by default).
    expect(() => instance.columnCount(2.5)).toThrow(
      /expected an integer/,
    );
  });
});
