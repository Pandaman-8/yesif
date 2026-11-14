import { useMemo, useRef, useState } from "react";
import {
  practiceFor,
  RUBRIC,
  type ChoiceId,
  type PracticeChoice,
} from "../domain/practice";
import type { Option, Scenario } from "../domain/engine";

function Feedback({ choice }: { choice: PracticeChoice }) {
  return (
    <div className="practice-feedback" role="status">
      <p>
        <strong>What works.</strong> {choice.worked}
      </p>
      <p>
        <strong>
          {choice.id === "grounded" ? "Keep in mind." : "What to change."}
        </strong>{" "}
        {choice.improve}
      </p>
      {choice.id !== "grounded" && (
        <p>
          <strong>Try saying:</strong> “{choice.revision}”
        </p>
      )}
      <details className="rubric-evidence">
        <summary>Why this feedback?</summary>
        <dl>
          {choice.evidence.map((e) => (
            <div key={e.criterion}>
              <dt>
                {RUBRIC.find(([id]) => id === e.criterion)![1]} ·{" "}
                {e.status === "supported"
                  ? "Shown"
                  : e.status === "risk"
                    ? "Needs a check"
                    : "Not shown"}
              </dt>
              <dd>
                {e.quote && <q>{e.quote}</q>} {e.reason}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

export function NegotiationPractice({
  scenario,
  chosen,
  scope,
}: {
  scenario: Scenario;
  chosen: Option | null;
  scope: string;
}) {
  const [stage, setStage] = useState<
    "ready" | "first" | "second" | "done" | "skipped"
  >("ready");
  const [first, setFirst] = useState<ChoiceId | undefined>();
  const [second, setSecond] = useState<ChoiceId | undefined>();
  const title = useRef<HTMLHeadingElement>(null);
  const turn1 = useMemo(
    () => practiceFor(scenario, chosen, undefined, scope),
    [scenario, chosen, scope],
  );
  const turn2 = useMemo(
    () => (first ? practiceFor(scenario, chosen, first, scope) : null),
    [scenario, chosen, first, scope],
  );
  const turn = stage === "second" || stage === "done" ? turn2! : turn1;
  const selected = stage === "second" || stage === "done" ? second : first;
  const answer = turn?.choices.find((c) => c.id === selected);
  const firstAnswer = turn1.choices.find((c) => c.id === first);
  function transition(next: typeof stage) {
    setStage(next);
    setTimeout(() => title.current?.focus({ preventScroll: true }), 0);
  }
  function restart() {
    setFirst(undefined);
    setSecond(undefined);
    transition("first");
  }
  const active = stage === "first" || stage === "second";
  return (
    <section
      className="practice panel negotiation-practice"
      aria-labelledby="practice-title"
    >
      <div className="practice-topline">
        <p className="eyebrow">Optional · Two decisions</p>
        {active && (
          <button className="text-button" onClick={() => transition("skipped")}>
            Skip practice
          </button>
        )}
      </div>
      <h2 id="practice-title" ref={title} tabIndex={-1}>
        {stage === "done"
          ? "Two replies. One clearer condition."
          : active
            ? `Step ${stage === "first" ? "1 of 2 · Your response" : "2 of 2 · Their pushback"}`
            : "Rehearse the conversation"}
      </h2>
      {stage === "ready" || stage === "skipped" ? (
        <>
          <p>
            {stage === "skipped"
              ? "Practice skipped. Your proposal is unchanged."
              : "Try a response, then handle a follow-up. Practice with this plan before sharing your message."}
          </p>
          <button className="button outline" onClick={restart}>
            {stage === "skipped" ? "Try practice again" : "Start practice"}
          </button>
        </>
      ) : (
        <>
          <details className="practice-context">
            <summary>The situation you’re practicing</summary>
            <p>{turn.context}</p>
          </details>
          {stage === "done" ? (
            <>
              <p className="practice-recap">
                <strong>Your first response:</strong>{" "}
                {firstAnswer!.id === "grounded"
                  ? firstAnswer!.worked
                  : firstAnswer!.improve}
              </p>
              <p className="help">Your response to the follow-up</p>
              <blockquote className="practice-selected">
                {answer!.text}
              </blockquote>
              <Feedback choice={answer!} />
              <button className="button outline" onClick={restart}>
                Try again
              </button>
            </>
          ) : (
            <>
              <p className="manager-quote">{turn.prompt}</p>
              <p className="help">Choose what you would say next.</p>
              <div
                className="practice-choices"
                role="group"
                aria-label={`Step ${turn.step} replies`}
              >
                {turn.choices.map((c, i) => (
                  <button
                    key={c.id}
                    className={`practice-choice ${selected === c.id ? "selected" : ""}`}
                    aria-pressed={selected === c.id}
                    onClick={() => {
                      if (stage === "first") {
                        setFirst(c.id);
                        setSecond(undefined);
                      } else setSecond(c.id);
                    }}
                  >
                    <span aria-hidden="true">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {c.text}
                  </button>
                ))}
              </div>
              {answer && <Feedback choice={answer} />}
              <div className="practice-navigation">
                {stage === "second" && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setSecond(undefined);
                      transition("first");
                    }}
                  >
                    Back to first response
                  </button>
                )}
                <button
                  className="button primary"
                  disabled={!answer}
                  onClick={() =>
                    transition(stage === "first" ? "second" : "done")
                  }
                >
                  {stage === "first" ? "Hear the pushback" : "Finish practice"}
                </button>
              </div>
            </>
          )}
        </>
      )}
      <p className="fine-print">
        Feedback explains these authored replies only. It does not evaluate your
        edited message or measure your negotiation ability. No AI analysis.
      </p>
    </section>
  );
}
