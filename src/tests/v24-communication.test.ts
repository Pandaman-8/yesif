import { expect, it } from "vitest";
import { exampleScenario, simulate, type Scenario } from "../domain/engine";
import {
  shortProposal,
  renegotiationRequest,
  detailedProposal,
  selectedConsequences,
  proposalEvidence,
} from "../domain/conversation";
import { practiceFor, type ChoiceId } from "../domain/practice";

export function cases() {
  const reference = exampleScenario();
  const fits = exampleScenario();
  fits.tasks = [fits.tasks[0]];
  const combined = exampleScenario();
  combined.tasks = [
    { ...combined.tasks[0], units: 44, deadline: 4 },
    { ...combined.tasks[2], units: 8 },
  ];
  combined.request.units = 24;
  const early = exampleScenario();
  early.tasks = [{ ...early.tasks[2], units: 28, deadline: 1, movable: false }];
  early.request.units = 4;
  const mixed = structuredClone(early);
  mixed.request.units = 40;
  const tiny = exampleScenario();
  tiny.tasks = [{ ...tiny.tasks[0], units: 59, deadline: 4 }];
  return [
    { s: fits, p: simulate(fits, [], 20), kind: "fits" },
    { s: reference, p: simulate(reference, ["report"], 20), kind: "deferral" },
    { s: reference, p: simulate(reference, [], 8), kind: "scope" },
    { s: combined, p: simulate(combined, ["report"], 16), kind: "combined" },
    { s: early, p: null, kind: "blocked" },
    { s: mixed, p: null, kind: "blocked" },
    { s: tiny, p: simulate(tiny, [], 1), kind: "scope" },
  ] as const;
}
it("A–D: concise conditional messages retain every checked change without duplicating evidence", () => {
  const entries = cases();
  for (const { s, p } of entries.filter((x) => x.p)) {
    const text = shortProposal(s, p!);
    expect(text.split(/\s+/).length).toBeLessThan(85);
    expect(text).toContain(s.request.name);
    expect(text).toMatch(/Could we/);
    expect(text).not.toContain("approved");
    expect(detailedProposal(s, p!, "")).not.toContain(text);
    expect(detailedProposal(s, p!, "")).not.toMatch(/Could we|I can offer/);
    for (const id of p!.deferred)
      expect(text).toContain(s.tasks.find((t) => t.id === id)!.name);
  }
  expect(shortProposal(entries[0].s, entries[0].p!)).not.toMatch(
    /shortfall|smaller|move/,
  );
  expect(shortProposal(entries[1].s, entries[1].p!)).toContain(
    "checking future capacity",
  );
  expect(
    shortProposal(entries[3].s, entries[3].p!, "Two charts; no appendix"),
  ).toContain(
    "move Weekly report beyond this week and approve the reduced scope",
  );
});
it("C/G: arbitrary 15-minute reduction is a changed deliverable, with only user-authored contents", () => {
  for (const x of [cases()[2], cases()[6]]) {
    const empty = shortProposal(x.s, x.p!);
    expect(empty).toContain("smaller");
    expect(empty).toContain("still needs to be defined");
    expect(empty).not.toMatch(/slides|research|appendix/);
    const defined = shortProposal(
      x.s,
      x.p!,
      "Five core slides, without research or appendix.",
    );
    expect(defined).toContain(
      "Five core slides, without research or appendix.",
    );
    expect(selectedConsequences(x.s, x.p!).items.join(" ")).toContain(
      "not the original work done faster",
    );
  }
  expect(shortProposal(cases()[6].s, cases()[6].p!)).toContain("0.25-hour");
});
it("E/F: first constraint, existing cause and later evidence remain distinct", () => {
  const early = cases()[4],
    mixed = cases()[5];
  for (const x of [early, mixed]) {
    const text = renegotiationRequest(x.s);
    expect(text).toContain("Weekly report requires 7h, but I have 6h");
    expect(text).toContain("1h shortfall");
    expect(text).toContain("before the new request");
    expect(text).not.toMatch(/reduce.*presentation|15h/);
    expect(text).toContain("recheck every deadline");
  }
  expect(practiceFor(mixed.s, null).context).toContain(
    "Friday: 17h due / 15h usable",
  );
  expect(detailedProposal(mixed.s, null, "")).toContain("Friday");
});
it("selected consequences recompute totals, reserve, owed work and replacement deadlines", () => {
  const { s, p } = cases()[1];
  s.reserve = [4, 0, 0, 0, 0];
  const f = selectedConsequences(s, {
    ...p!,
    result: { ...p!.result, total: 0, capacity: 999 },
  });
  expect(f.plan.result.total).toBe(52);
  expect(f.plan.result.capacity).toBe(56);
  expect(f.items.join(" ")).toContain("1h remain unassigned");
  expect(f.items.join(" ")).toContain(
    "5h moves beyond this week; it remains owed",
  );
  expect(f.items.join(" ")).toContain("Friday deadline needs approval");
  expect(
    proposalEvidence(s, p!).find((x) => x.label === "Deadlines checked")!.value,
  ).toContain("Monday: 0h due / 2h usable");
  s.capacity.fill(0);
  expect(() => selectedConsequences(s, p!)).toThrow();
  expect(() => practiceFor(s, p!)).toThrow();
});
it("every scenario and all first choices lead to scenario-specific second decisions with bounded balanced answers", () => {
  const paths: (ChoiceId | undefined)[] = [
    undefined,
    "grounded",
    "observe",
    "assume",
  ];
  for (const { s, p, kind } of cases()) {
    const prompts = new Set<string>();
    for (const first of paths) {
      const turn = practiceFor(s, p, first, "Core findings only");
      expect(turn.kind).toBe(kind);
      expect(turn.step).toBe(first ? 2 : 1);
      expect(turn.choices).toHaveLength(3);
      prompts.add(turn.prompt);
      const counts = turn.choices.map((c) => c.text.split(/\s+/).length);
      expect(Math.max(...counts) / Math.min(...counts)).toBeLessThan(1.6);
      expect(Math.max(...counts)).toBeLessThan(32);
      for (const choice of turn.choices) {
        expect(choice.evidence).toHaveLength(5);
        for (const e of choice.evidence) {
          if (e.status !== "missing") {
            expect(e.quote).toBeTruthy();
            expect(choice.text).toContain(e.quote!);
            expect(e.reason.length).toBeGreaterThan(15);
          } else expect(e.quote).toBeNull();
        }
        expect(choice.revision).toBe(
          turn.choices.find((c) => c.id === "grounded")!.text,
        );
        expect(choice.text).not.toContain(shortProposalSafe(s, p));
      }
      const observe = turn.choices.find((c) => c.id === "observe")!;
      expect(
        observe.evidence.find((e) => e.criterion === "action")!.status,
      ).toBe("missing");
      expect(
        observe.evidence.find((e) => e.criterion === "agreement")!.status,
      ).toBe("missing");
      expect(
        turn.choices
          .find((c) => c.id === "assume")!
          .evidence.find((e) => e.criterion === "promise")!.status,
      ).toBe("risk");
    }
    expect(prompts.size).toBe(4);
  }
});
function shortProposalSafe(s: Scenario, p: ReturnType<typeof simulate> | null) {
  return p ? shortProposal(s, p) : renegotiationRequest(s);
}
it("rubric does not credit a complete constraint merely for repeating a fitting total", () => {
  for (const x of [cases()[0], cases()[2]]) {
    const choice = practiceFor(x.s, x.p).choices.find(
      (c) => c.id === "assume",
    )!;
    expect(
      choice.evidence.find((e) => e.criterion === "constraint")!.status,
    ).toBe("missing");
  }
});
it("custom facts agree with an independent prefix oracle; no demo names leak into 200 scenarios or practice paths", () => {
  let seed = 224;
  const rand = (n: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % n;
  };
  for (let i = 0; i < 200; i++) {
    const s: Scenario = {
      capacity: Array.from({ length: 5 }, () => rand(20)),
      tasks: [],
      request: {
        id: "new",
        name: `Request ${i}`,
        units: 1 + rand(32),
        deadline: rand(5),
        movable: false,
        priority: "normal",
      },
    };
    s.reserve = s.capacity.map((x) => rand(x + 1));
    s.tasks = Array.from({ length: rand(9) }, (_, j) => ({
      id: `t${j}`,
      name: `Obligation ${i}-${j}`,
      units: 1 + rand(24),
      deadline: rand(5),
      movable: rand(2) === 1,
      priority: "normal",
    }));
    let avail = 0;
    const prefixes = s.capacity.map((n, day) => {
      avail += n - s.reserve![day];
      const due = [...s.tasks, s.request]
        .filter((t) => t.deadline <= day)
        .reduce((v, t) => v + t.units, 0);
      return { day, due, avail, deficit: Math.max(0, due - avail) };
    });
    const first = prefixes.find((x) => x.deficit);
    const p = first ? null : simulate(s, [], s.request.units);
    const text = first ? renegotiationRequest(s) : shortProposal(s, p!);
    expect(text).not.toMatch(/Weekly report|Urgent presentation|Launch QA/);
    if (first) {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      expect(text).toContain(`By ${days[first.day]}`);
      expect(text).toContain(`${first.due / 4}h`);
      expect(text).toContain(`${first.avail / 4}h`);
      expect(text).toContain(`${first.deficit / 4}h shortfall`);
      const names = practiceFor(s, null)
        .context.split("Relevant work: ")[1]
        .split(". ")[0]
        .split("; ");
      s.tasks.forEach((t) =>
        expect(names.includes(t.name)).toBe(t.deadline <= first.day),
      );
    }
    for (const firstChoice of [
      undefined,
      "grounded",
      "observe",
      "assume",
    ] as const) {
      const turn = practiceFor(s, p, firstChoice);
      expect(turn.context).not.toMatch(/Weekly report|Urgent presentation/);
      for (const option of turn.choices)
        for (const e of option.evidence)
          if (e.quote) expect(option.text).toContain(e.quote);
    }
  }
});

it("a refused deferral of early work asks about that deadline, never an irrelevant later scope cut", () => {
  const s = cases()[4].s;
  s.tasks[0].movable = true;
  const p = simulate(s, [s.tasks[0].id], s.request.units);
  const turn = practiceFor(s, p);
  expect(turn.prompt).toContain("Weekly report by Tuesday");
  const good = turn.choices.find((c) => c.id === "grounded")!;
  expect(good.text).toContain("Tuesday deadline or time before then");
  expect(good.text).not.toContain("request’s scope");
  expect(good.worked).toContain(
    "cannot be repaired by cutting the later Friday request",
  );
  for (const e of good.evidence)
    if (e.quote) expect(good.text).toContain(e.quote);
  expect(
    Math.max(...turn.choices.map((c) => c.text.split(/\s+/).length)) /
      Math.min(...turn.choices.map((c) => c.text.split(/\s+/).length)),
  ).toBeLessThan(1.6);
});
