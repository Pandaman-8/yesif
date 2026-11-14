# YESIF

**Every yes needs an if.** A private, interactive commitment trade-off simulator for workload conversations.

Start with clear context, compare verified trade-offs, inspect real task allocations by day, and edit/copy a short proposal. If no plan fits, prepare an honest renegotiation request. No account, backend, external AI, analytics or payment collection.

- Production: https://pandaman-8.github.io/yesif/
- Public source: https://github.com/Pandaman-8/yesif
- Primary track: Skills. Initial audience: US marketing/project coordinators aged 25–45.
- Demand, pricing, and differentiation are hypotheses; this is a working product experiment, not a validated business.

## V2.3 — visual scheduling and causal decisions

The weekly allocation is now a proportional five-day view, derived from the unchanged EDF allocator. It distinguishes real task hours, unassigned usable time and explicit reserve, with accessible details and cross-day task highlighting.

A pure causal layer compares existing-only and full-workload deadline constraints. It separates preexisting conflicts from request-caused or additional pressure, rechecks every verified alternative, and keeps unverified negotiation directions distinct. Impossible-plan messages now name the work behind the binding deadline, with separate factual evidence.

**103 tests pass**, including the unchanged 500 engine and 1,000 allocation cases, plus 500 new independently checked causal scenarios. Real browser review covers 44 state/width combinations; native keyboard and full screen-reader verification remain incomplete.

See [audit](docs/V2_3_AUDIT.md), [scheduling contract](docs/V2_3_SCHEDULING.md), [causal engine](docs/V2_3_CAUSAL_ENGINE.md), [QA](docs/V2_3_QA.md), and [pitch handoff](docs/V2_3_PITCH_HANDOFF.md). Rollback: `codex/yesif-v2-2-rollback`. No PDF pitch deck is included in this release.

## V2.2 — visual system and results

Results now separate **fits**, **checked alternatives**, and **unresolved conditions**. A fitting request gets one confirmation action and exact unassigned hours. Conflicting plans show the first missed deadline, separately from weekly totals, and identify conflicts already present in existing work. When no allowed combination fits, only the renegotiation route is prominent.

Alternatives expose changes, unchanged work, calculated hours and required agreement, with equal action styling. One option pairs facts and outcome across the width; two compare side by side; three use three columns on wide screens or two plus a full-width third at 900px. Mobile stacks them. The optional simulator still recomputes actual 15-minute scope changes and task moves; fixed work stays protected. Allocation details follow the primary action. Green means “fits the estimates,” never approval.

The result styles use semantic ivory, forest and amber surfaces, readable type, and 180–220ms transitions respecting reduced motion. Landing, input, domain, persistence and proposal generation are preserved. All 624 original non-result CSS declaration groups were checked against V2.1.

Clean install, typecheck, **80 tests** (67 preserved + 13 new), production build and whitespace check pass. [QA record](docs/V2_2_QA.json) and [36 browser measurements](artifacts/v2.2/browser-metrics.json) cover six widths. Reviewed before/after at 900px: [fits before](artifacts/v2.2/before-fits-900.png) / [after](artifacts/v2.2/after-fits-900.png), [overload before](artifacts/v2.2/before-overload-900.png) / [after](artifacts/v2.2/after-overload-900.png), [conflict before](artifacts/v2.2/before-conflict-900.png) / [after](artifacts/v2.2/after-conflict-900.png), [simulator before](artifacts/v2.2/before-simulator-900.png) / [after](artifacts/v2.2/after-simulator-conflict-900.png). [Mobile alternatives](artifacts/v2.2/after-options-375.png) and [three-option layout](artifacts/v2.2/after-three-options-900.png) show the responsive treatment. Captures are actual bounded browser clips, not full-page mockups.

The comparison cards carry more explicit facts and are not shorter than V2.1; mobile still requires scrolling. Human comprehension and timing need a retest. Keyboard paths have automated coverage, but native keyboard delivery through the browser tool was inconclusive. No WCAG certification, payment validation or proof of demand is claimed. Blocks 05–13 remain out of scope.

V2.1 rollback: `codex/yesif-v2-1-rollback` at `dc9a2ea4ea498dcf9905ce429b1aa8e7c97c846b`. Stage 03 checkpoint: `7539380` (67 tests passed). Restore through a reviewed revert/new commit and a successful deployment; do not force-push over subsequent work.

## V2.1 — landing and input

The primary **Plan my workload** action opens an empty personal request; **Explore an example** runs the original sample through the real engine. The landing preview calculates the sample's overload, named proposed move and feasible result.

Input separates new work, usable focused time and existing commitments. Explicit weekday quick-entry remains editable per day; reserve is optional and visibly subtracted. Completed commitments have a compact review state with timing flexibility always visible, and an Edit action for effort, deadline and priority. New estimates are blank until entered. Start over and Load example use the existing save/discard/cancel guard.

Verification: clean install, typecheck, **67 tests**, production build and whitespace check passed. Existing domain, storage, results/proposal logic, dependencies and deployment workflow are unchanged. [Observed browser/layout evidence](docs/V2_1_QA.json) covers 375, 390, 768, 900, 1280 and 1440 px without horizontal overflow, plus real 10/15, 18/15 and early-deadline 8/15 scenarios. At 900 px the primary CTA moved from about y=647 to y=461; the three-commitment form decreased from 1,979 to 1,650 px. At 375 px the form is still long (2,182 px versus V2's 2,194), but timing controls are now visible and completed cards are compact.

Screenshots initially timed out, then succeeded with explicit capture clips. Reviewed comparisons: [V2 landing](artifacts/v2.1/v2-landing-900.png) / [V2.1 landing](artifacts/v2.1/landing-900.png), [V2 input](artifacts/v2.1/v2-input-900.png) / [V2.1 input](artifacts/v2.1/input-900.png). Mobile: [landing](artifacts/v2.1/landing-mobile.png), [input](artifacts/v2.1/input-mobile.png), [commitments](artifacts/v2.1/commitments-mobile.png). The final input entrance takes 220ms, with focus and section scrolling respecting reduced motion. Screenshots and automated checks do not establish first-time comprehension or full assistive-technology compatibility. Repeat human testing remains open; the individual feedback statuses are recorded in the QA JSON. Demand and payments remain unvalidated.

Rollback: `codex/yesif-v2-rollback` preserves `dc326f1ac7523c960efd5030466b79782581237d`. Restore that code with a reviewed revert/new commit and a successful deployment; do not force-push over later work.

## Run locally

Node 22.22+ and npm 10+:

```sh
npm ci
npm run dev
```

Open the `/yesif/` URL printed by Vite. If the port is busy, Vite prints the next available port.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

## Deployment

GitHub Actions runs clean install, typecheck, tests, build and whitespace check on pushes to `main`, then deploys `dist` to GitHub Pages. Configure Pages source as GitHub Actions. Vite's base is `/yesif/`. For a different path, update `vite.config.ts` and the favicon path in `index.html`.

## Scope and privacy

One person, five weekdays, eight existing commitments, quarter-hour estimates. Work must be available at the start and divisible, with no dependencies. Users enter remaining focused capacity themselves. Deferring work never proves future capacity. Reduced effort means a reduced deliverable requiring agreement.

Only explicit saves and notebook edits write to localStorage. A separate local draft protects partial inputs; destructive transitions ask whether to save, discard or cancel. The free workflow is unlimited, with one saved-decision slot. The proposed $4.99 one-time kit has a clearly labeled free demo unlocking multiple saved decisions, outcome-aware follow-ups and local export; no payments occur. Existing saved entries remain readable after the demo session ends.

V2 details: [independent audit](docs/V2_PRODUCT_AUDIT.md), [allocation specification](docs/V2_ENGINE_SPEC.md), [UX decisions](docs/V2_UX_DESIGN.md), [QA](docs/V2_QA_REPORT.md), and [pitch handoff](docs/V2_PITCH_HANDOFF.md). V1 rollback: `codex/yesif-v1-rollback` at `f47894bc8b59790042d9da2565b2f4e312d14ab3`.

V1 historical documents: [product decision](docs/PRODUCT_DECISION.md), [engine specification](docs/ENGINE_SPEC.md), [QA report](docs/QA_REPORT.md), and [pitch handoff](docs/PITCH_HANDOFF.md).

ShiftMargin is a separate fallback and is not modified by this project. No pitch deck is included.
