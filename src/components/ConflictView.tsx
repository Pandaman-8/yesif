import { DAYS, hours } from "../domain/engine";
import type { ConflictAnalysis } from "../domain/conflicts";

/** Discussion directions are deliberately separate from checked plan cards. */
export function NegotiationDirections({
  analysis,
}: {
  analysis: ConflictAnalysis;
}) {
  return (
    <details className="causal-directions">
      <summary>Relevant changes to discuss</summary>
      <p className="fine-print">
        Not verified solutions. No condition has been changed or agreed.
      </p>
      <ul>
        {analysis.negotiationDirections.map((d) => (
          <li key={d.id}>
            <strong>{d.label}</strong>
            <p>{d.explanation}</p>
            <p>{d.assumptionToChange}</p>
          </li>
        ))}
      </ul>
      <p className="fine-print">{analysis.negotiationDirections[0]?.recheck}</p>
    </details>
  );
}
export function ConflictContributors({
  analysis,
}: {
  analysis: ConflictAnalysis;
}) {
  const c = analysis.firstConflict;
  if (!c) return null;
  return (
    <details className="causal-contributors">
      <summary>What contributes to {DAYS[c.day]}?</summary>
      <ul>
        {c.contributingCommitments.map((t) => (
          <li key={t.id}>
            {t.name} · {hours(t.units)}h · due {DAYS[t.deadline]}
            {!t.movable ? " · Fixed" : ""}
          </li>
        ))}
      </ul>
      <p>
        {c.requestContributes
          ? "The new request is also due by this date."
          : "The new request is due later and is excluded from this deadline’s due work."}
      </p>
      {analysis.conflicts.length > 1 && (
        <p>
          Other failed checks:{" "}
          {analysis.conflicts
            .slice(1)
            .map((p) => `${DAYS[p.day]} (${hours(p.deficit)}h short)`)
            .join("; ")}
          . Fixing only the first shortfall does not prove the week fits.
        </p>
      )}
    </details>
  );
}
