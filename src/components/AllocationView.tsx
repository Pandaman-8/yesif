import { allocate } from "../domain/allocation";
import { DAYS, hours, type Option, type Scenario } from "../domain/engine";
export function AllocationView({
  scenario,
  plan,
}: {
  scenario: Scenario;
  plan: Option;
}) {
  const allocation = allocate(scenario, plan);
  if (!allocation.fits)
    return (
      <p className="help">
        No complete allocation is possible with these changes.
      </p>
    );
  const tasks = [...scenario.tasks, scenario.request];
  return (
    <details className="allocation">
      <summary>
        How your week could work{" "}
        <span>
          {hours(plan.result.capacity - plan.result.total)}h unassigned
        </span>
      </summary>
      <p className="help">
        One possible allocation based on your entered hours and assumptions.
        Work with the nearest deadline comes first; ties follow your input
        order, with the new request last.
      </p>
      <ol className="allocation-days">
        {allocation.days.map((day) => (
          <li key={day.day}>
            <strong>{DAYS[day.day]}</strong>
            <div>
              {day.assignments.map((a) => (
                <p key={a.taskId}>
                  {tasks.find((t) => t.id === a.taskId)!.name}{" "}
                  <b>{hours(a.units)}h</b>
                </p>
              ))}
              <p className="day-spare">
                {hours(day.available)}h available
                {day.reserve > 0 &&
                  ` · ${hours(day.reserve)}h reserved separately`}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="fine-print">
        All work can start at the beginning of the week and can be split. No
        fixed appointments or dependencies are modeled. This is not a delivery
        guarantee.
      </p>
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
