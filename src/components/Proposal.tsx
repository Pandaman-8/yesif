import { analyzeConflicts, causalSummary } from "../domain/conflicts";
import { NegotiationDirections } from "./ConflictView";
import { useMemo, type RefObject } from "react";
import { ArrowLeft, Bookmark, Copy, RotateCcw } from "lucide-react";
import {
  hours,
  optionTitle,
  type Option,
  type Scenario,
} from "../domain/engine";
import {
  blockedEvidence,
  proposalEvidence,
  selectedConsequences,
} from "../domain/conversation";
import { NegotiationPractice } from "./NegotiationPractice";
import { AllocationView, ChangesView } from "./AllocationView";
interface Props {
  scenario: Scenario;
  chosen: Option | null;
  heading: RefObject<HTMLHeadingElement | null>;
  message: string;
  scope: string;
  setScope: (s: string) => void;
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
  setScope,
  setMessage,
  copy,
  save,
  saveDraft,
  savedId,
  reset,
  compare,
}: Props) {
  const analysis = useMemo(() => analyzeConflicts(scenario), [scenario]);
  const facts = useMemo(
    () => (chosen ? selectedConsequences(scenario, chosen, scope) : null),
    [scenario, chosen, scope],
  );
  const evidence = useMemo(
    () =>
      chosen
        ? proposalEvidence(scenario, chosen, scope)
        : blockedEvidence(scenario),
    [scenario, chosen, scope],
  );
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
            <h2>Your message</h2>
            <span className="small-pill">Editable draft</span>
          </div>
          {facts?.smaller && (
            <div className="proposal-scope">
              <label htmlFor="proposal-scope">
                What will the smaller version include?
              </label>
              <input
                id="proposal-scope"
                maxLength={500}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="For example: five core slides, without research or appendix"
                aria-describedby="scope-note"
              />
              <p id="scope-note" className="help">
                {scope.trim()
                  ? "Agree these contents and their estimate together."
                  : "Still to be defined and agreed. A time fit does not verify a useful deliverable."}{" "}
                Your message stays unchanged until you update it.
              </p>
              <div
                role={
                  scope.trim() && !message.includes(scope.trim())
                    ? "status"
                    : undefined
                }
                aria-live="polite"
                className="scope-sync-notice"
              >
                {scope.trim() && !message.includes(scope.trim())
                  ? "This description is not included verbatim in your draft. Update the generated draft or edit the message yourself. Paraphrases are not checked."
                  : ""}
              </div>
              <button className="text-button" onClick={reset}>
                Update generated draft with this scope
              </button>
            </div>
          )}
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
            <summary>
              {chosen
                ? "Why this fits the time constraints"
                : "Why this is blocked"}
            </summary>
            <dl className="proposal-evidence">
              {evidence.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
            {!chosen && <NegotiationDirections analysis={analysis} />}
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
            <p>Fits the entered time constraints</p>
            <ul className="selected-consequences">
              {facts!.items.map((text, index) => (
                <li key={index}>{text}</li>
              ))}
            </ul>
            <p className="fine-print">
              Proposed, not yet agreed. Calculation checks the selected plan; it
              does not verify your edited message.
            </p>
            <AllocationView scenario={scenario} plan={chosen} />
          </aside>
        ) : (
          <aside className="conflict-summary">
            <h2>Conditions still need to change.</h2>
            <p>{causalSummary(scenario, analysis)}</p>
          </aside>
        )}
      </div>
      {chosen && (
        <details className="proposal-obligations">
          <summary>Which obligations change — and which remain?</summary>
          <ChangesView scenario={scenario} plan={chosen} />
        </details>
      )}
      <NegotiationPractice
        key={JSON.stringify([scenario, chosen?.deferred, chosen?.requestUnits])}
        scenario={scenario}
        chosen={chosen}
        scope={scope}
      />
    </>
  );
}
