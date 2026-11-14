# YESIF V2 decision engine

## Preserved model

V1 cumulative feasibility is retained: at every day d, effort due by d must not exceed focused capacity available by d. A spare weekly total never repairs an early deadline. One worker, five weekdays, integer 15-minute units, divisible work, all tasks available at the beginning. No dependencies, earliest-start dates, fixed calendar blocks or overtime inference. At most eight existing commitments.

`Scenario.reserve?: number[5]` is the only added scheduling input. Effective daily capacity is `capacity[d] - reserve[d]`. Reserve defaults to zero for V1 records and must be an integer in `[0, capacity[d]]`. Empty numeric fields stay invalid; no silent NaN/null-to-zero conversion. Baseline, suggestions, simulation, proposal facts and allocation all use effective capacity.

## Concrete allocation

`allocate(scenario, plan)` first re-simulates the exact selected IDs and requested units. It returns `{fits:false, days:null}` for an impossible plan, never a partial schedule labeled complete.

For a feasible plan:

1. Exclude only explicitly deferred negotiable commitments. Fixed deferrals are rejected by `simulate`.
2. Replace the new request's effort with the selected positive scope.
3. Sort tasks by end-of-day deadline, then original input position. The new request comes last in a deadline tie. This is stable and visible in the UI.
4. For each weekday, consume effective capacity in that order, assigning `min(remaining task units, unused daily capacity)`.
5. Store task IDs and assigned integer units, unused effective capacity and separately reserved capacity.
6. Throw on any feasibility/allocation contradiction; do not hide a mismatch behind an empty graphic.

Under the stated assumptions, EDF is sufficient: moving an earlier-deadline unit before a later-deadline unit cannot damage a deadline. If EDF misses the first deadline d, due work exceeds cumulative capacity through d, contradicting the feasibility predicate. Conversely any valid schedule must satisfy every cumulative bound.

Required invariants: only retained task IDs; positive integer assignments; each task exactly receives required remaining effort; every assignment is on/before its deadline; daily sum <= effective capacity; unused + assigned + reserve = original capacity; deferred tasks absent; reduced request gets exactly the smaller scope. Allocation is one possible arrangement, not a delivery guarantee or fixed calendar.

## Alternatives and unresolved conditions

V1 `analyze` and its rankings remain compatible. The UI helper `startingOptions` displays at most three options, retaining a scope alternative when available. If no full-scope deferral fits, it enumerates negotiable subsets and computes the largest remaining request scope using the minimum cumulative slack at/after its deadline. It discards impossible, zero-scope, and dominated subsets. It ranks combined candidates by fewer high-priority changes, fewer commitments changed, larger feasible scope, then stable ID. Every visible suggestion is re-simulated before use.

Impossible means even deferring all negotiable tasks and retaining only 0.25h of the request still conflicts. This monotone best case proves no allowed combination can work. The UI gives the first missed deadline, shortfall, fixed commitments and an editable request to discuss changing conditions. It does not allocate the impossible plan, call it feasible, or save it into the feasible-decision notebook. It can be saved as a separate local draft.

Deferrals remain named obligations awaiting an approved new date and future-capacity check. Scope reductions require a smaller deliverable. Its optional user description is included in the proposal but its effort estimate is not independently verified. No approval is inferred.

## Conversation and storage

Short proposals use a fresh feasible simulation; detailed explanations retain V1 factual templates. Impossible requests use a separate generator. User-edited words are not validated. Contextual practice uses the actual request, deadline, capacity and chosen condition; stable answer position varies by request. The four rubric checks describe the authored answers, not the person's ability.

`yesif.notebook.v1` and envelope version 1 remain compatible; optional reserve and scope data are backward compatible. Individually valid legacy records can be recovered beside corrupt entries. Original raw data is untouched until an explicit write, update or deletion. No automatic migration wipes old records.

A separate explicit draft uses `yesif.draft.v2`. Non-finite numeric fields are tagged and restored as invalid NaN, never silently coerced to zero. Draft reading has structural/size checks and validates any saved plan. Current work is not automatically uploaded or autosaved. Destructive transitions support Save draft / Discard / Cancel; dirty browser departure registers beforeunload (browser-dependent). Failed outcome-note writes retain in-memory text for retry.

## Evidence

The original 500-case quarter-slot oracle remains. An additional 1,000 generated scenarios exercise original plans, manually selected combinations, reserves and generated alternatives. An independent witness checker enumerates each assigned quarter-hour and validates membership, exact counts, daily bounds and deadlines without calling allocator internals. Reference cases A–F and unknown generated/custom scenarios are also checked. See V2_QA_REPORT.md for executed counts and browser limits.
