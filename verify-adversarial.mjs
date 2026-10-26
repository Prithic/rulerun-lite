import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const qa=path.resolve(process.env.QA_DIR||'.');
await fs.mkdir(qa,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
const context=await browser.newContext({viewport:{width:1440,height:1100},permissions:['clipboard-read','clipboard-write']});
await context.addInitScript(()=>{
 window.__qaWorkers=0;
 const Native=window.Worker;
 window.Worker=class extends Native{
  constructor(...args){super(...args);this.live=true;window.__qaWorkers++;}
  terminate(){if(this.live){this.live=false;window.__qaWorkers--;}return super.terminate();}
 };
});
const page=await context.newPage(),errors=[],warnings=[],requests=[],badResponses=[];
page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(['error','warning'].includes(m.type()))warnings.push(m.text());});
page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
const response=await page.goto(process.env.DEMO_URL||'http://localhost:3107');
expect(response.status()).toBe(200);
await expect(page).toHaveTitle(/RuleRun Lite/);
await expect(page.getByRole('heading',{level:1})).toContainText('Find what breaks.');
const reset=()=>page.getByRole('button',{name:'Reset demo'}).click();
const run=()=>page.getByRole('button',{name:/^Run checks/}).click();
const source=page.getByRole('textbox',{name:'JavaScript function'});
await run();
await expect(page.getByRole('status')).toContainText('2 properties violated');
await expect(page.locator('.property-result').nth(1)).toContainText('200 cases executed');
await expect(page.locator('.property-result').nth(3)).toContainText('200 cases executed');
await page.getByRole('combobox',{name:'Property for rule 1'}).selectOption('upperBound');
await expect(page.getByRole('status')).toContainText('Inputs changed');
await expect(page.getByRole('button',{name:'Copy test',exact:true})).toBeDisabled();
await reset();
const invalid=[
 ['',/Provide one function/],
 ['function discount(price, percent) {',/expect|syntax|token/i],
 ['function discount(other) { return 0; }',/Provide one function/],
 ['async function discount(price, percent) { return 0; }',/Provide one function/],
 ['function discount(price, percent) { throw Error("audit exception"); }',/audit exception/],
 ...['Promise.resolve(0)','NaN','Infinity','-Infinity'].map(v=>[`function discount(price, percent) { return ${v}; }`,/finite number/]),
 ['function discount(price, percent) { Number.isFinite=()=>true; return Infinity; }',/finite number/],
 ['function discount(price, percent) { globalThis.calls=(globalThis.calls||0)+1; return globalThis.calls===1?-1:price; }',/deterministic/],
 ['function discount(price, percent) { while(true){} }',/interrupted|limit/i],
 ['function discount(price, percent) { return discount(price, percent); }',/stack|overflow/i],
 ['function discount(price, percent) { const a=[]; while(true) a.push(new Array(10000).fill(1)); }',/memory|alloc|interrupted/i],
];
for(const [code,message] of invalid){
 await source.fill(code);await run();
 await expect(page.getByRole('region',{name:'Execution results'}).getByRole('alert')).toContainText(message,{timeout:15000});
 expect(await page.evaluate(()=>window.__qaWorkers)).toBe(0);
}
await source.fill('function discount(price, percent) { while(true){} }');await run();await reset();
expect(await page.evaluate(()=>window.__qaWorkers)).toBe(0);
await expect(page.getByRole('status')).toContainText('Your next counterexample');
await run();await expect(page.getByRole('status')).toContainText('2 properties violated');
expect(await page.evaluate(()=>window.__qaWorkers)).toBe(0);

// A correct concrete call must never be displayed as a failed counterexample.
await source.fill('function discount(price, percent) { return price * (1 - percent / 100); }');await run();
await expect(page.getByRole('status')).toContainText('All enabled properties passed');
await expect(page.locator('.function-call')).toHaveCount(0);

await page.getByRole('combobox',{name:'Demo',exact:true}).selectOption('rounding');await run();
await expect(page.getByRole('status')).toContainText('properties violated');
await page.locator('.property-result').filter({hasText:'A 0% discount preserves the price'}).click();
const call=await page.locator('.function-call').innerText();
const observed=Number(await page.locator('.observation strong').innerText());
const price=Number(call.match(/discount\((.*),/)[1]);
expect(price%1).not.toBe(0);expect(observed).toBe(Math.round(price));expect(Math.abs(observed-price)).toBeGreaterThan(1e-7);
await fs.mkdir(path.join(qa,'rounding'),{recursive:true});
let download=page.waitForEvent('download');await page.getByRole('button',{name:'Export .test.ts'}).click();await(await download).saveAs(path.join(qa,'rounding','discount.regression.test.ts'));
await page.screenshot({path:path.join(qa,'rounding.png'),fullPage:true});
await page.getByRole('button',{name:'Load corrected sample',exact:true}).click();
await expect(page.getByRole('button',{name:'Export .test.ts'})).toBeDisabled();
await run();await expect(page.getByRole('status')).toContainText('All enabled properties passed');

// Trailing line comments must survive serialization and execution in exported tests.
await reset();await source.fill('function discount(price, percent) { return price - percent; }\n// trailing comment');await run();
await expect(page.getByRole('status')).toContainText('2 properties violated');
await fs.mkdir(path.join(qa,'comment'),{recursive:true});
download=page.waitForEvent('download');await page.getByRole('button',{name:'Export .test.ts'}).click();await(await download).saveAs(path.join(qa,'comment','discount.regression.test.ts'));

// Observe the network while editing private text and executing/exporting it.
const start=requests.length;
await source.fill('function discount(price, percent) { /* RULERUN_QA_PRIVATE_SENTINEL */ return price - percent; }');
await page.getByRole('textbox',{name:'Your requirements'}).fill('RULERUN_QA_PRIVATE_SENTINEL typed requirements');
await run();await expect(page.getByRole('status')).toContainText('2 properties violated');
await page.getByRole('button',{name:'Copy test',exact:true}).click();
const workflowRequests=requests.slice(start);
expect(workflowRequests.some(r=>JSON.stringify(r).includes('RULERUN_QA_PRIVATE_SENTINEL'))).toBe(false);
expect(workflowRequests.filter(r=>r.method!=='GET')).toEqual([]);

const viewports=[];
for(const [width,height] of [[1440,1100],[1280,800],[768,1024],[390,844]]){
 await page.setViewportSize({width,height});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await expect(page.getByRole('button',{name:'Run checks again'})).toBeVisible();
 await page.screenshot({path:path.join(qa,`viewport-${width}.png`),fullPage:true});
 viewports.push(`${width}x${height}`);
}
await source.focus();await page.keyboard.press('Tab');
expect(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle)).not.toBe('none');
// Exercise unavailable/denied microphone handling without recording real audio.
await page.evaluate(()=>{Object.defineProperty(window,'SpeechRecognition',{value:undefined,configurable:true});Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined,configurable:true});});
await page.getByRole('button',{name:'Dictate',exact:true}).click();
await expect(page.locator('.notice')).toContainText('unavailable');
await page.evaluate(()=>{window.SpeechRecognition=class{start(){this.onerror?.({error:'not-allowed'});}stop(){this.onend?.();}};});
await page.getByRole('button',{name:'Dictate',exact:true}).click();
await expect(page.locator('.notice')).toContainText('not-allowed');
await expect(page.getByRole('textbox',{name:'Your requirements'})).toBeEditable();
expect(errors).toEqual([]);
const unexpectedWarnings=warnings.filter(m=>!/Aborted\(Assertion failed: list_empty/.test(m));
if(unexpectedWarnings.length)console.log(JSON.stringify({unexpectedWarnings,badResponses}));
expect(unexpectedWarnings).toEqual([]);
console.log(JSON.stringify({url:page.url(),title:await page.title(),invalidCases:invalid.length,viewports,rounding:{price,observed,call},workerCleanup:'completion/error/reset verified',workflowRequests,pageErrors:errors,consoleWarnings:warnings,unexpectedWarnings,microphone:'unavailable/denied fault injection only; no hardware test'}));
}finally{await browser.close();}
