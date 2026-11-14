# YESIF V2.5 release QA

## Baseline

Clean `main` at `44165f613237faeeae2dad24a007cb7cdfbc5e19`; no intervening changes or user edits. Rollback: `codex/yesif-v2-4-rollback`; development: `codex/yesif-v2-5-final-polish`. Baseline clean install, typecheck, **118/118 tests (13 files, 24.23s)**, production build (1.19s), whitespace check all successful. Existing source, persistence, V2.4 docs and deployment workflow inspected before implementation.

## Stage A — trust

- P0-A: FIXED. 7h Tuesday work plus 1h Tuesday request with 6h usable was described as existing work “over capacity”, despite 8/15 weekly. New text identifies the 1h existing + 1h added deadline deficits. A new Monday failure and independently failing Friday existing work are explicitly separate. No engine change.
- P0-B: FIXED. A conservative literal check announces a scope description absent from the editor; it does not evaluate paraphrases. Updating a saved/manual draft uses Save/Discard/Cancel; Cancel preserves exact text and scope.
- P0-C duplicate save: FIXED. Reselecting an identical saved option previously lost savedId and hit the Free limit. Semantic comparison includes actual inputs, selected conditions, exact scope and message; ignores generated IDs, object order and absent versus zero reserve. A match reopens its identity without writing or changing notes/outcome.
- Stage A gate: typecheck; **31/31 tests** in trust, V2.4 communication/UI and V2 flow suites (10.64s). Initial regression caught an overly broad scope-update guard; corrected so a fresh generated draft updates directly while manually edited or saved text remains protected. No baseline assertion weakened.

Further stage evidence and final release verification follow below.

## Stage B — current decision comparison

Block 07: FIXED in implementation and automated checks; final browser verification recorded later. Existing equal-weight responsive 1/2/3 cards remain, with named retained work, moved hours still owed and high-priority impact. Per-card disclosure contains every obligation, original versus selected scope, required agreement and all five recalculated deadlines. No changed option ranking, preference score or pricing gate. Existing zero-option renegotiation route preserved.

New `decisionTools.ts` recomputes all facts through the existing simulation; `DecisionFacts.tsx` renders factual evidence. `Results.tsx` exposes it without navigating away. Typecheck and **33/33 tests** across comparison, V2.2 results, integration and V2 flows passed (20.68s); three new comparison tests verify stale-cache rejection, combined agreements and rendered facts. A keyboard regression initially inserted the new disclosure before the existing map; restored the original map tab order without changing the baseline test.

## Stage C — repeat-use Kit tools

- Block 09: implemented truthful Free/Kit comparison only in Notebook. CTA: “Unlock free demo — no payment required.” $4.99 is explicitly proposed and unvalidated, one-time; no account, charge, subscription or renewal. Access resets on reload. Free core remains intact. Export stays available after the visit ends, along with opening/reusing existing records.
- Workspace: existing explicit open/reuse/delete/export paths extended, with 50-decision bound preserved and identical-save detection. No storage schema migration.
- Saved comparison: two explicit selectors, same-record selection disabled, fresh simulation for each snapshot. Inputs with different capacities/reserves, requests or commitments are disclosed, without ranking or invented gains.
- Playbook: Notebook → saved decision → Negotiation Playbook. Actual limiting prefix, conditional ask, unchanged work, open agreements, authored objection and grounded reply.
- Follow-up: Notebook → saved decision → Prepare a follow-up. Editable and copyable, source notes/outcome preserved; edited drafts survive internal navigation. Source changes show a notice and require explicit guarded regeneration. Temporary edits are not persisted across reload, as stated beside the editor; beforeunload warns.
- Brief: Notebook → saved decision → Decision Brief. Exact source request/commitments, original and revised deadline checks, conditions, approvals, owed work, user-recorded outcome and unverified message; copy and print actions. Print isolates one chosen brief; no PDF dependency.
- Additional confirmed practice defect: going Back then forward without changing the first choice retained the old second answer. Fixed by clearing it on Back, with an explicit regression.
- Focused Kit/matrix gate: **19/19 tests passed (12.06s)**. Initial full run: 140/146, with six interaction timeouts under worker contention, not failed numerical assertions. Closed Kit artifacts now render on demand; test concurrency capped at two workers, with original timeout limits and assertions retained. Final rerun results below.

## Stage D — final corrections and browser evidence

Confirmed during this release:

- Saved comparison was too long on mobile: the initial 375px comparison section measured 2,933px. Core request/priority/owed-hours/conditions now remain visible, with full obligation and weekday tables behind an explicit disclosure. The revised 375px DOM measured 1,644px. This is a size observation, **not** final visual signoff.
- Opening one saved artifact stretched the neighboring closed card. Saved cards now align to the start of their grid row. Final screenshot verification was blocked by capture timeouts.
- A deleted decision's temporary follow-up left a `beforeunload` warning behind. Confirmed deletion now clears only that record's follow-up state; Cancel retains its exact text and stored record. Added regression verifies the warning before editing/deletion and its removal after confirmed deletion. Focused Kit suite: **8/8 passed (19.98s)**.
- Singular retained-task wording now uses “Deadlines stay: …”.

### Actual browser actions, separate from automated tests

Used the in-app browser with production preview at `http://localhost:5178/yesif/`; no state injection. Before screenshots were captured from V2.4. Two records were actually saved through the V2.4 UI, then recovered in V2.5. Outcome and notes also survived a subsequent fresh load. Demo access reset, all records remained readable, and Export remained available in Free.

Verified through browser interactions and current DOM:

- Original overload 18/15 exposes report deferral 13/15 (2h unassigned) and scope reduction 15/15 (0h unassigned). Fits route shows 10/15 and a confirmation action.
- Combined-input case 19/15 exposes reduce-to-2h and move-report-plus-reduce-to-4h. Both conditions and owed hours are present.
- Fixed 7h Tuesday work plus new 1h Tuesday request: 8/15 weekly; 8h due/6h available Tuesday; 2h deficit. Actual proposal says 1h already existed and the request adds 1h, and requires rechecking every deadline.
- Same-input saved comparison recomputes both 15/15 snapshots. A newly saved 10/15 scenario compared with the combined snapshot shows “Different input scenarios”, exact request and commitment differences, and no universal ranking.
- Scope changed to “Two charts, without appendix”; proposal manually changed to “My exact personal wording. Please keep this.” The literal unapplied notice appeared. Explicit update opened Save/Discard/Cancel. Cancel preserved exact text and returned focus to the scope update button. A separate local draft was explicitly saved before proceeding.
- Follow-up edited from recorded outcome/notes. Regenerate opens Replace/Cancel; Cancel preserves text and restores focus. Copy follow-up, Playbook and Brief reached the explicit selected-text fallback when this browser denied clipboard access. Actual clipboard write success is **NOT VERIFIED** here; mocked success and real fallback are distinct evidence.
- Decision Brief opened with original/revised checks, conditions and original saved text. Print action populated the isolated print record. OS print-preview/pagination and printer/PDF output are **NOT VERIFIED**.
- Native Tab/Enter/Space/Escape calls produced no navigation/activation/dismissal through this browser tool. Native keyboard support is **NOT VERIFIED**, not PASS. Click Cancel and focus return worked. Existing jsdom keyboard tests remain intact.
- Native reduced-motion emulation and screen reader were unavailable: **NOT VERIFIED**. Existing CSS handling and automated reduced-motion scroll behavior are retained.
- Console inspection showed Electron host CSP warnings, with no observed YESIF application error. This is a bounded observation, not a claim about every browser.

### Screenshot inventory and limits

Files: [`artifacts/v2.5`](../artifacts/v2.5/), [measurements](../artifacts/v2.5/browser-metrics.json), [follow-up observations](../artifacts/v2.5/final-browser-observations.txt).

- Seven genuine V2.4 before captures at 900px: fits, overload comparison, early conflict, early proposal, combined change, Kit, saved workspace.
- Twenty-four V2.5 stage-C captures/measurements: Kit, saved comparison, follow-up, Playbook at **375, 390, 768, 900, 1280, 1440px**. All recorded document widths fit the viewport. The follow-up 768px image contains a capture artifact and is **not visual acceptance evidence**. Other captures were inspected; 900px follow-up was recaptured after an initial compositor artifact.
- [Kit before](../artifacts/v2.5/before-kit-900.png) / [Kit after](../artifacts/v2.5/after-kit-900.png); [saved workspace before](../artifacts/v2.5/before-saved-workspace-900.png) / [initial saved comparison after](../artifacts/v2.5/after-saved-comparison-900.png).
- Saved-comparison screenshots precede the final compact disclosure change. Follow-up/Playbook screenshots precede the grid alignment correction. They are **intermediate evidence**, not final screenshots of those corrections.
- After browser session recovery, screenshot calls repeatedly timed out; requested viewport changes also did not consistently change actual width. No fabricated after-fits/after-early/after-combined/Brief captures were substituted. Final screenshots and new native visual review of 0/1/2/3 option layouts at all six widths remain **NOT VERIFIED**. Prior V2.2–V2.4 captures are historical only.

## Reference calculation matrix

`src/tests/v25-matrix.test.ts` checks all five prefixes with independent arithmetic, including requested changes and reserves. Hours below are displayed units; implementation remains integer quarter-hours.

| Reference | Expected checked result |
| --- | --- |
| 5h existing + 5h request | 10/15; all deadlines fit; 5h unassigned |
| Standard overload | 18/15; Friday short 3h |
| Defer 5h report | 13/15; all deadlines fit; 5h remains owed |
| Reduce request to 2h | 15/15; no buffer; smaller result requires agreement |
| Fixed 7h Tue + new 1h Fri | 8/15 weekly; Tuesday 7/6, short 1h |
| Fixed 7h Tue + new 1h Tue | 8/15 weekly; Tuesday 8/6, short 2h = 1h existing + 1h added |
| Fixed 7h Tue + new 10h Fri | 17/15; Tuesday short 1h and Friday short 2h |
| New 2h Mon + existing 5h Fri, capacity 1/1/1/1/0 | 7/4 weekly; Monday short 1h; existing work separately fails Friday |
| Exact capacity | 15/15 feasible; zero unassigned, no delivery guarantee |
| Zero usable, positive request | impossible; no verified alternative |
| 11h fixed + 2h movable + 6h new; move 2h and reduce to 4h | 15/15; both agreements required; fixed work retained |

Additional tests retain reserves, 15-minute granularity, invalid/blank/NaN recovery, fixed protection, duplicate-ID rejection, eight-commitment limit, 0–3 options, 50-record limit, corrupted/partial/legacy storage and blocked/quota save behavior. The original 500 engine, 1,000 allocation, 500 causal and 200 communication randomized cases remain unchanged.

## Persistence and Free/Kit boundary

`yesif.notebook.v1` and `yesif.draft.v2` validators and encodings are unchanged. Read operations do not rewrite corrupted/legacy storage. Existing tests prove valid-record recovery alongside damaged entries, partial numeric draft recovery, failed writes retaining user text, note-save retry, Delete Cancel, exact JSON export, stale proposal clearing and guarded destructive navigation. Browser recovery exercised real V2.4 records. No migration, automatic text replacement or entitlement persistence was introduced.

Identical-save matching includes exact scope/message plus semantic input and selected condition; notes and outcomes on the existing record are preserved without a write. Meaningfully changed proposals still count as distinct. Free allows unlimited core work, practice and one saved decision. Kit is an in-memory, no-payment demo, up to 50 local records. Reload ends demo access without hiding stored records or their export. $4.99 is a proposed, unvalidated one-time experiment, never a purchase or subscription. Follow-up edits are temporary and separate from source notes/proposal; the editor says to copy before reload.

## Exact source changes

| Files | Purpose |
| --- | --- |
| `src/domain/conversation.ts` | Causal early-conflict wording |
| `src/storage/scenarios.ts` | Pure semantic comparison helpers; existing storage format untouched |
| `src/App.tsx` | Duplicate-save reuse, saved/manual draft guard, Kit routes, temporary follow-ups, print isolation, deletion cleanup, Free recovery export |
| `src/components/Proposal.tsx` | Conservative accessible unapplied-scope notice |
| `src/components/NegotiationPractice.tsx` | Clear second choice on Back |
| `src/components/Results.tsx`, `DecisionFacts.tsx` | Current option obligations, priority, agreements and deadline evidence |
| `src/domain/decisionTools.ts` | Recomputed saved facts, differences, Playbook, follow-up and Brief text |
| `src/components/SavedComparison.tsx` | Two-snapshot selection and comparison, compact evidence disclosure |
| `src/components/KitOffer.tsx` | Accurate Free/current-visit demo boundary and proposed price |
| `src/components/ArtifactText.tsx`, `DecisionKit.tsx`, `FollowUp.tsx` | Functional editable/copy/print tools and explicit replacement guard |
| `src/styles.css` | Scoped comparison/artifact/print rules and saved grid alignment |
| `src/tests/v25-{trust,decisions,kit,matrix}.test.*` | New behavioral and numerical regressions |
| `src/tests/integration.test.tsx`, `v2-flow.test.tsx` | Only renamed demo CTA selectors; baseline assertions/timeouts retained |
| `vite.config.ts` | Bound test workers to two; `/yesif/` base unchanged |
| `README.md`, this report, `artifacts/v2.5/` | Release description and actual evidence |

Protected core `engine.ts`, `allocation.ts`, `options.ts`, `conflicts.ts`, landing/input components, package dependencies, draft storage and deployment workflow have no diff from V2.4. ShiftMargin and unrelated repositories were not edited.

## Acceptance status and remaining issues

Statuses describe implementation plus available acceptance evidence; **PARTIALLY FIXED does not mean COMPLETE**.

| Item | Status | Evidence / remaining gap |
| --- | --- | --- |
| P0-A causal copy | FIXED | Three subcases automated; same-day case exercised in browser |
| P0-B scope/message divergence | FIXED | Accessible literal notice, exact-text Cancel regression and actual browser check |
| P0-C save/state defects | FIXED | Semantic duplicate reuse and deletion cleanup; original persistence guards retained |
| Block 07 current comparison | PARTIALLY FIXED | Implemented and behavioral tests; browser facts/actions checked; final six-width 0/1/2/3 visual signoff unavailable |
| Block 09 Free/Kit | FIXED | Real unlock/reset/recovery, six-width screenshots, honest price and boundary |
| Block 10 workspace | FIXED | Existing open/reuse/delete/export tests, actual save/open/recovery; bound preserved |
| Block 10 saved comparison | PARTIALLY FIXED | Same/different inputs tested and exercised; final compact layout screenshot review unavailable |
| Block 10 Playbook | PARTIALLY FIXED | Grounded artifact and copy tests, actual content/fallback and six-width intermediate screenshots; final alignment visual review unavailable |
| Block 10 follow-up | PARTIALLY FIXED | Edit/copy/guard/navigation/source preservation tested and exercised; native clipboard success and final alignment visual review unavailable |
| Block 10 Brief | PARTIALLY FIXED | Real generated text and print entry point; copy/print isolation tested; native print preview and final screenshots unavailable |
| Overall Block 10 acceptance | PARTIALLY FIXED | All five bounded tools function; browser/print acceptance gaps above prevent COMPLETE claim |
| Backend/accounts/payments/AI/calendar | DEFERRED OUT OF SCOPE | Explicitly excluded |

Remaining P0: no known unfixed computation/data-loss/trust defect in the checked scope. Remaining P1: **NOT FIXED** as release-verification gaps — final six-width visual review, native keyboard, screen reader, reduced motion and native print preview. Remaining P2: **NOT FIXED** — first-time comprehension, 60-second interaction timing, demand, price, retention and skill improvement are unvalidated. No WCAG certification or business validation is claimed.

## 60–90 second judge demo (guidance, not measured user timing)

1. 0–10s: Explore an example; point to 18h required / 15h available and Friday shortfall.
2. 10–25s: Compare moving Weekly report (13/15; report still owed) with reducing the request (15/15; smaller contents need agreement). Open obligation checks if asked.
3. 25–40s: Choose the report move. Read/edit the conditional proposal; explain new date and unchecked future capacity.
4. 40–60s: Start two-step practice; choose a plausible response and inspect the grounded feedback. This is authored practice, not AI assessment.
5. 60–90s: Save, open Notebook, unlock the explicitly free demo, open Playbook or Brief for that actual decision. Explain proposed $4.99, local storage and current-visit access. No payment or validated demand claim.

## Final gates and release

Stage-C full gate passed **146/146 across 17 files (59.39s)**, typecheck, build and whitespace. After the final deletion regression, the first clean gate caught an unsupported `exact` test-query property; removed it. The next full run passed **146/147**, with one original 5-second integration test timing out at 5.238s while browser QA was active; no numerical assertion failed. A final clean sequential retry without browser activity is recorded below. No timeout or baseline assertion was weakened.

Final clean gate: **PASS — 147/147 tests, 17/17 files, 108.04s** (118 baseline + 29 new). `npm ci` installed 109 packages and reported zero vulnerabilities; `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check` all exited successfully in sequence. Build: 1.52s; JS `index-BbgVJKRk.js` 330.34kB (99.42kB gzip), CSS `index-CjIPZxCC.css` 56.10kB (11.58kB gzip). `/yesif/` base and built asset paths inspected. No separate lint script exists; typecheck/build and whitespace are the configured gates. Final retry had no code/test/timeout changes after the preceding timeout run; browser activity was stopped.
