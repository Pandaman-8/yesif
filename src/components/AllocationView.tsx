import { useState } from "react";
import { allocate } from "../domain/allocation";
import { DAYS, hours, type Option, type Scenario } from "../domain/engine";

/** A proportional view of the allocator's witness, never of cached plan.result. */
export function AllocationView({
  scenario,
  plan,
}: {
  scenario: Scenario;
  plan: Option;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const allocation = allocate(scenario, plan);
  if (!allocation.fits)
    return (
      <p className="help">
        No complete allocation is possible with these changes.
      </p>
    );
  const tasks = [...scenario.tasks, scenario.request];
  const scheduled = tasks.filter((t) => !plan.deferred.includes(t.id));
  const active = scheduled.some((t) => t.id === selected) ? selected : null;
  const code = (id: string) =>
    id === scenario.request.id
      ? "N"
      : String.fromCharCode(65 + scenario.tasks.findIndex((t) => t.id === id));
  const tone = (id: string) =>
    id === scenario.request.id
      ? "tone-request"
      : `task-${scenario.tasks.findIndex((t) => t.id === id) % 3}`;
  const maxDay = Math.max(...scenario.capacity, 1);
  const assigned = allocation.days.reduce(
    (n, d) => n + d.assignments.reduce((v, a) => v + a.units, 0),
    0,
  );
  const usable = allocation.days.reduce((n, d) => n + d.capacity, 0);
  const spare = allocation.days.reduce((n, d) => n + d.available, 0);
  const reserved = allocation.days.reduce((n, d) => n + d.reserve, 0);
  const deferred = scenario.tasks.filter((t) => plan.deferred.includes(t.id));
  return (
    <details className="allocation week-map">
      <summary>
        Your week, mapped <span>{hours(spare)}h unassigned</span>
      </summary>
      <p className="week-intro">
        One possible work allocation, calculated from your hours and deadlines.
      </p>
      <p className="week-totals">
        <strong>{hours(assigned)}h assigned</strong> / {hours(usable)}h usable
        {reserved > 0 && ` · ${hours(reserved)}h reserved`}
      </p>
      <div className="week-key">
        <span>Solid: work</span>
        <span>Open: unassigned</span>
        {reserved > 0 && <span>Hatched: reserved</span>}
      </div>
      <ol className="week-days" aria-label="Calculated weekday allocation">
        {allocation.days.map((day) => {
          const entered = day.capacity + day.reserve;
          const description = `${DAYS[day.day]}: ${hours(entered)}h entered, ${hours(day.capacity)}h usable. ${day.assignments.map((a) => `${tasks.find((t) => t.id === a.taskId)!.name}${a.taskId === scenario.request.id ? " (new request)" : ""}: ${hours(a.units)}h`).join("; ")}. ${hours(day.available)}h unassigned; ${hours(day.reserve)}h reserved.`;
          return (
            <li key={day.day} data-day={day.day}>
              <div className="week-day-label">
                <strong>{DAYS[day.day]}</strong>
                <span>
                  {hours(day.capacity)}h usable · {hours(day.available)}h free
                </span>
              </div>
              <div className="week-track" role="img" aria-label={description}>
                {entered === 0 ? (
                  <span className="week-zero">No focused capacity</span>
                ) : (
                  <div
                    className="week-bar"
                    style={{ width: `${(entered / maxDay) * 100}%` }}
                  >
                    {day.assignments.map((a) => (
                      <span
                        key={a.taskId}
                        data-task-id={a.taskId}
                        data-units={a.units}
                        className={`week-segment ${tone(a.taskId)} ${active === a.taskId ? "highlighted" : ""} ${active && active !== a.taskId ? "not-selected" : ""}`}
                        style={{ width: `${(a.units / entered) * 100}%` }}
                        aria-hidden="true"
                      >
                        <span>{code(a.taskId)}</span>
                      </span>
                    ))}
                    {day.available > 0 && (
                      <span
                        className="week-segment unassigned"
                        data-units={day.available}
                        style={{ width: `${(day.available / entered) * 100}%` }}
                        aria-hidden="true"
                      />
                    )}
                    {day.reserve > 0 && (
                      <span
                        className="week-segment reserved"
                        data-units={day.reserve}
                        style={{ width: `${(day.reserve / entered) * 100}%` }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div
        className="week-task-key"
        aria-label="Highlight a task across the week"
      >
        {scheduled.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={active === t.id}
            onClick={() => setSelected(active === t.id ? null : t.id)}
            className="week-task-button"
          >
            <span className={`week-code ${tone(t.id)}`} aria-hidden="true">
              {code(t.id)}
            </span>
            <span>
              {t.name}
              <small>
                {t.id === scenario.request.id
                  ? `New request · ${hours(plan.requestUnits)}h${plan.requestUnits < t.units ? ` of ${hours(t.units)}h requested` : ""}`
                  : `${hours(t.units)}h · due ${DAYS[t.deadline]}`}
              </small>
            </span>
          </button>
        ))}
      </div>
      {deferred.length > 0 && (
        <p className="week-deferred">
          <strong>Outside this week, pending agreement:</strong>{" "}
          {deferred.map((t) => `${t.name} (${hours(t.units)}h)`).join("; ")}.
          Still owed; new dates and future capacity need checking.
        </p>
      )}
      <details className="week-details">
        <summary>Exact hours and assumptions</summary>
        <dl>
          {allocation.days.map((day) => (
            <div key={day.day}>
              <dt>
                {DAYS[day.day]} · {hours(day.capacity + day.reserve)}h entered
              </dt>
              <dd>
                {day.assignments
                  .map(
                    (a) =>
                      `${tasks.find((t) => t.id === a.taskId)!.name}: ${hours(a.units)}h`,
                  )
                  .join("; ") || "No work assigned"}
                . {hours(day.available)}h unassigned; {hours(day.reserve)}h
                reserved.
              </dd>
            </div>
          ))}
        </dl>
        <p className="fine-print">
          Nearest deadlines first; ties follow input order, new request last.
          Work can start at the beginning of the week and can be split. No
          appointments, dependencies or delivery guarantee.
        </p>
      </details>
    </details>
  );
}
export function ChangesView({
  scenario,
  plan,
}: {
  scenario: Scenario;
  plan: Option;
}) {
  const deferred = scenario.tasks.filter((t) => plan.deferred.includes(t.id));
  return (
    <div className="change-ledger">
      <div>
        <h3>Work planned this week</h3>
        <p>
          {[
            ...scenario.tasks
              .filter((t) => !plan.deferred.includes(t.id))
              .map((t) => `${t.name} · ${hours(t.units)}h`),
            `${scenario.request.name} · ${hours(plan.requestUnits)}h`,
          ].join("; ")}
        </p>
      </div>
      <div>
        <h3>Proposed for renegotiation</h3>
        <p>
          {deferred.length
            ? `Propose moving ${deferred.map((t) => t.name).join(" and ")} beyond this week. `
            : "No existing commitment moves. "}
          {plan.requestUnits < scenario.request.units
            ? `Agree a smaller ${hours(plan.requestUnits)}h deliverable instead of ${hours(scenario.request.units)}h.`
            : "Keep the full new deliverable."}
        </p>
      </div>
      <div>
        <h3>Still needs scheduling or approval</h3>
        <p>
          {deferred.length
            ? `${deferred.map((t) => `${t.name} (${hours(t.units)}h)`).join("; ")} remain obligations. Agree new dates and check future capacity.`
            : "Confirm the proposed scope and priorities before committing."}{" "}
          No change is automatically agreed.
        </p>
      </div>
    </div>
  );
}
