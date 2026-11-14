import { createRef, useState } from "react";
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Results } from "../components/Results";
import {
  exampleScenario,
  simulate,
  type Scenario,
  type Task,
} from "../domain/engine";
import App from "../App";

const task = (
  id: string,
  hours: number,
  deadline = 4,
  movable = false,
): Task => ({
  id,
  name: id,
  units: hours * 4,
  deadline,
  movable,
  priority: "normal",
});
const scenario = (
  tasks: Task[],
  request = task("Presentation", 5),
): Scenario => ({ capacity: [12, 12, 12, 12, 12], tasks, request });
function setup(s: Scenario) {
  const choose = vi.fn(),
    unresolved = vi.fn();
  function Harness() {
    const [deferred, setDeferred] = useState<string[]>([]),
      [units, setUnits] = useState(s.request.units),
      [scope, setScope] = useState("");
    return (
      <Results
        scenario={s}
        heading={createRef()}
        demo={false}
        simulation={simulate(s, deferred, units)}
        deferred={deferred}
        units={units}
        scope={scope}
        setDeferred={setDeferred}
        setUnits={setUnits}
        setScope={setScope}
        choose={choose}
        unresolved={unresolved}
        edit={vi.fn()}
      />
    );
  }
  render(<Harness />);
  return { choose, unresolved, user: userEvent.setup() };
}
it("A: presents 10/15 as one confirmation with 5h unassigned and real allocation", async () => {
  const { user, choose } = setup(scenario([task("Weekly report", 5)]));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "This request fits your estimated week.",
  );
  const overview = screen.getByRole("region", { name: "Reality check" });
  expect(overview).toHaveTextContent("10h / 15h");
  expect(within(overview).getAllByText("5h unassigned").length).toBeGreaterThan(
    0,
  );
  expect(screen.queryByRole("region", { name: "Your options" })).toBeNull();
  await user.click(screen.getByText("Your week, mapped"));
  expect(
    screen.getByRole("img", { name: /Monday:.*Weekly report: 3h/ }),
  ).toBeVisible();
  expect(screen.queryByText(/0h available/)).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "Prepare a confirmation" }),
  );
  expect(choose.mock.calls[0][0]).toMatchObject({
    kind: "accept",
    deferred: [],
    requestUnits: 20,
    result: { fits: true, total: 40, capacity: 60 },
  });
});
it("B: compares actual 13/15 and 15/15 alternatives with equal actions and explicit agreement", async () => {
  const s = exampleScenario();
  const { choose, user } = setup(s);
  const cards = screen.getAllByRole("article");
  expect(cards).toHaveLength(2);
  expect(cards[0]).toHaveTextContent("13h / 15h");
  expect(cards[0]).toHaveTextContent("Weekly report · 5h");
  expect(cards[0]).toHaveTextContent("Future capacity unchecked");
  expect(cards[1]).toHaveTextContent("15h / 15h");
  expect(cards[1]).toHaveTextContent("2h of 5h requested");
  expect(cards[1]).toHaveTextContent("All existing commitments and deadlines");
  for (const card of cards) {
    expect(card).toHaveTextContent("Needs agreement");
    const button = within(card).getByRole("button", {
      name: "Use this trade-off",
    });
    expect(button).toHaveClass("primary");
    expect(
      button.compareDocumentPosition(
        within(card).getByText("Your week, mapped"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
  expect(screen.queryByText(/best option/i)).toBeNull();
  await user.click(
    within(cards[1]).getByRole("button", { name: "Use this trade-off" }),
  );
  expect(choose.mock.calls[0][0]).toMatchObject({
    requestUnits: 8,
    deferred: [],
    result: { total: 60, capacity: 60, fits: true },
  });
});
it("C: identifies the preexisting Tuesday 7/6 conflict despite an 8/15 weekly total", async () => {
  const { user, unresolved, choose } = setup(
    scenario([task("Weekly report", 7, 1)], task("Presentation", 1)),
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Your Tuesday deadline is short by 1 hour.",
  );
  const proof = screen.getByRole("region", { name: "Reality check" });
  expect(proof).toHaveTextContent("8h / 15h");
  expect(proof).toHaveTextContent("7hdue by Tuesday");
  expect(proof).toHaveTextContent("6havailable through Tuesday");
  expect(proof).toHaveTextContent(
    "Your existing commitments already have a conflict",
  );
  expect(screen.queryByRole("article")).toBeNull();
  expect(
    screen.queryByRole("button", { name: /Explore your own trade-off/ }),
  ).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "Prepare a renegotiation request" }),
  );
  expect(unresolved).toHaveBeenCalledOnce();
  expect(choose).not.toHaveBeenCalled();
});
it("D: exact capacity remains feasible without claiming a buffer or guarantee", () => {
  setup(scenario([task("Weekly report", 10)]));
  expect(
    screen.getByRole("button", { name: "Prepare a confirmation" }),
  ).toBeEnabled();
  expect(
    screen.getByRole("region", { name: "Reality check" }),
  ).toHaveTextContent("15h / 15h");
  expect(
    screen.getByRole("region", { name: "Reality check" }),
  ).toHaveTextContent("0h unassigned");
  expect(
    screen.getByText("Based on your estimates, not a delivery guarantee."),
  ).toBeVisible();
});
it("E: shows real combined deferral plus 4h scope and preserves it while closing the simulator", async () => {
  const s = scenario(
    [task("Fixed work", 11), task("Negotiable report", 2, 4, true)],
    task("Presentation", 6),
  );
  const { user, choose } = setup(s);
  const combined = screen.getByRole("article", {
    name: "Move Negotiable report + reduce scope",
  });
  expect(combined).toHaveTextContent("4h of 6h requested");
  expect(combined).toHaveTextContent("15h / 15h");
  await user.click(
    screen.getByRole("button", { name: /Explore your own trade-off/ }),
  );
  expect(screen.getByLabelText("Defer Fixed work")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Use this plan" })).toBeDisabled();
  await user.click(screen.getByLabelText("Defer Negotiable report"));
  fireEvent.change(screen.getByRole("slider"), { target: { value: "16" } });
  await user.type(
    screen.getByLabelText(/What would the smaller deliverable include/),
    "Core slides",
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "0h unassigned. Fits every weekday deadline",
  );
  await user.click(
    screen.getByRole("button", { name: /Explore your own trade-off/ }),
  );
  await user.click(
    screen.getByRole("button", { name: /Explore your own trade-off/ }),
  );
  expect(screen.getByRole("slider")).toHaveAttribute(
    "aria-valuetext",
    "4 hours",
  );
  expect(
    screen.getByLabelText(/What would the smaller deliverable include/),
  ).toHaveValue("Core slides");
  await user.click(screen.getByRole("button", { name: "Use this plan" }));
  expect(choose.mock.calls[0][0]).toMatchObject({
    kind: "combined",
    deferred: ["Negotiable report"],
    requestUnits: 16,
    result: { fits: true, total: 60 },
  });
});
it("F: zero capacity has a working unresolved route and no feasible indicator", async () => {
  const s = scenario([]);
  s.capacity = [0, 0, 0, 0, 0];
  const { user, unresolved } = setup(s);
  expect(
    screen.getByRole("region", { name: "Reality check" }),
  ).toHaveTextContent("5h / 0h");
  expect(screen.queryByText("All weekday deadlines fit")).toBeNull();
  expect(screen.queryByRole("article")).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "Prepare a renegotiation request" }),
  );
  expect(unresolved).toHaveBeenCalledOnce();
});
it("shows the early restriction and weekly overload as separate facts", () => {
  setup(scenario([task("Monday launch", 5, 0)], task("Presentation", 15)));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Monday deadline is short by 2 hours",
  );
  expect(
    screen.getByRole("region", { name: "Reality check" }),
  ).toHaveTextContent("5h over weekly capacity");
  expect(
    screen.getByRole("region", { name: "Reality check" }),
  ).toHaveTextContent("3havailable through Monday");
});
it("does not label an early deadline impossible when a smaller scope fits", async () => {
  const { choose, user } = setup(scenario([], task("Early request", 7, 1)));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Tuesday deadline is short by 1 hour",
  );
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByRole("article")).toHaveTextContent("6h of 7h requested");
  expect(
    screen.queryByRole("button", { name: "Prepare a renegotiation request" }),
  ).toBeNull();
  await user.click(screen.getByRole("button", { name: "Use this trade-off" }));
  expect(choose.mock.calls[0][0]).toMatchObject({
    requestUnits: 24,
    result: { fits: true },
  });
});
it("allows a negotiable existing conflict to be resolved without calling it impossible", () => {
  setup(scenario([task("Weekly report", 7, 1, true)], task("Presentation", 1)));
  expect(
    screen.getByText("Your existing commitments already have a conflict."),
  ).toBeVisible();
  expect(
    screen.getByRole("article", { name: "Move Weekly report" }),
  ).toHaveTextContent("1h / 15h");
  expect(
    screen.queryByRole("button", { name: "Prepare a renegotiation request" }),
  ).toBeNull();
});
it("uses distinct one- and three-option layout hooks while preserving equal actions", () => {
  setup(
    scenario([
      task("Report A", 5, 4, true),
      task("Report B", 5, 4, true),
      task("Fixed work", 3),
    ]),
  );
  const cards = screen.getAllByRole("article");
  expect(cards).toHaveLength(3);
  expect(cards[0].parentElement).toHaveClass("option-count-3");
  expect(cards[0]).toHaveTextContent("13h / 15h");
  expect(cards[1]).toHaveTextContent("13h / 15h");
  expect(cards[2]).toHaveTextContent("15h / 15h");
  expect(
    screen
      .getAllByRole("button", { name: "Use this trade-off" })
      .every((b) => b.classList.contains("primary")),
  ).toBe(true);
});
it("announces one concise simulator state, preserves focus and disables a plan when it becomes invalid", async () => {
  const { user } = setup(exampleScenario());
  await user.click(
    screen.getByRole("button", { name: /Explore your own trade-off/ }),
  );
  const move = screen.getByLabelText("Defer Weekly report");
  await user.click(move);
  expect(move).toHaveFocus();
  expect(screen.getByRole("button", { name: "Use this plan" })).toBeEnabled();
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status")).not.toContainElement(
    screen.getByText("Check every deadline"),
  );
  await user.click(move);
  expect(move).toHaveFocus();
  expect(screen.getByRole("button", { name: "Use this plan" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Use this plan" })).toHaveAttribute(
    "aria-describedby",
    "simulation-state",
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "By Friday, 18h are due, but only 15h are available",
  );
});
it("G: changing deadlines and flexibility invalidates the old proposal and recomputes safely", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Explore an example" }));
  await user.click(
    screen.getAllByRole("button", { name: "Use this trade-off" })[0],
  );
  await waitFor(() =>
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus(),
  );
  expect(
    (screen.getByLabelText("Your proposal") as HTMLTextAreaElement).value,
  ).toContain("Weekly report");
  await user.click(screen.getByRole("button", { name: "Compare options" }));
  await user.click(screen.getByRole("button", { name: "Edit workload" }));
  await user.click(screen.getByRole("button", { name: "Remove commitment 1" }));
  await user.click(screen.getByRole("button", { name: "Remove commitment 1" }));
  await user.click(screen.getByRole("button", { name: "Edit commitment 1" }));
  fireEvent.change(screen.getByLabelText("New request hours"), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByLabelText("Commitment 1 hours"), {
    target: { value: "7" },
  });
  await user.selectOptions(screen.getByLabelText("Commitment 1 deadline"), "1");
  await user.selectOptions(
    screen.getByLabelText("Commitment 1 flexibility"),
    "fixed",
  );
  await user.click(screen.getByRole("button", { name: "Check my week" }));
  await waitFor(() =>
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus(),
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Tuesday deadline is short by 1 hour",
  );
  expect(
    screen.getByRole("button", { name: /Make your proposal/ }),
  ).toHaveAttribute("aria-disabled", "true");
  expect(screen.queryByRole("article")).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "Prepare a renegotiation request" }),
  );
  expect(
    (screen.getByLabelText("Your proposal") as HTMLTextAreaElement).value,
  ).toContain("1h shortfall");
  expect(screen.queryByRole("button", { name: "Save decision" })).toBeNull();
}, 15000);

it("supports keyboard choice, disclosure and proposal activation without custom key handling", async () => {
  const { user, choose } = setup(exampleScenario());
  await user.tab();
  expect(screen.getByRole("button", { name: "Edit workload" })).toHaveFocus();
  await user.tab();
  const first = screen.getByRole("article", { name: "Move Weekly report" });
  expect(
    within(first).getByRole("button", { name: "Use this trade-off" }),
  ).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(choose.mock.calls[0][0]).toMatchObject({
    requestUnits: 20,
    result: { fits: true, total: 52 },
  });
  await user.tab();
  const disclosure = within(first)
    .getByText("Your week, mapped")
    .closest("summary");
  expect(disclosure).toHaveFocus();
});
