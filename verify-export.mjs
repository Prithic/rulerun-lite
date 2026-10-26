import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const input=path.resolve(process.env.QA_DIR||'.','discount.regression.test.ts');
const original=await fs.readFile(input,'utf8');
const cases=JSON.parse(original.match(/const cases = ([\s\S]*?);\nfor /)?.[1]||'null');
if(!Array.isArray(cases)||!cases.length)throw Error('Export has no discovered cases');
const qa=await fs.mkdtemp(path.join(os.tmpdir(),'rulerun-export-'));
const fixture=path.join(qa,'discount.regression.test.ts');
const config=path.join(qa,'export-check.config.mjs');
const aliases=Object.fromEntries(['vitest','quickjs-emscripten','@jitl/quickjs-singlefile-browser-release-sync'].map(name=>[name,fileURLToPath(import.meta.resolve(name))]));
const corrected='function discount(price, percent) { return price * (1 - percent / 100); }';
try{
 await fs.writeFile(config,`export default ${JSON.stringify({root:qa,resolve:{alias:aliases},test:{include:['discount.regression.test.ts']}})};`);
 await fs.writeFile(fixture,original);
 const run=()=>spawnSync(process.execPath,[fileURLToPath(new URL('./node_modules/vitest/vitest.mjs',import.meta.url)),'run','--config',config],{encoding:'utf8',timeout:60000});
 const buggy=run();
 if(buggy.status!==1||!buggy.stdout.includes(`${cases.length} failed`))throw Error(buggy.stdout+buggy.stderr);
 if((buggy.stderr.match(/AssertionError:/g)||[]).length!==cases.length)throw Error('Export failed without the expected property assertion failures:\n'+buggy.stdout+buggy.stderr);
 console.log(`Captured buggy export: ${cases.length} actual assertion failures (expected).`);
 if(!/^const source = .*;$/m.test(original))throw Error('Captured source missing');
 await fs.writeFile(fixture,original.replace(/^const source = .*;$/m,()=>`const source = ${JSON.stringify(corrected)};`));
 const fixed=run();
 if(fixed.status!==0||!fixed.stdout.includes(`${cases.length} passed`))throw Error(fixed.stdout+fixed.stderr);
 console.log(`Corrected source: ${cases.length} tests passed. Original download unchanged. QA_DIR=${path.dirname(input)}`);
}finally{
 for(const file of [fixture,config])await fs.unlink(file).catch(()=>{});
}
