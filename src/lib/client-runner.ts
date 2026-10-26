import type {Rule} from './rules';
import type {RunResult} from './engine';
export function execute(source:string,rules:Rule[],signal?:AbortSignal,spec?:string):Promise<RunResult>{return new Promise((resolve,reject)=>{
 if(signal?.aborted){reject(new Error('Run canceled.'));return;}
 const worker=new Worker(new URL('./runner.worker.ts',import.meta.url));
 const finish=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);worker.terminate();};
 const cancel=()=>{finish();reject(new Error('Run canceled.'));};
 const timer=setTimeout(()=>{finish();reject(new Error('Execution exceeded the 8-second limit. Simplify the function and try again.'));},8000);
 signal?.addEventListener('abort',cancel,{once:true});
 worker.onmessage=e=>{finish();if(e.data.ok)resolve(e.data.value);else reject(new Error(e.data.error));};
 worker.onerror=()=>{finish();reject(new Error('The isolated runner could not start. Reload and try again.'));};
 worker.onmessageerror=()=>{finish();reject(new Error('The isolated runner returned an unreadable result.'));};
 try{worker.postMessage({source,rules,spec});}catch(e){finish();reject(e);}
});}
