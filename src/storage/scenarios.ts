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
