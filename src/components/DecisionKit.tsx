import { useState } from "react";
import type { SavedDecision } from "../storage/scenarios";
import { decisionBrief, playbook } from "../domain/decisionTools";
import { ArtifactText } from "./ArtifactText";
export function DecisionKit({
  decision,
  print,
}: {
  decision: SavedDecision;
  print: (text: string) => void;
}) {
  const [prepOpen, setPrepOpen] = useState(false),
    [briefOpen, setBriefOpen] = useState(false);
  return (
    <div className="decision-kit">
      <details onToggle={(e) => setPrepOpen(e.currentTarget.open)}>
        <summary>Negotiation Playbook · Kit demo</summary>
        {prepOpen && (
          <>
            <p className="help">
              A preparation note for this saved plan. The possible objection is
              authored practice, not a prediction.
            </p>
            <ArtifactText
              label="Negotiation playbook"
              text={playbook(decision)}
            />
          </>
        )}
      </details>
      <details onToggle={(e) => setBriefOpen(e.currentTarget.open)}>
        <summary>Decision Brief · Kit demo</summary>
        {briefOpen && (
          <>
            <p className="help">
              A factual record of proposed conditions and your recorded outcome.
              No employer approval is implied.
            </p>
            <ArtifactText
              label="Decision brief"
              text={decisionBrief(decision)}
              print={() => print(decisionBrief(decision))}
            />
          </>
        )}
      </details>
    </div>
  );
}
