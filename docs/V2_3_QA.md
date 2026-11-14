# YESIF V2.3 QA

## Baseline and staged checks

- Baseline `c78be7e3b58b372f22a3b4f95d97100b3f29691b`: clean tree, 80/80 tests passed, 20.38s.
- Rollback branch: `codex/yesif-v2-2-rollback` at that exact SHA.
- Block 05 checkpoint: `46c0629` — 87/87 tests passed, 29.80s; typecheck and whitespace check passed. Allocator unchanged.
- Block 06: 11 causal tests then 4 UI tests were added; targeted 15/15 passed in 4.56s. A further practice-attribution test was added before the final clean gate. Final suite: 103 tests in 11 files (80 baseline + 7 schedule + 12 causal + 4 causal UI).
- During development a CSS percentage comparison was corrected to numerical tolerance (33.33333333333333 versus 33.333333333333336), a keyboard test was updated for the new focusable evidence disclosure, and a textarea assertion was corrected to compare its value. Mathematical expected results were not relaxed. One complete-suite run timed out in the long V2.2 combined-scope UI journey at 5.283s; the unchanged test passed on the next full run (103/103, 28.20s). Its timeout was then raised from 5s to 10s to tolerate shared-host load; all interactions and assertions remain. The final run below includes that timeout change and an explicit agreement requirement even for fitting requests.

## Final release gate

Commands: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`. Exact final results and deployment proof are recorded below after execution.

The unchanged 500 generated engine cases and 1,000 allocation witnesses remain. New independent evidence: 500 causal scenarios and verified alternatives; 60 rendered allocation witnesses; exact A–F schedule cases; A–I causal cases; keyboard, state reset, storage compatibility and eight-commitment UI checks.

## Real browser review

44 measured state/width combinations in `artifacts/v2.3/browser-metrics.json`; all have `scrollWidth <= clientWidth`. Actual PNGs were emitted and visually inspected, not just measured.

Seven states at all six widths (375, 390, 768, 900, 1280, 1440): two different reference schedules, preexisting Tuesday conflict, impossible proposal with separate evidence, fits 10/15 allocation, new-request early conflict, interactive scope simulation, and combined reserve/quarter-hour/zero-day/long-name case. Selected proposal from an eight-commitment custom scenario additionally checked at 375/900. One real V2.2 before screenshot is retained.

Browser interactions confirmed: Tuesday attribution and report-focused proposal; 7h request reduced to 6h at Tuesday produces 11/15 and a changed EDF map; long task selection highlights its actual task ID; 0h Monday, 1h Tuesday reserve, two 0.25h tasks give 0.5h assigned / 11h usable and 10.5h unassigned; eight negotiable commitments produce three checked options and a selected 10.5/11 proposal. The chosen schedule excludes the two deferred IDs and keeps their obligations visible. Console error log at end: empty.

Captures are bounded 1,200px clips, not full-page screenshots. Some mobile clips omit the very top/bottom of a long section after reflow; semantic values and overflow were checked separately. Eight-task legends can still be tall. Screenshot artifacts demonstrate layout, not user comprehension or business value.

## Accessibility and preserved scope

Native buttons, summaries, accessible per-day text, a textual legend, non-color task codes, 44px task targets, visible-focus CSS and reduced-motion overrides are preserved. Automated keyboard tests pass. Native browser Tab delivery did not move focus in the test harness; native keyboard and screen-reader verification remain incomplete. Reduced-motion CSS and existing tests were inspected; no OS-level emulation or full WCAG audit is claimed.

No changes to `engine.ts`, `allocation.ts`, `options.ts`, storage modules, App routing, Landing, Workload, package dependencies or deploy workflow. Browser work did not save or delete customer records. Existing stored messages and agreement states remain readable and unchanged. ShiftMargin was not modified.

## Deferred / risks

Earliest starts, dependencies, multi-week planning, calendar integrations, automatic deadline transfers, AI coaching, full Skills redesign, Plus changes and payments remain out of scope. Demand and payment validation remain unproven. Human comprehension/timing retest and a native accessibility audit remain pending. The English PDF pitch deck was not created; it remains a competition deliverable outside this task.

## Executed final results

- `npm ci`: success, 109 packages installed in 7s; dependency manifests unchanged.
- `npm run typecheck`: success.
- `npm test`: **103/103 passed, 11/11 files**, 29.80s (final source, including explicit agreement metadata and the 10s UI-journey allowance).
- `npm run build`: success, 1.13s Vite phase. CSS `index-Dj8_rAtS.css` (51.52 kB); JS `index-Chp9quFt.js` (301.93 kB).
- `git diff --check`: success.
- Protected-path diff against V2.2: empty for engine, allocator, options, storage, App, Landing, Workload, dependency manifests and deploy workflow.
- 45 screenshots: one before plus 44 after; 44 browser width measurements, no overflow.

CI run, published SHA and the public-site smoke check are reported with the final release. A local pass is not presented as deployment proof.
