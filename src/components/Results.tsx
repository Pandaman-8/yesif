import {
  analyzeConflicts,
  causalSummary,
  simulationConstraint,
} from "../domain/conflicts";
import { ConflictContributors, NegotiationDirections } from "./ConflictView";
import { useMemo, useState, type RefObject } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import {
  DAYS,
  hours,
  simulate,
  type Option,
  type Scenario,
} from "../domain/engine";
import { decisionFacts } from "../domain/decisionTools";
import { DecisionFacts } from "./DecisionFacts";
import { DeadlineTable } from "./Shared";
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
  const output = useMemo(() => analyzeConflicts(scenario), [scenario]);
  const baseline = output.baseline;
  const firstConflict = baseline.checkpoints.find((c) => c.deficit > 0);
  const existingConflict = output.existingFirstConflict;
  const possible = simulate(
    scenario,
    scenario.tasks.filter((t) => t.movable).map((t) => t.id),
    1,
  ).result.fits;
  const [advanced, setAdvanced] = useState(false);
  const options = output.verifiedAlternatives.map((a) => a.plan);
  const deadlineLeads = !!firstConflict && (!possible || firstConflict.day < 4);
  const title = baseline.fits
    ? "This request fits your estimated week."
    : deadlineLeads
      ? `Your ${DAYS[firstConflict!.day]} deadline is short by ${hours(firstConflict!.deficit)} ${firstConflict!.deficit === 4 ? "hour" : "hours"}.`
      : "Your current plan needs a change.";
  return (
    <div
      className={`results-screen ${baseline.fits ? "result-fits" : possible ? "result-options" : "result-unresolved"}`}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {baseline.fits
              ? "Your week, checked"
              : possible
                ? "Find your if"
                : "A condition needs to change"}
          </p>
          <h1 ref={heading} tabIndex={-1}>
            {title}
          </h1>
          <p className="result-request">
            {scenario.request.name} · {hours(scenario.request.units)}h requested
            by {DAYS[scenario.request.deadline]}
          </p>
          {demo && (
            <p className="result-demo">Fictional example · real calculations</p>
          )}
        </div>
        <button className="text-button" onClick={edit}>
          <ArrowLeft size={16} /> Edit workload
        </button>
      </div>

      <section
        className={`result-overview ${baseline.fits ? "is-feasible" : "is-conflict"} ${deadlineLeads ? "deadline-leads" : ""}`}
        aria-label="Reality check"
      >
        <div className="week-evidence">
          <p className="eyebrow">
            {baseline.fits
              ? "Planned this week"
              : "Whole week · before changes"}
          </p>
          <div className="big-number">
            {hours(baseline.total)}h{" "}
            <span>
              / {hours(baseline.capacity)}h <small>available</small>
            </span>
          </div>
          <p className="work-breakdown">
            {hours(output.existing.total)}h committed +{" "}
            {hours(scenario.request.units)}h requested
          </p>
          {baseline.fits ? (
            <p className="capacity-note">
              <Check size={18} aria-hidden="true" />{" "}
              <strong>
                {hours(baseline.capacity - baseline.total)}h unassigned
              </strong>
            </p>
          ) : baseline.overload > 0 ? (
            <p className="capacity-note warning">
              <AlertCircle size={18} aria-hidden="true" />
              <strong>{hours(baseline.overload)}h over weekly capacity</strong>
            </p>
          ) : (
            <p className="capacity-note">
              Weekly total fits; an earlier deadline does not.
            </p>
          )}
        </div>
        <div className="outcome-evidence">
          {baseline.fits ? (
            <>
              <p className="outcome-label">
                <Check size={18} aria-hidden="true" /> All weekday deadlines fit
              </p>
              <p>Keep your commitments, scope and deadlines.</p>
              <p className="result-caveat">
                Based on your estimates, not a delivery guarantee.
              </p>
              <button
                className="button primary"
                onClick={() =>
                  choose(simulate(scenario, [], scenario.request.units))
                }
              >
                Prepare a confirmation <ArrowRight size={16} />
              </button>
            </>
          ) : (
            firstConflict && (
              <>
                <p className="outcome-label">
                  <AlertCircle size={18} aria-hidden="true" /> First missed
                  deadline · {DAYS[firstConflict.day]}
                </p>
                {deadlineLeads && (
                  <div className="deadline-facts">
                    <p>
                      <strong>{hours(firstConflict.due)}h</strong>
                      <span>due by {DAYS[firstConflict.day]}</span>
                    </p>
                    <p>
                      <strong>{hours(firstConflict.available)}h</strong>
                      <span>available through {DAYS[firstConflict.day]}</span>
                    </p>
                  </div>
                )}
                {!deadlineLeads && (
                  <p className="deadline-shortfall">
                    Compare the checked changes below.
                  </p>
                )}
                {baseline.overload === 0 && (
                  <p className="result-caveat">
                    Spare time later in the week cannot repair this deadline.
                  </p>
                )}
                {!existingConflict && (
                  <p className="result-caveat">
                    {causalSummary(scenario, output)}
                  </p>
                )}
                {existingConflict && (
                  <p className="existing-conflict">
                    <strong>
                      Your existing commitments already have a conflict.
                    </strong>{" "}
                    {causalSummary(scenario, output)}
                  </p>
                )}
                <ConflictContributors analysis={output} />
              </>
            )
          )}
        </div>
        {baseline.fits && (
          <div className="overview-details">
            <AllocationView scenario={scenario} plan={options[0]} />
          </div>
        )}
      </section>

      {!baseline.fits && possible && options.length > 0 && (
        <section aria-label="Your options" className="result-alternatives">
          <div className="options-heading">
            <h2>
              {options.length === 1
                ? "A change that could make this week fit."
                : "Changes that could make this week fit."}
            </h2>
            <p>
              Each fits the entered hours and deadlines. Choose what you can
              agree on.
            </p>
          </div>
          <div className={`option-grid option-count-${options.length}`}>
            {options.map((o, i) => (
              <TradeoffCard
                key={o.id}
                scenario={scenario}
                option={o}
                index={i}
                choose={choose}
              />
            ))}
          </div>
        </section>
      )}
      {!baseline.fits && !possible && (
        <section className="unresolved-next" aria-label="Next step">
          <div>
            <h2>Ask to change the conditions.</h2>
            <p>
              No verified solution under these conditions. The allowed moves and
              scope cuts still leave a deadline conflict.
            </p>
            <p className="result-caveat">
              {output.firstConflict && (
                <>
                  Address work or usable time by{" "}
                  {DAYS[output.firstConflict.day]}.{" "}
                  {output.firstConflict.contributingCommitments
                    .map((t) => t.name)
                    .join("; ")}
                  {output.requestContributesToFirstConflict
                    ? `${output.firstConflict.contributingCommitments.length ? "; " : ""}${scenario.request.name}`
                    : ""}
                  .
                </>
              )}
            </p>
            <NegotiationDirections analysis={output} />
          </div>
          <button className="button primary" onClick={unresolved}>
            Prepare a renegotiation request <ArrowRight size={16} />
          </button>
        </section>
      )}
      {!baseline.fits && possible && !options.length && (
        <p className="manual-route">
          A combination can fit. Open the optional simulator to combine task
          moves with a smaller deliverable.
        </p>
      )}
      {possible && (
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
            Optional: combine task moves and a smaller deliverable. Fixed
            deadlines stay protected.
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
                        {hours(t.units)}h
                        {!t.movable && <LockKeyhole size={14} />}
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
              <div
                className={`sim-result ${simulation.result.fits ? "is-feasible" : "is-conflict"}`}
              >
                <div>
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
                  <p
                    className="sim-explanation"
                    id="simulation-state"
                    role="status"
                    aria-atomic="true"
                  >
                    {simulationConstraint(scenario, simulation)}
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
                {simulation.result.fits && (
                  <AllocationView scenario={scenario} plan={simulation} />
                )}
                <details className="proof">
                  <summary>Check every deadline</summary>
                  <DeadlineTable result={simulation.result} />
                </details>
              </div>
              <details className="simulation-ledger">
                <summary>Review changed obligations</summary>
                <ChangesView scenario={scenario} plan={simulation} />
              </details>
            </div>
          )}
        </section>
      )}
      <details className="assumptions result-proof">
        <summary>Detailed deadline checks and assumptions</summary>
        <DeadlineTable result={output.baseline} />
        <p>
          One person, five weekdays, divisible work available from the start. No
          dependencies, fixed appointments or future capacity. Options
          prioritize fewer high-priority changes, then fewer tasks and fewer
          deferred hours. Up to two deferral options plus a smaller scope are
          shown when available. When no full-scope option exists, we also check
          combined changes.{" "}
          {possible
            ? "Other combinations can be explored in the optional simulator."
            : "Even moving all negotiable work and reducing the request to 0.25h leaves a conflict."}
        </p>
      </details>
    </div>
  );
}

function TradeoffCard({
  scenario,
  option: o,
  index,
  choose,
}: {
  scenario: Scenario;
  option: Option;
  index: number;
  choose: (option: Option) => void;
}) {
  const facts = decisionFacts(scenario, o);
  const moved = facts.moved;
  const reduced = o.requestUnits < scenario.request.units;
  const title = moved.length
    ? `Move ${moved.map((t) => t.name).join(" + ")}${reduced ? " + reduce scope" : ""}`
    : "Reduce the new request";
  const titleId = `tradeoff-${index}`;
  return (
    <article className="option-card" aria-labelledby={titleId}>
      <div className="option-decision">
        <div className="option-top">
          <span className="option-letter">
            {String.fromCharCode(65 + index)}
          </span>
          <span>Possible change</span>
        </div>
        <h3 id={titleId}>{title}</h3>
        <dl className="option-facts">
          <div>
            <dt>What changes</dt>
            <dd>
              {moved.length > 0 && (
                <span>
                  {moved
                    .map((t) => `${t.name} · ${hours(t.units)}h`)
                    .join("; ")}{" "}
                  beyond this week.
                </span>
              )}
              {reduced && (
                <span>
                  {hours(o.requestUnits)}h of {hours(scenario.request.units)}h
                  requested: a smaller deliverable.
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>What stays</dt>
            <dd>
              {moved.length
                ? scenario.tasks.length === moved.length
                  ? "No existing work remains this week."
                  : `${facts.retained.map((t) => t.name).join("; ")} keep their deadlines.`
                : `All existing commitments and deadlines: ${facts.retained.map((t) => t.name).join("; ")}.`}
              {!reduced && (
                <span>
                  Full {hours(o.requestUnits)}h {scenario.request.name}.
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
      <div className="option-outcome">
        <p className="option-priority">{facts.priority}</p>
        {moved.length > 0 && (
          <p className="help">
            {hours(moved.reduce((n, t) => n + t.units, 0))}h moved, still owed.
          </p>
        )}
        <div className="option-math">
          <span>
            <strong>{hours(o.result.total)}h</strong> /{" "}
            {hours(o.result.capacity)}h <small>planned / available</small>
          </span>
          <span>
            <strong>{hours(o.result.capacity - o.result.total)}h</strong>
            <small>unassigned</small>
          </span>
        </div>
        <p className="option-fit">
          <Check size={16} aria-hidden="true" /> Fits every weekday deadline
        </p>
        <div className="option-agreement">
          <p>
            <ArrowUpRight size={16} aria-hidden="true" />
            <strong>Needs agreement</strong>
          </p>
          <p>
            {moved.length
              ? `New ${moved.length === 1 ? "deadline" : "deadlines"}${reduced ? " and a smaller deliverable" : ""}. Future capacity unchecked.`
              : "Agree exactly what the smaller deliverable includes."}
          </p>
        </div>
        <button
          className="button primary full"
          aria-describedby={titleId}
          onClick={() => choose(simulate(scenario, o.deferred, o.requestUnits))}
        >
          Use this trade-off <ArrowRight size={16} />
        </button>
        <AllocationView scenario={scenario} plan={o} />
        <details className="comparison-details">
          <summary>Compare obligations and deadlines</summary>
          <DecisionFacts scenario={scenario} plan={o} />
        </details>
      </div>
    </article>
  );
}
