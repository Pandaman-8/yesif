import { useState } from "react";
import { X } from "lucide-react";
import { DAYS, hours, type Task, type Feasibility } from "../domain/engine";
export function parseHours(value: string) {
  return value.trim() === "" ? NaN : Number(value) * 4;
}
export function TaskEditor({
  task,
  label,
  onChange,
  onRemove,
  showErrors = false,
}: {
  task: Task;
  label: string;
  onChange: (task: Task) => void;
  onRemove?: () => void;
  showErrors?: boolean;
}) {
  const nameInvalid = !task.name.trim();
  const hoursInvalid =
    !Number.isInteger(task.units) || task.units < 1 || task.units > 480;
  const [expanded, setExpanded] = useState(
    !task.name.trim() || !Number.isInteger(task.units),
  );
  const editing = !onRemove || expanded || nameInvalid || hoursInvalid;
  const id = `task-${task.id}`;
  function toggleEditing(value: boolean) {
    setExpanded(value);
    setTimeout(
      () =>
        document.getElementById(value ? `${id}-name` : `${id}-edit`)?.focus(),
      0,
    );
  }
  return (
    <div
      className={
        onRemove
          ? `task-editor commitment-item ${editing ? "" : "commitment-compact"}`
          : "new-task-editor"
      }
    >
      {!editing && (
        <div className="commitment-overview">
          <div>
            <strong>{task.name}</strong>
            <p>
              {hours(task.units)}h remaining · Due {DAYS[task.deadline]}
              {task.priority === "high" ? " · High priority" : ""}
            </p>
          </div>
          <button
            id={`${id}-edit`}
            className="text-button"
            type="button"
            aria-label={`Edit ${label.toLowerCase()}`}
            onClick={() => toggleEditing(true)}
          >
            Edit
          </button>
          <button
            className="remove-button"
            type="button"
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={onRemove}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {editing && (
        <>
          <div className="task-name">
            <label>
              {onRemove ? label : "Task name"}
              <input
                id={`${id}-name`}
                aria-label={`${label} name`}
                required
                maxLength={100}
                aria-invalid={(showErrors && nameInvalid) || undefined}
                aria-describedby={
                  showErrors && nameInvalid ? `${id}-name-error` : undefined
                }
                placeholder={
                  onRemove ? "e.g. Weekly report" : "e.g. Urgent presentation"
                }
                value={task.name}
                onChange={(e) => onChange({ ...task, name: e.target.value })}
              />
              {showErrors && nameInvalid && (
                <span className="field-error" id={`${id}-name-error`}>
                  Enter a task name.
                </span>
              )}
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
              {onRemove ? "Hours remaining" : "Estimated hours needed"}
              <input
                aria-label={`${label} hours`}
                required
                type="number"
                min="0.25"
                max="120"
                step="0.25"
                placeholder="e.g. 5"
                aria-invalid={(showErrors && hoursInvalid) || undefined}
                aria-describedby={
                  showErrors && hoursInvalid ? `${id}-hours-error` : undefined
                }
                value={Number.isNaN(task.units) ? "" : task.units / 4}
                onChange={(e) =>
                  onChange({ ...task, units: parseHours(e.target.value) })
                }
              />
              {showErrors && hoursInvalid && (
                <span className="field-error" id={`${id}-hours-error`}>
                  Enter 0.25–120 hours, in 0.25-hour steps.
                </span>
              )}
            </label>
            <label>
              Deadline
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
          </div>
        </>
      )}
      {onRemove && (
        <>
          <div className="flexibility-row">
            <label>
              Can its timing change?
              <select
                aria-label={`${label} flexibility`}
                aria-describedby={`${id}-flex-help`}
                value={task.movable ? "movable" : "fixed"}
                onChange={(e) =>
                  onChange({ ...task, movable: e.target.value === "movable" })
                }
              >
                <option value="fixed">Fixed</option>
                <option value="movable">Can discuss</option>
              </select>
            </label>
            <p id={`${id}-flex-help`}>
              {task.movable
                ? "A move beyond this week needs agreement and a new deadline."
                : "This deadline stays protected."}
            </p>
          </div>
          {editing && (
            <div className="commitment-edit-actions">
              <details className="task-settings">
                <summary>
                  Suggestion priority ·{" "}
                  {task.priority === "high" ? "High" : "Normal"}
                </summary>
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
                <p className="help">
                  Priority ranks suggestions. Only “Can discuss” permits a
                  proposed move.
                </p>
              </details>
              <button
                className="text-button"
                type="button"
                disabled={nameInvalid || hoursInvalid}
                aria-label={`Done editing ${label.toLowerCase()}`}
                onClick={() => toggleEditing(false)}
              >
                Done
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export function conflictText(result: Feasibility) {
  const c = result.checkpoints.find((v) => v.deficit);
  return c
    ? `By ${DAYS[c.day]}, ${hours(c.due)}h are due, but only ${hours(c.available)}h are available. That deadline needs ${hours(c.deficit)}h more room.`
    : "";
}
export function DeadlineTable({ result }: { result: Feasibility }) {
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
