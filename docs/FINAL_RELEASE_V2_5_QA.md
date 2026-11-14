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
