import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { AllocationView } from "../components/AllocationView";
import { allocate } from "../domain/allocation";
import { exampleScenario, simulate, type Scenario } from "../domain/engine";

function verifyRendered(s: Scenario, deferred: string[], units: number) {
  const plan = simulate(s, deferred, units);
  const view = render(<AllocationView scenario={s} plan={plan} />);
  const allocation = allocate(s, plan);
  if (!allocation.fits) {
    expect(view.container.querySelector(".week-days")).toBeNull();
    view.unmount();
    return;
  }
  allocation.days.forEach((d) => {
    const row = view.container.querySelector(`[data-day="${d.day}"]`)!;
    const entered = s.capacity[d.day];
    const segments = Array.from(
      row.querySelectorAll<HTMLElement>(".week-segment"),
    );
    expect(segments.reduce((n, el) => n + Number(el.dataset.units), 0)).toBe(
      entered,
    );
    segments.forEach((el) =>
      expect(parseFloat(el.style.width)).toBeCloseTo(
        (Number(el.dataset.units) / entered) * 100,
        8,
      ),
    );
    expect(
      Array.from(row.querySelectorAll<HTMLElement>("[data-task-id]")).map(
        (el) => ({
          taskId: el.dataset.taskId,
          units: Number(el.dataset.units),
        }),
      ),
    ).toEqual(d.assignments);
    expect(row.querySelector(".week-track")).toHaveAttribute(
      "aria-label",
      expect.stringContaining(
        `${d.available / 4}h unassigned; ${d.reserve / 4}h reserved`,
      ),
    );
    if (entered)
      expect(
        parseFloat((row.querySelector(".week-bar") as HTMLElement).style.width),
      ).toBeCloseTo((entered / Math.max(...s.capacity)) * 100, 8);
    else expect(row).toHaveTextContent("No focused capacity");
  });
  view.unmount();
}
it("A: renders the exact 10/15 EDF witness and five spare hours", () => {
  const s = exampleScenario();
  s.tasks = [s.tasks[2]];
  const a = allocate(s, { deferred: [], requestUnits: 20 });
  expect(a.fits && a.days.map((d) => [d.assignments, d.available])).toEqual([
    [[{ taskId: "report", units: 12 }], 0],
    [
      [
        { taskId: "report", units: 8 },
        { taskId: "request", units: 4 },
      ],
      0,
    ],
    [[{ taskId: "request", units: 12 }], 0],
    [[{ taskId: "request", units: 4 }], 8],
    [[], 12],
  ]);
  verifyRendered(s, [], 20);
});
it("B/C: different options render their own allocation and retain deferred obligations", () => {
  const s = exampleScenario();
  verifyRendered(s, ["report"], 20);
  verifyRendered(s, [], 8);
  const v = render(
    <AllocationView scenario={s} plan={simulate(s, ["report"], 20)} />,
  );
  expect(v.container.querySelector('[data-task-id="report"]')).toBeNull();
  expect(screen.getByText(/Still owed/)).toHaveTextContent(
    "Weekly report (5h)",
  );
  expect(v.container).toHaveTextContent("13h assigned / 15h usable");
  v.rerender(<AllocationView scenario={s} plan={simulate(s, [], 8)} />);
  expect(v.container).toHaveTextContent("New request · 2h of 5h requested");
  expect(
    Array.from(
      v.container.querySelectorAll<HTMLElement>('[data-task-id="request"]'),
    ).reduce((n, e) => n + Number(e.dataset.units), 0),
  ).toBe(8);
});
it("D: accounts for explicit reserve exactly once: 13 assigned, 14 usable, 1 free", () => {
  const s = exampleScenario();
  s.reserve = [4, 0, 0, 0, 0];
  verifyRendered(s, ["report"], 20);
  const v = render(
    <AllocationView scenario={s} plan={simulate(s, ["report"], 20)} />,
  );
  expect(v.container).toHaveTextContent(
    "13h assigned / 14h usable · 1h reserved",
  );
  expect(v.container.querySelector('[data-day="0"] .reserved')).toHaveAttribute(
    "data-units",
    "4",
  );
  expect(
    parseFloat(
      (v.container.querySelector('[data-day="0"] .reserved') as HTMLElement)
        .style.width,
    ),
  ).toBeCloseTo(100 / 3, 8);
});
it("E: never renders a completed schedule for an impossible or stale falsely feasible result", () => {
  const s = exampleScenario();
  const stale = simulate(s, ["report"], 20);
  s.tasks = [{ ...s.tasks[0], units: 28, deadline: 1 }];
  s.request.units = 4;
  const v = render(
    <AllocationView
      scenario={s}
      plan={{ ...stale, deferred: [], requestUnits: 4 }}
    />,
  );
  expect(v.container.querySelector(".week-days")).toBeNull();
  expect(screen.getByText(/No complete allocation/)).toBeInTheDocument();
});
it("F: updates labels, hours, reserve, deadlines and deferrals without stale data", () => {
  const s = exampleScenario();
  s.tasks = [s.tasks[2]];
  const v = render(<AllocationView scenario={s} plan={simulate(s, [], 20)} />);
  const changed: Scenario = {
    ...s,
    capacity: [0, 12, 12, 12, 12],
    reserve: [0, 1, 0, 0, 0],
    tasks: [{ ...s.tasks[0], name: "Revised brief", units: 1, deadline: 1 }],
    request: { ...s.request, units: 1 },
  };
  v.rerender(
    <AllocationView scenario={changed} plan={simulate(changed, [], 1)} />,
  );
  expect(v.container).not.toHaveTextContent("Weekly report");
  expect(v.container).toHaveTextContent("Revised brief");
  expect(v.container.querySelector('[data-day="0"]')).toHaveTextContent(
    "No focused capacity",
  );
  expect(v.container.querySelector('[data-task-id="report"]')).toHaveAttribute(
    "data-units",
    "1",
  );
  expect(v.container.querySelector(".week-totals")).toHaveTextContent(
    "0.5h assigned / 11.75h usable · 0.25h reserved",
  );
  v.unmount();
  verifyRendered(changed, [], 1);
});
it("supports keyboard task selection and keeps tiny segments proportional, using large legend targets", async () => {
  const s = exampleScenario();
  s.tasks = [{ ...s.tasks[2], units: 1 }];
  s.request.units = 1;
  const v = render(<AllocationView scenario={s} plan={simulate(s, [], 1)} />);
  const user = userEvent.setup();
  await user.click(screen.getByText("Your week, mapped"));
  await user.tab();
  const button = screen.getByRole("button", { name: /Weekly report/ });
  expect(button).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(v.container.querySelector('[data-task-id="report"]')).toHaveClass(
    "highlighted",
  );
  expect(
    parseFloat(
      (v.container.querySelector('[data-task-id="report"]') as HTMLElement)
        .style.width,
    ),
  ).toBeCloseTo(100 / 12);
  fireEvent.click(button);
  expect(button).toHaveAttribute("aria-pressed", "false");
});
it("renders 60 generated witnesses with current IDs, exact quarters, reserve and zero-capacity days", () => {
  let seed = 927;
  const rand = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let i = 0; i < 60; i++) {
    const s = exampleScenario();
    s.capacity = Array.from({ length: 5 }, () => rand(25));
    s.reserve = s.capacity.map((n) => rand(n + 1));
    s.tasks = Array.from({ length: rand(9) }, (_, j) => ({
      id: `id-${i}-${j}`,
      name: `Custom ${rand(999)}`,
      units: 1 + rand(12),
      deadline: rand(5),
      movable: rand(2) === 0,
      priority: "normal" as const,
    }));
    s.request.units = 1 + rand(12);
    s.request.deadline = rand(5);
    verifyRendered(
      s,
      s.tasks.filter((t) => t.movable).map((t) => t.id),
      1 + rand(s.request.units),
    );
  }
});
