import { isScenario, simulate, type Scenario } from "../domain/engine";
export interface SavedDecision {
  id: string;
  created: string;
  scenario: Scenario;
  plan: { deferred: string[]; requestUnits: number };
  message: string;
  outcome: "pending" | "agreed" | "revisit";
  notes: string;
  scope?: string;
}
export interface Notebook {
  version: 1;
  decisions: SavedDecision[];
}
export const STORAGE_KEY = "yesif.notebook.v1";
function validDecision(value: unknown): value is SavedDecision {
  if (!value || typeof value !== "object") return false;
  const v = value as SavedDecision;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    v.id.length <= 100 &&
    typeof v.created === "string" &&
    Number.isFinite(Date.parse(v.created)) &&
    isScenario(v.scenario) &&
    typeof v.message === "string" &&
    v.message.length <= 10000 &&
    (v.scope === undefined ||
      (typeof v.scope === "string" && v.scope.length <= 500)) &&
    typeof v.notes === "string" &&
    v.notes.length <= 2000 &&
    ["pending", "agreed", "revisit"].includes(v.outcome) &&
    !!v.plan &&
    Array.isArray(v.plan.deferred) &&
    simulate(v.scenario, v.plan.deferred, v.plan.requestUnits).result.fits
  );
}
export function readNotebook(storage: Pick<Storage, "getItem">): {
  notebook: Notebook;
  warning: string;
} {
  const blank: Notebook = { version: 1, decisions: [] };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { notebook: blank, warning: "" };
    if (raw.length > 1000000) throw new Error("Too large");
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") throw new Error("Invalid");
    const v = value as Notebook;
    if (
      v.version !== 1 ||
      !Array.isArray(v.decisions) ||
      v.decisions.length > 50
    )
      throw new Error("Invalid");
    const seen = new Set<string>();
    const valid = v.decisions.filter((d) => {
      try {
        if (!validDecision(d) || seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      } catch {
        return false;
      }
    });
    return {
      notebook: { version: 1, decisions: valid },
      warning:
        valid.length === v.decisions.length
          ? ""
          : "Some saved decisions could not be read. Valid records were recovered. The original data stays untouched until your next explicit save, update or deletion.",
    };
  } catch {
    return {
      notebook: blank,
      warning:
        "Saved decisions could not be read. Your current work still works. Saving a new decision will replace unreadable data.",
    };
  }
}
export function writeNotebook(
  storage: Pick<Storage, "setItem">,
  notebook: Notebook,
): string {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(notebook));
    return "";
  } catch {
    return "This browser could not save your decision. Copy your proposal before leaving.";
  }
}

// Compare persisted meaning, independent of object-key order, generated task IDs,
// commitment order and the equivalent absent/zero reserve in legacy records.
export function scenarioContent(s: Scenario): string {
  const task = (t: Scenario["request"]) => [
    t.name,
    t.units,
    t.deadline,
    t.movable,
    t.priority,
  ];
  return JSON.stringify({
    capacity: s.capacity,
    reserve: s.reserve ?? [0, 0, 0, 0, 0],
    request: task(s.request),
    tasks: s.tasks
      .map(task)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  });
}
export function sameSavedContent(
  a: Pick<SavedDecision, "scenario" | "plan" | "message" | "scope">,
  b: Pick<SavedDecision, "scenario" | "plan" | "message" | "scope">,
): boolean {
  const moved = (d: typeof a) =>
    JSON.stringify(
      d.scenario.tasks
        .map((t) => [
          t.name,
          t.units,
          t.deadline,
          t.movable,
          t.priority,
          d.plan.deferred.includes(t.id),
        ])
        .sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y))),
    );
  return (
    scenarioContent(a.scenario) === scenarioContent(b.scenario) &&
    moved(a) === moved(b) &&
    a.plan.requestUnits === b.plan.requestUnits &&
    a.message === b.message &&
    (a.scope ?? "") === (b.scope ?? "")
  );
}
