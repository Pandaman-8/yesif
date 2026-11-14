import { expect, it, vi } from "vitest";
import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { decisionFacts } from "../domain/decisionTools";
import { exampleScenario, simulate } from "../domain/engine";
import { Results } from "../components/Results";
it("comparison facts independently recompute retained, moved and high-priority obligations", () => {
  const s = exampleScenario();
  s.tasks[2].priority = "high";
  const p = simulate(s, ["report"], 20);
  p.result.total = 999;
  const f = decisionFacts(s, p);
  expect(f.plan.result.total).toBe(52);
  expect(f.plan.result.capacity).toBe(60);
  expect(f.retained.map((t) => t.id)).toEqual(["qa", "updates"]);
  expect(f.highMoved.map((t) => t.id)).toEqual(["report"]);
  expect(f.agreements.join(" ")).toContain("5h remain owed");
  expect(f.agreements.join(" ")).toContain("not verified");
  expect(f.plan.result.checkpoints.every((c) => c.deficit === 0)).toBe(true);
  expect(() => decisionFacts(s, { deferred: [], requestUnits: 20 })).toThrow();
});
it("combined comparison retains BOTH agreements and exact smaller contents", () => {
  const s = exampleScenario();
  s.tasks = [
    { ...s.tasks[0], units: 44, deadline: 4 },
    { ...s.tasks[2], units: 8 },
  ];
  s.request.units = 24;
  const f = decisionFacts(
    s,
    { deferred: ["report"], requestUnits: 16 },
    "Core findings only",
  );
  expect(f.plan.result.total).toBe(60);
  expect(f.agreements.join(" ")).toContain("2h remain owed");
  expect(f.agreements.join(" ")).toContain("smaller 4h result");
  expect(f.agreements.join(" ")).toContain("Core findings only");
});
it("current Free comparison exposes actual retained tasks, priorities and all deadline checks", async () => {
  const s = exampleScenario();
  const choose = vi.fn();
  render(
    <Results
      scenario={s}
      heading={createRef()}
      demo={false}
      simulation={simulate(s, [], 20)}
      deferred={[]}
      units={20}
      scope=""
      setDeferred={vi.fn()}
      setUnits={vi.fn()}
      setScope={vi.fn()}
      choose={choose}
      edit={vi.fn()}
      unresolved={vi.fn()}
    />,
  );
  const card = screen.getByRole("article", { name: "Move Weekly report" });
  const user = userEvent.setup();
  await user.click(within(card).getByText("Compare obligations and deadlines"));
  expect(within(card).getByText(/Launch QA · 5h · Wednesday/)).toBeVisible();
  expect(
    within(card).getByText(/Customer updates · 3h · Thursday/),
  ).toBeVisible();
  expect(within(card).getAllByRole("row")).toHaveLength(6);
  await user.click(
    within(card).getByRole("button", { name: "Use this trade-off" }),
  );
  expect(choose.mock.calls[0][0].result).toMatchObject({
    total: 52,
    capacity: 60,
    fits: true,
  });
});
