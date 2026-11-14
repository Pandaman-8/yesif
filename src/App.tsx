import { useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  ShieldCheck,
  LockKeyhole,
  Copy,
  BookOpen,
  ChevronDown,
  Download,
  Bookmark,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import {
  DAYS,
  analyze,
  simulate,
  emptyScenario,
  exampleScenario,
  hours,
  optionTitle,
  proposal,
  validate,
  type Scenario,
  type Task,
  type Option,
  type Feasibility,
} from "./domain/engine";
import {
  readNotebook,
  writeNotebook,
  type Notebook,
  type SavedDecision,
} from "./storage/scenarios";

type Page = "landing" | "workload" | "results" | "proposal" | "notebook";
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const load = () => {
  try {
    return readNotebook(window.localStorage);
  } catch {
    return {
      notebook: { version: 1 as const, decisions: [] },
      warning:
        "Local saving is unavailable in this browser. You can still use and copy every proposal.",
    };
  }
};
function App() {
  const [initial] = useState(load);
  const [page, setPage] = useState<Page>("landing");
  const [scenario, setScenario] = useState<Scenario>(exampleScenario);
  const [selected, setSelected] = useState<Option | null>(null);
  const [simDeferred, setSimDeferred] = useState<string[]>([]);
  const [simUnits, setSimUnits] = useState(20);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState(initial.warning);
  const [notebook, setNotebook] = useState<Notebook>(initial.notebook);
  const [unlocked, setUnlocked] = useState(false);
  const [practice, setPractice] = useState<number | null>(null);
  const [savedId, setSavedId] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const output = validate(scenario).length === 0 ? analyze(scenario) : null;
  const chosen =
    output && selected
      ? simulate(scenario, selected.deferred, selected.requestUnits)
      : null;
  const simulation = output ? simulate(scenario, simDeferred, simUnits) : null;
  const anyPlanPossible = output
    ? simulate(
        scenario,
        scenario.tasks.filter((t) => t.movable).map((t) => t.id),
        1,
      ).result.fits
    : false;
  function go(next: Page) {
    setPage(next);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "instant" });
    setTimeout(() => heading.current?.focus(), 0);
  }
  function change(next: Scenario) {
    setScenario(next);
    setSelected(null);
    setSimDeferred([]);
    setSimUnits(next.request.units);
    setMessage("");
    setPractice(null);
    setSavedId("");
    setNotice("");
    if (errors.length) setErrors(validate(next));
  }
  function start(example: boolean) {
    change(example ? exampleScenario() : emptyScenario());
    setErrors([]);
    go(example && page === "landing" ? "results" : "workload");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const problems = validate(scenario);
    setErrors(problems);
    if (problems.length) {
      setTimeout(() => document.getElementById("form-errors")?.focus(), 0);
      return;
    }
    go("results");
  }
  function choose(option: Option) {
    setSelected(option);
    setMessage(proposal(scenario, option));
    setPractice(null);
    setSavedId("");
    go("proposal");
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setNotice("Proposal copied. Ready to paste wherever you work.");
    } catch {
      setNotice(
        "Clipboard access was unavailable. Select the proposal text and copy it manually.",
      );
      document.getElementById("proposal-text")?.focus();
      (
        document.getElementById("proposal-text") as HTMLTextAreaElement | null
      )?.select();
    }
  }
  function persist(next: Notebook) {
    let error: string;
    try {
      error = writeNotebook(window.localStorage, next);
    } catch {
      error = "Local saving is unavailable. Copy your proposal before leaving.";
    }
    if (error) {
      setNotice(error);
      return false;
    }
    setNotebook(next);
    return true;
  }
  function save() {
    if (!chosen) return;
    if (!savedId && notebook.decisions.length >= (unlocked ? 50 : 1)) {
      go("notebook");
      setNotice(
        unlocked
          ? "This device has reached the 50-decision storage limit. Delete an old decision to make room."
          : "Your free saved decision is safe. Unlock the no-payment kit demo to save more, or delete it to use the free slot again.",
      );
      return;
    }
    const id = savedId || crypto.randomUUID();
    const old = notebook.decisions.find((d) => d.id === id);
    const decision: SavedDecision = {
      id,
      created: old?.created || new Date().toISOString(),
      scenario: structuredClone(scenario),
      plan: { deferred: chosen.deferred, requestUnits: chosen.requestUnits },
      message,
      outcome: old?.outcome || "pending",
      notes: old?.notes || "",
    };
    if (
      persist({
        version: 1,
        decisions: [decision, ...notebook.decisions.filter((d) => d.id !== id)],
      })
    ) {
      setSavedId(id);
      setNotice("Saved on this device. No message was sent.");
    }
  }
  function restore(d: SavedDecision) {
    setScenario(structuredClone(d.scenario));
    setSelected(simulate(d.scenario, d.plan.deferred, d.plan.requestUnits));
    setSimDeferred(d.plan.deferred);
    setSimUnits(d.plan.requestUnits);
    setMessage(d.message);
    setSavedId(d.id);
    setErrors([]);
    setPractice(null);
    go("proposal");
  }
  function updateDecision(
    id: string,
    patch: Partial<Pick<SavedDecision, "outcome" | "notes">>,
  ) {
    persist({
      ...notebook,
      decisions: notebook.decisions.map((d) =>
        d.id === id ? { ...d, ...patch } : d,
      ),
    });
  }
  function exportNotebook() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(notebook, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "yesif-decisions.json";
    link.click();
    URL.revokeObjectURL(url);
    setNotice(
      "Export downloaded. It contains the task names, proposals, and notes you saved.",
    );
  }
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="wordmark"
            onClick={() => go("landing")}
            aria-label="YESIF home"
          >
            yesif<span>.</span>
          </button>
          <span className="brand-note">
            A little clarity before you commit.
          </span>
          <nav aria-label="Main navigation">
            <button className="nav-link" onClick={() => go("notebook")}>
              <BookOpen size={16} /> <span>My decisions</span>
              {notebook.decisions.length > 0 && (
                <span className="count">{notebook.decisions.length}</span>
              )}
            </button>
            <button className="nav-kit" onClick={() => go("notebook")}>
              The negotiation kit <ArrowUpRight size={14} />
            </button>
          </nav>
        </div>
      </header>
      <main id="main">
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {page === "landing" ? (
          <>
            <section className="hero wrap">
              <div className="hero-copy">
                <p className="eyebrow">
                  <span className="little-line" /> FOR THE NEXT “QUICK FAVOR”
                </p>
                <h1 ref={heading} tabIndex={-1}>
                  Your week is full.
                  <br />
                  Your answer
                  <br />
                  has <em>options.</em>
                </h1>
                <p className="hero-description">
                  A new request doesn’t have to mean another late night. See
                  what fits, find a fair trade-off, and get the words to propose
                  it.
                </p>
                <div className="hero-actions">
                  <button
                    className="button primary"
                    onClick={() => start(true)}
                  >
                    Try a real example <ArrowRight size={18} />
                  </button>
                  <button className="text-button" onClick={() => start(false)}>
                    Use my own workload <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="trust-line">
                  <ShieldCheck size={15} />
                  <span>No account. Private on your device. Free to try.</span>
                </div>
              </div>
              <div
                className="hero-visual"
                aria-label="Illustrative example: 18 hours of work, 15 available. Propose deferring a five-hour report to make room."
              >
                <div className="paper-top">
                  <span className="paper-dot" />
                  <span>A WEEK WITH A LITTLE TOO MUCH IN IT</span>
                  <span className="paper-number">01 / 03</span>
                </div>
                <div className="week-paper">
                  <div className="paper-title">
                    <span>Your week, at a glance</span>
                    <span className="small-pill">15h available</span>
                  </div>
                  <div className="mini-days">
                    {DAYS.map((d) => (
                      <span key={d}>{d.slice(0, 3).toUpperCase()}</span>
                    ))}
                  </div>
                  <div className="week-block qa">
                    Launch QA <span>5h</span>
                  </div>
                  <div className="week-block updates">
                    Customer updates <span>3h</span>
                  </div>
                  <div className="week-block report">
                    Weekly report <span>5h</span>
                  </div>
                  <div className="week-block request">
                    ↳ The new presentation <span>+5h</span>
                  </div>
                  <div className="paper-total">
                    <span>A full yes would mean</span>
                    <strong>
                      18h <span>/ 15h</span>
                    </strong>
                  </div>
                </div>
                <div className="if-note">
                  <div className="note-icon">
                    <ArrowUpRight size={23} />
                  </div>
                  <div>
                    <p>THERE’S ANOTHER WAY TO SAY YES.</p>
                    <blockquote>
                      “Yes, if we move
                      <br />
                      the weekly report.”
                    </blockquote>
                    <span>
                      One clear trade-off. A conversation you can have.
                    </span>
                  </div>
                </div>
                <span className="visual-caption">
                  A fictional week. A very familiar situation.
                </span>
              </div>
            </section>
            <section className="how wrap">
              <div className="how-intro">
                <p className="eyebrow">
                  LESS GUESSWORK. MORE GROUND TO STAND ON.
                </p>
                <h2>
                  From “I’ll try”
                  <br />
                  to “here’s how.”
                </h2>
              </div>
              <div className="how-step">
                <span>01</span>
                <h3>See the whole picture</h3>
                <p>
                  Add your available hours and commitments. We check the
                  deadlines, too.
                </p>
              </div>
              <div className="how-step">
                <span>02</span>
                <h3>Choose what can change</h3>
                <p>
                  Compare specific trade-offs. Keep your fixed commitments
                  protected.
                </p>
              </div>
              <div className="how-step">
                <span>03</span>
                <h3>Make a clear proposal</h3>
                <p>
                  Leave with an editable message and a little practice for the
                  conversation.
                </p>
              </div>
            </section>
            <section className="landing-note wrap">
              <span>EVERY YES NEEDS AN IF.</span>
              <p>You bring the context. We help you see the choices.</p>
              <button className="text-button" onClick={() => start(true)}>
                Find your if <ArrowRight size={16} />
              </button>
            </section>
          </>
        ) : (
          <div className="workspace wrap">
            {page !== "notebook" && (
              <ol className="stepper" aria-label="Your progress">
                {[
                  ["workload", "Set the scene"],
                  ["results", "Find your if"],
                  ["proposal", "Make your proposal"],
                ].map(([id, label], i) => (
                  <li
                    key={id}
                    className={page === id ? "active" : ""}
                    aria-current={page === id ? "step" : undefined}
                  >
                    <span>{i + 1}</span>
                    {label}
                  </li>
                ))}
              </ol>
            )}
            {page === "workload" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">01 / SET THE SCENE</p>
                    <h1 ref={heading} tabIndex={-1}>
                      What’s on your plate?
                    </h1>
                    <p>
                      One Monday–Friday planning week. Count the focused time
                      you actually have.
                    </p>
                  </div>
                  <button className="text-button" onClick={() => start(true)}>
                    <RotateCcw size={15} /> Reset example
                  </button>
                </div>
                <form onSubmit={submit} noValidate>
                  {errors.length > 0 && (
                    <div
                      className="error-box"
                      id="form-errors"
                      tabIndex={-1}
                      role="alert"
                    >
                      <strong>Let’s fix a few details first.</strong>
                      <ul>
                        {errors.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="input-layout">
                    <div className="workload-main">
                      <section className="panel">
                        <div className="section-title">
                          <div>
                            <p className="eyebrow">YOUR AVAILABLE TIME</p>
                            <h2>Make room for reality.</h2>
                          </div>
                          <span className="capacity-total">
                            {Number.isFinite(sum(scenario.capacity))
                              ? hours(sum(scenario.capacity))
                              : "—"}
                            <small>h this week</small>
                          </span>
                        </div>
                        <p className="help">
                          Hours left after meetings, admin, breaks, and a
                          buffer. Use 0 for unavailable or already-passed days.
                        </p>
                        <div className="day-inputs">
                          {DAYS.map((d, i) => (
                            <label key={d}>
                              <span>{d.slice(0, 3)}</span>
                              <div className="hours-input">
                                <input
                                  aria-label={`${d} focused hours`}
                                  type="number"
                                  min="0"
                                  max="24"
                                  step="0.25"
                                  value={
                                    Number.isNaN(scenario.capacity[i])
                                      ? ""
                                      : scenario.capacity[i] / 4
                                  }
                                  onChange={(e) =>
                                    change({
                                      ...scenario,
                                      capacity: scenario.capacity.map((v, j) =>
                                        i === j
                                          ? parseHours(e.target.value)
                                          : v,
                                      ),
                                    })
                                  }
                                />
                                <span>h</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </section>
                      <section className="panel">
                        <div className="section-title">
                          <div>
                            <p className="eyebrow">EXISTING COMMITMENTS</p>
                            <h2>The work you’ve already said yes to.</h2>
                          </div>
                          <span className="small-pill">
                            {scenario.tasks.length} / 8
                          </span>
                        </div>
                        <p className="help">
                          Remaining work only. “Can discuss” means you could ask
                          to defer it beyond this week.
                        </p>
                        <div className="task-list">
                          {scenario.tasks.map((task, i) => (
                            <TaskEditor
                              key={task.id}
                              task={task}
                              label={`Commitment ${i + 1}`}
                              onChange={(t) =>
                                change({
                                  ...scenario,
                                  tasks: scenario.tasks.map((v) =>
                                    v.id === t.id ? t : v,
                                  ),
                                })
                              }
                              onRemove={() =>
                                change({
                                  ...scenario,
                                  tasks: scenario.tasks.filter(
                                    (t) => t.id !== task.id,
                                  ),
                                })
                              }
                            />
                          ))}
                        </div>
                        {scenario.tasks.length === 0 && (
                          <p className="empty-inline">
                            No existing commitments yet. Add the work that
                            shares this time.
                          </p>
                        )}
                        <button
                          className="add-button"
                          type="button"
                          disabled={scenario.tasks.length >= 8}
                          onClick={() =>
                            change({
                              ...scenario,
                              tasks: [
                                ...scenario.tasks,
                                {
                                  id: crypto.randomUUID(),
                                  name: "",
                                  units: 4,
                                  deadline: 4,
                                  movable: false,
                                  priority: "normal",
                                },
                              ],
                            })
                          }
                        >
                          <Plus size={16} /> Add a commitment
                        </button>
                      </section>
                    </div>
                    <aside className="request-panel">
                      <div className="request-icon">
                        <ArrowUpRight size={24} />
                      </div>
                      <p className="eyebrow">AND THEN THIS ARRIVES…</p>
                      <h2>The new request.</h2>
                      <p className="help">
                        What are you being asked to take on?
                      </p>
                      <TaskEditor
                        task={scenario.request}
                        label="New request"
                        onChange={(request) => change({ ...scenario, request })}
                      />
                      <div className="request-note">
                        <LockKeyhole size={15} />
                        <span>
                          Your task details stay in this browser. Nothing is
                          sent to your manager.
                        </span>
                      </div>
                      <button className="button primary full" type="submit">
                        Find my options <ArrowRight size={17} />
                      </button>
                    </aside>
                  </div>
                  <details className="assumptions">
                    <summary>
                      How this check works <ChevronDown size={14} />
                    </summary>
                    <p>
                      One person, one Monday–Friday planning week. All work is
                      available from the start, can be split into 15-minute
                      pieces, and has no dependencies. Deadlines are end of day.
                      Enter only remaining availability; we do not infer dates,
                      meetings, weekends, overtime, or next week’s capacity.
                      This is an estimate, not a delivery guarantee. If work can
                      only start later or must happen at a fixed time, this
                      simplified check is not sufficient.
                    </p>
                  </details>
                </form>
              </>
            )}
            {page === "results" && output && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">02 / FIND YOUR IF</p>
                    <h1 ref={heading} tabIndex={-1}>
                      {output.baseline.fits
                        ? "There’s room for this yes."
                        : "Something has to give. Not you."}
                    </h1>
                    <p>
                      {output.baseline.fits
                        ? "Your estimates fit the available time and every weekday deadline."
                        : "A workable proposal starts with deciding what can change."}
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => go("workload")}
                  >
                    <ArrowLeft size={16} /> Edit workload
                  </button>
                </div>
                <div className="reality">
                  <div>
                    <p className="eyebrow">IF YOU ACCEPT EVERYTHING</p>
                    <div className="big-number">
                      {hours(output.baseline.total)}h{" "}
                      <span>/ {hours(output.baseline.capacity)}h</span>
                    </div>
                    <p>
                      {hours(sum(scenario.tasks.map((t) => t.units)))}h
                      committed + {hours(scenario.request.units)}h requested
                    </p>
                  </div>
                  <div className="reality-message">
                    <span className="reality-pill">
                      {output.baseline.fits
                        ? "Fits your estimates"
                        : output.baseline.overload
                          ? `${hours(output.baseline.overload)}h over capacity`
                          : "Early deadline conflict"}
                    </span>
                    <p>
                      {output.baseline.fits
                        ? "No change is needed under the assumptions below. Confirm the scope before committing."
                        : conflictText(output.baseline)}
                    </p>
                  </div>
                </div>
                {!output.existing.fits && (
                  <p className="error-box">
                    Your existing commitments already conflict with available
                    time. The options below must resolve that conflict too.
                  </p>
                )}
                {simulation && (
                  <section
                    className="simulator"
                    aria-label="Interactive trade-off simulator"
                  >
                    <div className="sim-controls">
                      <p className="eyebrow">THE TRADE-OFF TABLE</p>
                      <h2>Move a piece. See what changes.</h2>
                      <p className="help">
                        Choose what you could renegotiate. Your original
                        workload stays intact.
                      </p>
                      <div className="sim-tasks">
                        {scenario.tasks.map((t) => (
                          <label
                            key={t.id}
                            className={`sim-task ${!t.movable ? "locked" : ""} ${simDeferred.includes(t.id) ? "deferred" : ""}`}
                          >
                            <input
                              type="checkbox"
                              disabled={!t.movable}
                              checked={simDeferred.includes(t.id)}
                              onChange={(e) => {
                                setSimDeferred(
                                  e.target.checked
                                    ? [...simDeferred, t.id]
                                    : simDeferred.filter((id) => id !== t.id),
                                );
                              }}
                              aria-label={`Defer ${t.name}`}
                            />
                            <span className="sim-task-text">
                              <strong>{t.name}</strong>
                              <small>
                                Due {DAYS[t.deadline]} ·{" "}
                                {t.priority === "high"
                                  ? "High priority"
                                  : "Normal priority"}
                              </small>
                            </span>
                            <span className="sim-task-hours">
                              {hours(t.units)}h
                              <small>
                                {t.movable ? (
                                  simDeferred.includes(t.id) ? (
                                    "Propose deferral"
                                  ) : (
                                    "Can discuss"
                                  )
                                ) : (
                                  <>
                                    <LockKeyhole size={10} /> Fixed
                                  </>
                                )}
                              </small>
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
                          <label htmlFor="scope-slider">
                            New request’s scope
                          </label>
                          <strong>
                            {hours(simUnits)}h{" "}
                            <span>/ {hours(scenario.request.units)}h</span>
                          </strong>
                        </div>
                        <input
                          id="scope-slider"
                          type="range"
                          min="1"
                          max={scenario.request.units}
                          step="1"
                          value={simUnits}
                          aria-valuetext={`${hours(simUnits)} hours`}
                          onChange={(e) => setSimUnits(Number(e.target.value))}
                        />
                        <div className="scope-steps">
                          <button
                            aria-label="Reduce scope by 15 minutes"
                            disabled={simUnits <= 1}
                            onClick={() =>
                              setSimUnits((n) => Math.max(1, n - 1))
                            }
                          >
                            −
                          </button>
                          <span>Adjust by 15 minutes</span>
                          <button
                            aria-label="Increase scope by 15 minutes"
                            disabled={simUnits >= scenario.request.units}
                            onClick={() =>
                              setSimUnits((n) =>
                                Math.min(scenario.request.units, n + 1),
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <p>
                          {simUnits < scenario.request.units
                            ? "Smaller scope means agreeing on a smaller deliverable. It is not the same work done faster."
                            : "Keep the full request, or reduce the hours to propose a smaller deliverable."}
                        </p>
                      </div>
                    </div>
                    <div className="sim-result" aria-live="polite">
                      <p className="eyebrow">WITH YOUR CHANGES</p>
                      <div className="sim-number">
                        {hours(simulation.result.total)}h{" "}
                        <span>/ {hours(simulation.result.capacity)}h</span>
                      </div>
                      <span
                        className={`sim-status ${simulation.result.fits ? "fits" : ""}`}
                      >
                        {simulation.result.fits ? (
                          <>
                            <Check size={15} /> Fits every weekday deadline
                          </>
                        ) : (
                          <>Still needs a change</>
                        )}
                      </span>
                      <p className="sim-explanation">
                        {simulation.result.fits
                          ? `${hours(simulation.result.capacity - simulation.result.total)}h left this week, based on your estimates.`
                          : conflictText(simulation.result)}
                      </p>
                      <DeadlineTable result={simulation.result} />
                      {simDeferred.length > 0 && (
                        <p className="fine-print">
                          Deferred work needs a new agreed date. Future capacity
                          is unchecked.
                        </p>
                      )}
                      <button
                        className="button primary full"
                        disabled={!simulation.result.fits}
                        onClick={() => choose(simulation)}
                      >
                        Use this plan <ArrowRight size={16} />
                      </button>
                      <button
                        className="text-button"
                        onClick={() => {
                          setSimDeferred([]);
                          setSimUnits(scenario.request.units);
                        }}
                      >
                        Reset changes
                      </button>
                    </div>
                  </section>
                )}
                <div className="options-heading">
                  <h2>
                    {output.options.length
                      ? "Want a starting point?"
                      : anyPlanPossible
                        ? "Try combining two changes above."
                        : "No workable option under these constraints."}
                  </h2>
                  <p>
                    {output.options.length
                      ? "Choose a condition you could actually discuss. Nothing changes until you agree."
                      : anyPlanPossible
                        ? "A deferral alone or a scope cut alone does not fit. Try both in the simulator and check the deadlines before proposing a plan."
                        : "Even deferring every negotiable task and reducing the request to 15 minutes leaves a conflict. Discuss more time, a different deadline, or help from someone else."}
                  </p>
                </div>
                <div className="option-grid">
                  {output.options.map((o, i) => (
                    <article
                      className={`option-card ${o.kind === "scope" ? "scope-card" : ""}`}
                      key={o.id}
                    >
                      <div className="option-top">
                        <span className="option-letter">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="eyebrow">
                          {o.kind === "defer"
                            ? "CHANGE A PRIORITY"
                            : o.kind === "scope"
                              ? "CHANGE THE DELIVERABLE"
                              : "KEEP THE PLAN"}
                        </span>
                      </div>
                      <h3>{optionTitle(scenario, o)}</h3>
                      <p>
                        {o.kind === "defer"
                          ? `Ask to move ${hours(output.baseline.total - o.result.total)}h beyond this planning week. A new date needs agreement; future capacity is unchecked.`
                          : o.kind === "scope"
                            ? `Agree on what a ${hours(o.requestUnits)}h version includes. The original ${hours(scenario.request.units)}h deliverable will not be completed in less time.`
                            : "Keep the requested scope and deadline. Revisit the plan if your estimates change."}
                      </p>
                      <div className="option-math">
                        <span>
                          <strong>{hours(o.result.total)}h</strong> /{" "}
                          {hours(o.result.capacity)}h planned
                        </span>
                        <span>
                          <Check size={14} />
                          {hours(o.result.capacity - o.result.total)}h left
                        </span>
                      </div>
                      <details className="proof">
                        <summary>
                          Check every deadline <ChevronDown size={14} />
                        </summary>
                        <DeadlineTable result={o.result} />
                      </details>
                      <button
                        className="button outline full"
                        onClick={() => choose(o)}
                      >
                        {o.kind === "accept"
                          ? "Prepare my reply"
                          : "Use this trade-off"}
                        <ArrowRight size={16} />
                      </button>
                    </article>
                  ))}
                </div>
                <details className="assumptions">
                  <summary>
                    See the original deadline check <ChevronDown size={14} />
                  </summary>
                  <DeadlineTable result={output.baseline} />
                </details>
                <p className="fine-print">
                  Up to three minimal deferral sets, ranked by fewer
                  high-priority tasks changed, then fewer tasks, then fewer
                  hours deferred. Scope reduction is a separate option. You can
                  combine scope reduction and deferrals in the simulator above.
                  Dependencies and future weeks are outside this check.
                </p>
                {!output.options.length && (
                  <button
                    className="button primary"
                    onClick={() => go("workload")}
                  >
                    Revisit my inputs <ArrowLeft size={16} />
                  </button>
                )}
              </>
            )}
            {page === "proposal" && chosen && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">03 / MAKE YOUR PROPOSAL</p>
                    <h1 ref={heading} tabIndex={-1}>
                      A clear ask. A better starting point.
                    </h1>
                    <p>
                      Your numbers, your choice. Make the words sound like you.
                    </p>
                  </div>
                  <button className="text-button" onClick={() => go("results")}>
                    <ArrowLeft size={16} /> Compare options
                  </button>
                </div>
                <div className="proposal-layout">
                  <section className="panel proposal-panel">
                    <div className="section-title">
                      <p className="eyebrow">YOUR CONVERSATION STARTER</p>
                      <span className="small-pill">Editable draft</span>
                    </div>
                    <label className="sr-only" htmlFor="proposal-text">
                      Your proposal
                    </label>
                    <textarea
                      id="proposal-text"
                      value={message}
                      maxLength={10000}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        setNotice("");
                      }}
                    />
                    <div className="proposal-actions">
                      <button
                        className="button primary"
                        onClick={copy}
                        disabled={!message.trim()}
                      >
                        <Copy size={16} /> Copy proposal
                      </button>
                      <button
                        className="text-button"
                        onClick={save}
                        disabled={!message.trim()}
                      >
                        <Bookmark size={16} />
                        {savedId ? "Update saved decision" : "Save decision"}
                      </button>
                      <button
                        className="reset-draft"
                        aria-label="Reset proposal to generated draft"
                        onClick={() => {
                          setMessage(proposal(scenario, chosen));
                          setNotice(
                            "Draft reset to the current calculated proposal.",
                          );
                        }}
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                    <p className="fine-print">
                      Nothing is sent for you. Review before sharing. Edited
                      text is not recalculated or scored.
                    </p>
                  </section>
                  <aside className="choice-summary">
                    <span className="round-check">
                      <Check size={23} />
                    </span>
                    <p className="eyebrow">YOUR CHOSEN CONDITION</p>
                    <h2>{optionTitle(scenario, chosen)}</h2>
                    <div className="chosen-numbers">
                      <strong>{hours(chosen.result.total)}h</strong>
                      <span>of {hours(chosen.result.capacity)}h available</span>
                    </div>
                    <p>
                      <CheckCircle2 size={15} /> Fits every weekday deadline
                    </p>
                    <span className="fine-print">
                      {chosen.deferred.length > 0
                        ? "Proposed deferral only. Agree on a new date and check future capacity."
                        : chosen.kind === "scope"
                          ? "A smaller deliverable needs agreement on what is included."
                          : "Based on the hours and assumptions you supplied."}
                    </span>
                  </aside>
                </div>
                <section className="practice panel">
                  <div>
                    <p className="eyebrow">A 30-SECOND PRACTICE</p>
                    <h2>
                      {chosen.kind === "accept"
                        ? "What if the scope grows?"
                        : "What if they push back?"}
                    </h2>
                    <p className="manager-quote">
                      {chosen.kind === "accept"
                        ? "“Can you add a few more things and keep the deadline?”"
                        : "“Everything is urgent. We still need this by Friday.”"}
                    </p>
                    <p className="help">
                      Choose the response that keeps the conversation grounded.
                    </p>
                  </div>
                  <div className="practice-choices">
                    {[
                      "“Sure. I’ll find a way to get everything done.”",
                      "“That’s impossible. You need to be more realistic.”",
                      `“With ${hours(output!.baseline.capacity)} focused hours available, I need us to agree on what fits. Could we confirm the scope and which commitment should change?”`,
                    ].map((text, i) => (
                      <button
                        key={i}
                        className={
                          practice === i
                            ? "practice-choice selected"
                            : "practice-choice"
                        }
                        onClick={() => setPractice(i)}
                        aria-pressed={practice === i}
                      >
                        <span>{String.fromCharCode(65 + i)}</span>
                        {text}
                      </button>
                    ))}
                  </div>
                  {practice !== null && (
                    <div className="practice-feedback" role="status">
                      <strong>
                        {practice === 2
                          ? "You made the decision explicit."
                          : practice === 0
                            ? "Good intent, but the constraint disappeared."
                            : "You named a problem, but left no decision to make."}
                      </strong>
                      <p>
                        {practice === 2
                          ? "Bring your selected trade-off into this reply, then ask for agreement."
                          : practice === 0
                            ? "An open-ended yes promises capacity you have not checked. Name the available time and ask what should change."
                            : "A concrete option is easier to act on than a judgment. State the hours, offer the condition you selected, and ask for agreement."}
                      </p>
                      <ul>
                        {[
                          "Makes the constraint clear",
                          "Identifies a decision or trade-off",
                          "Asks for agreement on priorities",
                          "Avoids an unchecked promise",
                        ].map((label, i) => (
                          <li key={label}>
                            <span>
                              {practice === 2 || (practice === 1 && i === 3)
                                ? "✓"
                                : "○"}
                            </span>
                            {label}
                          </li>
                        ))}
                      </ul>
                      <small>
                        Fixed rubric for these three responses. No AI analysis
                        or measurement of your ability.
                      </small>
                    </div>
                  )}
                </section>
              </>
            )}
            {page === "notebook" && (
              <>
                <button
                  className="text-button notebook-return"
                  onClick={() => go(chosen ? "proposal" : "workload")}
                >
                  <ArrowLeft size={15} />{" "}
                  {chosen ? "Back to my proposal" : "Back to my workload"}
                </button>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">A LITTLE LESS STARTING OVER</p>
                    <h1 ref={heading} tabIndex={-1}>
                      Your decision notebook.
                    </h1>
                    <p>Keep the context. Come back when priorities change.</p>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => start(false)}
                  >
                    New situation <Plus size={16} />
                  </button>
                </div>
                <section className="kit-banner">
                  <div>
                    <span className="eyebrow">
                      THE NEGOTIATION KIT · PRICING EXPERIMENT
                    </span>
                    <h2>Make your next conversation easier.</h2>
                    <p>
                      Save multiple situations, reuse the inputs, record what
                      was agreed, and export your notebook.
                    </p>
                    <span className="fine-print">
                      One saved decision and the complete core workflow are
                      free. Data stays in this browser; no sync. Demo unlock
                      lasts for this visit.
                    </span>
                  </div>
                  <div className="kit-action">
                    <div className="price">
                      $4.99 <span>one time · proposed price</span>
                    </div>
                    <button
                      className="button primary"
                      disabled={unlocked}
                      onClick={() => {
                        setUnlocked(true);
                        setNotice(
                          "Kit demo unlocked for this visit. No payment, account, or subscription.",
                        );
                      }}
                    >
                      {unlocked ? (
                        <>
                          <Check size={16} /> Demo unlocked
                        </>
                      ) : (
                        <>
                          Unlock free demo <ArrowUpRight size={16} />
                        </>
                      )}
                    </button>
                    <small>No checkout. No payment is collected.</small>
                  </div>
                </section>
                <div className="section-title notebook-heading">
                  <h2>
                    Saved on this device{" "}
                    <span className="small-pill">
                      {notebook.decisions.length}
                    </span>
                  </h2>
                  {unlocked && notebook.decisions.length > 0 && (
                    <button className="text-button" onClick={exportNotebook}>
                      <Download size={16} /> Export notebook
                    </button>
                  )}
                </div>
                {notebook.decisions.length === 0 ? (
                  <div className="empty-notebook">
                    <BookOpen size={30} />
                    <h3>Your next decision can start here.</h3>
                    <p>
                      Save a proposal after choosing a trade-off. It will stay
                      here when you return to this browser.
                    </p>
                    <button
                      className="button outline"
                      onClick={() => start(true)}
                    >
                      Try the example <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="saved-grid">
                    {notebook.decisions.map((d) => (
                      <article className="panel saved-card" key={d.id}>
                        <p className="eyebrow">
                          {new Date(d.created).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          · SAVED SNAPSHOT
                        </p>
                        <h3>{d.scenario.request.name}</h3>
                        <p>
                          {optionTitle(
                            d.scenario,
                            simulate(
                              d.scenario,
                              d.plan.deferred,
                              d.plan.requestUnits,
                            ),
                          )}
                        </p>
                        <label>
                          Conversation outcome
                          <select
                            value={d.outcome}
                            onChange={(e) =>
                              updateDecision(d.id, {
                                outcome: e.target
                                  .value as SavedDecision["outcome"],
                              })
                            }
                          >
                            <option value="pending">Not discussed yet</option>
                            <option value="agreed">
                              Agreement recorded by me
                            </option>
                            <option value="revisit">
                              Needs another conversation
                            </option>
                          </select>
                        </label>
                        <label>
                          What was agreed?
                          <textarea
                            rows={2}
                            maxLength={2000}
                            value={d.notes}
                            placeholder="A new date, a smaller scope, a next step…"
                            onChange={(e) =>
                              updateDecision(d.id, { notes: e.target.value })
                            }
                          />
                        </label>
                        <p className="fine-print">
                          Your note only; the saved workload does not change.
                        </p>
                        <div className="saved-actions">
                          <button
                            className="text-button"
                            onClick={() => restore(d)}
                          >
                            Open decision <ArrowRight size={15} />
                          </button>
                          <button
                            className="text-button"
                            onClick={() => {
                              change(structuredClone(d.scenario));
                              setErrors([]);
                              go("workload");
                            }}
                          >
                            Reuse workload
                          </button>
                          <button
                            className="delete-button"
                            aria-label={`Delete saved ${d.scenario.request.name}`}
                            onClick={() => {
                              if (
                                persist({
                                  ...notebook,
                                  decisions: notebook.decisions.filter(
                                    (v) => v.id !== d.id,
                                  ),
                                })
                              ) {
                                if (savedId === d.id) setSavedId("");
                                setNotice(
                                  "Decision deleted from this browser.",
                                );
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <p className="fine-print">
                  Saving is explicit. Clearing browser data removes this
                  notebook. Avoid sensitive names on shared devices. No
                  analytics, accounts, or task uploads.
                </p>
              </>
            )}
          </div>
        )}
      </main>
      <footer className="footer wrap">
        <span className="footer-logo">yesif.</span>
        <span>Every yes needs an if.</span>
        <span className="footer-right">
          <LockKeyhole size={13} /> Your work stays yours.
        </span>
      </footer>
    </>
  );
}
function parseHours(value: string) {
  return value.trim() === "" ? NaN : Number(value) * 4;
}
function TaskEditor({
  task,
  label,
  onChange,
  onRemove,
}: {
  task: Task;
  label: string;
  onChange: (task: Task) => void;
  onRemove?: () => void;
}) {
  return (
    <div className={onRemove ? "task-editor" : "new-task-editor"}>
      <div className="task-name">
        <label>
          {onRemove ? label : "What’s the task?"}
          <input
            aria-label={`${label} name`}
            maxLength={100}
            placeholder={
              onRemove ? "e.g. Campaign brief" : "e.g. Urgent presentation"
            }
            value={task.name}
            onChange={(e) => onChange({ ...task, name: e.target.value })}
          />
        </label>
        {onRemove && (
          <button
            className="remove-button"
            type="button"
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={onRemove}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="task-fields">
        <label>
          Hours left
          <input
            aria-label={`${label} hours`}
            type="number"
            min="0.25"
            max="120"
            step="0.25"
            value={Number.isNaN(task.units) ? "" : task.units / 4}
            onChange={(e) =>
              onChange({ ...task, units: parseHours(e.target.value) })
            }
          />
        </label>
        <label>
          Due by
          <select
            aria-label={`${label} deadline`}
            value={task.deadline}
            onChange={(e) =>
              onChange({ ...task, deadline: Number(e.target.value) })
            }
          >
            {DAYS.map((day, i) => (
              <option key={day} value={i}>
                {day}
              </option>
            ))}
          </select>
        </label>
        {onRemove && (
          <label>
            Flexibility
            <select
              aria-label={`${label} flexibility`}
              value={task.movable ? "movable" : "fixed"}
              onChange={(e) =>
                onChange({ ...task, movable: e.target.value === "movable" })
              }
            >
              <option value="fixed">Fixed</option>
              <option value="movable">Can discuss</option>
            </select>
          </label>
        )}
        {onRemove && (
          <label>
            Priority
            <select
              aria-label={`${label} priority`}
              value={task.priority}
              onChange={(e) =>
                onChange({
                  ...task,
                  priority: e.target.value as Task["priority"],
                })
              }
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
function conflictText(result: Feasibility) {
  const c = result.checkpoints.find((v) => v.deficit);
  return c
    ? `By ${DAYS[c.day]}, ${hours(c.due)}h are due, but only ${hours(c.available)}h are available. That deadline needs ${hours(c.deficit)}h more room.`
    : "";
}
function DeadlineTable({ result }: { result: Feasibility }) {
  return (
    <div className="deadline-table">
      <table>
        <caption>Cumulative hours by end of day</caption>
        <thead>
          <tr>
            <th>By</th>
            <th>Due</th>
            <th>Available</th>
            <th>Check</th>
          </tr>
        </thead>
        <tbody>
          {result.checkpoints.map((c) => (
            <tr key={c.day}>
              <th scope="row">{DAYS[c.day].slice(0, 3)}</th>
              <td>{hours(c.due)}h</td>
              <td>{hours(c.available)}h</td>
              <td className={c.deficit ? "conflict-cell" : ""}>
                {c.deficit ? `${hours(c.deficit)}h short` : "Fits"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default App;
