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
import { readDraft } from "../storage/draft";

const field = (name: string) => screen.getByLabelText(name);
const input = (name: string, value: string) =>
  fireEvent.change(field(name), { target: { value } });
async function personal() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Plan my workload" }));
  return user;
}
async function hours(user: ReturnType<typeof userEvent.setup>, n: string) {
  input("Same hours each weekday", n);
  await user.click(screen.getByRole("button", { name: "Apply to weekdays" }));
}
async function commitment(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  name: string,
  effort: string,
  due: string,
  movable = false,
) {
  await user.click(screen.getByRole("button", { name: "Add a commitment" }));
  input(`Commitment ${index} name`, name);
  input(`Commitment ${index} hours`, effort);
  await user.selectOptions(field(`Commitment ${index} deadline`), due);
  if (movable)
    await user.selectOptions(
      field(`Commitment ${index} flexibility`),
      "movable",
    );
}
it("makes personal input primary, starts with blank required effort and focuses the heading", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.queryByRole("button", { name: /negotiation kit/i })).toBeNull();
  const primary = screen.getByRole("button", { name: "Plan my workload" });
  expect(primary).toHaveClass("primary");
  expect(
    screen.getByRole("button", { name: "Explore an example" }),
  ).not.toHaveClass("primary");
  await user.click(primary);
  expect(field("New request hours")).toHaveValue(null);
  expect(field("New request hours")).toBeRequired();
  expect(field("New request name")).toHaveValue("");
  expect(field("Monday focused hours")).toHaveValue(0);
  expect(screen.queryByLabelText("Commitment 1 name")).toBeNull();
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "What needs to fit?" }),
    ).toHaveFocus(),
  );
  await user.tab();
  expect(screen.getByRole("button", { name: "Start over" })).toHaveFocus();
});
it("validates missing, zero and non-quarter effort without turning blank into zero, and focuses errors", async () => {
  const user = await personal();
  await user.click(screen.getByRole("button", { name: "Check my week" }));
  expect(field("New request name")).toHaveFocus();
  input("New request name", "Brief");
  for (const value of ["", "0", "0.1"]) {
    input("New request hours", value);
    await user.click(screen.getByRole("button", { name: "Check my week" }));
    expect(field("New request hours")).toHaveAttribute("aria-invalid", "true");
    expect(field("New request hours")).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent("0.25–120");
  }
});
it("applies explicit weekday hours, permits zero and keeps per-day editing independent", async () => {
  const user = await personal();
  await user.click(screen.getByRole("button", { name: "Apply to weekdays" }));
  expect(screen.getByRole("alert")).toHaveTextContent("before applying");
  expect(field("Same hours each weekday")).toHaveFocus();
  for (const invalid of ["25", "-1", "0.1"]) {
    await hours(user, invalid);
    expect(field("Monday focused hours")).toHaveValue(0);
  }
  await hours(user, "3");
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    expect(field(`${day} focused hours`)).toHaveValue(3);
  input("Wednesday focused hours", "1.5");
  expect(field("Monday focused hours")).toHaveValue(3);
  expect(field("Wednesday focused hours")).toHaveValue(1.5);
  await hours(user, "0");
  expect(field("Friday focused hours")).toHaveValue(0);
  input("Same hours each weekday", "2");
  field("Same hours each weekday").focus();
  await user.keyboard("{Enter}");
  expect(field("Monday focused hours")).toHaveValue(2);
  expect(screen.getByRole("form", { name: "Your workload" })).toBeVisible();
});
it("case B: visible flexibility and personal 10h/15h submit to a feasible real result", async () => {
  const user = await personal();
  input("New request name", "Urgent presentation");
  input("New request hours", "5");
  await hours(user, "3");
  await commitment(user, 1, "Weekly report", "5", "4");
  expect(field("Commitment 1 flexibility")).toBeVisible();
  expect(field("Commitment 1 flexibility")).toHaveValue("fixed");
  expect(screen.getByText(/This deadline stays protected/)).toBeVisible();
  await user.selectOptions(field("Commitment 1 flexibility"), "movable");
  expect(screen.getByText(/agreement and a new deadline/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Check my week" }));
  expect(
    screen.getByRole("heading", { name: "There’s room for this yes." }),
  ).toBeVisible();
  expect(screen.getByText("10h", { selector: ".big-number" })).toBeVisible();
  expect(
    screen.getByRole("region", { name: "Reality check" }),
  ).toHaveTextContent("10h / 15h");
  await user.click(screen.getByRole("button", { name: "Edit workload" }));
  expect(field("Commitment 1 flexibility")).toHaveValue("movable");
  expect(field("New request hours")).toHaveValue(5);
});
it("case C: independently entered conflict produces the genuine report trade-off", async () => {
  const user = await personal();
  input("New request name", "Urgent presentation");
  input("New request hours", "5");
  await hours(user, "3");
  await commitment(user, 1, "Launch QA", "5", "2");
  await commitment(user, 2, "Customer updates", "3", "3");
  await commitment(user, 3, "Weekly report", "5", "4", true);
  await user.click(screen.getByRole("button", { name: "Check my week" }));
  expect(
    screen.getByRole("heading", { name: "Something has to give. Not you." }),
  ).toBeVisible();
  expect(screen.getByText("18h", { selector: ".big-number" })).toBeVisible();
  const card = screen.getAllByRole("article")[0];
  expect(card).toHaveTextContent("Weekly report");
  expect(card).toHaveTextContent("13h");
});
it("case D: 8h/15h still fails Tuesday by 1h", async () => {
  const user = await personal();
  input("New request name", "Urgent presentation");
  input("New request hours", "1");
  await hours(user, "3");
  await commitment(user, 1, "Weekly report", "7", "1");
  await user.click(screen.getByRole("button", { name: "Check my week" }));
  expect(screen.getByText("8h", { selector: ".big-number" })).toBeVisible();
  expect(
    screen.getAllByText(/By Tuesday, 7h are due, but only 6h are available/)
      .length,
  ).toBeGreaterThan(0);
  expect(
    screen.queryByRole("button", { name: "Use this trade-off" }),
  ).toBeNull();
  expect(
    screen.getByRole("button", { name: "Prepare a renegotiation request" }),
  ).toBeVisible();
});
it("protects Start over and Load example, preserves blank effort in a draft, and clears quick-entry state on reset", async () => {
  const user = await personal();
  input("New request name", "Partial work");
  await hours(user, "3");
  for (const name of ["Start over", "Load example"]) {
    await user.click(screen.getByRole("button", { name }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(field("New request name")).toHaveValue("Partial work");
    expect(field("New request hours")).toHaveValue(null);
  }
  await user.click(screen.getByRole("button", { name: "Start over" }));
  await user.click(
    screen.getByRole("button", { name: "Save draft and continue" }),
  );
  expect(Number.isNaN(readDraft(localStorage)!.scenario.request.units)).toBe(
    true,
  );
  expect(field("New request name")).toHaveValue("");
  expect(field("Same hours each weekday")).toHaveValue(null);
  expect(field("Monday focused hours")).toHaveValue(0);
  await user.click(screen.getByRole("button", { name: "YESIF home" }));
  await user.click(screen.getByRole("button", { name: "Resume local draft" }));
  expect(field("New request name")).toHaveValue("Partial work");
  expect(field("New request hours")).toHaveValue(null);
  expect(field("Monday focused hours")).toHaveValue(3);
});
it("keeps work through navigation, explains unavailable stages and supports add/remove focus", async () => {
  const user = await personal();
  input("New request name", "Keep this");
  await user.click(screen.getByRole("button", { name: /Find your if/ }));
  expect(screen.getByRole("status")).toHaveTextContent("valid daily hours");
  expect(field("New request name")).toHaveValue("Keep this");
  await user.click(screen.getByRole("button", { name: "Add a commitment" }));
  expect(field("Commitment 1 name")).toHaveFocus();
  expect(field("Commitment 1 hours")).toHaveValue(null);
  await user.click(screen.getByRole("button", { name: "Remove commitment 1" }));
  expect(screen.queryByLabelText("Commitment 1 name")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Add a commitment" }),
  ).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "YESIF home" }));
  await user.click(screen.getByRole("button", { name: "Plan my workload" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await user.click(screen.getByRole("button", { name: "My decisions" }));
  await user.click(screen.getByRole("button", { name: /Back to/ }));
  expect(field("New request name")).toHaveValue("Keep this");
});

it("collapses completed commitments while keeping timing visible and supports editing again", async () => {
  const user = await personal();
  await commitment(user, 1, "Report", "5", "4");
  await user.click(
    screen.getByRole("button", { name: "Done editing commitment 1" }),
  );
  expect(screen.getByText("5h remaining · Due Friday")).toBeVisible();
  expect(field("Commitment 1 flexibility")).toBeVisible();
  expect(screen.queryByLabelText("Commitment 1 name")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Edit commitment 1" }),
  ).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Edit commitment 1" }));
  expect(field("Commitment 1 name")).toHaveFocus();
  expect(field("Commitment 1 hours")).toHaveValue(5);
  input("Commitment 1 hours", "");
  expect(
    screen.getByRole("button", { name: "Done editing commitment 1" }),
  ).toBeDisabled();
});
