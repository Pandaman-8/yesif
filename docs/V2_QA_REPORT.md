# YESIF V2 QA report

Date: November 14, 2026. Public release identity and final production checks will be appended after deployment. This report distinguishes automation, real browser observations and incomplete checks.

## Baseline and automated gate

Baseline `f47894bc8b59790042d9da2565b2f4e312d14ab3`: 35/35 tests passed; existing CI successful. Preserved as `codex/yesif-v1-rollback`. Development: `codex/yesif-v2-human-first`.

Executed on V2:

| Check                 | Actual result                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm ci                | PASS; 109 packages installed, audit reported zero vulnerabilities                                                                                           |
| npm run typecheck     | PASS, strict TypeScript                                                                                                                                     |
| npm test              | PASS: **57 tests in 6 files**                                                                                                                               |
| npm run build         | PASS; JS 283.31 kB / 87.12 kB gzip, CSS 33.29 kB / 7.42 kB gzip                                                                                             |
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
