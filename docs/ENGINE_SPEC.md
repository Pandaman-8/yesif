# YESIF engine specification

## Inputs and invariants

`Scenario = { capacity: number[5], tasks: Task[], request: Task }`.
`Task = { id, name, units, deadline, movable, priority }`.

Effort is integer quarter-hours (`hours × 4`). Capacity is 0–96 units per day; tasks are 1–480 units; 0–8 existing tasks; unique nonempty IDs; trimmed nonempty names up to 100 characters. Deadline is an integer 0–4 (Monday–Friday, end of day). `movable` is explicit boolean; priority is normal/high. Empty numeric inputs become NaN and block calculation instead of silently becoming zero. Invalid values never reach results.

## Feasibility

For every day d:

- C(d) = sum of available capacity through d.
- W(d) = sum of remaining effort of tasks due on or before d.
- Deficit(d) = max(0, W(d) − C(d)).

A plan fits iff every deficit is zero. Weekly overload is max(0, sum effort − sum capacity), and does **not** replace the deadline check. The displayed proof is cumulative, not an allocation of specific tasks to time slots.

Correct under: one worker; all work available at period start; arbitrarily divisible quarter-hour units; no dependencies, release dates, fixed appointments, or context-switch costs. Availability is focused work after meetings/admin/buffer. The user chooses a planning week; weekdays are not inferred calendar dates. Passed days must be entered as zero remaining availability. No implied overtime/weekends. Estimates are not guarantees.

## Automatic starting points

Enumerate up to 2^8 subsets of tasks explicitly marked negotiable. Remove each subset from the current period, keep the full request, and recheck every deadline. Reject infeasible subsets. Remove strict supersets of other feasible subsets. Rank by (high-priority tasks changed, total tasks changed, hours deferred, stable identifier). Display up to three.

Scope-only option: existing work must already fit. Maximum new effort is min[C(d) − W_existing(d)] over all d at or after the new request's deadline. Offer it only when positive and below the requested effort. Later commitments can constrain the new request even when its own deadline has headroom. Zero scope is not a deliverable.

When the baseline fits, the sole suggested starting point is accepting without changes.

## Interactive simulation

The user can independently toggle any negotiable commitment and set a reduced request scope with a quarter-hour slider or explicit ±15-minute buttons. This supports combined deferral and scope plans, including valid combinations absent from automatic suggestions. Each change calls `simulate` and rebuilds every checkpoint immediately. Fixed tasks are disabled in UI and rejected by the engine. Unknown IDs, duplicate deferrals, noninteger/zero/expanded scope are rejected. Invalid plans remain visible as conflicts; proposal action stays disabled.

Deferral removes current-period effort only; it does not establish next week's availability or a new deadline. Scope reduction changes the deliverable, never the estimated productivity of the original task. Neither implies manager approval. Existing task scope cuts and within-week deadline renegotiation are not modeled; edit inputs only after independently choosing appropriate constraints.

## Proposal and state safety

Proposal generation recalculates the chosen change from the current inputs and refuses any remaining conflict. Templates use actual task names, effort and deadlines; combined changes are explicitly described. Original/changed totals and first missed deadline are included. Editable text is user-authored after generation, not automatically validated.

Input changes clear the selected plan, message, practice state and saved-decision identity. Proposed changes never mutate original workload. Opening a saved decision restores its scenario, plan and edited message. Reusing a workload clears the previous proposal and agreement state. Outcome notes never silently change a workload or claim approval.

## Storage

Explicit saves only, key `yesif.notebook.v1`. Envelope version 1, max 50 decisions / 1 MB input; each record checks scenario, plan feasibility, unique ID, timestamp, outcome, message (10,000 characters) and notes (2,000). Corrupt/unsupported storage warns without deleting the underlying value; the next explicit save replaces unreadable content. Read/write failures are recoverable and do not claim saving succeeded. No task data is transmitted. Kit unlock is session state, a demonstration rather than payment access control. JSON export is local and may contain sensitive user-entered text.

## Verification strategy

Example arithmetic; early-deadline failure with spare weekly capacity; zero capacity; exact fits; fixed tasks; existing impossible workload; late bottlenecks on scope; minimal/ranked multiple deferrals; combined plans; forged/stale plans; real proposal facts; malformed input; storage failure/corruption; React user flow and clipboard. A seeded 500-case independent quarter-slot earliest-deadline execution oracle checks the cumulative feasibility criterion and generated alternatives.
