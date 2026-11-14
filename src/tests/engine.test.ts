import { describe, it, expect } from "vitest";
import {
  analyze,
  feasibility,
  exampleScenario,
  simulate,
  proposal,
  validate,
  type Task,
} from "../domain/engine";
const task = (
  id: string,
  units: number,
  deadline: number,
  movable = false,
  priority: "normal" | "high" = "normal",
): Task => ({ id, name: id, units, deadline, movable, priority });
describe("deadline engine", () => {
  it("calculates the supplied example without special cases", () => {
    const a = analyze(exampleScenario());
    expect(a.baseline.total).toBe(72);
    expect(a.baseline.capacity).toBe(60);
    expect(a.baseline.overload).toBe(12);
    expect(a.options.map((o) => [o.kind, o.result.total])).toEqual([
      ["defer", 52],
      ["scope", 60],
    ]);
  });
  it("rejects an early deadline even when the weekly total fits", () => {
    const s = exampleScenario();
    s.tasks = [task("early", 28, 1)];
    s.request = task("new", 4, 4);
    const a = analyze(s);
    expect(a.baseline.overload).toBe(0);
    expect(a.baseline.fits).toBe(false);
    expect(a.baseline.checkpoints[1].deficit).toBe(4);
    expect(a.options).toHaveLength(0);
  });
  it("accepts exact-fit and empty existing workload", () => {
    const s = exampleScenario();
    s.tasks = [];
    s.request.units = 60;
    const a = analyze(s);
    expect(a.options[0].kind).toBe("accept");
    expect(a.baseline.fits).toBe(true);
  });
  it("never invents work capacity when all days are unavailable", () => {
    const s = exampleScenario();
    s.capacity = [0, 0, 0, 0, 0];
    expect(analyze(s).options).toEqual([]);
  });
  it("never defers fixed tasks; may offer a true scope reduction", () => {
    const s = exampleScenario();
    s.tasks.forEach((t) => (t.movable = false));
    expect(analyze(s).options.map((o) => o.kind)).toEqual(["scope"]);
    expect(() => simulate(s, ["report"], 20)).toThrow("Only negotiable");
  });
  it("requires a positive reduced deliverable", () => {
    const s = exampleScenario();
    s.tasks = [task("full", 60, 4)];
    expect(analyze(s).options).toEqual([]);
    expect(() => simulate(s, [], 0)).toThrow();
  });
  it("scope is bounded by later obligations as well as its own deadline", () => {
    const s = exampleScenario();
    s.tasks = [task("later", 52, 4)];
    s.request = task("new", 20, 1);
    const a = analyze(s);
    expect(a.options[0].requestUnits).toBe(8);
  });
  it("scope cannot fix a preexisting deadline conflict", () => {
    const s = exampleScenario();
    s.tasks = [task("already late", 20, 0)];
    expect(analyze(s).options).toEqual([]);
  });
  it("finds multi-task deferrals and removes redundant supersets", () => {
    const s = exampleScenario();
    s.tasks = [
      task("a", 20, 4, true),
      task("b", 20, 4, true),
      task("c", 20, 4, true),
    ];
    s.request.units = 40;
    const opts = analyze(s).options.filter((o) => o.kind === "defer");
    expect(opts).toHaveLength(3);
    expect(opts.every((o) => o.deferred.length === 2)).toBe(true);
  });
  it("ranks fewer high-priority changes before task count", () => {
    const s = exampleScenario();
    s.tasks = [
      task("high", 24, 4, true, "high"),
      task("a", 12, 4, true),
      task("b", 12, 4, true),
    ];
    s.request.units = 36;
    expect(analyze(s).options[0].deferred).toEqual(["a", "b"]);
  });
  it("supports combinations the automatic suggestions do not enumerate", () => {
    const s = exampleScenario();
    s.tasks = [task("flex", 8, 4, true), task("fixed", 44, 4)];
    s.request.units = 24;
    expect(analyze(s).options.map((o) => o.kind)).toEqual(["scope"]);
    const o = simulate(s, ["flex"], 16);
    expect(o.kind).toBe("combined");
    expect(o.result.fits).toBe(true);
    expect(proposal(s, o)).toContain("smaller, 4-hour version");
    expect(proposal(s, o)).toContain("flex (2 hours");
  });
  it("reports invalid simulation and refuses to generate its proposal", () => {
    const s = exampleScenario();
    const o = simulate(s, [], 20);
    expect(o.result.fits).toBe(false);
    expect(() => proposal(s, o)).toThrow("still conflicts");
  });
  it("rejects unknown/duplicate deferrals and invalid scope", () => {
    const s = exampleScenario();
    for (const ids of [["missing"], ["report", "report"]])
      expect(() => simulate(s, ids, 20)).toThrow();
    for (const n of [NaN, 1.5, 0, 21, -1])
      expect(() => simulate(s, [], n)).toThrow();
  });
  it("uses actual data in proposals without assuming future capacity", () => {
    const s = exampleScenario();
    s.request.name = "Partner launch";
    s.request.deadline = 3;
    s.capacity = [12, 12, 12, 16, 8];
    const o = simulate(s, ["report"], 20);
    const p = proposal(s, o);
    expect(p).toContain("Partner launch by Thursday");
    expect(p).toContain("13 hours already committed");
    expect(p).toContain("15 focused hours");
    expect(p).toContain("18 hours");
    expect(p).toContain("Capacity beyond this week has not been checked");
    expect(p).not.toContain("approved");
  });
  it("revalidates stale selections against current inputs", () => {
    const s = exampleScenario();
    const o = simulate(s, ["report"], 20);
    s.tasks[2].movable = false;
    expect(() => proposal(s, o)).toThrow();
  });
  it.each([NaN, Infinity, -1, 1.5, 97])(
    "validates availability %s",
    (value) => {
      const s = exampleScenario();
      s.capacity[0] = value;
      expect(validate(s).length).toBeGreaterThan(0);
      expect(() => analyze(s)).toThrow();
    },
  );
  it("validates identifiers, task limits, names, durations and weekdays", () => {
    const s = exampleScenario();
    s.tasks[0].name = " ";
    s.tasks[0].units = 0;
    s.tasks[0].deadline = 5;
    s.tasks[0].id = s.request.id;
    expect(validate(s)).toHaveLength(4);
    s.tasks = Array.from({ length: 9 }, (_, i) => task(String(i), 1, 4));
    expect(validate(s)).toContain("Add no more than 8 existing commitments.");
    expect(validate(null)).toHaveLength(1);
  });
  it("matches a discrete earliest-deadline execution oracle on 500 generated cases", () => {
    let seed = 129;
    const random = (max: number) => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed % max;
    };
    for (let c = 0; c < 500; c++) {
      const capacity = Array.from({ length: 5 }, () => random(15));
      const tasks = Array.from({ length: random(9) }, (_, i) =>
        task(String(i), 1 + random(18), random(5), random(2) === 1),
      );
      const remaining = tasks
        .map((t) => ({ ...t }))
        .sort((a, b) => a.deadline - b.deadline);
      let missed = false;
      for (let day = 0; day < 5; day++) {
        for (let slot = 0; slot < capacity[day]; slot++) {
          const next = remaining.find((t) => t.units > 0);
          if (next) next.units--;
        }
        if (remaining.some((t) => t.deadline <= day && t.units > 0))
          missed = true;
      }
      expect(feasibility(capacity, tasks).fits).toBe(!missed);
      const s = {
        capacity,
        tasks,
        request: task("request", 1 + random(18), random(5)),
      };
      for (const o of analyze(s).options) {
        expect(simulate(s, o.deferred, o.requestUnits).result.fits).toBe(true);
        expect(
          o.deferred.every((id) => tasks.find((t) => t.id === id)?.movable),
        ).toBe(true);
      }
    }
  });
});
