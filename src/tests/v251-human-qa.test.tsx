import { expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { NegotiationPractice } from "../components/NegotiationPractice";
import { PrintBrief } from "../components/PrintBrief";
import { SavedComparison } from "../components/SavedComparison";
import { exampleScenario, simulate } from "../domain/engine";
import { practiceFor } from "../domain/practice";
import { decisionBrief, decisionBriefParts } from "../domain/decisionTools";
import { STORAGE_KEY, type SavedDecision } from "../storage/scenarios";

it("recaps the exact two risky scope replies, keeps feedback separate, and preserves manual text through Back, Retry and Skip", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Explore an example" }));
  await user.click(
    within(
      screen.getByRole("article", { name: "Reduce the new request" }),
    ).getByRole("button", { name: "Use this trade-off" }),
  );
  const scenario = exampleScenario(),
    plan = simulate(scenario, [], 8);
  const first = practiceFor(scenario, plan).choices.find(
    (c) => c.id === "assume",
  )!;
  const second = practiceFor(scenario, plan, "assume").choices.find(
    (c) => c.id === "assume",
  )!;
  const manual = "My exact proposal.\nKeep all my punctuation — and terms.";
  fireEvent.change(screen.getByLabelText("Your proposal"), {
    target: { value: manual },
  });
  await user.click(screen.getByRole("button", { name: "Start practice" }));
  await user.click(screen.getByRole("button", { name: first.text }));
  await user.click(screen.getByRole("button", { name: "Hear the pushback" }));
  expect(
    screen.getByText(/Then can I tell everyone the full result/),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: second.text }));
  await user.click(
    screen.getByRole("button", { name: "Back to first response" }),
  );
  expect(screen.getByRole("button", { name: first.text })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await user.click(screen.getByRole("button", { name: "Hear the pushback" }));
  expect(
    screen.getByRole("button", { name: "Finish practice" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: second.text }));
  await user.click(screen.getByRole("button", { name: "Finish practice" }));
  expect(screen.getByLabelText("Your first response").textContent).toBe(
    first.text,
  );
  expect(
    screen.getByLabelText("Your response to the follow-up").textContent,
  ).toBe(second.text);
  for (const reply of [first, second]) {
    expect(screen.getAllByText(reply.improve).length).toBeGreaterThan(0);
  }
  expect(screen.getByLabelText("Your first response").textContent).not.toBe(
    first.improve,
  );
  expect(screen.getByLabelText("Your proposal")).toHaveValue(manual);
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    screen.getByRole("button", { name: "Hear the pushback" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Skip practice" }));
  expect(screen.getByLabelText("Your proposal")).toHaveValue(manual);
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
}, 10000);

it.each(["grounded", "observe"] as const)(
  "recaps the actual %s first reply rather than its evaluation",
  async (id) => {
    const s = exampleScenario(),
      p = simulate(s, [], 8);
    const first = practiceFor(s, p).choices.find((c) => c.id === id)!;
    const second = practiceFor(s, p, id).choices.find(
      (c) => c.id === "grounded",
    )!;
    const user = userEvent.setup();
    render(<NegotiationPractice scenario={s} chosen={p} scope="" />);
    for (const name of [
      "Start practice",
      first.text,
      "Hear the pushback",
      second.text,
      "Finish practice",
    ]) {
      await user.click(screen.getByRole("button", { name }));
    }
    expect(screen.getByLabelText("Your first response").textContent).toBe(
      first.text,
    );
    expect(
      screen.getByLabelText("Your response to the follow-up").textContent,
    ).toBe(second.text);
  },
);

const saved = (id: string, reduced = false): SavedDecision => ({
  id,
  created: id === "a" ? "2026-11-14T10:00:00Z" : "2026-11-15T11:30:00Z",
  scenario: exampleScenario(),
  plan: { deferred: reduced ? [] : ["report"], requestUnits: reduced ? 8 : 20 },
  message: "My saved message: exact.\n\nA second paragraph <with details>.",
  notes: "Keep the original notes.",
  outcome: "pending",
});
it("distinguishes same-named snapshots by concise change and date without modifying stored data", async () => {
  const ds = [saved("a"), saved("b", true)];
  const raw = JSON.stringify({ version: 1, decisions: ds });
  localStorage.setItem(STORAGE_KEY, raw);
  const user = userEvent.setup();
  render(<SavedComparison decisions={ds} />);
  const a = screen.getByRole("combobox", { name: "Snapshot A" });
  expect(
    within(a).getByRole("option", { name: "1. Urgent presentation · Move 5h" }),
  ).toBeVisible();
  expect(
    within(a).getByRole("option", {
      name: "2. Urgent presentation · Scope 2h",
    }),
  ).toBeVisible();
  await user.selectOptions(a, "b");
  expect(a).toHaveAccessibleDescription(
    /Make the new request a 2h deliverable.*Nov 15, 2026/,
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Snapshot B" }),
    "a",
  );
  expect(screen.getByRole("article", { name: "Snapshot A" })).toHaveTextContent(
    "15h / 15h",
  );
  expect(screen.getByRole("article", { name: "Snapshot B" })).toHaveTextContent(
    "13h / 15h",
  );
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
});
it("print structure preserves every brief fact, disclaimer and multiline manual paragraph", () => {
  const d = saved("a");
  d.message +=
    "\n\nOriginal week: my own words, not a new calculation.\nFinal line.";
  const text = decisionBrief(d);
  const { container } = render(<PrintBrief parts={decisionBriefParts(d)} />);
  const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
  expect(normalize(container.textContent!)).toBe(normalize(text));
  expect(
    [...container.querySelectorAll("h2")].filter(
      (e) => e.textContent === "Original week:",
    ),
  ).toHaveLength(1);
  const messageSection = [...container.querySelectorAll("section")].find(
    (e) =>
      e.querySelector("h2")?.textContent ===
      "Your saved message (not verified by the calculation):",
  )!;
  expect(messageSection.querySelector("p")?.textContent?.trim()).toBe(
    d.message,
  );
  expect(container.querySelector("h1")?.textContent).toContain(
    "Urgent presentation",
  );
  expect(
    [...container.querySelectorAll("h2")].map((e) => e.textContent),
  ).toContain("Checked deadlines:");
  expect(container.textContent).toContain(
    "No dependencies, delivery guarantee or verified future capacity.",
  );
});
it("scope follow-up choices address the objection without repeating the first-step options", () => {
  const s = exampleScenario(),
    p = simulate(s, [], 8);
  const first = practiceFor(s, p);
  for (const id of ["grounded", "observe", "assume"] as const) {
    const second = practiceFor(s, p, id);
    for (const reply of second.choices) {
      expect(reply.text).not.toBe(
        first.choices.find((c) => c.id === reply.id)!.text,
      );
      for (const e of reply.evidence)
        if (e.quote) expect(reply.text).toContain(e.quote);
    }
  }
});
