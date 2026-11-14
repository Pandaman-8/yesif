import { describe, expect, it } from "vitest";
import { allocate } from "../domain/allocation";
import {
  analyze,
  availableCapacity,
  exampleScenario,
  simulate,
  validate,
  type Scenario,
} from "../domain/engine";
import {
  practiceFor,
  renegotiationRequest,
  shortProposal,
} from "../domain/conversation";

// Independent witness checker: count each output quarter-hour without reusing scheduler logic.
function check(s: Scenario, deferred: string[], units: number) {
  const witness = allocate(s, { deferred, requestUnits: units });
  const verdict = simulate(s, deferred, units).result.fits;
  expect(witness.fits).toBe(verdict);
  if (!witness.fits) {
    expect(witness.days).toBeNull();
    return;
  }
  const expected = [
    ...s.tasks.filter((t) => !deferred.includes(t.id)),
    { ...s.request, units },
  ];
  const counts = new Map(expected.map((t) => [t.id, 0]));
  expect(witness.days).toHaveLength(5);
  witness.days.forEach((day, index) => {
    expect(day.day).toBe(index);
    let used = 0;
    for (const assignment of day.assignments) {
      const task = expected.find((t) => t.id === assignment.taskId);
      expect(task).toBeDefined();
      expect(Number.isInteger(assignment.units) && assignment.units > 0).toBe(
        true,
      );
      expect(index).toBeLessThanOrEqual(task!.deadline);
      for (let slot = 0; slot < assignment.units; slot++) {
        counts.set(task!.id, counts.get(task!.id)! + 1);
        used++;
      }
    }
    expect(used).toBeLessThanOrEqual(
      s.capacity[index] - (s.reserve?.[index] ?? 0),
    );
    expect(day.available + used + day.reserve).toBe(s.capacity[index]);
  });
  expected.forEach((t) => expect(counts.get(t.id)).toBe(t.units));
}
describe("concrete allocation and conversation", () => {
  it("checks A/B/C and concrete deterministic daily hours", () => {
    const s = exampleScenario();
    check(s, [], 20);
    check(s, ["report"], 20);
    check(s, [], 8);
    const a = allocate(s, { deferred: ["report"], requestUnits: 20 });
    expect(a.fits && a.days.map((d) => d.assignments)).toEqual([
      [{ taskId: "qa", units: 12 }],
      [
        { taskId: "qa", units: 8 },
        { taskId: "updates", units: 4 },
      ],
      [
        { taskId: "updates", units: 8 },
        { taskId: "request", units: 4 },
      ],
      [{ taskId: "request", units: 12 }],
      [{ taskId: "request", units: 4 }],
    ]);
  });
  it("rejects early-deadline and zero-capacity schedules and offers honest requests", () => {
    const s = exampleScenario();
    s.tasks = [{ ...s.tasks[0], units: 28, deadline: 1 }];
    s.request.units = 4;
    check(s, [], 4);
    expect(renegotiationRequest(s)).toContain("Tuesday");
    expect(renegotiationRequest(s)).toContain("1h shortfall");
    expect(renegotiationRequest(s)).toContain("Launch QA");
    s.capacity.fill(0);
    check(s, [], 1);
    expect(() => shortProposal(s, simulate(s, [], 1))).toThrow();
  });
  it("allocates a combined change and names both conditions", () => {
    const s = exampleScenario();
    s.tasks = [
      { ...s.tasks[0], units: 44, deadline: 4 },
      { ...s.tasks[2], units: 8 },
    ];
    s.request.units = 24;
    check(s, ["report"], 16);
    const text = shortProposal(s, simulate(s, ["report"], 16), "Slides only");
    expect(text).toContain("4-hour");
    expect(text).toContain("Weekly report");
    expect(text).toContain("Slides only");
  });
  it("subtracts only explicit reserve and validates unavailable reserve", () => {
    const s = exampleScenario();
    s.reserve = [4, 0, 0, 0, 0];
    expect(analyze(s).baseline.capacity).toBe(56);
    expect(availableCapacity(s)).toEqual([8, 12, 12, 12, 12]);
    check(s, ["report"], 20);
    for (const n of [NaN, -1, 0.5, 13]) {
      s.reserve[0] = n;
      expect(validate(s).length).toBeGreaterThan(0);
    }
  });
  it("uses stable input order for equal deadlines", () => {
    const s = exampleScenario();
    s.tasks = s.tasks.map((t) => ({ ...t, deadline: 4 }));
    const a = allocate(s, { deferred: ["report"], requestUnits: 8 });
    expect(a.fits && a.days[0].assignments[0].taskId).toBe("qa");
  });
  it("validates 1000 independent random schedule witnesses including reserves and manual combinations", () => {
    let seed = 8273;
    const rand = (max: number) => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed % max;
    };
    for (let i = 0; i < 1000; i++) {
      const s = exampleScenario();
      s.capacity = Array.from({ length: 5 }, () => rand(25));
      s.reserve = s.capacity.map((n) => rand(n + 1));
      s.tasks = Array.from({ length: rand(9) }, (_, j) => ({
        id: `t${j}`,
        name: `Independent ${j}`,
        units: 1 + rand(20),
        deadline: rand(5),
        movable: rand(3) > 0,
        priority: "normal",
      }));
      s.request.units = 1 + rand(24);
      s.request.deadline = rand(5);
      check(s, [], s.request.units);
      check(
        s,
        s.tasks.filter((t) => t.movable && rand(2)).map((t) => t.id),
        1 + rand(s.request.units),
      );
      startingOptions(s).forEach((o) => check(s, o.deferred, o.requestUnits));
    }
  });
  it("grounds practice in the actual request and deadline with varied answer position", () => {
    const positions = new Set<number>();
    for (const name of ["A", "B", "C"]) {
      const s = exampleScenario();
      s.request.name = name;
      s.request.deadline = 3;
      const p = practiceFor(s, simulate(s, ["report"], 16));
      expect(p.prompt).toContain("Thursday");
      const index = p.choices.findIndex((c) => c.id === "grounded");
      positions.add(index);
      expect(p.context).toContain("Weekly report");
      expect(p.choices[index].evidence.map((e) => e.status)).toEqual(
        Array(5).fill("supported"),
      );
    }
    expect(positions.size).toBe(3);
  });
});

import { startingOptions } from "../domain/options";
it("offers a checked combined starting point when full-scope deferrals cannot fit", () => {
  const s = exampleScenario();
  s.tasks = [
    { ...s.tasks[0], units: 44, deadline: 4 },
    { ...s.tasks[2], units: 8 },
  ];
  s.request.units = 24;
  const options = startingOptions(s);
  expect(options.map((o) => [o.kind, o.requestUnits])).toEqual([
    ["scope", 8],
    ["combined", 16],
  ]);
  options.forEach((o) => check(s, o.deferred, o.requestUnits));
});
