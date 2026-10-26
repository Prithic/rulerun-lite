import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
const original=await fs.readFile('discount.regression.test.ts','utf8');
await fs.writeFile('export-check.config.ts',"import {defineConfig} from 'vitest/config';export default defineConfig({test:{include:['discount.regression.test.ts']}});");
try{
const buggy=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','--config','export-check.config.ts'],{encoding:'utf8'});
console.log('Captured buggy export exit:',buggy.status);if(buggy.status!==1||!buggy.stdout.includes('2 failed'))throw Error(buggy.stdout+buggy.stderr);
await fs.writeFile('discount.regression.test.ts',original.replace('return price - percent;','return price * (1 - percent / 100);'));
const fixed=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','--config','export-check.config.ts'],{encoding:'utf8'});
console.log(fixed.stdout);if(fixed.status!==0||!fixed.stdout.includes('2 passed'))throw Error(fixed.stdout+fixed.stderr);
console.log('Verified downloaded regression: fails on captured bug, passes on correction.');
}finally{await fs.writeFile('discount.regression.test.ts',original);await fs.unlink('export-check.config.ts');}
