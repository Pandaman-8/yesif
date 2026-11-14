import { shortProposal } from "../domain/conversation";
import { simulate } from "../domain/engine";
import type { SavedDecision } from "../storage/scenarios";
export function FollowUp({ decision: d }: { decision: SavedDecision }) {
  const text = (() => {
    const condition = shortProposal(
      d.scenario,
      simulate(d.scenario, d.plan.deferred, d.plan.requestUnits),
      d.scope,
    );
    return d.outcome === "agreed"
      ? `Thanks for discussing ${d.scenario.request.name}. My understanding is: ${d.notes.trim() || "[add the exact terms we agreed]"}. Could you confirm that I captured this correctly? I’ll check the updated timing before committing to any further changes.`
      : `Following up on ${d.scenario.request.name}: ${condition}${d.notes.trim() ? ` My note for this conversation: ${d.notes.trim()}.` : ""} Could we confirm the next step?`;
  })();
  return (
    <details className="follow-up">
      <summary>Prepare a follow-up · Kit demo</summary>
      <p className="help">
        Built from your saved condition and your reported outcome. Review any
        notes before sharing. No message is sent.
      </p>
      <label>
        Follow-up message
        <textarea
          value={text}
          maxLength={10000}
          readOnly
          onFocus={(e) => e.target.select()}
        />
      </label>
      <p className="fine-print">
        Select the message to copy it, then edit it where you send it. Update
        your outcome notes to change the recorded terms.
      </p>
    </details>
  );
}
