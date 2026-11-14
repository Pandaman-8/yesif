import { expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { exampleScenario, simulate } from "../domain/engine";
import { practiceFor } from "../domain/practice";
import { STORAGE_KEY, readNotebook } from "../storage/scenarios";
import { DRAFT_KEY } from "../storage/draft";

async function chooseScope(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Explore an example" }));
  await user.click(
    within(
      screen.getByRole("article", { name: "Reduce the new request" }),
    ).getByRole("button", { name: "Use this trade-off" }),
  );
}
it("recommended scope can be defined explicitly; manual edits survive practice, feedback, back, skip, retry and copy", async () => {
  const user = userEvent.setup();
  render(<App />);
  await chooseScope(user);
  const editor = screen.getByLabelText("Your proposal");
  const original = (editor as HTMLTextAreaElement).value;
  expect(original).toContain("still needs to be defined");
  fireEvent.change(
    screen.getByLabelText("What will the smaller version include?"),
    { target: { value: "Five core slides, no appendix" } },
  );
  expect(editor).toHaveValue(original);
  await user.click(
    screen.getByRole("button", {
      name: "Update generated draft with this scope",
    }),
  );
  expect((editor as HTMLTextAreaElement).value).toContain(
    "Five core slides, no appendix",
  );
  fireEvent.change(editor, {
    target: { value: "My own terms — please confirm the core slides." },
  });
  await user.click(screen.getByRole("button", { name: "Start practice" }));
  const s = exampleScenario(),
    p = simulate(s, [], 8);
  const t1 = practiceFor(s, p);
  await user.click(
    screen.getByRole("button", {
      name: t1.choices.find((c) => c.id === "observe")!.text,
    }),
  );
  expect(
    within(screen.getByRole("region", { name: /Step 1/ })).getByRole("status"),
  ).toHaveTextContent("leave the next action implicit");
  await user.click(screen.getByRole("button", { name: "Hear the pushback" }));
  expect(
    screen.getByText(/What do we need to agree before you start/),
  ).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: "Back to first response" }),
  );
  await user.click(
    screen.getByRole("button", {
      name: t1.choices.find((c) => c.id === "grounded")!.text,
    }),
  );
  await user.click(screen.getByRole("button", { name: "Hear the pushback" }));
  expect(screen.getByText(/I still want the full result/)).toBeVisible();
  const t2 = practiceFor(s, p, "grounded");
  await user.click(
    screen.getByRole("button", {
      name: t2.choices.find((c) => c.id === "grounded")!.text,
    }),
  );
  await user.click(screen.getByRole("button", { name: "Finish practice" }));
  expect(
    screen.getByRole("heading", {
      name: "Two replies. One clearer condition.",
    }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    screen.getByRole("button", { name: "Hear the pushback" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Skip practice" }));
  expect(
    screen.getByText("Practice skipped. Your proposal is unchanged."),
  ).toBeVisible();
  expect(editor).toHaveValue("My own terms — please confirm the core slides.");
  await user.click(screen.getByRole("button", { name: "Copy proposal" }));
  expect(await navigator.clipboard.readText()).toBe(
    "My own terms — please confirm the core slides.",
  );
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
}, 10000);
it("scope refresh and changed trade-off use the dirty-state guard; cancelling preserves the message", async () => {
  const user = userEvent.setup();
  render(<App />);
  await chooseScope(user);
  const editor = screen.getByLabelText("Your proposal");
  fireEvent.change(editor, { target: { value: "Keep my negotiation terms" } });
  fireEvent.change(
    screen.getByLabelText("What will the smaller version include?"),
    { target: { value: "Findings only" } },
  );
  await user.click(
    screen.getByRole("button", {
      name: "Update generated draft with this scope",
    }),
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(editor).toHaveValue("Keep my negotiation terms");
  await user.click(screen.getByRole("button", { name: "Compare options" }));
  await user.click(
    within(
      screen.getByRole("article", { name: "Move Weekly report" }),
    ).getByRole("button", { name: "Use this trade-off" }),
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: "Save draft and continue" }),
  );
  expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).message).toBe(
    "Keep my negotiation terms",
  );
  expect(
    (screen.getByLabelText("Your proposal") as HTMLTextAreaElement).value,
  ).toContain("move Weekly report beyond this week");
  expect(
    (screen.getByLabelText("Your proposal") as HTMLTextAreaElement).value,
  ).not.toContain("smaller");
  expect(
    screen.queryByLabelText("What will the smaller version include?"),
  ).toBeNull();
});
it("keyboard reaches replies, feedback disclosure and follow-up; practice does not reset on editor keystrokes", async () => {
  const user = userEvent.setup();
  render(<App />);
  await chooseScope(user);
  const start = screen.getByRole("button", { name: "Start practice" });
  start.focus();
  await user.keyboard("{Enter}");
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Step 1 of 2 · Your response" }),
    ).toHaveFocus(),
  );
  await user.tab(); // native details summary
  expect(document.activeElement?.tagName).toBe("SUMMARY");
  await user.tab();
  const reply = document.activeElement as HTMLElement;
  expect(reply.tagName).toBe("BUTTON");
  await user.keyboard("{Enter}");
  expect(reply).toHaveAttribute("aria-pressed", "true");
  fireEvent.change(screen.getByLabelText("Your proposal"), {
    target: { value: "Keyboard edited message" },
  });
  expect(reply).toHaveAttribute("aria-pressed", "true");
  const next = screen.getByRole("button", { name: "Hear the pushback" });
  next.focus();
  await user.keyboard("{Enter}");
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Step 2 of 2 · Their pushback" }),
    ).toHaveFocus(),
  );
  expect(screen.getByLabelText("Your proposal")).toHaveValue(
    "Keyboard edited message",
  );
});
it.each(["V1", "V2", "V2.3"])(
  "%s stored message, notes, outcome and optional scope survive reading and practice without writes",
  async (version) => {
    const s = exampleScenario();
    const d = {
      id: "old",
      created: "2026-11-01T12:00:00Z",
      scenario: s,
      plan: { deferred: ["report"], requestUnits: 20 },
      message: `${version}: personally agreed wording`,
      notes: "Keep the follow-up note",
      outcome: "revisit",
      ...(version === "V1" ? {} : { scope: "Old optional scope" }),
    };
    const raw = JSON.stringify({ version: 1, decisions: [d] });
    localStorage.setItem(STORAGE_KEY, raw);
    expect(readNotebook(localStorage).notebook.decisions[0]).toEqual(d);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /My decisions/ }));
    await user.click(screen.getByRole("button", { name: "Open decision" }));
    expect(screen.getByLabelText("Your proposal")).toHaveValue(d.message);
    await user.click(screen.getByRole("button", { name: "Start practice" }));
    await user.click(screen.getByRole("button", { name: "Skip practice" }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
    expect(screen.getByLabelText("Your proposal")).toHaveValue(d.message);
  },
);
it("scope and independently edited message survive explicit local draft recovery", async () => {
  const user = userEvent.setup();
  const view = render(<App />);
  await chooseScope(user);
  fireEvent.change(
    screen.getByLabelText("What will the smaller version include?"),
    { target: { value: "A single chart" } },
  );
  fireEvent.change(screen.getByLabelText("Your proposal"), {
    target: { value: "Please confirm the single chart." },
  });
  await user.click(screen.getByRole("button", { name: "Save local draft" }));
  view.unmount();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Resume local draft" }));
  expect(
    screen.getByLabelText("What will the smaller version include?"),
  ).toHaveValue("A single chart");
  expect(screen.getByLabelText("Your proposal")).toHaveValue(
    "Please confirm the single chart.",
  );
});
