# V2.4 QA record

Baseline: clean main at `171b1d0cc1c645f5ecf58e186ab35e3025252ce0`; 103/103 tests passed in 28.62s. Rollback branch: `codex/yesif-v2-3-rollback`. Release work: `codex/yesif-v2-4-negotiation`.

## Final local gate

Executed sequentially: `npm ci && npm run typecheck && npm test && npm run build && git diff --check`.

- Clean install: 109 packages, successful.
- Typecheck: successful.
- Vitest: **118/118 tests, 13/13 files, 31.23s**. All 103 baseline tests retained; 15 new tests.
- Production build: successful, Vite 1.20s. JS `index-DwCEn4sI.js` 316.52 kB / 95.81 kB gzip; CSS `index-B5CbUPt4.css` 53.83 kB / 11.11 kB gzip.
- Whitespace check: successful.

Existing 500 engine, 1,000 allocation and 500 causal randomized cases are preserved. New communication tests include 200 independently checked deadline-prefix cases, all practice paths, actual evidence-quote membership, uncredited missing criteria, comparable answer lengths, fresh recalculation, quarter-hour scope, combined conditions and refusal of an early deferral. Cutting Friday work is not accepted as repairing a Tuesday conflict. New UI tests cover connected practice, back/retry/skip, editor preservation, explicit scope update, guarded plan changes, keyboard focus and persistence.

Development failures were corrected before the final gate: stale UI labels, an unsupported asymmetric textarea assertion, duplicated scope props, and an incorrect separator in the independent membership oracle. Two full runs hit the existing 5s timeout in the long reset/draft/remount test (5.199s and 5.222s); the isolated suite passed 19/19. Only that test's timeout increased to 10s, without changing assertions. The final full suite passed.

## Real browser checks

Actual in-app browser, local Vite `/yesif/`, six requested widths: **375, 390, 768, 900, 1280, 1440**, height 1100. [48 measured state/width combinations](../artifacts/v2.4/browser-metrics.json); all have document scroll width equal to client width. The scrollbar reduces client width by 15px in these captures.

| State | Checked behavior | 900px screenshot |
| --- | --- | --- |
| Deferral step 1 | 13/15; conditional short draft; plausible comparable replies | [Practice](../artifacts/v2.4/deferral-step1-900.png) |
| Deferral step 2 | First unchecked answer changes pushback; conditional repair and quoted feedback | [Feedback](../artifacts/v2.4/deferral-step2-feedback-900.png) |
| Reduced scope | 2h of 5h; explicit five-slide description; draft application | [Proposal](../artifacts/v2.4/scope-proposal-900.png) |
| Scope completion | Acknowledgement then grounded follow-up; recap of both decisions | [Recap](../artifacts/v2.4/scope-complete-900.png) |
| Fits | 10/15; confirm scope; extra work stays unestimated | [Fits](../artifacts/v2.4/fits-proposal-900.png) |
| Tuesday evidence | 7h report / 6h Tuesday capacity despite 8/15 weekly; real contributors | [Evidence](../artifacts/v2.4/tuesday-evidence-900.png) |
| Mixed conflict | 17/15; existing Tuesday deficit plus later request pressure; recheck all dates | [Mixed](../artifacts/v2.4/mixed-step2-900.png) |
| Early deferral | Refused move of Tuesday report targets Tuesday deadline/time, not Friday scope | [Early deadline](../artifacts/v2.4/early-deferral-900.png) |

Each state has the same six width-named PNGs in `artifacts/v2.4/` (48 captures), plus one initial review capture. These are real bounded browser clips, not mockups or complete-page captures. Long mobile evidence/feedback continues below the 1100px clip. Minor top-edge clipping from browser reflow does not mean the full page was inspected in one image. Mobile reply buttons in the final early-deferral state are 123–146px tall with 22–23 words, not one conspicuously large answer. Comparable wording and layout do not establish that users find the exercise difficult or useful.

Copy was verified against the browser clipboard. Manual text remained byte-for-byte unchanged through practice, completion, retry and skip. Explicit scope application after manual editing opened the guard; Cancel preserved the text. A saved local QA decision reopened with both its exact message and scope description. Back/changed first reply cleared the previous second reply. Final browser error log was empty.

The clean install stopped the original dev server, leaving one browser tab with previously loaded code. After restarting the host server, a fresh tab restored the explicit QA draft and rechecked the final early-deferral correction; all six corresponding screenshots were replaced from fresh code. No stale screenshot is used to claim that edge-case fix.

## Compatibility and boundaries

Automated fixtures exercise V1, V2 and V2.3 notebook-v1 data, including entries with and without scope descriptions, notes/outcomes and manually edited messages. Reads preserve original serialized storage; no migration or schema change. Explicit draft recovery preserves scope and message. Browser recovery also passed for the newly saved QA decision and draft.

Engine, allocator, options, conflict classification, storage modules, Landing, Workload, dependencies and deployment workflow have no changes. No pricing, paywall, backend, analytics or ShiftMargin work. Changed production files: `App.tsx`, `Proposal.tsx`, `NegotiationPractice.tsx`, `conversation.ts`, `practice.ts`, and scoped additions to `styles.css`.

Native browser Enter delivery moved focus but did not reliably activate controls. Automated user-event Tab/Enter and focus checks pass; **native keyboard and full screen-reader QA remain incomplete**. Existing reduced-motion CSS is preserved; no new animation was added, but OS-level reduced-motion emulation was not performed. No WCAG certification or human comprehension/time-to-result claim.

Full Block 07, Block 09 and Block 10 remain deferred. Skill improvement, retention, demand and paid value are unproven. No PDF pitch deck.

## Release procedure

Commit only this release, push the feature and rollback branches, fast-forward main, and require both GitHub Actions verification and Pages deployment success. Verify the public app and built asset hashes after deployment. Record the resulting commit SHA and CI URL in the delivery report. Restore the rollback through a reviewed revert/new commit and a successful deployment; never force-push over subsequent work.
