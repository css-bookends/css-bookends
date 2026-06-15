import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { anchorSize, parseSpacing } from '../../src/spacing';
import type { SpacingKeyword } from '../../src/types';

/*
 * INPUT step of the spacing LEXICON (shared guts of the padding/margin books). The
 * lexicon's job is INPUT only: VALIDATE the input (shape + each value against the
 * book's policy) and return it unchanged - shorthand intact. Spelling it out into the
 * four sides is each book's STORAGE step, not the lexicon's. Real assertions.
 */

describe('spacing input — validates and returns the input (shorthand intact)', () => {
  it('accepts a scalar measurement', () => {
    const v = m(8);
    expect(parseSpacing(v)).toBe(v);
  });

  it('accepts bare 0', () => {
    expect(parseSpacing(0)).toBe(0);
  });

  it('accepts every keyword', () => {
    const keywords: SpacingKeyword[] = [
      'auto',
      'inherit',
      'initial',
      'unset',
      'revert',
      'revert-layer',
    ];
    for (const kw of keywords) {
      expect(parseSpacing(kw)).toBe(kw);
    }
  });

  it('accepts an object with x/y axes, returned unchanged', () => {
    const o = { x: m(4), y: m(8) };
    expect(parseSpacing(o)).toBe(o);
  });

  it('accepts an object with explicit sides', () => {
    const o = { top: m(2), left: m(0) };
    expect(parseSpacing(o)).toBe(o);
  });
});

describe('spacing input — invalid input throws', () => {
  it('throws on an unknown scalar string', () => {
    expect(() => parseSpacing('huge' as never)).toThrow();
  });

  it('throws on an invalid value inside the object', () => {
    expect(() => parseSpacing({ x: 'huge' as never })).toThrow();
  });

  it('throws on a non-value, non-object input', () => {
    expect(() => parseSpacing(42 as never)).toThrow();
  });
});

describe('spacing input — value-domain policy (padding/margin split)', () => {
  it('allows auto + negatives by default', () => {
    expect(parseSpacing('auto')).toBe('auto');
    const neg = m(-4);
    expect(parseSpacing(neg)).toBe(neg);
  });

  it('forbids auto when policy.auto is false (padding)', () => {
    expect(() => parseSpacing('auto', { auto: false })).toThrow();
    expect(() =>
      parseSpacing({ x: 'auto' }, { auto: false }),
    ).toThrow();
  });

  it('forbids negatives when policy.negative is false (padding)', () => {
    expect(() => parseSpacing(m(-4), { negative: false })).toThrow();
    expect(() =>
      parseSpacing({ y: m(-4) }, { negative: false }),
    ).toThrow();
  });

  it('allows them when the policy permits (margin)', () => {
    expect(parseSpacing('auto', { auto: true })).toBe('auto');
    const neg = m(-4);
    expect(parseSpacing(neg, { negative: true })).toBe(neg);
  });
});

describe('spacing input — anchor-size() (margin-only special value)', () => {
  it('accepts an anchor-size() scalar', () => {
    const a = anchorSize({ size: 'width' });
    expect(parseSpacing(a)).toBe(a);
  });

  it('accepts anchor-size() inside the object form', () => {
    const a = anchorSize({
      anchor: '--btn',
      size: 'inline',
      fallback: m(50),
    });
    const o = { x: a };
    expect(parseSpacing(o)).toBe(o);
  });

  it('builder rejects a non-dashed-ident anchor', () => {
    expect(() => anchorSize({ anchor: 'btn' })).toThrow();
  });

  it('builder rejects an invalid size keyword', () => {
    expect(() => anchorSize({ size: 'bogus' as never })).toThrow();
  });

  it('is forbidden when policy.anchorSize is false (padding)', () => {
    const a = anchorSize({ size: 'width' });
    expect(() => parseSpacing(a, { anchorSize: false })).toThrow();
    expect(() =>
      parseSpacing({ x: a }, { anchorSize: false }),
    ).toThrow();
  });
});
