import { isScenario, simulate, type Scenario } from "../domain/engine";
export const DRAFT_KEY = "yesif.draft.v2";
export interface Draft {
  version: 2;
  page?: "workload" | "results" | "proposal";
  scenario: Scenario;
  plan: { deferred: string[]; requestUnits: number } | null;
  preview?: { deferred: string[]; requestUnits: number };
  unresolved: boolean;
  message: string;
  scope: string;
}
// Invalid/empty numeric fields remain explicitly invalid; JSON null is never treated as zero.
export function encodeDraft(draft: Draft): string {
  return JSON.stringify(draft, (_key, value) =>
    typeof value === "number" && !Number.isFinite(value)
      ? { invalidNumber: true }
      : value,
  );
}
export function readDraft(storage: Pick<Storage, "getItem">): Draft | null {
  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (!raw || raw.length > 100000) return null;
    const d = JSON.parse(raw, (_key, value) =>
      value &&
      typeof value === "object" &&
      value.invalidNumber === true &&
      Object.keys(value).length === 1
        ? NaN
        : value,
    ) as Draft;
    if (
      !d ||
      d.version !== 2 ||
      typeof d.message !== "string" ||
      d.message.length > 10000 ||
      typeof d.scope !== "string" ||
      d.scope.length > 500 ||
      typeof d.unresolved !== "boolean"
    )
      return null;
    if (
      d.page !== undefined &&
      !["workload", "results", "proposal"].includes(d.page)
    )
      return null;
    const s = d.scenario;
    const number = (v: unknown) =>
      typeof v === "number" && (Number.isNaN(v) || Number.isFinite(v));
    if (
      !s ||
      !Array.isArray(s.capacity) ||
      s.capacity.length !== 5 ||
      !s.capacity.every(number) ||
      !Array.isArray(s.tasks) ||
      s.tasks.length > 8
    )
      return null;
    if (
      s.reserve !== undefined &&
      (!Array.isArray(s.reserve) ||
        s.reserve.length !== 5 ||
        !s.reserve.every(number))
    )
      return null;
    const ids = new Set<string>();
    for (const t of [...s.tasks, s.request]) {
      if (
        !t ||
        typeof t.id !== "string" ||
        !t.id ||
        t.id.length > 100 ||
        ids.has(t.id) ||
        typeof t.name !== "string" ||
        t.name.length > 100 ||
        !number(t.units) ||
        !Number.isInteger(t.deadline) ||
        t.deadline < 0 ||
        t.deadline > 4 ||
        typeof t.movable !== "boolean" ||
        !["normal", "high"].includes(t.priority)
      )
        return null;
      ids.add(t.id);
    }
    if (
      d.plan !== null &&
      (!isScenario(s) ||
        !simulate(s, d.plan.deferred, d.plan.requestUnits).result.fits)
    )
      return null;
    if (
      d.preview &&
      (!isScenario(s) ||
        !simulate(s, d.preview.deferred, d.preview.requestUnits))
    )
      return null;
    if (
      d.unresolved &&
      (!isScenario(s) || simulate(s, [], s.request.units).result.fits)
    )
      return null;
    if (d.page === "results" && !isScenario(s)) return null;
    if (d.page === "proposal" && !d.plan && !d.unresolved) return null;
    return d;
  } catch {
    return null;
  }
}
export function writeDraft(
  storage: Pick<Storage, "setItem">,
  d: Draft,
): string {
  try {
    storage.setItem(DRAFT_KEY, encodeDraft(d));
    return "";
  } catch {
    return "This browser could not save your draft. Your current work is still here.";
  }
}
