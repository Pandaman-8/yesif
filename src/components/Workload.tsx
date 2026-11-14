import type { FormEvent, RefObject } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  LockKeyhole,
  Plus,
  RotateCcw,
} from "lucide-react";
import { DAYS, hours, type Scenario } from "../domain/engine";
import { TaskEditor, parseHours } from "./Shared";
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
export function Workload({
  scenario,
  change,
  heading,
  errors,
  submit,
  reset,
}: {
  scenario: Scenario;
  change: (s: Scenario) => void;
  heading: RefObject<HTMLHeadingElement | null>;
  errors: string[];
  submit: (e: FormEvent) => void;
  reset: () => void;
}) {
  return (
    <>
      {" "}
      <div className="page-heading">
        <div>
          <p className="eyebrow">Set the scene</p>
          <h1 ref={heading} tabIndex={-1}>
            Let’s make the request concrete.
          </h1>
          <p>
            One Monday–Friday planning week. Count the focused time you actually
            have.
          </p>
        </div>
        <button className="text-button" onClick={reset}>
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
        <div className="input-journey">
          {" "}
          <section className="panel request-first">
            <div className="request-icon">
              <ArrowUpRight size={24} />
            </div>
            <p className="eyebrow">1 · The new request</p>
            <h2>What are you being asked to do?</h2>
            <p className="help">What are you being asked to take on?</p>
            <TaskEditor
              task={scenario.request}
              label="New request"
              onChange={(request) => change({ ...scenario, request })}
            />
            <div className="request-note">
              <LockKeyhole size={15} />
              <span>
                Your task details stay in this browser. Nothing is sent to your
                manager.
              </span>
            </div>
          </section>{" "}
          <section className="panel">
            <div className="section-title">
              <div>
                <p className="eyebrow">2 · Your available time</p>
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
              Hours left after meetings, admin and breaks. Reserve extra time
              below if you want to keep it uncommitted. Use 0 for unavailable or
              already-passed days.
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
                            i === j ? parseHours(e.target.value) : v,
                          ),
                        })
                      }
                    />
                    <span>h</span>
                  </div>
                </label>
              ))}
            </div>
            <details className="reserve-control">
              <summary>
                Time I want to keep available (optional reserve)
              </summary>
              <p className="help">
                We subtract these hours before checking any plan. Leave zero if
                your focused hours already include a buffer.
              </p>
              <div className="day-inputs">
                {DAYS.map((day, i) => (
                  <label key={day}>
                    {day.slice(0, 3)}
                    <input
                      type="number"
                      min="0"
                      max={scenario.capacity[i] / 4}
                      step="0.25"
                      aria-label={`${day} reserved hours`}
                      value={
                        Number.isNaN(scenario.reserve?.[i])
                          ? ""
                          : (scenario.reserve?.[i] ?? 0) / 4
                      }
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
                ))}
              </div>
            </details>
          </section>
          <section className="panel">
            <div className="section-title">
              <div>
                <p className="eyebrow">3 · Existing commitments</p>
                <h2>The work you’ve already said yes to.</h2>
              </div>
              <span className="small-pill">{scenario.tasks.length} / 8</span>
            </div>
            <p className="help">
              Remaining work only. “Can discuss” means you could ask to defer it
              beyond this week.
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
                      tasks: scenario.tasks.map((v) => (v.id === t.id ? t : v)),
                    })
                  }
                  onRemove={() =>
                    change({
                      ...scenario,
                      tasks: scenario.tasks.filter((t) => t.id !== task.id),
                    })
                  }
                />
              ))}
            </div>
            {scenario.tasks.length === 0 && (
              <p className="empty-inline">
                No existing commitments yet. Add the work that shares this time.
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
            {scenario.tasks.length >= 8 && (
              <p className="help">
                Eight commitments is the limit for this check. Remove one to add
                another.
              </p>
            )}
          </section>
          <button className="button primary" type="submit">
            Find my options <ArrowRight size={17} />
          </button>
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
        </details>
      </form>
    </>
  );
}
