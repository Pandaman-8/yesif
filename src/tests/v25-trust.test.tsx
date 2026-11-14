import { expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { exampleScenario } from "../domain/engine";
import { renegotiationRequest } from "../domain/conversation";
import {
  sameSavedContent,
  STORAGE_KEY,
  type SavedDecision,
} from "../storage/scenarios";

it("separates existing and added same-day deficits without claiming weekly overload", () => {
  const s = exampleScenario();
  s.tasks = [{ ...s.tasks[2], units: 28, deadline: 1, movable: false }];
  s.request = { ...s.request, units: 4, deadline: 1 };
  const text = renegotiationRequest(s);
  expect(text).toContain("By Tuesday");
  expect(text).toContain(
    "require 8h, but I have 6h available — a 2h shortfall",
  );
  expect(text).toContain(
    "1h of this shortfall already existed, and the request adds 1h",
  );
  expect(text).not.toContain("over capacity");
  expect(text).toContain("recheck every deadline");
  s.request.deadline = 4;
  const later = renegotiationRequest(s);
  expect(later).toContain("requires 7h, but I have 6h");
  expect(later).toContain("before the new request");
  expect(later).not.toMatch(/reduce|scope|Friday.*shortfall/);
});
it("separates new early failure from independently failing later existing work", () => {
  const s = exampleScenario();
  s.capacity = [4, 4, 4, 4, 0];
  s.tasks = [{ ...s.tasks[0], units: 20, deadline: 4 }];
  s.request = { ...s.request, units: 8, deadline: 0 };
  const text = renegotiationRequest(s);
  expect(text).toContain("By Monday");
  expect(text).toContain("requires 2h, but I have 1h");
  expect(text).toContain("new request causes this early shortfall");
  expect(text).toContain(
    "existing work separately falls short by 1h on Friday",
  );
  expect(text).not.toContain("this shortfall already existed");
});
it("semantic duplicate detection preserves exact messages, scopes and selected conditions", () => {
  const a = {
    scenario: exampleScenario(),
    plan: { deferred: ["report"], requestUnits: 20 },
    message: "My exact text",
    scope: "",
  };
  const b = structuredClone(a);
  b.scenario.tasks.reverse();
  b.scenario.reserve = [0, 0, 0, 0, 0];
  expect(sameSavedContent(a, b)).toBe(true);
  b.message += " ";
  expect(sameSavedContent(a, b)).toBe(false);
  b.message = a.message;
  b.scope = "Smaller contents";
  expect(sameSavedContent(a, b)).toBe(false);
  b.scope = "";
  b.plan.requestUnits = 8;
  expect(sameSavedContent(a, b)).toBe(false);
});
it("reselecting the exact saved decision does not upsell, duplicate or overwrite notes", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Explore an example" }));
  const choose = async () =>
    user.click(
      within(
        screen.getByRole("article", { name: "Move Weekly report" }),
      ).getByRole("button", { name: "Use this trade-off" }),
    );
  await choose();
  await user.click(screen.getByRole("button", { name: "Save decision" }));
  const raw = localStorage.getItem(STORAGE_KEY);
  await user.click(screen.getByRole("button", { name: "Compare options" }));
  await choose();
  await user.click(screen.getByRole("button", { name: "Save decision" }));
  expect(screen.getByRole("status")).toHaveTextContent("already saved");
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  expect(screen.getByLabelText("Your proposal")).toBeVisible();
});
it("unapplied scope has an accessible literal notice and Cancel preserves recovered manual text", async () => {
  const d: SavedDecision = {
    id: "old",
    created: "2026-11-14T12:00:00Z",
    scenario: exampleScenario(),
    plan: { deferred: [], requestUnits: 8 },
    message: "Please keep my authored wording.",
    scope: "",
    notes: "Original note",
    outcome: "pending",
  };
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, decisions: [d] }),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: /My decisions/ }));
  await user.click(screen.getByRole("button", { name: "Open decision" }));
  fireEvent.change(
    screen.getByLabelText("What will the smaller version include?"),
    { target: { value: "Two charts" } },
  );
  expect(screen.getByRole("status")).toHaveTextContent("not included verbatim");
  await user.click(
    screen.getByRole("button", {
      name: "Update generated draft with this scope",
    }),
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByLabelText("Your proposal")).toHaveValue(d.message);
  expect(
    screen.getByLabelText("What will the smaller version include?"),
  ).toHaveValue("Two charts");
});
