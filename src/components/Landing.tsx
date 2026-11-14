import type { RefObject } from "react";
import { ArrowRight, Check, ArrowDown } from "lucide-react";
import { analyze, exampleScenario, hours, simulate } from "../domain/engine";

// The preview uses the same scenario and deadline checks as the interactive demo.
const sample = exampleScenario();
const before = analyze(sample).baseline;
const candidate = analyze(sample).options.find(
  (option) => option.kind === "defer",
);
const after =
  candidate && simulate(sample, candidate.deferred, candidate.requestUnits);
const moved = sample.tasks.filter((task) => after?.deferred.includes(task.id));

export function Landing({
  heading,
  start,
}: {
  heading: RefObject<HTMLHeadingElement | null>;
  start: (example: boolean) => void;
}) {
  return (
    <section className="landing-v21 wrap">
      <div className="landing-intro">
        <p className="landing-kicker">
          For the work that arrives on top of everything else.
        </p>
        <h1 ref={heading} tabIndex={-1}>
          Too much on your plate?
          <br />
          <em>Find what can change.</em>
        </h1>
        <p className="landing-description">
          A new request, an already full week. Check what fits, compare
          realistic trade-offs, and prepare a clear response.
        </p>
        <div className="landing-actions">
          <button className="button primary" onClick={() => start(false)}>
            Plan my workload <ArrowRight size={18} />
          </button>
          <button className="text-button" onClick={() => start(true)}>
            Explore an example <ArrowRight size={16} />
          </button>
        </div>
        <p className="landing-privacy">
          No account needed. Your task details stay in this browser.
        </p>
      </div>
      <div
        className="decision-preview"
        aria-label="Calculated fictional example"
      >
        <div className="preview-header">
          <span>A fictional week</span>
          <span>Calculated with YESIF</span>
        </div>
        <div className="preview-before">
          <div>
            <span className="preview-label">With the new request</span>
            <p className="preview-number">
              {hours(before.total)}h{" "}
              <span>/ {hours(before.capacity)}h available</span>
            </p>
          </div>
          <span className="preview-warning">
            {before.fits
              ? "Fits deadlines"
              : `${hours(before.overload)}h over capacity`}
          </span>
        </div>
        <ul className="preview-work">
          {[...sample.tasks, sample.request].map((task) => (
            <li
              key={task.id}
              className={task.id === sample.request.id ? "preview-new" : ""}
            >
              <span>
                {task.name}
                {task.id === sample.request.id && <small>New request</small>}
              </span>
              <strong>{hours(task.units)}h</strong>
            </li>
          ))}
        </ul>
        {after && (
          <>
            <div className="preview-change">
              <ArrowDown size={18} />
              <p>
                <strong>
                  Propose moving {moved.map((task) => task.name).join(", ")}
                </strong>
                <span>Beyond this week, with an agreed new deadline.</span>
              </p>
            </div>
            <div className="preview-after">
              <div>
                <span className="preview-label">If that change is agreed</span>
                <p className="preview-number">
                  {hours(after.result.total)}h{" "}
                  <span>/ {hours(after.result.capacity)}h available</span>
                </p>
              </div>
              <p>
                <Check size={16} />{" "}
                {after.result.fits
                  ? "Fits every weekday deadline"
                  : "Still needs a change"}
              </p>
            </div>
          </>
        )}
      </div>
      <div className="landing-process" aria-label="What you do and receive">
        <div>
          <span>01</span>
          <p>
            <strong>Add your situation</strong>New request, focused time,
            existing work.
          </p>
        </div>
        <div>
          <span>02</span>
          <p>
            <strong>Compare real changes</strong>See the effect on each
            deadline.
          </p>
        </div>
        <div>
          <span>03</span>
          <p>
            <strong>Prepare your response</strong>A specific proposal you can
            edit.
          </p>
        </div>
      </div>
    </section>
  );
}
