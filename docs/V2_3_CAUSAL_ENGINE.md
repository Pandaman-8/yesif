# Causal decision analysis

`src/domain/conflicts.ts` is a pure interpretation layer over the existing engine, not a replacement scheduler. `analyzeConflicts` validates through `analyze`, compares the existing-only and full-workload cumulative checkpoints, and never mutates the scenario.

## Classification

- `fits`: all full-workload weekday checks pass.
- `new_request_causes_conflict`: existing work passes; adding the request introduces a failed prefix.
- `preexisting_conflict`: existing work already fails; the request creates no additional positive deficit in any prefix.
- `preexisting_and_additional_pressure`: existing work already fails and at least one full-workload deficit is greater than the corresponding existing-only deficit. This may occur at the same, an earlier, or a later date.

Using spare time alone is not classified as additional conflict. Reserve is included through the engine's effective capacity. Weekly overload is kept separate from early constraints.

Each violated checkpoint records due/usable/deficit quarters, existing-only demand/deficit, additional deficit, actual existing task objects due on or before that day, and whether the request is due by that day. The first conflict, existing first conflict and all later failed checkpoints remain available. A Friday task is excluded from a Tuesday constraint.

## Recommendations and proof

`startingOptions` remains unchanged. Every returned candidate is run through `simulate` again. Verified records contain the exact deferred tasks, selected request effort, fresh checked plan, remaining usable capacity, all-deadline verdict and agreement/future-capacity conditions. No Fixed task is silently deferred. Future capacity is never marked checked. An accept option fits the estimates; scope and priority still need confirmation.

Unverified directions are distinct typed records: relevant date, affected IDs, label, explanation, assumption that would need to change and required recheck. They discuss capacity before the binding date, conditions of relevant existing work, and request scope/deadline only when the request contributes to that prefix. These are not executable changes. The first deficit is explicitly a lower bound, not a proof of a sufficient repair.

`simulationConstraint` recomputes a selected plan with `simulate`; if a scope cut or deferral concerns only later-due work, it explicitly says that change cannot repair the current earlier shortfall. It never infers success from weekly totals.

## Conversation and UI

Results shares the analysis for attribution, verified alternatives and unverified directions. An impossible result has one unresolved action and no fake allocation. `renegotiationRequest` names the contributing work and actual limiting date; it no longer begins by refusing the unrelated new request. For the reference case it starts: “By Tuesday, Weekly report requires 7h, but I have 6h available — a 1h shortfall.” It requests a discussion and all-week recheck, not approval that has already happened.

`conflictBreakdown` supplies separate factual details: membership, existing comparison, first and later failed checks, weekly total and verification limits. Feasible proposals remain conditional on their checked changes. Practice receives only factual consistency fixes; its broader design is unchanged. Existing saved/custom messages are not rewritten; explicitly resetting a generated draft uses the current generator.

## Independent evidence and limits

The new test oracle builds demand buckets and accumulates integer capacity independently; it does not use engine/allocator helpers for expectations. It verifies 500 generated scenarios, every claimed alternative, due-work membership, deficits and attribution. Adversarial cases include preexisting Tuesday 7/6, a new early request, mixed pressure, irrelevant Friday changes, multiple failed prefixes, exact capacity, reserve and old storage fixtures. Prior 500 engine and 1,000 allocation cases remain unchanged.

This is deterministic attribution under a simplified five-day model, not proof of real-world causation or guaranteed delivery. No earliest-start constraints, dependencies, appointments, multi-week optimization, calendar integration, automatic transfers, AI, likelihood scores or preference-based “best” ranking were added. Unverified directions require new inputs and full revalidation.
