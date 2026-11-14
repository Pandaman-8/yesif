import { useRef, useState, type FormEvent, type RefObject } from "react";
import {
  ArrowRight,
  ChevronDown,
  LockKeyhole,
  Plus,
  RotateCcw,
  Check,
} from "lucide-react";
import { DAYS, hours, type Scenario } from "../domain/engine";
import { TaskEditor, parseHours } from "./Shared";
const validHours = (n: number, min = 0, max = 96) =>
  Number.isInteger(n) && n >= min && n <= max;
const total = (values: number[]) => values.reduce((a, b) => a + b, 0);

export function Workload({
  scenario,
  change,
  heading,
  errors,
  submit,
  reset,
  loadExample,
}: {
  scenario: Scenario;
  change: (s: Scenario) => void;
  heading: RefObject<HTMLHeadingElement | null>;
  errors: string[];
  submit: (e: FormEvent) => void;
  reset: () => void;
  loadExample: () => void;
}) {
  const [sameHours, setSameHours] = useState("");
  const [quickError, setQuickError] = useState(false);
  const [quickNotice, setQuickNotice] = useState("");
  const quickInput = useRef<HTMLInputElement>(null);
  const requestComplete =
    !!scenario.request.name.trim() &&
    validHours(scenario.request.units, 1, 480);
  const capacityComplete =
    scenario.capacity.every((n) => validHours(n)) &&
    (!scenario.reserve ||
      scenario.reserve.every(
        (n, i) => validHours(n) && n <= scenario.capacity[i],
      ));
  const tasksComplete = scenario.tasks.every(
    (t) => !!t.name.trim() && validHours(t.units, 1, 480),
  );
  const gross = total(scenario.capacity),
    reserve = total(scenario.reserve ?? [0, 0, 0, 0, 0]);
  function applyHours() {
    const units = parseHours(sameHours);
    if (!validHours(units)) {
      setQuickError(true);
      setQuickNotice("");
      quickInput.current?.focus();
      return;
    }
    change({ ...scenario, capacity: DAYS.map(() => units) });
    setQuickError(false);
    setQuickNotice(
      `${hours(units)} focused hours applied to each weekday. You can still edit any day.`,
    );
  }
  return (
    <div className="workload-v21">
      <div className="page-heading input-heading">
        <div>
          <p className="eyebrow">Your Monday–Friday week</p>
          <h1 ref={heading} tabIndex={-1}>
            What needs to fit?
          </h1>
          <p>
            Tell us about the new request, your available time, and existing
            commitments. We’ll check the deadlines and show what could change.
          </p>
        </div>
        <div className="input-tools">
          <button className="text-button" onClick={reset}>
            <RotateCcw size={15} /> Start over
          </button>
          <button className="text-button" onClick={loadExample}>
            Load example
          </button>
        </div>
      </div>
      <nav className="input-map" aria-label="Workload sections">
        {[
          ["new-request", "New request", requestComplete],
          ["available-time", "Available time", capacityComplete && gross > 0],
          [
            "existing-work",
            "Existing work",
            tasksComplete && scenario.tasks.length > 0,
          ],
        ].map(([id, name, done], i) => (
          <a
            key={String(id)}
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById(String(id))
                ?.focus({ preventScroll: true });
              document.getElementById(String(id))?.scrollIntoView({
                block: "start",
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
              });
            }}
          >
            <span>
              {done ? <Check size={15} aria-label="Details entered" /> : i + 1}
            </span>{" "}
            {name}
          </a>
        ))}
      </nav>
      <form onSubmit={submit} noValidate aria-label="Your workload">
        {errors.length > 0 && (
          <div
            className="error-box"
            id="form-errors"
            tabIndex={-1}
            role="alert"
          >
            <strong>Check the highlighted fields.</strong>
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="input-journey">
          <section
            className="panel request-section"
            aria-labelledby="new-request"
          >
            <div className="input-section-heading">
              <span className="section-marker">01</span>
              <div>
                <h2 id="new-request" tabIndex={-1}>
                  The new request
                </h2>
                <p>The extra work someone wants you to take on.</p>
              </div>
              <span className="section-state">
                {requestComplete ? "Details entered" : "Start here"}
              </span>
            </div>
            <TaskEditor
              task={scenario.request}
              label="New request"
              showErrors={errors.length > 0}
              onChange={(request) => change({ ...scenario, request })}
            />
          </section>
          <section
            className="panel capacity-section"
            aria-labelledby="available-time"
          >
            <div className="input-section-heading">
              <span className="section-marker">02</span>
              <div>
                <h2 id="available-time" tabIndex={-1}>
                  My available time
                </h2>
                <p>
                  Focused hours for the request and existing work, after
                  meetings, admin and breaks.
                </p>
              </div>
            </div>
            <div className="quick-capacity">
              <label htmlFor="same-hours">
                Same hours each weekday
                <span className="help">
                  If meetings leave you 2 focused hours a day, enter 2.
                </span>
              </label>
              <div>
                <input
                  ref={quickInput}
                  id="same-hours"
                  aria-label="Same hours each weekday"
                  type="number"
                  min="0"
                  max="24"
                  step="0.25"
                  placeholder="e.g. 3"
                  value={sameHours}
                  aria-invalid={quickError || undefined}
                  aria-describedby={quickError ? "quick-error" : undefined}
                  onChange={(e) => {
                    setSameHours(e.target.value);
                    setQuickError(false);
                    setQuickNotice("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyHours();
                    }
                  }}
                />
                <button
                  className="button outline"
                  type="button"
                  onClick={applyHours}
                >
                  Apply to weekdays
                </button>
              </div>
            </div>
            {quickError && (
              <p id="quick-error" className="field-error" role="alert">
                Enter 0–24 hours in 0.25-hour steps before applying.
              </p>
            )}
            {quickNotice && (
              <p className="quick-notice" role="status">
                {quickNotice}
              </p>
            )}
            <div className="day-inputs">
              {DAYS.map((day, i) => {
                const invalid =
                  errors.length > 0 && !validHours(scenario.capacity[i]);
                return (
                  <label key={day}>
                    <span>{day.slice(0, 3)}</span>
                    <div className="hours-input">
                      <input
                        aria-label={`${day} focused hours`}
                        required
                        type="number"
                        min="0"
                        max="24"
                        step="0.25"
                        aria-invalid={invalid || undefined}
                        aria-describedby={
                          invalid ? "capacity-error" : "capacity-help"
                        }
                        value={
                          Number.isNaN(scenario.capacity[i])
                            ? ""
                            : scenario.capacity[i] / 4
                        }
                        onChange={(e) => {
                          setQuickNotice("");
                          change({
                            ...scenario,
                            capacity: scenario.capacity.map((v, j) =>
                              i === j ? parseHours(e.target.value) : v,
                            ),
                          });
                        }}
                      />
                      <span>h</span>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="help" id="capacity-help">
              Starts at 0 (unavailable). Add only time still ahead this week.
            </p>
            {errors.length > 0 &&
              !scenario.capacity.every((n) => validHours(n)) && (
                <p className="field-error" id="capacity-error">
                  Each day needs 0–24 hours, in 0.25-hour steps. Use 0 for
                  unavailable days.
                </p>
              )}
            <details
              className="reserve-control"
              open={errors.some((e) => e.startsWith("Reserve")) || undefined}
            >
              <summary>
                Keep some time uncommitted <span>Optional</span>
              </summary>
              <p className="help">
                For interruptions, urgent work or breathing room. We subtract
                only the buffer you enter below. Leave it at 0 if your focused
                hours already include a buffer, so you don’t count it twice.
              </p>
              <div className="day-inputs">
                {DAYS.map((day, i) => {
                  const value = scenario.reserve?.[i] ?? 0;
                  const invalid =
                    errors.length > 0 &&
                    (!validHours(value) || value > scenario.capacity[i]);
                  return (
                    <label key={day}>
                      {day.slice(0, 3)}
                      <input
                        type="number"
                        min="0"
                        max={
                          Number.isFinite(scenario.capacity[i])
                            ? scenario.capacity[i] / 4
                            : 24
                        }
                        step="0.25"
                        aria-label={`${day} reserved hours`}
                        aria-invalid={invalid || undefined}
                        aria-describedby={invalid ? "reserve-error" : undefined}
                        value={Number.isNaN(value) ? "" : value / 4}
                        onChange={(e) =>
                          change({
                            ...scenario,
                            reserve: DAYS.map((_, j) =>
                              i === j
                                ? parseHours(e.target.value)
                                : (scenario.reserve?.[j] ?? 0),
                            ),
                          })
                        }
                      />
                    </label>
                  );
                })}
              </div>
              {errors.some((e) => e.startsWith("Reserve")) && (
                <p className="field-error" id="reserve-error">
                  Use 0–24 hours in 0.25-hour steps, no more than that day’s
                  focused time.
                </p>
              )}
            </details>
            <div className="usable-time">
              <span>
                {capacityComplete
                  ? `${hours(gross)}h entered − ${hours(reserve)}h kept uncommitted`
                  : "Complete the daily hours above"}
              </span>
              <strong>
                {capacityComplete
                  ? `${hours(gross - reserve)}h usable this week`
                  : "—"}
              </strong>
            </div>
          </section>
          <section
            className="panel commitments-section"
            aria-labelledby="existing-work"
          >
            <div className="input-section-heading">
              <span className="section-marker">03</span>
              <div>
                <h2 id="existing-work" tabIndex={-1}>
                  What I’ve already committed to
                </h2>
                <p>Work you already owe, sharing those same focused hours.</p>
              </div>
              <span className="section-state">{scenario.tasks.length} / 8</span>
            </div>
            <div className="task-list">
              {scenario.tasks.map((task, i) => (
                <TaskEditor
                  key={task.id}
                  task={task}
                  label={`Commitment ${i + 1}`}
                  showErrors={errors.length > 0}
                  onChange={(t) =>
                    change({
                      ...scenario,
                      tasks: scenario.tasks.map((v) => (v.id === t.id ? t : v)),
                    })
                  }
                  onRemove={() => {
                    change({
                      ...scenario,
                      tasks: scenario.tasks.filter((t) => t.id !== task.id),
                    });
                    setTimeout(() => {
                      const next = document.querySelector<HTMLInputElement>(
                        `[aria-label="Commitment ${i + 1} name"]`,
                      );
                      (
                        next ?? document.getElementById("add-commitment")
                      )?.focus();
                    }, 0);
                  }}
                />
              ))}
            </div>
            {scenario.tasks.length === 0 && (
              <div className="commitment-empty">
                <p>No existing work added.</p>
                <span>
                  Add only what’s still left to do, such as a report or client
                  updates. Nothing else due? You can skip this.
                </span>
              </div>
            )}
            <button
              className="add-button"
              id="add-commitment"
              type="button"
              disabled={scenario.tasks.length >= 8}
              onClick={() => {
                const id = crypto.randomUUID();
                change({
                  ...scenario,
                  tasks: [
                    ...scenario.tasks,
                    {
                      id,
                      name: "",
                      units: NaN,
                      deadline: 4,
                      movable: false,
                      priority: "normal",
                    },
                  ],
                });
                setTimeout(
                  () =>
                    document
                      .querySelector<HTMLInputElement>(
                        `[aria-label="Commitment ${scenario.tasks.length + 1} name"]`,
                      )
                      ?.focus(),
                  0,
                );
              }}
            >
              <Plus size={16} /> Add a commitment
            </button>
            {scenario.tasks.length >= 8 && (
              <p className="help">
                Eight commitments is the limit for this check. Remove one to add
                another.
              </p>
            )}
          </section>
          <div className="check-week">
            <div>
              <strong>Ready to see what fits?</strong>
              <p>See deadline conflicts and possible changes.</p>
            </div>
            <button className="button primary" type="submit">
              Check my week <ArrowRight size={17} />
            </button>
          </div>
        </div>
        <details className="assumptions">
          <summary>
            How this check works <ChevronDown size={14} />
          </summary>
          <p>
            One person, one Monday–Friday planning week. All work is available
            from the start, can be split into 15-minute pieces, and has no
            dependencies. Deadlines are end of day. Enter only remaining
            availability; we do not infer dates, meetings, weekends, overtime,
            or next week’s capacity. This is an estimate, not a delivery
            guarantee. If work can only start later or must happen at a fixed
            time, this simplified check is not sufficient.
          </p>
        </details>{" "}
        <p className="input-privacy">
          <LockKeyhole size={14} /> Your task details stay in this browser.
          Nothing is sent to your manager.
        </p>
      </form>
    </div>
  );
}
