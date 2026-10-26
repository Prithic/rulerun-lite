import { describe, it, expect } from 'vitest';
import { suggestRulesFromNotes } from './rule-suggester';

describe('suggestRulesFromNotes', () => {
  it('maps the standard specification to all four supported properties with no unmapped clauses', () => {
    const text = 'The discounted price must never be negative or exceed the original price. A 0% discount keeps the original price. A 100% discount gives a price of zero.';
    const result = suggestRulesFromNotes(text);
    expect(result.recognized.map((r) => r.kind).sort()).toEqual(['fullDiscount', 'nonNegative', 'upperBound', 'zeroIdentity'].sort());
    expect(result.suggestedRules.every((r) => r.enabled)).toBe(true);
    expect(result.unmapped.length).toBe(0);
  });

  it('maps individual phrases correctly', () => {
    const res1 = suggestRulesFromNotes('The result is never negative.');
    expect(res1.recognized).toHaveLength(1);
    expect(res1.recognized[0].kind).toBe('nonNegative');
    expect(res1.suggestedRules.find((r) => r.kind === 'nonNegative')?.enabled).toBe(true);
    expect(res1.suggestedRules.find((r) => r.kind === 'zeroIdentity')?.enabled).toBe(false);

    const res2 = suggestRulesFromNotes('A 0% discount preserves the price.');
    expect(res2.recognized).toHaveLength(1);
    expect(res2.recognized[0].kind).toBe('zeroIdentity');

    const res3 = suggestRulesFromNotes('A 100% discount produces zero.');
    expect(res3.recognized).toHaveLength(1);
    expect(res3.recognized[0].kind).toBe('fullDiscount');

    const res4 = suggestRulesFromNotes('The output must never exceed the original price.');
    expect(res4.recognized).toHaveLength(1);
    expect(res4.recognized[0].kind).toBe('upperBound');
  });

  it('identifies unmapped clauses without claiming they are verified', () => {
    const text = 'Result is never negative. Free shipping on orders over $50. Tiered loyalty points apply.';
    const result = suggestRulesFromNotes(text);
    expect(result.recognized).toHaveLength(1);
    expect(result.recognized[0].kind).toBe('nonNegative');
    expect(result.unmapped).toContain('Free shipping on orders over $50');
    expect(result.unmapped).toContain('Tiered loyalty points apply');
  });

  it('handles empty and whitespace input cleanly', () => {
    const result = suggestRulesFromNotes('   \n  ');
    expect(result.recognized).toHaveLength(0);
    expect(result.unmapped).toHaveLength(0);
    expect(result.suggestedRules.every((r) => r.enabled)).toBe(true);
  });
});
