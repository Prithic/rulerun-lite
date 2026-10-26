import * as fc from 'fast-check';
import { newQuickJSWASMModule } from 'quickjs-emscripten';
import variant from '@jitl/quickjs-singlefile-browser-release-sync';
import { holds, rulesSchema, conditions, type Rule } from './rules';
export const SEED = 20261026;
export const RUNS = 200;
export type CheckResult = {kind: Rule['kind']; passed: boolean; runs: number; input?: [number,number]; observed?: number; expected: string; path?: string};
export type RunResult = { results: CheckResult[]; seed: number; duration: number; source: string; rules: Rule[] };
export async function runChecks(source: string, inputRules: Rule[]): Promise<RunResult> {
 const parsed = rulesSchema.safeParse(inputRules);
 if(!parsed.success) throw new Error(parsed.error.issues.map(issue=>issue.message).join('; '));
 const rules = parsed.data;
 if (source.length > 12000 || !/^\s*(function\s+discount\s*\(\s*price\s*,\s*percent\s*\)\s*\{|\(\s*price\s*,\s*percent\s*\)\s*=>)/.test(source)) throw new Error('Provide one function named discount(price, percent), or a (price, percent) arrow function. Maximum 12,000 characters.');
 const started = performance.now();
 const module = await newQuickJSWASMModule(variant);
 const runtime = module.newRuntime();
 runtime.setMemoryLimit(16 * 1024 * 1024); runtime.setMaxStackSize(256 * 1024);
 const deadline = Date.now() + 3000; runtime.setInterruptHandler(() => Date.now() > deadline);
 const vm = runtime.newContext();
 let executionFailure: unknown;
 try {
  const evaluate = (code: string) => {
   const value = vm.evalCode(code);
   if(value.error) {
    let text = 'Sandbox execution failed';
    try { const message = vm.getProp(value.error,'message'); try { text = vm.getString(message) || text; } finally { message.dispose(); } }
    finally { value.error.dispose(); }
    throw new Error(text);
   }
   try { return vm.getNumber(value.value); } finally { value.value.dispose(); }
  };
  // No host functions, module loader, DOM, network, filesystem, or secrets are exposed.
  evaluate(`globalThis.Date = undefined; Math.random = () => { throw Error('Randomness is unsupported; use a pure deterministic function'); }; globalThis.__subject = (${source}\n); if(typeof __subject !== 'function') throw Error('Expected a function');`);
  const invoke = (p:number,d:number): number => { const result = evaluate(`(() => { const f = (${source}\n); const r = f(${p},${d}); if(typeof r !== 'number') throw Error('Return a finite number synchronously'); return r; })()`); if(typeof result !== 'number' || !Number.isFinite(result)) throw new Error('Return a finite number synchronously'); return result; };
  const results: CheckResult[] = [];
  for(const rule of rules.filter(r => r.enabled)) {
   const prices = fc.integer({min:0,max:1000000}).map(c => c/100);
   const percents = rule.kind === 'zeroIdentity' ? fc.constant(0) : rule.kind === 'fullDiscount' ? fc.constant(100) : fc.integer({min:0,max:10000}).map(n=>n/100);
   let executionError: Error | undefined;
   const checked = fc.check(fc.property(prices,percents,(p,d)=> { try { return holds(rule.kind,p,invoke(p,d)); } catch(e) { executionError = e instanceof Error ? e : new Error(String(e)); throw e; } }), {seed:SEED,numRuns:RUNS,examples: rule.kind === 'zeroIdentity' ? [[0,0],[100,0]] : rule.kind === 'fullDiscount' ? [[0,100],[100,100]] : [[0,100],[1,50],[100,0],[100,100]], endOnFailure:false});
   if(executionError) throw new Error(`Function execution failed: ${executionError.message}`);
   const pair = checked.counterexample as [number,number] | null;
   const observed = pair ? invoke(...pair) : undefined;
   if(pair && holds(rule.kind,pair[0],observed!)) throw new Error('The counterexample did not reproduce. Use a pure deterministic function without global state.');
   results.push({kind:rule.kind,passed:!checked.failed,runs:checked.numRuns,expected:conditions[rule.kind],...(pair ? {input:pair,observed,path:checked.counterexamplePath ?? undefined} : {})});
  }
  return {results,seed:SEED,duration:Math.round(performance.now()-started),source,rules};
 } catch(error) { executionFailure = error; throw error; }
 finally {
  try { try { vm.dispose(); } finally { runtime.dispose(); } }
  catch(cleanupError) { if(!executionFailure) throw cleanupError; }
 }
}

