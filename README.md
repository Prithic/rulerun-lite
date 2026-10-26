# RuleRun Lite

**Speak the rule. Find what breaks.** A small, real property-testing workbench built with Next.js App Router, TypeScript, Tailwind, Zod, fast-check and QuickJS WebAssembly. No account, API key, database, model request, or external configuration is needed.

[Live demo](https://rulerun-lite.vercel.app) · [Submission checklist](docs/SUBMISSION.md)

## Run

Use Node.js 22 or newer. From this folder:

```sh
npm ci
npm run dev
```

Open http://localhost:3107. For production: `npm run build` then `npm start`.

## Try the complete workflow

1. The buggy `discount(price, percent)` function and four rules load automatically.
2. Type requirements, dictate with a supported browser, or use Wispr/device keyboard dictation in the requirements field. Notes are not automatically translated into properties. Review, select, and enable supported executable rules explicitly.
3. Run checks. The real engine finds `discount(0, 100) === -100`, violating non-negativity and the full-discount property. No output is precomputed or displayed before execution.
4. Select any result to inspect its input, required condition, observed output, seed and replay path. Copy a repair prompt, copy a regression test, or download `discount.regression.test.ts`.
5. Load the corrected sample. Previous results become stale and export is disabled. Run again: the same enabled rules and seed execute against the corrected source.

The corrected sample is a predefined teaching example loaded only by an explicit button; no automatic repair occurs. Edits are kept in memory only. Reset restores the demo.

## Supported contract and limits

- One synchronous pure JavaScript function expression: `function discount(price, percent) { ... }` or `(price, percent) => ...`. No exports, imports, files, repository access, or module dependencies.
- Two finite numeric inputs: price **0–10,000** in 0.01 steps, percent **0–100** in 0.01 steps. Negative prices, percentages outside this range, objects, strings, arrays, async functions, DOM and I/O are outside scope.
- Return a finite number. Exceptions, promises, NaN, Infinity, invalid syntax, unsupported source, duplicate rules and zero enabled rules produce errors, never success.
- Four reviewed templates: non-negative output; 0% identity; 100% zero; output bounded by original price. Equality and upper bound use absolute tolerance `1e-7`; non-negativity is strict. Rules can be enabled/disabled and changed through the selectors. Each kind must be unique.
- Every enabled property uses fast-check with fixed seed **20261026**, a 200-run budget including fixed boundary examples and deterministic generated integer-backed decimal inputs. Checks stop and shrink on failure, so failed properties execute fewer than 200 main runs; shrinking can execute additional calls. Results display the actual main-run count. Dependency versions are locked for replay stability.
- A passing bounded property run is evidence, not an exhaustive proof. Floating-point arithmetic applies. The function must be deterministic and free of side effects; arbitrary purity is not statically proven. Date and Math.random are disabled. Each input creates a new function closure; ambient mutation of QuickJS globals is outside the pure-function contract.
- Requirements text is intentionally separate from executable templates. Unsupported prose is never silently interpreted or claimed tested.

## Security boundaries

User source executes only inside **QuickJS compiled to WebAssembly in a disposable browser Web Worker**. There is no server execution endpoint, host eval, host Function constructor, model API or credential in the client. No network, module loader, filesystem, DOM or application host callbacks are installed in QuickJS. QuickJS's own eval cannot escape the VM into the host. Runtime memory is capped at 16 MiB, stack at 256 KiB, execution at approximately 3 seconds through an interrupt handler. A host watchdog terminates the worker after 8 seconds, including initialization. Source is capped at 12,000 characters; the worker is terminated after success or failure. An interrupted run discards partial results.

The browser must support WebAssembly and Workers. WebAssembly/engine/browser bugs remain part of the trusted computing base; keep dependencies maintained. These limits protect this constrained demo, not a general-purpose multi-tenant code execution service. No sensitive data should be embedded in test source. The app does not send function source or requirement text to a server.

Optional built-in dictation uses the browser SpeechRecognition API and may send **audio** to that browser vendor's recognition service; the UI explains this before results. Denied permission, absent support, and recognition errors leave typing and external keyboard dictation available. Hardware microphone input is not covered by automated checks. No Wispr API integration or affiliation is implied.

## Regression export

The exported file is standalone Vitest TypeScript with concrete discovered inputs and the captured source as a string. It executes the subject inside QuickJS, never directly in Node. Install the packages listed at the top of the exported file and run its provided Vitest command. The captured buggy source is expected to fail. Replace `source` with your corrected function and rerun. Exports contain only the properties for which real counterexamples were discovered; passing properties do not fabricate regression inputs. Use the app to rerun the full generated suite. Copy/export is disabled for stale results.

## Verify

```sh
npm test
npm run typecheck
npm run build
```

`verify-ui.mjs` exercises the real browser path with installed Chrome: buggy run, four properties, corrected rerun, stale export blocking, clipboard, downloaded regression, reset, invalid output, disabled/duplicate rules, typed requirements and mobile overflow. Run with a local server: `DEMO_URL=http://localhost:3107 node verify-ui.mjs` (PowerShell: `$env:DEMO_URL='http://localhost:3107'; node verify-ui.mjs`). It creates local QA screenshots and a downloaded test. `node verify-export.mjs` then checks that this exact downloaded export fails on the bug and passes with corrected source. Test configuration keeps these intentional failing export files out of `npm test`.

Set `QA_DIR` to an absolute folder outside the repository to keep browser screenshots and the downloaded test out of source control. The browser script defaults to port 3107, matching `npm start`. The export verifier reads the downloaded test from its working directory and needs access to this project's installed dependencies.

## Architecture and future extraction

- `src/lib/rules.ts`: Zod contract, template labels, predicates and demos.
- `src/lib/engine.ts`: deterministic generation, isolated execution, result model; shared by browser worker and unit tests.
- `src/lib/client-runner.ts` / `runner.worker.ts`: worker lifecycle and watchdog.
- `src/lib/export.ts`: regression and repair-prompt generation from immutable run snapshots.
- `src/app`: responsive workbench and explicit stale/current run state.

A future server-side extraction adapter can return `Rule[]` validated by `rulesSchema`, shown for human review before it updates editor state. It must never generate test results or execute supplied source. No model package, route, key or dependency is included now.

## Vercel

Import or deploy **this repository**. Framework: Next.js. Install: `npm ci`. Build: `npm run build`. No environment variables are needed. `vercel.json` records these settings. The WebAssembly binary is embedded in the browser variant, avoiding runtime remote Wasm downloads and filesystem assumptions. Test the deployed URL with `DEMO_URL` before sharing it with judges; public access must be verified independently of local build success.
