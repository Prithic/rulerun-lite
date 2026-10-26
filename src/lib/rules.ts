import { z } from 'zod';
export const kinds = ['nonNegative', 'zeroIdentity', 'fullDiscount', 'upperBound'] as const;
export const ruleSchema = z.object({ kind: z.enum(kinds), enabled: z.boolean() }).strict();
export const rulesSchema = z.array(ruleSchema).min(1).max(4).refine(r => new Set(r.map(x => x.kind)).size === r.length, 'Each rule must be unique').refine(r => r.some(x => x.enabled), 'Enable at least one rule');
export type Rule = z.infer<typeof ruleSchema>;
export const labels: Record<Rule['kind'], string> = { nonNegative: 'The result is never negative', zeroIdentity: 'A 0% discount preserves the price', fullDiscount: 'A 100% discount produces zero', upperBound: 'The result never exceeds the price' };
export const conditions: Record<Rule['kind'], string> = { nonNegative: 'Number.isFinite(result) && result >= 0', zeroIdentity: 'Math.abs(result - price) <= 1e-7', fullDiscount: 'Math.abs(result) <= 1e-7', upperBound: 'Number.isFinite(result) && result <= price + 1e-7' };
export function holds(kind: Rule['kind'], price: number, result: number) { if (!Number.isFinite(result)) return false; switch(kind) { case 'nonNegative': return result >= 0; case 'zeroIdentity': return Math.abs(result-price) <= 1e-7; case 'fullDiscount': return Math.abs(result) <= 1e-7; case 'upperBound': return result <= price + 1e-7; } }
export const initialRules: Rule[] = kinds.map(kind => ({kind, enabled:true}));
export const buggy = `function discount(price, percent) {\n  return price - percent;\n}`;
export const corrected = `function discount(price, percent) {\n  return price * (1 - percent / 100);\n}`;
export const roundingBug = `function discount(price, percent) {\n  return Math.round(price * (1 - percent / 100));\n}`;
export const specification = 'The discounted price must never be negative or exceed the original price. A 0% discount keeps the original price. A 100% discount gives a price of zero.';
