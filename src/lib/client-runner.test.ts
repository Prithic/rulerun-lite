import {it,expect,vi,afterEach} from 'vitest';
import {execute} from './client-runner';
import {buggy,initialRules} from './rules';
let worker:FakeWorker;
class FakeWorker{
 onmessage?: (e:{data:unknown})=>void;
 onerror?: ()=>void;
 onmessageerror?: ()=>void;
 terminate=vi.fn();postMessage=vi.fn();
 constructor(){worker=this;}
}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
function setup(){vi.useFakeTimers();vi.stubGlobal('Worker',FakeWorker);}
it('terminates a stalled worker at the host watchdog deadline',async()=>{
 setup();const pending=expect(execute(buggy,initialRules)).rejects.toThrow('8-second');
 await vi.advanceTimersByTimeAsync(8000);await pending;expect(worker.terminate).toHaveBeenCalledOnce();
});
it('aborts a running worker immediately',async()=>{
 setup();const controller=new AbortController();const pending=expect(execute(buggy,initialRules,controller.signal)).rejects.toThrow('canceled');
 controller.abort();await pending;expect(worker.terminate).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
});
it.each(['onerror','onmessageerror'] as const)('cleans up after %s',async event=>{
 setup();const pending=expect(execute(buggy,initialRules)).rejects.toThrow('isolated runner');worker[event]?.();await pending;
 expect(worker.terminate).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
});
it('cleans up after a worker-reported execution error',async()=>{
 setup();const pending=expect(execute(buggy,initialRules)).rejects.toThrow('sandbox failure');
 worker.onmessage?.({data:{ok:false,error:'sandbox failure'}});await pending;expect(worker.terminate).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
});
