import { describe,it,expect } from 'vitest';
import { runChecks } from './engine';
import { buggy, corrected,initialRules } from './rules';
describe('real sandbox execution',()=>{
 it('vertical slice discovers a real negative result',async()=>{const r=await runChecks(buggy,[initialRules[0]]);expect(r.results[0].passed).toBe(false);expect(r.results[0].observed).toBeLessThan(0);expect(r.results[0].input).toBeDefined();console.log('VERIFIED COUNTEREXAMPLE',r.results[0]);});
 it('corrected function satisfies all same checks',async()=>{expect((await runChecks(corrected,initialRules)).results.every(r=>r.passed)).toBe(true);});
 it('rejects unsupported input',async()=>{await expect(runChecks('export default 1',initialRules)).rejects.toThrow('Provide one function');});
 it('interrupts loops',async()=>{await expect(runChecks('function discount(price, percent) { while(true){} }',initialRules)).rejects.toThrow();},10000);
 it('has no network or process bindings',async()=>{await expect(runChecks('function discount(price, percent) { return fetch("https://example.com"); }',initialRules)).rejects.toThrow();});
 it('rejects promises and nonfinite values',async()=>{await expect(runChecks('function discount(price, percent) { return Promise.resolve(0); }',initialRules)).rejects.toThrow();});
 it('reproduces identical counterexamples',async()=>{const a=await runChecks(buggy,initialRules);const b=await runChecks(buggy,initialRules);expect(a.results).toEqual(b.results);});
 it('rejects duplicate rules and all disabled rules',async()=>{await expect(runChecks(buggy,[initialRules[0],initialRules[0]])).rejects.toThrow('unique');await expect(runChecks(buggy,initialRules.map(r=>({...r,enabled:false})))).rejects.toThrow('Enable at least one');});
 it('reports syntax errors and exceptions instead of a pass',async()=>{await expect(runChecks('function discount(price, percent) {',initialRules)).rejects.toThrow();await expect(runChecks('function discount(price, percent) { throw Error("broken"); }',initialRules)).rejects.toThrow('broken');});
 it('disallows nondeterministic random code',async()=>{await expect(runChecks('function discount(price, percent) { return Math.random(); }',initialRules)).rejects.toThrow('Randomness is unsupported');});
 it('detects an upper-bound defect',async()=>{const r=await runChecks('function discount(price, percent) { return price + 1; }',[initialRules[3]]);expect(r.results[0].passed).toBe(false);expect(r.results[0].observed).toBeGreaterThan(r.results[0].input![0]);});
 it('rejects oversized sources',async()=>{await expect(runChecks(buggy+' '.repeat(12000),initialRules)).rejects.toThrow('12,000');});
});
