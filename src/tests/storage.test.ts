import { describe, it, expect } from "vitest";
import {
  readNotebook,
  writeNotebook,
  STORAGE_KEY,
  type Notebook,
} from "../storage/scenarios";
import { exampleScenario } from "../domain/engine";
const fixture = (): Notebook => ({
  version: 1,
  decisions: [
    {
      id: "saved",
      created: "2026-11-14T12:00:00Z",
      scenario: exampleScenario(),
      plan: { deferred: ["report"], requestUnits: 20 },
      message: "My edited proposal.",
      outcome: "pending",
      notes: "",
    },
  ],
});
describe("explicit, versioned local storage", () => {
  it("restores exact scenario, edited proposal and outcomes", () => {
    const n = fixture();
    n.decisions[0].outcome = "agreed";
    n.decisions[0].notes = "Report date needs checking";
    expect(writeNotebook(localStorage, n)).toBe("");
    expect(readNotebook(localStorage).notebook).toEqual(n);
  });
  it.each([
    "{broken",
    "null",
    '{"version":2,"decisions":[]}',
    '{"version":1,"decisions":[{}]}',
  ])("handles corrupt or unsupported data %s", (raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    const result = readNotebook(localStorage);
    expect(result.notebook.decisions).toEqual([]);
    expect(result.warning).not.toBe("");
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it("rejects impossible or fixed-task saved plans", () => {
    const n = fixture();
    n.decisions[0].plan.deferred = ["qa"];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(n));
    expect(readNotebook(localStorage).warning).not.toBe("");
  });
  it("handles blocked storage and quota errors", () => {
    expect(
      readNotebook({
        getItem() {
          throw new Error();
        },
      }).warning,
    ).not.toBe("");
    expect(
      writeNotebook(
        {
          setItem() {
            throw new Error();
          },
        },
        fixture(),
      ),
    ).toContain("could not save");
  });
});
