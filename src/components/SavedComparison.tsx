import { useState } from "react";
import { decisionFacts, scenarioDifferences } from "../domain/decisionTools";
import { hours, optionTitle } from "../domain/engine";
import type { SavedDecision } from "../storage/scenarios";
import { DecisionFacts } from "./DecisionFacts";
import { savedChoiceLabel, savedDate } from "./savedLabels";
export function SavedComparison({ decisions }: { decisions: SavedDecision[] }) {
  const [a, setA] = useState(""),
    [b, setB] = useState("");
  const first = decisions.find((d) => d.id === a),
    second = decisions.find((d) => d.id === b);
  const differences =
    first && second ? scenarioDifferences(first.scenario, second.scenario) : [];
  return (
    <section
      className="saved-comparison panel"
      aria-labelledby="saved-comparison-title"
    >
      <h2 id="saved-comparison-title">Compare two saved decisions</h2>
      <p>
        Recalculated from each snapshot. Neither is ranked as universally
        better.
      </p>
      {decisions.length < 2 ? (
        <p>Save a second distinct decision to compare its conditions here.</p>
      ) : (
        <>
          <div className="comparison-selects">
            {(
              [
                ["A", a, setA, b],
                ["B", b, setB, a],
              ] as const
            ).map(([label, value, set, other]) => (
              <label key={label}>
                Snapshot {label}
                <select
                  aria-label={`Snapshot ${label}`}
                  aria-describedby={`snapshot-${label}-description`}
                  value={decisions.some((d) => d.id === value) ? value : ""}
                  onChange={(e) => set(e.target.value)}
                >
                  <option value="">Choose a saved decision</option>
                  {decisions.map((d, i) => (
                    <option key={d.id} value={d.id} disabled={d.id === other}>
                      {savedChoiceLabel(d, i)}
                    </option>
                  ))}
                </select>
                <span
                  className="snapshot-description help"
                  id={`snapshot-${label}-description`}
                >
                  {(() => {
                    const d = decisions.find((d) => d.id === value);
                    return d
                      ? `${d.scenario.request.name} — ${optionTitle(d.scenario, decisionFacts(d.scenario, d.plan).plan)}. Saved ${savedDate(d)}.`
                      : "Select a snapshot to see its full change and saved date.";
                  })()}
                </span>
              </label>
            ))}
          </div>
          {first && second && first.id !== second.id && (
            <>
              <p className="comparison-context">
                {differences.length
                  ? "Different input scenarios — compare the conditions, not a claimed improvement."
                  : "Same input scenario — these snapshots propose different conditions or wording. No approval is implied."}
              </p>
              {differences.length > 0 && (
                <details>
                  <summary>What differs in the inputs?</summary>
                  <ul>
                    {differences.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </details>
              )}
              <div className="saved-comparison-grid">
                {[first, second].map((d, i) => {
                  const f = decisionFacts(d.scenario, d.plan, d.scope);
                  return (
                    <article
                      key={d.id}
                      aria-label={`Snapshot ${i === 0 ? "A" : "B"}`}
                    >
                      <p className="eyebrow">Snapshot {i === 0 ? "A" : "B"}</p>
                      <h3>{d.scenario.request.name}</h3>
                      <p className="help">Saved {savedDate(d)}</p>
                      <p>{optionTitle(d.scenario, f.plan)}</p>
                      <p className="snapshot-math">
                        <strong>
                          {hours(f.plan.result.total)}h /{" "}
                          {hours(f.plan.result.capacity)}h
                        </strong>{" "}
                        · {hours(f.plan.result.capacity - f.plan.result.total)}h
                        unassigned
                      </p>
                      <p>{f.priority}</p>
                      <p>{f.items[0]}</p>
                      <p>
                        {f.moved.length
                          ? `${hours(f.moved.reduce((n, t) => n + t.units, 0))}h moved, still owed. New dates need agreement; future capacity unchecked.`
                          : "Existing commitments keep their deadlines."}
                      </p>
                      {f.smaller && (
                        <p>
                          {d.scope?.trim()
                            ? `Smaller contents to agree: ${d.scope}`
                            : "Smaller contents and estimate still need agreement."}
                        </p>
                      )}
                      <details className="comparison-details">
                        <summary>All inputs and deadline checks</summary>
                        <DecisionFacts
                          scenario={d.scenario}
                          plan={f.plan}
                          scope={d.scope}
                        />
                      </details>
                      <details>
                        <summary>Saved message and recorded outcome</summary>
                        <p>{d.message}</p>
                        <p>
                          Recorded by you: {d.outcome}. {d.notes}
                        </p>
                      </details>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
