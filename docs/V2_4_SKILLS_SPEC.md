# V2.4 Skills specification

The optional practice is a deterministic two-decision conversation using the current scenario and freshly simulated selected plan. It neither changes the plan nor edits/sends the proposal. No external model or free-text scoring is involved.

## States and transitions

Ready → Start → first response → feedback → Hear the pushback → second response → feedback → Finish → recap. Either active step can be skipped. Retry clears both choices. Going back allows a different first choice and clears the previous second choice. The next manager prompt distinguishes a grounded conditional answer, an acknowledgement without action, and an unchecked inference. A changed scenario or selected plan starts a fresh exercise; editor keystrokes do not.

Five contexts: fitting request with unestimated extra work; deferral; reduced deliverable; combined deferral and reduced deliverable; unresolved constraint. Mixed causes are an unresolved context with separate early and later facts. Full task names, actual hours, deadlines, original constraint, current selection, scope description and agreement limits are in the optional situation disclosure. Names are not repeated in every answer, avoiding long-name answer cues.

For an early deferred obligation, refusing its move returns the discussion to its real deadline and time before that deadline. Cutting a later request is not offered as a repair. In a combined plan both conditions remain necessary.

## Feedback contract

Each authored choice has five criterion records: correct constraint, relevant action, agreement, grounded promise, clarity/tone. Each record is supported, missing, or (for an unsupported promise) a risk. Supported/risk records quote an actual substring of the displayed reply and explain its relevance. Missing evidence receives no positive mark. There is no aggregate score, certification or assessment of the person.

An acknowledgement can correctly name the constraint and withhold commitment while omitting action and agreement. A polite request can invite agreement while proposing an unchecked promise. Adding time before the binding deadline is a relevant action, but does not prove that every deadline will pass. Merely stating that the original calculation fits is not credited as identifying the missing estimate or the reduced-deliverable issue.

Feedback describes what worked, the specific omission/risk, and a concise possible revision. The five-criterion evidence is available on demand. Completion retains feedback from both decisions. Good-answer position varies deterministically by request name, deadline and step; plausibility comes from substantive differences, not position changes. Tested standard answers are fewer than 32 words, with longest/shortest ratio below 1.6.

## Limits

The authored exercise is brief and finite. It does not adapt like an expert human coach, evaluate arbitrary language, predict a manager's reaction, or prove learning transfer. One-minute completion is a design target, not measured user research. Actual skill improvement, retention, demand and paid value remain unproven. Native screen-reader and full accessibility audits remain pending.
