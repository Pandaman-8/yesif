import { startingOptions } from "../domain/options";
import { useState, type RefObject } from "react";
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from "lucide-react";
import {
  analyze,
  DAYS,
  hours,
  optionTitle,
  simulate,
  type Option,
  type Scenario,
} from "../domain/engine";
import { conflictText, DeadlineTable } from "./Shared";
import { AllocationView, ChangesView } from "./AllocationView";
interface Props {
  scenario: Scenario;
  heading: RefObject<HTMLHeadingElement | null>;
  demo: boolean;
  simulation: Option;
  deferred: string[];
  units: number;
  scope: string;
  setDeferred: (ids: string[]) => void;
  setUnits: (n: number) => void;
  setScope: (s: string) => void;
  choose: (o: Option) => void;
  edit: () => void;
  unresolved: () => void;
}
export function Results({
  scenario,
  heading,
  demo,
  simulation,
  deferred,
  units,
  scope,
  setDeferred,
  setUnits,
  setScope,
  choose,
  edit,
  unresolved,
}: Props) {
  const output = analyze(scenario);
  const possible = simulate(
    scenario,
    scenario.tasks.filter((t) => t.movable).map((t) => t.id),
    1,
  ).result.fits;
  const [advanced, setAdvanced] = useState(false);
  const options = startingOptions(scenario);
  return (
    <div className="results-screen">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Find your if</p>
          <h1 ref={heading} tabIndex={-1}>
            {output.baseline.fits
              ? "There’s room for this yes."
              : "Something has to give. Not you."}
          </h1>
          <p>
            {demo
              ? "Your manager just added another urgent request."
              : `${scenario.request.name} · ${hours(scenario.request.units)}h requested by ${DAYS[scenario.request.deadline]}`}
          </p>
        </div>
        <button className="text-button" onClick={edit}>
          <ArrowLeft size={16} /> Edit workload
        </button>
      </div>
      {demo && (
        <p className="demo-context">
          A fictional week, real calculations. You have{" "}
          <strong>{hours(output.existing.total)}h committed</strong>,{" "}
          <strong>{hours(output.baseline.capacity)}h available</strong>, and a
          new <strong>{hours(scenario.request.units)}h request</strong>.{" "}
          {output.baseline.fits
            ? "See how it fits below."
            : "Choose a change you could discuss. We’ll help you put it into words."}
        </p>
      )}
      <section
        className={`reality ${output.baseline.fits ? "is-feasible" : "is-conflict"}`}
        aria-label="Reality check"
      >
        <div>
          <p className="eyebrow">If you accept everything</p>
          <div className="big-number">
            {hours(output.baseline.total)}h{" "}
            <span>/ {hours(output.baseline.capacity)}h</span>
          </div>
          <p>
            {hours(output.existing.total)}h committed +{" "}
            {hours(scenario.request.units)}h requested
          </p>
        </div>
        <div className="reality-message">
          <span className="reality-pill">
            {output.baseline.fits
              ? "Fits your estimates"
              : output.baseline.overload
                ? `You need ${hours(output.baseline.overload)} more hours than you have.`
                : "The weekly total fits. An earlier deadline does not."}
          </span>
          <p>
            {output.baseline.fits
              ? "Confirm the scope and priorities before committing."
              : conflictText(output.baseline)}
          </p>
        </div>
      </section>
      {!output.existing.fits && (
        <p className="error-box">
          Existing commitments already conflict with available time. A smaller
          new request alone may not solve this.
        </p>
      )}
      <section aria-label="Your options">
        <div className="options-heading">
          <h2>
            {options.length
              ? "Your options"
              : possible
                ? "Two things need to change together."
                : "This request cannot fit under the current conditions."}
          </h2>
          <p>
            {options.length
              ? "Each option fits this week’s entered hours and deadlines. Choose one to prepare your proposal; changes still need agreement."
              : possible
                ? "Try moving negotiable work and reducing the new deliverable together in the simulator below."
                : "Even moving every negotiable commitment and reducing the request to 15 minutes leaves a conflict. You can still ask to renegotiate."}
          </p>
        </div>
        <div className="option-grid">
          {options.map((o, i) => (
            <article className="option-card" key={o.id}>
              <div className="option-top">
                <span className="option-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>Verified in this week’s model</span>
              </div>
              <h3>
                {optionTitle(scenario, o).replace(/^Defer /, "Propose moving ")}
              </h3>
              <p>
                {o.kind === "combined"
                  ? `Agree to move the named work beyond this week and reduce the request to ${hours(o.requestUnits)}h. Other commitments keep their deadlines. New dates and scope need agreement; future capacity is unchecked.`
                  : o.kind === "defer"
                    ? "Keep the full new request. Agree a new date for the named work; future capacity is unchecked."
                    : o.kind === "scope"
                      ? `Keep all existing commitments and deadlines. Agree what the smaller ${hours(o.requestUnits)}h deliverable includes.`
                      : "Keep your existing commitments, scope and deadlines."}
              </p>
              <div className="option-math">
                <span>
                  <strong>{hours(o.result.total)}h</strong> /{" "}
                  {hours(o.result.capacity)}h planned
                </span>
                <span>
                  <Check size={16} />
                  {hours(o.result.capacity - o.result.total)}h left
                </span>
              </div>
              <AllocationView scenario={scenario} plan={o} />
              <button
                className={`button ${i === 0 ? "primary" : "outline"} full`}
                onClick={() =>
                  choose(simulate(scenario, o.deferred, o.requestUnits))
                }
              >
                {o.kind === "accept"
                  ? "Prepare my reply"
                  : "Use this trade-off"}
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
        {!possible && (
          <div className="conflict-path">
            <p>
              <strong>What is blocking the plan?</strong>{" "}
              {scenario.tasks
                .filter((t) => !t.movable)
                .map(
                  (t) => `${t.name} (${hours(t.units)}h, ${DAYS[t.deadline]})`,
                )
                .join("; ") ||
                "The requested work needs more focused time before its deadline."}
            </p>
            <p>
              Discuss a different deadline, a smaller deliverable, more
              available time, or a change to a fixed commitment. None of these
              is assumed or automatically applied.
            </p>
            <button className="button primary" onClick={unresolved}>
              Prepare a renegotiation request <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
      <section className="advanced-section">
        <button
          className="advanced-toggle"
          aria-expanded={advanced}
          aria-controls="advanced-simulator"
          onClick={() => setAdvanced(!advanced)}
        >
          <span>Explore your own trade-off</span>
          <span>{advanced ? "Close −" : "Customize +"}</span>
        </button>
        <p className="help">
          Optional: combine changes, keep fixed work protected, and see every
          deadline recalculate.
        </p>
        {advanced && (
          <div
            id="advanced-simulator"
            className="simulator"
            aria-label="Interactive trade-off simulator"
          >
            <div className="sim-controls">
              <h2>What could change?</h2>
              <div className="sim-tasks">
                {scenario.tasks.map((t) => (
                  <label
                    key={t.id}
                    className={`sim-task ${!t.movable ? "locked" : ""} ${deferred.includes(t.id) ? "deferred" : ""}`}
                  >
                    <input
                      type="checkbox"
                      disabled={!t.movable}
                      checked={deferred.includes(t.id)}
                      aria-label={`Defer ${t.name}`}
                      onChange={(e) =>
                        setDeferred(
                          e.target.checked
                            ? [...deferred, t.id]
                            : deferred.filter((id) => id !== t.id),
                        )
                      }
                    />
                    <span className="sim-task-text">
                      <strong>{t.name}</strong>
                      <small>
                        Due {DAYS[t.deadline]} ·{" "}
                        {t.movable
                          ? "Propose moving beyond this week"
                          : "Fixed — edit workload to reconsider"}
                      </small>
                    </span>
                    <span className="sim-task-hours">
                      {hours(t.units)}h{!t.movable && <LockKeyhole size={14} />}
                    </span>
                  </label>
                ))}
              </div>
              <div className="scope-control">
                <p className="scope-task-name">
                  {scenario.request.name} · due{" "}
                  {DAYS[scenario.request.deadline]}
                </p>
                <div>
                  <label htmlFor="scope-slider">New request’s scope</label>
                  <strong>
                    {hours(units)}h{" "}
                    <span>/ {hours(scenario.request.units)}h</span>
                  </strong>
                </div>
                <input
                  id="scope-slider"
                  type="range"
                  min="1"
                  max={scenario.request.units}
                  step="1"
                  value={units}
                  aria-valuetext={`${hours(units)} hours`}
                  onChange={(e) => setUnits(Number(e.target.value))}
                />
                <div className="scope-steps">
                  <button
                    aria-label="Reduce scope by 15 minutes"
                    disabled={units <= 1}
                    onClick={() => setUnits(units - 1)}
                  >
                    −
                  </button>
                  <span>
                    15-minute steps · min 0.25h, max{" "}
                    {hours(scenario.request.units)}h
                  </span>
                  <button
                    aria-label="Increase scope by 15 minutes"
                    disabled={units >= scenario.request.units}
                    onClick={() => setUnits(units + 1)}
                  >
                    +
                  </button>
                </div>
                <p>
                  Smaller scope means a smaller deliverable, not the same work
                  done faster.
                </p>
                {units < scenario.request.units && (
                  <label className="scope-description">
                    What would the smaller deliverable include? (optional)
                    <input
                      maxLength={500}
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      placeholder="e.g. Core slides, without the appendix"
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="sim-result">
              <div aria-live="polite" aria-atomic="true">
                <p className="eyebrow">With your changes</p>
                <div className="sim-number">
                  {hours(simulation.result.total)}h{" "}
                  <span>/ {hours(simulation.result.capacity)}h</span>
                </div>
                <span
                  className={`sim-status ${simulation.result.fits ? "fits" : ""}`}
                >
                  {simulation.result.fits
                    ? "Fits every weekday deadline"
                    : "Still needs a change"}
                </span>
                <p className="sim-explanation" id="simulation-state">
                  {simulation.result.fits
                    ? `${hours(simulation.result.capacity - simulation.result.total)}h available after these changes. Agreement is still needed.`
                    : conflictText(simulation.result) +
                      " Change a negotiable commitment or reduce the deliverable before using this plan."}
                </p>
              </div>
              <button
                className="button primary full"
                disabled={!simulation.result.fits}
                aria-describedby="simulation-state"
                onClick={() => choose(simulation)}
              >
                Use this plan <ArrowRight size={16} />
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setDeferred([]);
                  setUnits(scenario.request.units);
                }}
              >
                Reset changes
              </button>
              <AllocationView scenario={scenario} plan={simulation} />
              <details className="proof">
                <summary>Check every deadline</summary>
                <DeadlineTable result={simulation.result} />
              </details>
            </div>
            <ChangesView scenario={scenario} plan={simulation} />
          </div>
        )}
      </section>
      <details className="assumptions">
        <summary>Original deadline check and assumptions</summary>
        <DeadlineTable result={output.baseline} />
        <p>
          One person, five weekdays, divisible work available from the start. No
          dependencies, fixed appointments or future capacity. Options
          prioritize fewer high-priority changes, then fewer tasks and fewer
          deferred hours. Up to two deferral options plus a smaller scope are
          shown when available. When no full-scope option exists, we also check
          combined changes. Other combinations can be explored above.
        </p>
      </details>
    </div>
  );
}
