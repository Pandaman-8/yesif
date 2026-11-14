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
      </div>
      {onRemove && (
        <details className="task-settings">
          <summary>
            Can this commitment change? {task.movable ? "Can discuss" : "Fixed"}{" "}
            · {task.priority} priority
          </summary>
          <p className="help">
            Fixed work stays protected. “Can discuss” allows a proposed move
            beyond this week; approval and a new date are still needed.
          </p>
          <div className="task-fields">
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
          </div>
        </details>
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
