# RuleRun Lite — final adversarial QA

**Date:** 26 October 2026 (IST). **Overall application status: READY WITH KNOWN LIMITATIONS.**

The deployed software is ready for a judge to try. The competition submission is **not complete**: no demo video, Wispr usage card, or verified account of the builder's Wispr workflow was supplied for this audit. No submission was sent. These evidence gaps materially limit competitiveness; passing software tests cannot establish meaningful Wispr usage or guarantee an award.

## Release and repository safety

- Public application: https://rulerun-lite.vercel.app/ . Verified without authentication using real Chrome interactions, before and after this release.
- Audited application commit: `de6a19e8e5e4f5c0b6f5c8922ff64b1572bf156f` on local `main`.
- Production deployment: `dpl_9d1bmZdp4AQum8CEySFbJyPCFroH`, Vercel project `prj_JMVyTwCIqoKtraSbiIK1GN1joZ8T`, existing team `haridharanesh-officials-projects`. READY; public alias assigned. Build took about 28 seconds.
- Deployment used 18 necessary application/configuration files through the existing Vercel project. No Git metadata directory, credentials, QA screenshots, reports, or repository documentation was uploaded in this release payload. All **18 deployment source-file SHA1 identifiers matched local file SHA1s**, with no mismatches. A separate source-content response was truncated and was not used as proof of complete equality.
- Starting worktree was clean, remote `https://github.com/Prithic/rulerun-lite.git`, starting commit `e983fe7`. No user changes were reset, deleted, or overwritten. No history rewriting or force-push.
- GitHub inspection during this audit returned **`isPrivate: false`**, contradicting the initial private-repository description. The user explicitly chose **“Keep visibility unchanged; do not push.”** No visibility change or source push was performed in this audit. The deployed fixes exist in the local commit and on Vercel; GitHub is intentionally behind.

## Independently executed checks

Old verification claims were not treated as new evidence.

| Check | Baseline | Final outcome |
| --- | --- | --- |
| `npm ci` | First attempt failed with Windows EPERM on the loaded Next SWC native module | Stopped this project's previous server; retry installed 92 packages, audited 93, zero reported vulnerabilities |
| `npm test` | 12 tests passed | **29 tests passed across three files** |
| `npm run typecheck` | Passed | Passed |
| `npm run build` | Passed | Passed; static `/`, not-found and icon routes built |
| `verify-ui.mjs` | Local production and previous live deployment passed | Fresh local production and updated public alias passed |
| `verify-adversarial.mjs` | New targeted suite reproduced defects before fixes | Fresh local and updated public alias passed 14 invalid/resource cases, state/privacy checks and four viewports |
| `verify-export.mjs` | Exact previous-public download: two expected failures, then two passes | Six exact final downloads checked: local/live × default/rounding/trailing-comment; each had two expected failures, then two passes after replacing only source |

Environment: Windows, Node **22.20.0**, npm **10.9.3**, Next **16.4.3**, React **19.3.1**, fast-check **4.10.2**, QuickJS packages **0.32.0**, Zod **4.6.7**, Vitest **5.0.5**, Playwright **1.64.1**, installed headless Chrome. Vercel project uses Node 24.x and independently built the same locked dependencies. No dependencies were upgraded. Browser plugin was unavailable; the existing Playwright/Chrome workflow was used.

Three intentionally failing new unit regressions first reproduced unsupported-signature acceptance, finite-output validation bypass and an inconsistent counterexample. They passed after fixes. Initial browser-harness failures were also investigated: Next's route announcer made an unscoped alert locator ambiguous; the test now scopes to Execution results. An ESM/CommonJS resolution error in the revised export helper was fixed and rerun. A missing browser icon caused a 404; the app now supplies `icon.svg`.

### Browser evidence

On **both local production and final public production**:

- Correct page URL/title, meaningful heading and workbench; HTTP 200 without sign-in or API key. No framework error overlay or page exceptions.
- Default failure vector is exactly **non-negative: fail, zero identity: pass, full discount: fail, upper bound: pass**. Real evidence includes `discount(0, 100) = -100`. Passing rules report 200 main cases.
- Explicitly loaded corrected source passes all four rules. Corrected `discount(100, 10)` is 90 and is never presented as a failing example; the browser also asserts no counterexample is rendered for the all-passing run.
- Source edits, executable-rule edits and loading correction mark results stale; export/copy is disabled. Rerunning disables export until completion and labels retained results as previous results. Rule-result selection changes the evidence panel without changing the run.
- Reset during a real infinite-loop run terminates its worker immediately. A subsequent run succeeds; obsolete results cannot overwrite reset state. Workers terminate on completion, failure and reset.
- Empty/malformed/wrong-signature/async source, thrown errors, Promise, NaN, both infinities, guest finite-check tampering, stateful inconsistent results, infinite loops, recursion and memory exhaustion produce errors. The page remains usable. Oversized source and invalid rule values are additionally covered directly at the engine boundary; the UI caps source at 12,000 characters and rule selectors only offer valid values. No custom seed UI exists, so invalid-seed UI testing is not applicable.
- Existing suite verifies no enabled rules, duplicate rules, copy test, copy repair prompt, download, typing, corrected rerun and reset.
- Actual unavailable/denied speech-recognition error handling was exercised through browser API fault injection. **No microphone hardware, vendor recognition accuracy, or Wispr desktop dictation was tested.**

Normal judge workflow: **zero page exceptions**. Adversarial workflow: zero page exceptions and zero unexpected console warnings. Deliberate recursion exhaustion produces one QuickJS `JS_FreeRuntime` assertion diagnostic in the console in both environments. It is documented, not counted as a clean console: the original useful execution error is preserved, the guest worker is terminated, and subsequent checks work. This dependency diagnostic remains a limitation; no escape or persistent UI failure was observed.

QA artifacts are outside the repository at:

`C:\Users\prith\.codex\visualizations\2026\10\26\01a1783b-b5d2-7042-b687-7837adc751aa\`

Subdirectories: `audit-baseline-local`, `audit-baseline-live`, `audit-final-local`, `audit-final-live`. Final directories contain desktop/mobile/pass screenshots, four viewport screenshots, rounding evidence and exact downloads under `rounding/` and `comment/`.

## Defects fixed

1. **Unsupported function signature accepted:** named-function validation previously checked only the function name/open parenthesis. It now requires the documented two parameters, or the supported two-parameter arrow form.
2. **Guest intrinsic tampering bypassed finite-output errors:** submitted code could replace guest `Number.isFinite`, returning Infinity as a property violation rather than an invalid-output error. Numeric finiteness is now checked in trusted host code outside QuickJS.
3. **False counterexample presentation for stateful code:** a function returning a negative value only on its first global invocation produced a failed result with a later observed value of zero. The final observation is now checked against the actual rule; a passing observation rejects the run as non-deterministic instead of being shown as a counterexample. This does not prove purity for arbitrary code.
4. **Export execution mismatch:** trailing source line comments could swallow the appended invocation. Export adds a separating newline, mirrors Date/random restrictions, records discovery paths and pins installation versions. Captured source remains JSON-escaped data and executes only inside QuickJS.
5. **Export helper directory/dependency mismatch:** it now reads `QA_DIR`, resolves ESM dependencies from the project, runs a temporary copy, derives expected case counts from the export and leaves the original download unchanged. No junction or manually copied helper is needed.
6. **Worker lifecycle gap:** reset previously ignored eventual results but left the old worker running until completion/watchdog. Abort now terminates it immediately; unmount, startup errors, message errors and postMessage exceptions also clean up.
7. **Resource error obscured by disposal failure:** explicit handle cleanup and preservation of the original execution failure prevent a secondary disposal error from replacing the useful user error. Low-level abort messages are normalized at the worker boundary. The underlying recursion diagnostic is retained as a known limitation above.

## Property-testing audit

Each enabled property uses real QuickJS execution inside fast-check. Prices are integer cents divided by 100, from 0 through 10,000. General percentages are integer hundredths divided by 100, from 0 through 100; zero/full-discount rules fix percent to 0/100 respectively. Each rule uses its own 200-main-case budget and fixed seed **20261026**.

The explicit examples are included in that budget, not added on top: a separate invocation-count test verifies 200 actual predicate calls for a successful 200-run property with supplied examples. On failure, fast-check stops and shrinks. `numRuns` is a main-case count, not total VM invocations: shrinking, initial source validation and final observation reruns are additional work. The UI does not claim its count includes shrinking.

Predicates are host-side; equality and upper-bound tolerances are consistently `1e-7`, while non-negativity is strict. Exceptions/timeouts/invalid outputs reject the whole run; partial success is not displayed. Zod rejects empty/unknown/malformed/duplicate/all-disabled rules. Changing source/rules makes snapshots stale.

The second preloaded scenario rounds the computed discount to whole dollars. Mathematically, with percent 0 and price 0.01 it returns `round(0.01) = 0`, violating identity by 0.01. Identity boundary examples `(0,0)` and `(100,0)` pass; the unit test verifies discovery occurs after those cases, and replays the final input using the same property, seed and reported fast-check path. Browser execution independently discovers **`discount(0.01, 0) = 0`**. It also finds an upper-bound defect for fractional prices. No failing output is loaded by selecting the scenario.

Repeated runs of the default source reproduce identical result objects apart from timing. Replay paths require the same property, generator order, explicit examples and locked fast-check version. Exports replay concrete inputs directly; they are not a full generated property suite. Neither bounded success nor this audit proves correctness for every input.

## Security and privacy

Source review traced `page.tsx → client-runner.ts → runner.worker.ts → engine.ts → QuickJS`. Supplied JavaScript has no installed host callbacks, module loader, network, DOM, filesystem or process capabilities. No server evaluation route, model route, host eval or host Function execution of submitted code was found. React renders source/results as text; exported source is JSON-escaped. No API key is needed.

Actual loop/recursion/allocation checks exercise guest interrupt/stack/memory failures. The engine sets a 16 MiB guest runtime limit, 256 KiB stack limit and approximately three-second interrupt deadline; the browser runner has an eight-second host watchdog. Separate fake-timer lifecycle tests cover stalled-worker watchdog, abort and error cleanup. The memory cap is **guest memory**, not a guarantee about total browser/process memory. Exported Node tests use QuickJS limits and Vitest's timeout, but do not have the browser's terminating Worker watchdog; use the browser application for arbitrary hostile experiments.

Browser network observation during source/requirements edits, test execution and copying an export saw only nine same-origin GET requests for worker chunks, with no source/requirements marker in request URLs or bodies and no POST. These observations plus source review support “Runs locally. Stays yours.” and “no code sent to a server” for the function-testing workflow. Optional speech recognition may send audio to the browser vendor; the UI notice states this. This is not an all-audio-local claim, nor a direct Wispr API integration.

No credential material was found in reviewed project source. A known-token/private-key pattern scan of the built client JavaScript returned zero matches; it is not a proof against every possible secret format. App implementation is necessarily bundled for browsers; unrelated repository documents, Git contents and credentials were not in the deployment payload. Wasm, QuickJS, browser and dependency internals remain trusted components; they were not exhaustively audited.

Codex Security scan `a4cbfdba-9ddf-4c1f-9f7b-0581d5720ef2` completed with zero reportable vulnerabilities after independent baseline/architecture review. **Qualification:** the host registered starting revision `e983fe7` and warned that the working tree changed during the scan. That static report is supporting evidence, not immutable final-release attestation. The browser/resource/source-hash checks above refer to the final release.

Security artifact: `C:\Users\prith\.codex\state\plugins\codex-security\scans\Wispr-challenge\e983fe78c9c64b8a69a56ffddb47e1d317ab1539_20261026T131024Z_7x_ibvlh\report.md` . Its directory also contains canonical manifest, findings, coverage and threat model. Scan usage was host-aggregated across thread histories, so it is not a reliable incremental cost measurement for this audit.

## UX and accessibility

Visually inspected final production screenshots at **1440×1100, 1280×800, 768×1024 and 390×844**. No page horizontal overflow. Desktop action remains visible at 1280×800. Tablet/mobile stack vertically and require scrolling; this is intentional. Long source lines scroll inside the textarea rather than widening the page.

Three focused improvements preserve the design: accessible demo selector; darker secondary evidence/labels; selected-result `aria-pressed` plus explicit previous-run state and safer export availability. Helper/predicate text samples measured approximately **5.10:1** against white; the Demo label measured **6.36:1**. A browser keyboard check confirmed visible focus. Controls use native buttons/selects/checkboxes/textareas with accessible names; results use status and errors use alert announcements. Source is a simple textarea rather than a full IDE.

This is a targeted accessibility review, not a complete WCAG certification or screen-reader usability study. Small text and vertical mobile navigation remain usability tradeoffs. Manual notes are explicitly separate from executable rules; no automatic prose extraction is implied.

## Skeptical judge simulation

The following are **our provisional evidence-based scores**, not actual judging results or a win prediction. Weights were confirmed on the rendered official judging page.

| Criterion | Weight | Current evidenced score / 10 | Reason |
| --- | --- | --- | --- |
| Real problem in your work | 30% | **6.5** | Concrete developer task and reproducible defects; no supplied personal workflow story or measured time saving yet. Narrow discount-only contract limits everyday utility. |
| Meaningful Wispr usage | 30% | **0 evidenced** | No real usage card, recording or verified build narrative supplied. This means evidence is missing, not that no Wispr usage occurred. Browser speech recognition does not establish Wispr usage. |
| Functionality | 25% | **8.5** | Real generated checks, isolation, reproducible input, working exports and correction loop verified publicly. Constrained domain, finite samples and resource-diagnostic limitation prevent a perfect score. |
| Demo clarity | 15% | **0 evidenced for video** | App is clear and script is prepared, but the required recorded video was not supplied or reviewed. A script cannot substitute for the actual recording. |

An arithmetic total from these evidence-only scores would be **40.75/100**. It is a package-completeness illustration, not a forecast of judge scores. The largest opportunity is evidence for Wispr usage and the recording, not expanding the application.

1. **Five-second comprehension:** tagline and preloaded code/rules give a quick route to action; showing Run → concrete input immediately is clearer than starting with architecture.
2. **Try without setup:** yes, verified publicly, no login/key.
3. **Real execution:** yes; invalid code errors and exported assertions were independently executed.
4. **Distinction from asking an LLM for tests:** deterministic generated inputs, shrinking, actual observations, a replay path and runnable captured regressions. No model claim is trusted as an execution result. Do not claim it replaces a general testing framework.
5. **Useful reproducible result:** both the obvious subtraction failure and generated fractional rounding failure are real.
6. **Scope clear:** function editor and input contract state a pure two-numeric-argument surface; README supplies full limits. Explain this in the video.
7. **Could a judge call it too narrow or insufficiently voice-driven?** Yes. The engine is effectively a four-template discount workbench, and rule selection is manual. Voice input alone is not the core technical contribution.
8. **Most likely score reducer:** unverified Wispr building evidence, followed by the missing recorded narrative and personal relevance.
9. **Highest-value next action:** record an honest, short real workflow with genuine Wispr dictation and the generated rounding example, paired with the actual usage card. Stop feature expansion.

The official challenge requires building **using Wispr Flow**; it does not require a Wispr API integration inside the product. A useful product plus real evidence of how Flow was used to build it is the relevant distinction.

## Three remaining improvements, ranked

1. **Real Wispr evidence — very high impact, low software risk.** Supply an authentic Insights usage screenshot and specific truthful account of prompts/docs/follow-ups dictated during the build. Do not invent numbers or retrospectively imply unrecorded usage.
2. **Record and rehearse the 100-second demo — high impact, low software risk.** Use real public execution, show generated fractional discovery, correction and export; check the resulting video and link in an incognito session.
3. **Personal problem/result narrative — high impact, low risk.** Explain who uses it, one actual occasion behavioral requirements caused a testing gap, and the actual result observed here. Measure any time-saving claim before using it. Preserve the narrow documented scope rather than expanding into repositories/AI repair before submission.

## 100-second recording sequence

| Time | Actual action / narration goal |
| --- | --- |
| 0–5s | Show public RuleRun Lite with the rounding demo selected. State: “A zero-percent discount should preserve the price. This function rounds it.” |
| 5–20s | Use genuine Wispr Flow desktop dictation in the requirements field. State clearly that these are notes and the four reviewed properties below are what execute. If Flow is unavailable, pause and prepare a truthful recording; do not substitute browser recognition while calling it Wispr. |
| 20–35s | Click Run checks and wait for the real result. Point out that integer boundary cases are insufficient and generated fractional input exposes the defect. |
| 35–50s | Select zero identity; show actual `discount(0.01, 0)`, expected identity, output 0 and replay path. Narrate only what is present in the actual run. |
| 50–65s | Download the regression while the failure is current. Show the captured source and concrete input, without opening personal files or terminals containing credentials. |
| 65–85s | Load corrected sample, show stale export blocking, then rerun the same rules. Wait for all four actual passes before saying they passed. |
| 85–100s | Explain: one pure JavaScript function, bounded generated tests, browser-isolated execution; notes/rules stay manual. Finish with product name and public link. Include one truthful sentence on how Wispr helped your actual build. |

### Recording checklist

- [ ] Rehearse against https://rulerun-lite.vercel.app/ in the recording browser.
- [ ] Confirm actual Wispr desktop setup/microphone and recording permissions yourself.
- [ ] Enable do-not-disturb; close personal tabs and hide notifications, credentials and private files.
- [ ] Record only the intended app surface; no unrelated source/terminal/personal account panels.
- [ ] Show real clicks, wait for execution and keep duration 90–110 seconds, under the official two-minute maximum.
- [ ] Review the entire audio/video for claims, readability and personal-data exposure.
- [ ] Upload the video and confirm judges can open the link without requesting access.

### Submission checklist

- [x] Public working application without login/key.
- [x] Final local/live functional checks and exact exports verified.
- [x] Known scope/security limits documented.
- [x] Local audited code commit created; **no GitHub push per latest user instruction**.
- [ ] Confirm solo registration/eligibility in your own challenge account.
- [ ] Attach a real Wispr Insights usage card.
- [ ] Attach and review the actual demo video.
- [ ] Provide the personal problem, intended user, actual result and truthful Wispr build narrative.
- [ ] Review the completed form and submit yourself before **31 October 2026, 11:59 pm IST**.

Official sources checked 26 October 2026: [challenge, submission and FAQ](https://www.wemakedevs.org/wispr), [judging criteria](https://www.wemakedevs.org/wispr/judges). No hackathon submission, social post or message to another person was sent.
