import { expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { exampleScenario } from "../domain/engine";
import {
  decisionBrief,
  followUpText,
  playbook,
  scenarioDifferences,
} from "../domain/decisionTools";
import {
  STORAGE_KEY,
  readNotebook,
  type SavedDecision,
} from "../storage/scenarios";
const decision = (id = "one", reduced = false): SavedDecision => ({
  id,
  created: "2026-11-15T02:00:00Z",
  scenario: exampleScenario(),
  plan: { deferred: reduced ? [] : ["report"], requestUnits: reduced ? 8 : 20 },
  message: `My exact message ${id}`,
  scope: reduced ? "Two charts" : "",
  notes: "Confirm the date with me",
  outcome: "pending",
});
async function notebook(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /My decisions/ }));
}
async function unlock(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", {
      name: "Unlock free demo — no payment required",
    }),
  );
}
function seed(ds: SavedDecision[]) {
  const raw = JSON.stringify({ version: 1, decisions: ds });
  localStorage.setItem(STORAGE_KEY, raw);
  return raw;
}
it("artifacts use actual inputs and self-recorded outcome, retain obligations and never invent approval", () => {
  const d = decision();
  const brief = decisionBrief(d),
    prep = playbook(d);
  expect(brief).toContain("18h / 15h");
  expect(brief).toContain("13h / 15h");
  expect(brief).toContain("5h moves beyond this week; it remains owed");
  expect(brief).toContain(d.message);
  expect(brief).toContain(d.notes);
  expect(prep).toContain("18h due / 15h usable by Friday");
  expect(prep).toContain("Weekly report");
  expect(prep).toContain("not a prediction");
  const reduced = decision("two", true);
  expect(decisionBrief(reduced)).toContain("Two charts");
  expect(playbook(reduced)).toContain("smaller");
  d.outcome = "agreed";
  expect(followUpText(d)).toContain("My understanding is");
  expect(followUpText(d)).toContain("Could you confirm");
  expect(decisionBrief(d)).toContain("not independently verified");
  d.outcome = "revisit";
  expect(followUpText(d)).toContain("Could we revisit");
});
it("saved comparison names material differences, normalizes IDs and zero reserves, and recomputes each snapshot", async () => {
  const a = decision(),
    b = decision("two", true);
  expect(scenarioDifferences(a.scenario, b.scenario)).toEqual([]);
  b.scenario.request.id = "other";
  b.scenario.reserve = [0, 0, 0, 0, 0];
  expect(scenarioDifferences(a.scenario, b.scenario)).toEqual([]);
  b.scenario.capacity[0] = 16;
  b.scenario.request.name = "Different request";
  expect(scenarioDifferences(a.scenario, b.scenario).join(" ")).toContain(
    "Daily capacity differs",
  );
  const raw = seed([a, b]);
  const user = userEvent.setup();
  render(<App />);
  await notebook(user);
  await unlock(user);
  await user.selectOptions(screen.getByLabelText("Snapshot A"), a.id);
  await user.selectOptions(screen.getByLabelText("Snapshot B"), b.id);
  const ca = screen.getByRole("article", { name: "Snapshot A" }),
    cb = screen.getByRole("article", { name: "Snapshot B" });
  expect(ca).toHaveTextContent("13h / 15h");
  expect(cb).toHaveTextContent("15h / 16h");
  expect(screen.getByText(/Different input scenarios/)).toBeVisible();
  await user.click(screen.getByText("What differs in the inputs?"));
  expect(screen.getByText(/Daily capacity differs/)).toBeVisible();
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
});
it("same-input comparison offers exact conditions without ranking and disallows self comparison", async () => {
  seed([decision(), decision("two", true)]);
  const user = userEvent.setup();
  render(<App />);
  await notebook(user);
  await unlock(user);
  await user.selectOptions(screen.getByLabelText("Snapshot A"), "one");
  await user.selectOptions(screen.getByLabelText("Snapshot B"), "two");
  expect(screen.getByText(/Same input scenario/)).toBeVisible();
  expect(
    within(screen.getByRole("combobox", { name: "Snapshot B" })).getByRole(
      "option",
      {
        name: /1\. Urgent/,
      },
    ),
  ).toBeDisabled();
  expect(screen.getByRole("article", { name: "Snapshot A" })).toHaveTextContent(
    "5h remain owed",
  );
  expect(screen.getByRole("article", { name: "Snapshot B" })).toHaveTextContent(
    "Two charts",
  );
});
it("all Kit artifact paths work: edit/copy follow-up, preserve notes across pages, copy playbook and print/copy brief", async () => {
  const d = decision();
  seed([d]);
  const user = userEvent.setup();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  render(<App />);
  await notebook(user);
  await unlock(user);
  await user.click(screen.getByText("Prepare a follow-up · Kit demo"));
  fireEvent.change(screen.getByLabelText("Follow-up message"), {
    target: { value: "My follow-up only" },
  });
  await user.click(
    screen.getByRole("button", { name: "Copy follow-up message" }),
  );
  expect(await navigator.clipboard.readText()).toBe("My follow-up only");
  fireEvent.change(screen.getByLabelText("What was agreed?"), {
    target: { value: "New recorded terms" },
  });
  expect(screen.getByLabelText("Follow-up message")).toHaveValue(
    "My follow-up only",
  );
  expect(screen.getByText(/saved outcome or notes changed/)).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: "Regenerate follow-up" }),
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByLabelText("Follow-up message")).toHaveValue(
    "My follow-up only",
  );
  await user.click(screen.getByRole("button", { name: "Open decision" }));
  await notebook(user);
  await user.click(screen.getByText("Prepare a follow-up · Kit demo"));
  expect(screen.getByLabelText("Follow-up message")).toHaveValue(
    "My follow-up only",
  );
  await user.click(screen.getByText("Negotiation Playbook · Kit demo"));
  await user.click(
    screen.getByRole("button", { name: "Copy negotiation playbook" }),
  );
  expect(await navigator.clipboard.readText()).toContain("Reasonable ask");
  await user.click(screen.getByText("Decision Brief · Kit demo"));
  await user.click(screen.getByRole("button", { name: "Copy decision brief" }));
  expect(await navigator.clipboard.readText()).toContain("New recorded terms");
  await user.click(
    screen.getByRole("button", { name: "Print decision brief" }),
  );
  expect(print).toHaveBeenCalledOnce();
  expect(document.querySelector(".print-brief")).toHaveTextContent("13h / 15h");
  const stored = readNotebook(localStorage).notebook.decisions[0];
  expect(stored.message).toBe(d.message);
  expect(stored.notes).toBe("New recorded terms");
  expect(JSON.stringify(stored)).not.toContain("My follow-up only");
}, 10000);
it("Kit access resets on remount while every saved entry remains openable and exportable in Free", async () => {
  const raw = seed([decision(), decision("two", true)]);
  const user = userEvent.setup();
  const view = render(<App />);
  await notebook(user);
  await unlock(user);
  view.unmount();
  render(<App />);
  await notebook(user);
  expect(
    screen.getByRole("button", {
      name: "Unlock free demo — no payment required",
    }),
  ).toBeEnabled();
  expect(screen.getByRole("button", { name: "Export notebook" })).toBeEnabled();
  expect(screen.queryByLabelText("Snapshot A")).toBeNull();
  expect(screen.getAllByRole("button", { name: "Open decision" })).toHaveLength(
    2,
  );
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  await user.click(screen.getAllByRole("button", { name: "Open decision" })[1]);
  expect(screen.getByLabelText("Your proposal")).toHaveValue(
    "My exact message two",
  );
});
it("50-decision cap preserves all existing snapshots and the unsaved proposal", async () => {
  seed(Array.from({ length: 50 }, (_, i) => decision(String(i))));
  const user = userEvent.setup();
  render(<App />);
  await notebook(user);
  await unlock(user);
  await user.click(screen.getByRole("button", { name: "Back to my workload" }));
  await user.click(screen.getByRole("button", { name: "Check my week" }));
  await user.click(
    within(
      screen.getByRole("article", { name: "Move Weekly report" }),
    ).getByRole("button", { name: "Use this trade-off" }),
  );
  await user.click(screen.getByRole("button", { name: "Save decision" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "50-decision storage limit",
  );
  expect(readNotebook(localStorage).notebook.decisions).toHaveLength(50);
  await user.click(screen.getByRole("button", { name: "Back to my proposal" }));
  expect(
    (screen.getByLabelText("Your proposal") as HTMLTextAreaElement).value,
  ).toContain("move Weekly report");
}, 10000);
it("follow-up clipboard failure selects exact edited text and preserves the source", async () => {
  const raw = seed([decision()]);
  const user = userEvent.setup();
  render(<App />);
  await notebook(user);
  await unlock(user);
  await user.click(screen.getByText("Prepare a follow-up · Kit demo"));
  fireEvent.change(screen.getByLabelText("Follow-up message"), {
    target: { value: "Manual follow-up" },
  });
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
    new Error("denied"),
  );
  await user.click(
    screen.getByRole("button", { name: "Copy follow-up message" }),
  );
  const editor = screen.getByLabelText(
    "Follow-up message",
  ) as HTMLTextAreaElement;
  expect(editor).toHaveFocus();
  expect(editor.selectionEnd - editor.selectionStart).toBe(editor.value.length);
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
});
