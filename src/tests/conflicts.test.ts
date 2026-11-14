import { expect, it } from "vitest";
import {
  analyzeConflicts,
  causalSummary,
  conflictBreakdown,
  simulationConstraint,
} from "../domain/conflicts";
import {
  detailedProposal,
  practiceFor,
  renegotiationRequest,
} from "../domain/conversation";
import {
  exampleScenario,
  simulate,
  type Scenario,
  type Task,
} from "../domain/engine";
import { readNotebook, type Notebook } from "../storage/scenarios";
import { readDraft } from "../storage/draft";
const task = (
  id: string,
  units: number,
  deadline: number,
  movable = false,
): Task => ({
  id,
  name: `Work ${id}`,
  units,
  deadline,
  movable,
  priority: "normal",
});
const scenario = (tasks: Task[], request = task("new", 4, 4)): Scenario => ({
  capacity: [12, 12, 12, 12, 12],
  tasks,
  request,
});

// Independent oracle: fill five demand buckets, then accumulate integers. No engine,
// allocator, availableCapacity, analyze or simulate is called to derive expectations.
function oracle(
  s: Scenario,
  includeRequest: boolean,
  deferred: string[] = [],
  requestUnits = s.request.units,
) {
  const buckets = [0, 0, 0, 0, 0];
  const tasks = s.tasks.filter((t) => !deferred.includes(t.id));
  if (includeRequest) tasks.push({ ...s.request, units: requestUnits });
  for (const t of tasks) buckets[t.deadline] += t.units;
  let due = 0,
    available = 0;
  return buckets.map((n, day) => {
    due += n;
    available += s.capacity[day] - (s.reserve?.[day] ?? 0);
    return { day, due, available, deficit: Math.max(0, due - available) };
  });
}
function check(s: Scenario) {
  const original = JSON.stringify(s),
    a = analyzeConflicts(s),
    existing = oracle(s, false),
    full = oracle(s, true);
  const existingFits = existing.every((c) => c.deficit === 0),
    fits = full.every((c) => c.deficit === 0);
  const expected = fits
    ? "fits"
    : existingFits
      ? "new_request_causes_conflict"
      : full.some((c, i) => c.deficit > existing[i].deficit)
        ? "preexisting_and_additional_pressure"
        : "preexisting_conflict";
  expect(a.classification).toBe(expected);
  expect(a.existingFeasible).toBe(existingFits);
  expect(a.baselineFeasible).toBe(fits);
  expect(a.baseline.checkpoints).toEqual(full);
  expect(a.existing.checkpoints).toEqual(existing);
  expect(a.firstConflict?.day).toBe(full.find((c) => c.deficit > 0)?.day);
  expect(a.existingFirstConflict).toEqual(
    existing.find((c) => c.deficit > 0) ?? null,
  );
  expect(a.weeklyOverloadUnits).toBe(full[4].deficit);
  expect(a.conflicts.map((c) => c.day)).toEqual(
    full.filter((c) => c.deficit > 0).map((c) => c.day),
  );
  for (const c of a.conflicts) {
    expect(c.contributingCommitments.map((t) => t.id)).toEqual(
      s.tasks.filter((t) => t.deadline <= c.day).map((t) => t.id),
    );
    expect(c.requestContributes).toBe(s.request.deadline <= c.day);
    expect(c.additionalDeficit).toBe(
      full[c.day].deficit - existing[c.day].deficit,
    );
  }
  for (const v of a.verifiedAlternatives) {
    const p = v.plan;
    expect(new Set(p.deferred).size).toBe(p.deferred.length);
    for (const id of p.deferred)
      expect(s.tasks.some((t) => t.id === id && t.movable)).toBe(true);
    expect(Number.isInteger(p.requestUnits)).toBe(true);
    expect(p.requestUnits).toBeGreaterThanOrEqual(1);
    expect(p.requestUnits).toBeLessThanOrEqual(s.request.units);
    const checkpoints = oracle(s, true, p.deferred, p.requestUnits);
    expect(checkpoints.every((c) => c.deficit === 0)).toBe(true);
    expect(p.result.fits).toBe(true);
    expect(p.result.checkpoints).toEqual(checkpoints);
    expect(v.changedTasks.map((t) => t.id)).toEqual(p.deferred);
    expect(v.requestUnits).toBe(p.requestUnits);
    expect(v.remainingUnits).toBe(
      checkpoints[4].available - checkpoints[4].due,
    );
    expect(v.allDeadlinesFit).toBe(true);
    expect(v.needsAgreement).toBe(true);
    expect(v.futureCapacityChecked).toBe(false);
  }
  for (const d of a.negotiationDirections) {
    expect(d.status).toBe("unverified");
    expect(d.day).toBe(a.firstConflict!.day);
    for (const id of d.taskIds)
      expect(
        [...s.tasks, s.request].find((t) => t.id === id)!.deadline,
      ).toBeLessThanOrEqual(d.day);
  }
  expect(JSON.stringify(s)).toBe(original);
}
it("A: attributes Tuesday 7/6 to existing work, not the Friday request; no futile scope solution", () => {
  const s = scenario([task("report", 28, 1)]),
    a = analyzeConflicts(s);
  check(s);
  expect(a.classification).toBe("preexisting_conflict");
  expect(a.baseline).toMatchObject({ total: 32, capacity: 60, overload: 0 });
  expect(a.firstConflict).toMatchObject({
    day: 1,
    due: 28,
    available: 24,
    deficit: 4,
    requestContributes: false,
  });
  expect(a.verifiedAlternatives).toEqual([]);
  expect(a.negotiationDirections.some((d) => d.id === "request_scope")).toBe(
    false,
  );
  expect(causalSummary(s, a)).toContain(
    "Friday request does not cause the earlier Tuesday shortfall",
  );
  const text = renegotiationRequest(s);
  expect(text).toMatch(/^By Tuesday, Work report requires 7h, but I have 6h/);
  expect(text).toContain("1h shortfall");
  expect(text).not.toMatch(/can.t commit|reduce.*Work new/);
  expect(detailedProposal(s, null, "")).not.toBe(text);
  expect(detailedProposal(s, null, "")).toContain(
    "Existing-only demand by this date: 7h",
  );
  expect(
    practiceFor(s, null).choices.find((c) => c.id === "grounded")!.text,
  ).toBe(text);
  expect(practiceFor(s, null).prompt).toContain("Tuesday");
});
it("B: new early request creates a constraint; only a rechecked smaller deliverable fits", () => {
  const s = scenario([task("report", 16, 4)], task("new", 28, 1));
  check(s);
  const a = analyzeConflicts(s);
  expect(a.classification).toBe("new_request_causes_conflict");
  expect(a.firstConflict!.contributingCommitments).toEqual([]);
  expect(a.requestContributesToFirstConflict).toBe(true);
  expect(a.verifiedAlternatives[0].requestUnits).toBe(24);
  expect(renegotiationRequest(s)).toMatch(/^By Tuesday, Work new requires 7h/);
});
it("C: distinguishes earlier existing pressure from additional Friday overload", () => {
  const s = scenario([task("report", 28, 1)], task("new", 40, 4));
  check(s);
  const a = analyzeConflicts(s);
  expect(a.classification).toBe("preexisting_and_additional_pressure");
  expect(a.firstConflict!.day).toBe(1);
  expect(a.weeklyOverloadUnits).toBe(8);
  expect(causalSummary(s, a)).toContain(
    "also adds 2h to the shortfall by Friday",
  );
  expect(conflictBreakdown(s, a)).toContain(
    "Friday: 17h due / 15h usable, 2h short",
  );
});
it("D: verifies a relevant negotiable deferral, preserving its obligation and approval requirement", () => {
  const s = scenario([task("report", 28, 1, true)]);
  check(s);
  const v = analyzeConflicts(s).verifiedAlternatives[0];
  expect(v.changedTasks.map((t) => t.id)).toEqual(["report"]);
  expect(v.needsAgreement).toBe(true);
  expect(v.plan.result.fits).toBe(true);
  expect(s.tasks).toHaveLength(1);
  expect(s.tasks[0].deadline).toBe(1);
});
it("E: removing Friday work and reducing Friday scope cannot repair Tuesday", () => {
  const s = scenario(
    [task("report", 28, 1), task("later", 20, 4, true)],
    task("new", 20, 4),
  );
  check(s);
  const p = simulate(s, ["later"], 1);
  expect(p.result.fits).toBe(false);
  expect(simulationConstraint(s, p)).toContain(
    "Moving Work later and reducing Work new cannot repair this shortfall: that work is due later",
  );
  expect(analyzeConflicts(s).verifiedAlternatives).toEqual([]);
});
it("F: fixing the first 1h deficit alone leaves the later deadline unverified and infeasible", () => {
  const s = scenario(
    [task("early", 28, 1), task("later", 20, 2)],
    task("new", 4, 4),
  );
  check(s);
  const a = analyzeConflicts(s);
  expect(a.conflicts.map((c) => c.day)).toEqual([1, 2]);
  const changed = { ...s, capacity: [16, 12, 12, 12, 12] };
  check(changed);
  expect(analyzeConflicts(changed).firstConflict?.day).toBe(2);
  expect(analyzeConflicts(changed).baselineFeasible).toBe(false);
  expect(a.negotiationDirections[0].explanation).toContain("lower bound");
});
it("G: exact capacity fits with zero spare time and no invented conflict", () => {
  const s = scenario([task("report", 40, 4)], task("new", 20, 4));
  check(s);
  const a = analyzeConflicts(s);
  expect(a.classification).toBe("fits");
  expect(a.firstConflict).toBeNull();
  expect(a.negotiationDirections).toEqual([]);
  expect(a.verifiedAlternatives[0].remainingUnits).toBe(0);
  expect(() => renegotiationRequest(s)).toThrow("No unresolved conflict");
});
it("handles new Monday pressure before a separate preexisting Tuesday conflict", () => {
  const s = scenario([task("report", 28, 1)], task("new", 16, 0));
  check(s);
  const a = analyzeConflicts(s);
  expect(a.firstConflict?.day).toBe(0);
  expect(a.existingFirstConflict?.day).toBe(1);
  expect(a.classification).toBe("preexisting_and_additional_pressure");
  expect(a.firstConflict?.contributingCommitments).toEqual([]);
});
it("rejects invalid inputs, preserves Fixed tasks and treats reserve as actual reduced capacity", () => {
  const s = exampleScenario();
  s.reserve = [4, 0, 0, 0, 0];
  check(s);
  expect(analyzeConflicts(s).baseline.capacity).toBe(56);
  expect(() => analyzeConflicts({ ...s, reserve: [13, 0, 0, 0, 0] })).toThrow();
  expect(() =>
    simulationConstraint(s, { ...simulate(s, [], 1), deferred: ["qa"] }),
  ).toThrow();
});
it("H: independently checks 500 generated causal analyses and every claimed verified alternative", () => {
  let seed = 91853;
  const rand = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let i = 0; i < 500; i++) {
    const s = scenario([]);
    s.capacity = Array.from({ length: 5 }, () => rand(33));
    s.reserve = s.capacity.map((n) => rand(n + 1));
    s.tasks = Array.from({ length: rand(9) }, (_, j) => ({
      ...task(
        `custom-${i}-${j}-${rand(999)}`,
        1 + rand(30),
        rand(5),
        rand(3) > 0,
      ),
      priority: rand(2) ? "normal" : "high",
    }));
    s.request = task(`request-${rand(9999)}`, 1 + rand(24), rand(5));
    check(s);
  }
});
it("I: old saved decisions and unresolved drafts remain readable with original messages and agreement", () => {
  const s = exampleScenario();
  const record: Notebook = {
    version: 1,
    decisions: [
      {
        id: "v22",
        created: "2026-11-14T12:00:00Z",
        scenario: s,
        plan: { deferred: ["report"], requestUnits: 20 },
        message: "Original custom agreement",
        outcome: "agreed",
        notes: "Keep this",
        scope: "",
      },
    ],
  };
  const before = JSON.stringify(record);
  const saved = readNotebook({ getItem: () => before });
  expect(saved.warning).toBe("");
  expect(saved.notebook).toEqual(record);
  analyzeConflicts(saved.notebook.decisions[0].scenario);
  expect(JSON.stringify(saved.notebook)).toBe(before);
  const bad = scenario([task("report", 28, 1)]);
  const draft = {
    version: 2,
    page: "proposal",
    scenario: bad,
    plan: null,
    unresolved: true,
    message: "Original user-edited unresolved message",
    scope: "",
  };
  expect(readDraft({ getItem: () => JSON.stringify(draft) })).toEqual(draft);
});

it("keeps practice grounded in the existing conflict even when a checked deferral is selected", () => {
  const s = scenario([task("report", 28, 1, true)]);
  const practice = practiceFor(s, simulate(s, ["report"], 4));
  expect(practice.prompt).toContain("Tuesday");
  expect(practice.choices.find((c) => c.id === "constraint")!.text).toContain(
    "By Tuesday, 7h are due with 6h available",
  );
  expect(practice.choices.find((c) => c.id === "grounded")!.text).toContain(
    "if we agree to move Work report",
  );
});
