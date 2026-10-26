# Submission readiness

Latest audit: [FINAL_QA_REPORT.md](FINAL_QA_REPORT.md). The final application has 29 passing unit tests and a verified generated-rounding demo. The submission still needs the manual materials below. Per the latest user instruction, GitHub visibility was left unchanged and audited fixes were not pushed.

Checked 26 October 2026 from the standalone Wispr challenge project.

## Application: ready for demonstration

- Public demo: https://rulerun-lite.vercel.app (complete browser workflow rechecked without sign-in).
- Clean locked dependency install; npm audit reported zero vulnerabilities.
- 12 unit tests, TypeScript check and production build passed.
- Local production server and public deployment passed the browser workflow: real failing inputs, corrected rerun, stale export protection, copy/download, reset, invalid-output errors, duplicate/disabled rules, and mobile layout. No browser page errors.
- Exact downloaded regression: two failures with captured buggy source, two passes after replacing only the function with its correction.
- Screenshots inspected at 1440 x 1100 and 390 x 844; no mobile horizontal overflow.
- Browser plugin not available; existing Playwright workflow used installed Chrome. Microphone hardware and Wispr usage were not verified.
- No old RuleRun Node server or listener on ports 3107/3108 was found. Fresh production server started on 3107.

## Submission package: user materials still needed

The official challenge asks for a working project link, a video of up to two minutes, a Wispr Insights usage-card screenshot, and a few lines on the problem, audience and Wispr usage. Deadline: **31 October 2026, 11:59 pm IST**. This is a solo challenge.

- [x] Working public project link.
- [ ] Record and upload a demo video of up to two minutes.
- [ ] Add a real screenshot of your Wispr Flow Insights usage card.
- [ ] Describe your actual Wispr-assisted build process; browser dictation alone does not establish Wispr usage.
- [ ] Confirm registration and submit the materials through the challenge website.

Source: https://www.wemakedevs.org/wispr (Submission and FAQ sections), checked 26 October 2026.

## Suggested demo sequence

1. Explain the problem: turning behavioral requirements into reproducible examples takes time.
2. Show the buggy function and four explicitly reviewed executable rules. If available, demonstrate real Wispr dictation into the requirements field; explain that prose is notes and rule selection is manual.
3. Run checks and show the actual `discount(0, 100) = -100` counterexample.
4. Download the regression test and show the repair prompt.
5. Load the predefined corrected sample and rerun the same rules: four properties pass.
6. Mention the boundary: one pure JavaScript function, two numeric inputs, isolated browser execution, bounded tests rather than a proof.

No submission has been sent by this verification process.
