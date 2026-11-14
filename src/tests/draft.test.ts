import { expect, it } from "vitest";
import { emptyScenario, exampleScenario } from "../domain/engine";
import { DRAFT_KEY, readDraft, writeDraft, type Draft } from "../storage/draft";
import { readNotebook, STORAGE_KEY } from "../storage/scenarios";
const draft = (): Draft => ({
  version: 2,
  scenario: emptyScenario(),
  plan: null,
  unresolved: false,
  message: "",
  scope: "",
});
it("preserves empty numeric fields as invalid through an explicit draft save", () => {
  const d = draft();
  d.scenario.capacity[0] = NaN;
  d.scenario.request.units = NaN;
  expect(writeDraft(localStorage, d)).toBe("");
  const recovered = readDraft(localStorage)!;
  expect(Number.isNaN(recovered.scenario.capacity[0])).toBe(true);
  expect(Number.isNaN(recovered.scenario.request.units)).toBe(true);
  expect(recovered.scenario.request.name).toBe("");
});
it("rejects corrupt drafts and literal null numeric values", () => {
  for (const raw of [
    "{bad",
    "null",
    JSON.stringify({
      ...draft(),
      scenario: { ...emptyScenario(), capacity: [null, 0, 0, 0, 0] },
    }),
  ]) {
    localStorage.setItem(DRAFT_KEY, raw);
    expect(readDraft(localStorage)).toBeNull();
  }
  expect(
    writeDraft(
      {
        setItem() {
          throw new Error();
        },
      },
      draft(),
    ),
  ).toContain("could not save");
});
it("recovers valid legacy records alongside a damaged record without replacing stored data", () => {
  const record = {
    id: "old",
    created: "2026-11-14",
    scenario: exampleScenario(),
    plan: { deferred: ["report"], requestUnits: 20 },
    message: "Old exact words",
    outcome: "pending",
    notes: "",
  };
  const raw = JSON.stringify({ version: 1, decisions: [{}, record] });
  localStorage.setItem(STORAGE_KEY, raw);
  const r = readNotebook(localStorage);
  expect(r.notebook.decisions).toEqual([record]);
  expect(r.warning).toContain("recovered");
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
});
