# YESIF V2.3 audit

Baseline: `c78be7e3b58b372f22a3b4f95d97100b3f29691b`; clean main; 80/80 tests passed in 20.38s. Rollback: `codex/yesif-v2-2-rollback`. Scope: Blocks 05 and 06 only.

| Evidence | User impact | Root cause | Fix / regression |
|---|---|---|---|
| Expanded V2.2 allocation repeats each task/day in a long list (before-schedule-900.png). | Hard to see the shape of a week or compare alternatives. | Text-only witness presentation. | Five proportional weekday bars; exact-hours disclosure; V2.3 schedule tests. |
| Old allocation summary trusts `plan.result`, although `allocate` recalculates. | A stale caller could label a current allocation with outdated spare hours. | Two sources of displayed totals. | All schedule totals now sum the fresh allocator witness; stale-result test. |
| 7h fixed Tuesday report + 1h Friday request: weekly 8/15, Tuesday 7/6. Old `renegotiationRequest` starts “I can’t commit to [new request]”. | Wrong cause and focus for negotiation. | Request-first template with no attribution model. | Block 06: pure cumulative comparison and causal conversation regression. |
| Old impossible details are exactly `renegotiationRequest`. | Repetition instead of factual explanation. | Same function for both surfaces. | Block 06: separate factual constraint breakdown. |
| Generic simulator advice says reduce the request without checking whether it is due by the binding deadline. | Later scope changes can be mistaken for a remedy to earlier work. | Advice not tied to the current violated prefix. | Block 06: relevance-aware simulation explanation. |
| Old practice foregrounds weekly capacity for early conflicts. | A correct weekly total obscures the binding date. | Generic practice context. | Block 06: minimum causal consistency correction. |

No feasibility or EDF defect was found in this audit. Divisible work available from week start, no dependencies, and unchecked future capacity are model limitations, not bugs.

Deferred: earliest starts, dependencies, multi-week optimization, calendars, automatic deadline transfers, AI coaching, full Skills redesign, commercial/payment changes. No PDF deck in this assignment. ShiftMargin is untouched.
