import {it,expect} from 'vitest';
import * as fc from 'fast-check';
import {runChecks,SEED,RUNS} from './engine';
import {initialRules,holds,buggy,corrected} from './rules';

it('reports exactly the default failures and each observation violates its rule',async()=>{
 const run=await runChecks(buggy,initialRules);
 expect(run.results.map(r=>r.passed)).toEqual([false,true,false,true]);
 for(const result of run.results.filter(r=>!r.passed)){
  expect(result.observed).toBe(result.input![0]-result.input![1]);
  expect(holds(result.kind,result.input![0],result.observed!)).toBe(false);
 }
 expect((await runChecks(corrected,initialRules)).results.every(r=>r.passed&&r.runs===200)).toBe(true);
});
it('counts supplied boundary cases inside the main run budget',()=>{
 let calls=0;
 const result=fc.check(fc.property(fc.integer(),()=>{calls++;return true;}),{seed:SEED,numRuns:RUNS,examples:[[0],[100]]});
 expect(result.numRuns).toBe(200);expect(calls).toBe(200);
});

it('rejects a different named-function signature',async()=>{
 await expect(runChecks('function discount(other) { return 0; }',initialRules)).rejects.toThrow('Provide one function');
});
it('rejects nonfinite output even when sandbox intrinsics are overwritten',async()=>{
 await expect(runChecks('function discount(price, percent) { Number.isFinite = () => true; return Infinity; }',initialRules)).rejects.toThrow('finite number');
});
it('never presents a now-passing observation as a counterexample',async()=>{
 await expect(runChecks('function discount(price, percent) { globalThis.calls = (globalThis.calls || 0) + 1; return globalThis.calls === 1 ? -1 : price; }',[initialRules[0]])).rejects.toThrow('deterministic');
});
it('finds the rounding defect after its supplied identity boundaries pass and replays its path',async()=>{
 const source='function discount(price, percent) { return Math.round(price * (1 - percent / 100)); }';
 expect(holds('zeroIdentity',0,0)).toBe(true);
 expect(holds('zeroIdentity',100,100)).toBe(true);
 const result=(await runChecks(source,[initialRules[1]])).results[0];
 expect(result.passed).toBe(false);
 expect(result.runs).toBeGreaterThan(2);
 expect(result.input![0] % 1).not.toBe(0);
 expect(holds('zeroIdentity',result.input![0],result.observed!)).toBe(false);
 const property=fc.property(fc.integer({min:0,max:1000000}).map(c=>c/100),fc.constant(0),(p,_d)=>holds('zeroIdentity',p,Math.round(p)));
 const replay=fc.check(property,{seed:SEED,numRuns:RUNS,examples:[[0,0],[100,0]],path:result.path});
 expect(replay.counterexample).toEqual(result.input);
});
it.each(['NaN','Infinity','-Infinity','Promise.resolve(0)'])('rejects %s',async value=>{
 await expect(runChecks(`function discount(price, percent) { return ${value}; }`,initialRules)).rejects.toThrow('finite number');
});
it('rejects empty, malformed and unknown rule definitions',async()=>{
 for(const rules of [[],[{kind:'unknown',enabled:true}],[{kind:'nonNegative',enabled:'yes'}]]){
  await expect(runChecks('function discount(price, percent) { return 0; }',rules as never)).rejects.toThrow();
 }
});
it('enforces sandbox host boundaries and stack/memory limits',async()=>{
 for(const body of [
  'return [typeof fetch,typeof process,typeof window,typeof document,typeof require,typeof WebSocket].every(v=>v==="undefined") ? price : -1;',
 ])expect((await runChecks(`function discount(price, percent) { ${body} }`,[initialRules[0]])).results[0].passed).toBe(true);
 for(const body of ['return discount(price, percent);','const a=[]; while(true) a.push(new Array(10000).fill(1));']){
  await expect(runChecks(`function discount(price, percent) { ${body} }`,initialRules)).rejects.toThrow();
 }
},10000);

it('supports common const discount assignment forms',async()=>{
 const passing='const discount = (price, percent) => price * (1 - percent / 100);';
 const run=await runChecks(passing,initialRules);
 expect(run.results.every(r=>r.passed)).toBe(true);

 const failing='const discount = (price, percent) => price - percent;';
 const failRun=await runChecks(failing,initialRules);
 expect(failRun.results.map(r=>r.passed)).toEqual([false,true,false,true]);
});

it('handles repeated sequential execution across successes, failures, exceptions and timeouts cleanly',async()=>{
 expect((await runChecks(corrected,initialRules)).results.every(r=>r.passed)).toBe(true);
 expect((await runChecks(buggy,initialRules)).results.some(r=>!r.passed)).toBe(true);
 await expect(runChecks('function discount(price, percent) { throw Error("boom"); }',initialRules)).rejects.toThrow('boom');
 await expect(runChecks('function discount(price, percent) { while(true){} }',initialRules)).rejects.toThrow();
 expect((await runChecks(corrected,initialRules)).results.every(r=>r.passed)).toBe(true);
},20000);

