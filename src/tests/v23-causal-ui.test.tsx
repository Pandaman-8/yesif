import { createRef, useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Results } from "../components/Results";
import { Proposal } from "../components/Proposal";
import { exampleScenario, simulate, type Scenario } from "../domain/engine";
import { renegotiationRequest } from "../domain/conversation";
function make(): Scenario {
  const s = exampleScenario();
  s.tasks = [{ ...s.tasks[2], units: 28, deadline: 1, movable: false }];
  s.request.units = 4;
  return s;
}
function ResultHarness({ s }: { s: Scenario }) {
  const [deferred, setDeferred] = useState<string[]>([]),
    [units, setUnits] = useState(s.request.units);
  return (
    <Results
      scenario={s}
      heading={createRef()}
      demo={false}
      simulation={simulate(s, deferred, units)}
      deferred={deferred}
      units={units}
      scope=""
      setScope={vi.fn()}
      setDeferred={setDeferred}
      setUnits={setUnits}
      choose={vi.fn()}
      edit={vi.fn()}
      unresolved={vi.fn()}
    />
  );
}
it("shows causal attribution, relevant Fixed work, and only unverified directions for Tuesday", async () => {
  const s = make();
  render(<ResultHarness s={s} />);
  const user = userEvent.setup();
  expect(
    screen.getByRole("region", { name: "Reality check" }),
  ).toHaveTextContent(
    "Friday request does not cause the earlier Tuesday shortfall",
  );
  expect(screen.queryByRole("article")).toBeNull();
  expect(screen.queryByRole("slider")).toBeNull();
  expect(screen.queryByText("Your week, mapped")).toBeNull();
  await user.click(screen.getByText("Relevant changes to discuss"));
  expect(
    screen.getByText(
      "Not verified solutions. No condition has been changed or agreed.",
    ),
  ).toBeVisible();
  expect(
    screen.getByText(/Weekly report \(7h, due Tuesday, Fixed/),
  ).toBeVisible();
  expect(
    screen.queryByText(/Discuss the scope or deadline of Urgent/),
  ).toBeNull();
});
it("unresolved proposal separates a report-focused request from factual detailed evidence", async () => {
  const s = make();
  const user = userEvent.setup();
  render(
    <Proposal
      scenario={s}
      chosen={null}
      heading={createRef()}
      message={renegotiationRequest(s)}
      scope=""
      setScope={vi.fn()}
      setMessage={vi.fn()}
      copy={vi.fn()}
      save={vi.fn()}
      saveDraft={() => true}
      savedId=""
      reset={vi.fn()}
      compare={vi.fn()}
    />,
  );
  expect(
    (
      screen.getByRole("textbox", {
        name: "Your proposal",
      }) as HTMLTextAreaElement
    ).value,
  ).toMatch(/^By Tuesday, Weekly report requires 7h, but I have 6h/);
  await user.click(screen.getByText("Why this is blocked"));
  expect(
    screen.getByText(/7h due by Tuesday; 1h shortfall at that date/),
  ).toBeVisible();
  expect(screen.queryByText("Your week, mapped")).toBeNull();
  expect(screen.queryByRole("button", { name: "Save decision" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Start practice" }));
  const practice = screen.getByRole("button", {
    name: /There’s a 1h gap by Tuesday/,
  });
  expect(practice).toHaveTextContent("recheck before committing");
});
it("manual later scope change stays infeasible; a relevant deferral creates and reset removes the map", async () => {
  const s = make();
  s.tasks[0].movable = true;
  s.request.units = 8;
  render(<ResultHarness s={s} />);
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: /Explore your own trade-off/ }),
  );
  fireEvent.change(screen.getByRole("slider"), { target: { value: "1" } });
  expect(screen.getByRole("status")).toHaveTextContent(
    "reducing Urgent presentation cannot repair this shortfall",
  );
  expect(screen.getByRole("button", { name: "Use this plan" })).toBeDisabled();
  await user.click(
    screen.getByRole("checkbox", { name: "Defer Weekly report" }),
  );
  expect(screen.getByRole("button", { name: "Use this plan" })).toBeEnabled();
  const simulation = screen
    .getByRole("button", { name: "Use this plan" })
    .closest(".sim-result")!;
  expect(
    within(simulation as HTMLElement).getByText("Your week, mapped"),
  ).toBeInTheDocument();
  expect(simulation).toHaveTextContent("0.25h assigned / 15h usable");
  await user.click(screen.getByRole("button", { name: "Reset changes" }));
  expect(
    within(simulation as HTMLElement).queryByText("Your week, mapped"),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Use this plan" })).toBeDisabled();
});
it("handles eight negotiable commitments and long custom names with actual current IDs", () => {
  const s = exampleScenario();
  s.tasks = Array.from({ length: 8 }, (_, i) => ({
    ...s.tasks[2],
    id: `eight-${i}`,
    name: `Long custom work ${i}: coordinating the cross-functional launch and review`,
    units: 8,
    deadline: 4,
  }));
  render(<ResultHarness s={s} />);
  expect(screen.getAllByRole("article").length).toBeGreaterThan(0);
  const cards = screen.getAllByRole("article");
  for (const c of cards)
    expect(c).toHaveTextContent("Fits every weekday deadline");
  expect(
    screen.getByRole("region", { name: "Reality check" }),
  ).toHaveTextContent("21h / 15h");
});
