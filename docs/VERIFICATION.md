# RuleRun Lite verification

Verified on 26 October 2026. No model integration, API key, account or database is required.

## Delivered deployment

- Public URL: https://rulerun-lite.vercel.app
- Platform: Vercel, Next.js 16.4.3, production, **READY**.
- Deployment: `dpl_8FhgjnTgJz4BwCXv1fohEKAVYNnN`.
- Connected account/team: `haridharanesh-officials-projects`.
- Build completed in approximately 25 seconds. Source uploaded from the isolated `rulerun-lite` folder; no Git commit or parent challenge data was published.
- Public URL opened in the Codex in-app browser without sign-in. Buggy sample executed and displayed two property violations, input `[0, 100]`, observed `-100`. Corrected sample then actually executed, showing all four enabled properties passed, 200 cases each.

## Execution evidence

The first vertical slice was implemented and browser-verified before the full UI. A real QuickJS execution of `price - percent` returned `-100` for `[0, 100]`; fast-check reported failure of non-negativity. Only then were remaining rules and interface added.

`npm test`: **12 passed**. Coverage includes a real negative counterexample, fixed function satisfying all properties, invalid source, infinite loop interruption, missing host network bindings, promises/nonfinite output, deterministic replay, duplicate/all-disabled rules, syntax errors/exceptions, disallowed randomness, upper-bound defect and oversized source.

`npm run typecheck`: passed. `npm run build`: passed. Vercel independently installed the locked dependencies and built successfully.

The **exact browser-downloaded** regression test was executed with Vitest: **two failures** against captured buggy source, then **two passes** after replacing only the source with the corrected function. The failed assertions were the discovered non-negative and full-discount violations.

The complete `verify-ui.mjs` workflow passed against both local and public Vercel builds. It covered genuine counterexamples, four rules, corrected rerun, stale-result warnings and blocked exports, copying tests and repair prompts, downloading the test, reset, invalid numeric output, all-disabled and duplicate-rule errors, editing requirements, and mobile layout without horizontal overflow. Browser errors: **0**.

Microphone hardware/provider recognition was not exercised automatically. Native dictation remains browser-dependent; typed requirements and Wispr/device keyboard dictation work through the standard editable field. No claim of Wispr API integration is made.

## Visual verification

Design reference: `design-concept.png`, generated with the built-in Image Gen tool. Browser screenshots: `workbench-desktop.png`, `workbench-mobile.png`, `workbench-passed.png`.

Local IAB access timed out, so installed Chrome/Playwright was used for deterministic desktop/mobile screenshots and full interaction checks. Once deployed, IAB directly verified both failing and passing public runs. Native screenshot viewports: **1440 × 1100** and **390 × 844**. Screenshots were inspected with `view_image` alongside the concept.

Five comparison areas inspected: compact brand/reset header; headline typography and hierarchy; dark function editor beside white requirements/rules pane; indigo primary run action and restrained semantic result colors; result evidence and export controls. Spacing, mobile stacking, code overflow and readable counterexamples were also inspected. Mobile has no horizontal overflow. At shorter desktop heights the page scrolls vertically to preserve readable controls and result details.

Intentional changes from the generated reference: executable dropdown templates replace unrestricted prose rules; a property selector and tabs replace simultaneous evidence/code panels; seed is fixed rather than an editable field; result values come exclusively from execution rather than the mockup's illustrative content. There is no misleading automatic extraction action. Additional numbered labels, stale state, input-contract text and finite-output validation make the testing workflow explicit. The layout follows the reference's two-pane workbench direction, but is not claimed to be a pixel-identical reproduction.

No fake result fixtures feed the application. Passing bounded tests do not prove correctness outside the documented input domain. The README documents runtime limits, trusted components and future extraction boundaries.
