import {runChecks} from './engine';
self.onmessage=async e=>{try{self.postMessage({ok:true,value:await runChecks(e.data.source,e.data.rules)});}catch(error){self.postMessage({ok:false,error:error instanceof Error?error.message:'Execution failed'});}};
