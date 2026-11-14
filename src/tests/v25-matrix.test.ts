import { expect, it } from "vitest";
import { analyzeConflicts } from "../domain/conflicts";
import { analyze, exampleScenario, simulate, validate } from "../domain/engine";
import { decisionFacts } from "../domain/decisionTools";
const matrix = () => {
  const base = exampleScenario(),
    fits = exampleScenario(),
    early = exampleScenario(),
    newEarly = exampleScenario(),
    combined = exampleScenario(),
    zero = exampleScenario(),
    exact = exampleScenario();
  fits.tasks = [fits.tasks[0]];
  early.tasks = [{ ...early.tasks[2], units: 28, deadline: 1, movable: false }];
  early.request.units = 4;
  const same = structuredClone(early);
  same.request.deadline = 1;
  const mixed = structuredClone(early);
  mixed.request.units = 40;
  newEarly.capacity = [4, 4, 4, 4, 0];
  newEarly.tasks = [{ ...newEarly.tasks[0], units: 20, deadline: 4 }];
  newEarly.request = { ...newEarly.request, units: 8, deadline: 0 };
  combined.tasks = [
    { ...combined.tasks[0], units: 44, deadline: 4 },
    { ...combined.tasks[2], units: 8 },
  ];
  combined.request.units = 24;
  zero.capacity = [0, 0, 0, 0, 0];
  zero.tasks = [];
  exact.tasks = [{ ...exact.tasks[0], units: 40, deadline: 4 }];
  return [
    {
      name: "normal",
      s: fits,
      ids: [],
      u: 20,
      total: 40,
      cap: 60,
      first: -1,
      gap: 0,
    },
    {
      name: "overload",
      s: base,
      ids: [],
      u: 20,
      total: 72,
      cap: 60,
      first: 4,
      gap: 12,
    },
    {
      name: "defer",
      s: base,
      ids: ["report"],
      u: 20,
      total: 52,
      cap: 60,
      first: -1,
      gap: 0,
    },
    {
      name: "reduce",
      s: base,
      ids: [],
      u: 8,
      total: 60,
      cap: 60,
      first: -1,
      gap: 0,
    },
    {
      name: "existing early",
      s: early,
      ids: [],
      u: 4,
      total: 32,
      cap: 60,
      first: 1,
      gap: 4,
    },
    {
      name: "same-day added",
      s: same,
      ids: [],
      u: 4,
      total: 32,
      cap: 60,
      first: 1,
      gap: 8,
    },
    {
      name: "mixed",
      s: mixed,
      ids: [],
      u: 40,
      total: 68,
      cap: 60,
      first: 1,
      gap: 4,
    },
    {
      name: "new early + existing late",
      s: newEarly,
      ids: [],
      u: 8,
      total: 28,
      cap: 16,
      first: 0,
      gap: 4,
    },
    {
      name: "exact",
      s: exact,
      ids: [],
      u: 20,
      total: 60,
      cap: 60,
      first: -1,
      gap: 0,
    },
    {
      name: "zero",
      s: zero,
      ids: [],
      u: 20,
      total: 20,
      cap: 0,
      first: 4,
      gap: 20,
    },
    {
      name: "combined",
      s: combined,
      ids: ["report"],
      u: 16,
      total: 60,
      cap: 60,
      first: -1,
      gap: 0,
    },
  ];
};
it.each(matrix())(
  "reference matrix: $name",
  ({ s, ids, u, total, cap, first, gap }) => {
    const p = simulate(s, ids, u);
    expect(p.result.total).toBe(total);
    expect(p.result.capacity).toBe(cap);
    const c = p.result.checkpoints.find((c) => c.deficit > 0);
    expect(c?.day ?? -1).toBe(first);
    expect(c?.deficit ?? 0).toBe(gap);
    expect(p.result.fits).toBe(first === -1);
    // Independent prefix arithmetic, including deferred work and reserve.
    for (let day = 0; day < 5; day++) {
      const due =
        s.tasks
          .filter((t) => !ids.includes(t.id) && t.deadline <= day)
          .reduce((n, t) => n + t.units, 0) +
        (s.request.deadline <= day ? u : 0);
      const capacity = s.capacity
        .slice(0, day + 1)
        .reduce((n, v, i) => n + v - (s.reserve?.[i] ?? 0), 0);
      expect(p.result.checkpoints[day]).toMatchObject({
        due,
        available: capacity,
        deficit: Math.max(0, due - capacity),
      });
    }
    if (p.result.fits) {
      const f = decisionFacts(s, p);
      expect(f.plan.result).toEqual(p.result);
      expect(f.moved.map((t) => t.id)).toEqual(ids);
    }
  },
);
it("reserves, quarter-hour scope, fixed protection and invalid identities remain enforced", () => {
  const s = exampleScenario();
  s.reserve = [1, 1, 1, 1, 1];
  const p = simulate(s, ["report"], 19);
  expect(p.result.capacity).toBe(55);
  expect(p.requestUnits).toBe(19);
  expect(p.result.fits).toBe(true);
  expect(() => simulate(s, ["qa"], 1)).toThrow();
  s.request.units = NaN;
  expect(validate(s).length).toBeGreaterThan(0);
  expect(() => analyze(s)).toThrow();
  s.request.units = 20;
  s.tasks[1].id = s.tasks[0].id;
  expect(validate(s).join(" ")).toContain("duplicate");
  const z = matrix().find((x) => x.name === "zero")!;
  expect(analyzeConflicts(z.s).verifiedAlternatives).toHaveLength(0);
});
