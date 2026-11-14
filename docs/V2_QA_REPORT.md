# YESIF V2 QA report

Date: November 14, 2026. V2 is publicly deployed. Browser limitations below remain open; no pixel-level visual or full accessibility sign-off is claimed. This report distinguishes automation, real browser observations and incomplete checks.

## Baseline and automated gate

Baseline `f47894bc8b59790042d9da2565b2f4e312d14ab3`: 35/35 tests passed; existing CI successful. Preserved as `codex/yesif-v1-rollback`. Development: `codex/yesif-v2-human-first`.

Executed on V2:

| Check                 | Actual result                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm ci                | PASS; 109 packages installed, audit reported zero vulnerabilities                                                                                           |
| npm run typecheck     | PASS, strict TypeScript                                                                                                                                     |
| npm test              | PASS: **57 tests in 6 files**                                                                                                                               |
| npm run build         | PASS; JS 283.32 kB / 87.14 kB gzip, CSS 33.29 kB / 7.42 kB gzip                                                                                             |
| git diff --check      | PASS                                                                                                                                                        |
| V1 generated oracle   | Original 500 deterministic cases retained                                                                                                                   |
| V2 witness validation | Additional 1,000 generated scenarios; original plan, manual combination and displayed suggestions checked independently by counting allocated quarter-hours |

All original 35 scenarios remain. Integration navigation was updated only for the intentional advanced-simulator disclosure and variable practice answer position. Original engine/storage assertions were not weakened.

Added coverage: exact daily reference allocation; reserve validation; early deadline/zero capacity; combined change and scope description; stable ties; contextual practice/deadline/answer position; combined starting suggestions; corrupt/partial drafts preserving NaN; partial legacy-record recovery; demo context and DOM order; impossible output; reset Save/Discard/Cancel; reload recovery; dirty beforeunload registration; failed draft save; deletion confirmation; follow-up; exact JSON Blob export content and attached download anchor with no synchronous revocation; reserve in UI; failed notes retained/retried; manual-message guard and stale-proposal invalidation.

Export automation verifies the payload against actual saved records, not an invented fixture. It verifies initiation and Blob lifetime, not an operating-system download receipt. Dialog top-layer behavior is stubbed in jsdom; browser observations are separate below.

## Browser observations before release

Codex in-app browser, local Vite preview at `/yesif/`. No alternate browser-control mechanism or security-policy bypass. Observed labels/DOM and read-only layout metrics used; these are not pixel-level visual sign-off.

- V1 public landing and result inspected; confirmed unintroduced simulator preceding options and dense always-visible table.
- V2 demo introduces the manager request and exact 13 + 5 / 15 context, then options before optional simulation.
- Expanded first option shows actual Mon QA 3h; Tue QA 2h + updates 1h; Wed updates 2h + presentation 1h; Thu presentation 3h; Fri presentation 1h + 2h available. No deferred report in allocation.
- **375, 390, 768, 1280, 1440px**: landing, custom input, result with expanded allocation, and unresolved-request/practice screen measured with matching document clientWidth and scrollWidth (360, 375, 753, 1265, 1425 respectively; 15px browser scrollbar). No horizontal overflow on those inspected screens.
- Custom zero-capacity scenario: Partner brief 1h due Tuesday; editable request correctly reports 1h short by Tuesday, no feasible plan badge.
- Saved unresolved local draft, reloaded, resumed exact proposal from recovery banner.
- Independent early-deadline case entered in real controls: 3h/day, fixed client review 7h Tuesday, new independent client brief 1h Friday. Result 8/15h, but Tuesday 7/6h with 1h short; no green acceptance or fictitious allocation.
- Native unsaved-change dialog appears on Reset example with Save draft / Discard / Cancel; Cancel receives focus. Cancel leaves actual custom values intact.
- Native selects exercised with documented selectOption; text/numeric inputs exercised with fill. Heading focus observed on navigation.

## Current tool limits

- Native keyboard dispatch did not reliably move focus; a Playwright Tab attempt was followed by a CDP Runtime.evaluate timeout. Full Tab/Enter/Space traversal is not claimed. Native DOM controls continued to work.
- Reduced-motion rules are implemented and source-reviewed; actual preference emulation has not been verified. No full accessibility certification or screen-reader sign-off.
- Local screenshot attempts were already blocked/timed out in V1. That restriction was not bypassed. Production screenshot availability is recorded after release below.
- Real clipboard success and actual downloaded-file receipt require explicit final observations; automated coverage is not a substitute.
- No target-user session, timed five-minute comprehension test, payment, retention or negotiation outcome measurement.

## Scope decisions and residual risks

Implemented P0: contextual options-first workflow, actual allocation, impossible-case output, explicit proposed/future obligations, data-loss guards. P1: sequential input, explicit reserve, smaller-deliverable description, short/detailed text, contextual practice, readable typography, responsive CSS and reduced-motion rules. P2: guarded deletion, partial legacy recovery, robust export initiation/payload checks, view component separation, outcome-aware follow-up.

Deferred intentionally: release dates, dependency/calendar constraints, intra-week deadline moves, future-week scheduling, automatic draft saving, backend/sync, secure paid entitlement, AI coaching, payments. Browser beforeunload is not reliable on every mobile/browser lifecycle; use explicit draft/save. Storage remains local and can be cleared. Unchanged or fully reverted input state does not trigger a destructive-transition confirmation. No head-to-head validation against ShiftMargin and no proven willingness to pay.

## Final browser observations and release identity

- Final application-code SHA: `05ac2803107376739163970296ab5459ad8f5126`. The complete V2 implementation was first released as `1717365dd8acf14a50ac69344ff055bdd8e52176`; the subsequent code change only prevents duplicate sentence punctuation in follow-up notes. All 57 tests, typecheck, build and whitespace checks passed again after that correction.
- Production: https://pandaman-8.github.io/yesif/ . Public repository: https://github.com/Pandaman-8/yesif . V1 rollback is also pushed to `codex/yesif-v1-rollback`.
- Initial V2 CI and deployment succeeded: https://github.com/Pandaman-8/yesif/actions/runs/43618697249 . Final application run: https://github.com/Pandaman-8/yesif/actions/runs/43618985126 . Both verify/build and deployment completed successfully.
- Public HTTP fetch returned the actual V2 HTML, referencing `index-BbckrkRL.js` and `index-s_PkzDqx.css` for the initial release. The final punctuation correction builds `index-2g6IHXgU.js`; final publication is checked through deployment CI. Later documentation commits do not alter application assets.
- Local-preview advanced simulator, feasible proposal/practice, and notebook/pricing screen were additionally measured at **all five requested widths**, with clientWidth equal to scrollWidth. This extends the earlier landing/input/result/impossible-screen checks.
- Real interaction: toggled Weekly report, obtained 13/15h, prepared the short proposal, selected the contextual grounded practice answer (position B in this scenario), observed all four rubric checks, and explicitly saved the decision. A subsequent browser-tab restart retained the saved record.
- Kit demo unlocked without payment; selected self-reported agreement, entered a QA-only note, and expanded the follow-up. Its text used the saved request and the actual note. The doubled punctuation discovered here was corrected in the final application commit.
- Explicit deletion opened a native dialog focused on Cancel; the QA decision was removed successfully. The separate QA draft’s removal confirmation was activated; no post-removal reload check was performed. No real user records were deleted.
- **Clipboard:** actual browser denied writing, clipboard remained empty, and the app selected/focused the proposal with a manual-copy instruction. Success is covered by integration tests, not confirmed in this browser.
- **Download:** real Export click completed but the browser download event timed out after 10 seconds. File receipt on disk is **unconfirmed**. Automated tests verified actual serialized saved data in the Blob, the attached anchor, filename and delayed revocation. The UI says “Export prepared,” not “download completed.”
- **Screenshots / public browser:** after local QA and successful public HTTP verification, the browser tool rejected the new production navigation with `Blocked browser navigation by Browser Use URL policy` (empty target in tool message). No bypass or alternative screenshot mechanism was attempted. **No V2 screenshot files were obtained.** Final public visual/browser verification remains incomplete; do not present DOM checks as screenshots. Temporary viewport overrides were reset.
- The browser tool also intermittently timed out on CDP operations. Native DOM actions continued to work for local QA. A clean preview error-log read returned no application errors; a later browser-client Statsig transport error belongs to the automation runtime, not an app dependency.

Release decision: working public candidate for the Skills/engineering demonstration, with explicit browser-verification limits. Before final competition submission, obtain real screenshots and check clipboard, downloaded file and keyboard behavior in an ordinary supported browser. This is not market validation or a decision to replace ShiftMargin.
