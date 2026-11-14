import { useState, type RefObject } from "react";
import { ArrowLeft, Bookmark, Copy, RotateCcw } from "lucide-react";
import {
  hours,
  optionTitle,
  type Option,
  type Scenario,
} from "../domain/engine";
import { detailedProposal, practiceFor } from "../domain/conversation";
import { AllocationView, ChangesView } from "./AllocationView";
interface Props {
  scenario: Scenario;
  chosen: Option | null;
  heading: RefObject<HTMLHeadingElement | null>;
  message: string;
  scope: string;
  setMessage: (s: string) => void;
  copy: () => void;
  save: () => void;
  saveDraft: () => boolean;
  savedId: string;
  reset: () => void;
  compare: () => void;
}
export function Proposal({
  scenario,
  chosen,
  heading,
  message,
  scope,
  setMessage,
  copy,
  save,
  saveDraft,
  savedId,
  reset,
  compare,
}: Props) {
  const [practice, setPractice] = useState<string | null>(null);
  const exercise = practiceFor(scenario, chosen);
  const answer = exercise.choices.find((c) => c.id === practice);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Make your proposal</p>
          <h1 ref={heading} tabIndex={-1}>
            {chosen
              ? "A clear ask. A better starting point."
              : "Request to renegotiate"}
          </h1>
          <p>
            {chosen
              ? "Your numbers, your choice. Make the words sound like you."
              : "An unresolved conflict — this is a request to change conditions, not a feasible plan."}
          </p>
        </div>
        <button className="text-button" onClick={compare}>
          <ArrowLeft size={16} /> Compare options
        </button>
      </div>
      <div className={`proposal-layout ${chosen ? "" : "unresolved-proposal"}`}>
        <section className="panel proposal-panel">
          <div className="section-title">
            <h2>
              {chosen ? "Your short proposal" : "Your renegotiation request"}
            </h2>
            <span className="small-pill">Editable draft</span>
          </div>
          <label className="sr-only" htmlFor="proposal-text">
            Your proposal
          </label>
          <textarea
            id="proposal-text"
            value={message}
            maxLength={10000}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="proposal-actions">
            <button
              className="button primary"
              onClick={copy}
              disabled={!message.trim()}
            >
              <Copy size={16} /> Copy proposal
            </button>
            {chosen ? (
              <button
                className="text-button"
                onClick={save}
                disabled={!message.trim()}
              >
                <Bookmark size={16} />
                {savedId ? "Update saved decision" : "Save decision"}
              </button>
            ) : (
              <button className="text-button" onClick={saveDraft}>
                Save local draft
              </button>
            )}
            <button
              className="reset-draft"
              aria-label="Reset proposal to generated draft"
              onClick={reset}
            >
              <RotateCcw size={18} />
            </button>
          </div>
          {!message.trim() && (
            <p className="help">
              Write a message before copying or saving a decision.
            </p>
          )}
          <p className="fine-print">
            Nothing is sent for you. Review before sharing. Edited text is not
            recalculated or scored.
          </p>
          <details className="detailed-explanation">
            <summary>Detailed explanation from the calculation</summary>
            <p>{detailedProposal(scenario, chosen, scope)}</p>
            <p className="fine-print">
              This explanation stays tied to the calculation. Your edits above
              do not change it.
            </p>
          </details>
        </section>
        {chosen ? (
          <aside className="choice-summary">
            <p className="eyebrow">Verified under entered assumptions</p>
            <h2>
              {optionTitle(scenario, chosen).replace(
                /^Defer /,
                "Propose moving ",
              )}
            </h2>
            <div className="chosen-numbers">
              <strong>{hours(chosen.result.total)}h</strong>
              <span>of {hours(chosen.result.capacity)}h available</span>
            </div>
            <p>Fits every weekday deadline</p>
            <p className="fine-print">
              Proposed, not yet agreed. Confirm the scope and priorities. Future
              capacity is unchecked.
            </p>
            <AllocationView scenario={scenario} plan={chosen} />
          </aside>
        ) : (
          <aside className="conflict-summary">
            <h2>Conditions still need to change.</h2>
            <p>
              No feasible schedule has been established. Ask which constraint
              can change, then return to your inputs and check again.
            </p>
          </aside>
        )}
      </div>
      {chosen && (
        <details className="proposal-obligations">
          <summary>Which obligations change — and which remain?</summary>
          <ChangesView scenario={scenario} plan={chosen} />
        </details>
      )}
      <section className="practice panel">
        <div>
          <p className="eyebrow">A short practice</p>
          <h2>
            {chosen?.kind === "accept"
              ? "What if the scope grows?"
              : "What if they push back?"}
          </h2>
          <p className="manager-quote">{exercise.prompt}</p>
          <p className="help">
            Choose the reply that names the constraint, offers a change and asks
            for agreement.
          </p>
        </div>
        <div className="practice-choices">
          {exercise.choices.map((c, i) => (
            <button
              key={c.id}
              className={`practice-choice ${practice === c.id ? "selected" : ""}`}
              aria-pressed={practice === c.id}
              onClick={() => setPractice(c.id)}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {c.text}
            </button>
          ))}
        </div>
        {answer && (
          <div className="practice-feedback" role="status">
            <strong>{answer.feedback}</strong>
            <ul>
              {[
                "Names the time constraint",
                "Offers a concrete change or scoped commitment",
                "Asks to agree priorities",
                "Avoids an unchecked promise",
              ].map((label, i) => (
                <li key={label}>
                  <span>{answer.checks[i] ? "✓" : "○"}</span>
                  {label}
                </li>
              ))}
            </ul>
            <small>
              Feedback describes this response only. It does not measure your
              real negotiation ability. No AI analysis.
            </small>
          </div>
        )}
      </section>
    </>
  );
}
