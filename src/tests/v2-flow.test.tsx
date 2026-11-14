import { expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { DRAFT_KEY } from "../storage/draft";
import { STORAGE_KEY } from "../storage/scenarios";

async function demo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Try a real example" }));
}
async function chooseFirst(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getAllByRole("button", { name: "Use this trade-off" })[0],
  );
}
it("introduces the demo, puts options first and exposes a concrete allocation", async () => {
  const user = userEvent.setup();
  render(<App />);
  await demo(user);
  expect(
    screen.getByText("Your manager just added another urgent request."),
  ).toBeInTheDocument();
  expect(
    screen
      .getByRole("region", { name: "Your options" })
      .compareDocumentPosition(
        screen.getByRole("button", { name: /Explore your own trade-off/ }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.queryByLabelText("Defer Weekly report")).toBeNull();
  const card = screen.getAllByRole("article")[0];
  await user.click(within(card).getByText("How your week could work"));
  expect(within(card).getByText("Monday")).toBeVisible();
  expect(within(card).getAllByText("Launch QA")).toHaveLength(2);
  expect(within(card).getByText("2h available")).toBeVisible();
  await chooseFirst(user);
  expect(
    (
      screen.getByRole("textbox", {
        name: "Your proposal",
      }) as HTMLTextAreaElement
    ).value,
  ).toContain("Weekly report");
});
it("keeps an impossible request distinct from a feasible proposal and saves its local draft", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Use my own workload" }));
  await user.type(screen.getByLabelText("New request name"), "Board brief");
  await user.selectOptions(screen.getByLabelText("New request deadline"), "1");
  await user.click(screen.getByRole("button", { name: "Find my options" }));
  await user.click(
    screen.getByRole("button", { name: "Prepare a renegotiation request" }),
  );
  expect(
    screen.getByRole("heading", { name: "Request to renegotiate" }),
  ).toBeVisible();
  const message = (
    screen.getByLabelText("Your proposal") as HTMLTextAreaElement
  ).value;
  expect(message).toContain("Tuesday");
  expect(message).toContain("1h shortfall");
  expect(screen.queryByText("Fits every weekday deadline")).toBeNull();
  expect(screen.queryByRole("button", { name: "Save decision" })).toBeNull();
  await user.click(
    screen.getAllByRole("button", { name: "Save local draft" })[0],
  );
  expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).unresolved).toBe(true);
});
it("protects reset: cancel keeps partial inputs, explicit draft survives remount, discard replaces them", async () => {
  const user = userEvent.setup();
  const view = render(<App />);
  await user.click(screen.getByRole("button", { name: "Use my own workload" }));
  await user.type(
    screen.getByLabelText("New request name"),
    "My partial request",
  );
  await user.clear(screen.getByLabelText("Monday focused hours"));
  await user.click(screen.getByRole("button", { name: "Reset example" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(screen.getByLabelText("New request name")).toHaveValue(
    "My partial request",
  );
  await user.click(screen.getByRole("button", { name: "Reset example" }));
  await user.click(
    screen.getByRole("button", { name: "Save draft and continue" }),
  );
  expect(screen.getByLabelText("New request name")).toHaveValue(
    "Urgent presentation",
  );
  view.unmount();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Resume local draft" }));
  expect(screen.getByLabelText("New request name")).toHaveValue(
    "My partial request",
  );
  expect(screen.getByLabelText("Monday focused hours")).toHaveValue(null);
  await user.type(screen.getByLabelText("New request name"), " changed");
  await user.click(screen.getByRole("button", { name: "Reset example" }));
  await user.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(screen.getByLabelText("New request name")).toHaveValue(
    "Urgent presentation",
  );
});
it("does not prompt for untouched inputs and warns about dirty reloads", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Use my own workload" }));
  await user.click(screen.getByRole("button", { name: "Reset example" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.type(screen.getByLabelText("New request name"), " extra");
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
});
it("keeps user edits if draft saving fails and cancels destructive restore", async () => {
  const user = userEvent.setup();
  render(<App />);
  await demo(user);
  await chooseFirst(user);
  await user.click(screen.getByRole("button", { name: "Save decision" }));
  await user.type(
    screen.getByLabelText("Your proposal"),
    " Please check first.",
  );
  await user.click(screen.getByRole("button", { name: /My decisions/ }));
  await user.click(screen.getByRole("button", { name: "Open decision" }));
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  await user.click(
    screen.getByRole("button", { name: "Save draft and continue" }),
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "could not save your draft",
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await user.click(screen.getByRole("button", { name: "Back to my proposal" }));
  expect(
    (screen.getByLabelText("Your proposal") as HTMLTextAreaElement).value,
  ).toContain("Please check first.");
});
it("confirms deletion, preserves cancel and enables a contextual kit follow-up", async () => {
  const user = userEvent.setup();
  render(<App />);
  await demo(user);
  await chooseFirst(user);
  await user.click(screen.getByRole("button", { name: "Save decision" }));
  await user.click(screen.getByRole("button", { name: /My decisions/ }));
  await user.click(screen.getByRole("button", { name: "Unlock free demo" }));
  await user.click(screen.getByText("Prepare a follow-up · Kit demo"));
  expect(
    (screen.getByLabelText("Follow-up message") as HTMLTextAreaElement).value,
  ).toContain("Weekly report");
  await user.click(screen.getByRole("button", { name: /Delete saved/ }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).decisions).toHaveLength(
    1,
  );
  await user.click(screen.getByRole("button", { name: /Delete saved/ }));
  await user.click(screen.getByRole("button", { name: "Delete decision" }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).decisions).toHaveLength(
    0,
  );
});
it("exports the exact stored JSON and keeps the blob URL alive after initiating download", async () => {
  const user = userEvent.setup();
  render(<App />);
  await demo(user);
  await chooseFirst(user);
  await user.click(screen.getByRole("button", { name: "Save decision" }));
  await user.click(screen.getByRole("button", { name: /My decisions/ }));
  await user.click(screen.getByRole("button", { name: "Unlock free demo" }));
  const create = vi.fn((_blob: Blob) => "blob:yesif-test"),
    revoke = vi.fn();
  vi.stubGlobal(
    "URL",
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }),
  );
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.isConnected).toBe(true);
      expect(this.download).toBe("yesif-decisions.json");
    });
  await user.click(screen.getByRole("button", { name: "Export notebook" }));
  expect(click).toHaveBeenCalledOnce();
  expect(revoke).not.toHaveBeenCalled();
  const blob = create.mock.calls[0][0] as Blob;
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
  expect(JSON.parse(text)).toEqual(
    JSON.parse(localStorage.getItem(STORAGE_KEY)!),
  );
  vi.unstubAllGlobals();
});
it("validates explicit reserve and reflects a smaller deliverable in the proposal", async () => {
  const user = userEvent.setup();
  render(<App />);
  await demo(user);
  await user.click(screen.getByRole("button", { name: "Edit workload" }));
  await user.click(
    screen.getByText("Time I want to keep available (optional reserve)"),
  );
  const reserve = screen.getByLabelText("Monday reserved hours");
  await user.clear(reserve);
  await user.type(reserve, "4");
  await user.click(screen.getByRole("button", { name: "Find my options" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Reserve");
  await user.clear(reserve);
  await user.type(reserve, "1");
  await user.click(screen.getByRole("button", { name: "Find my options" }));
  await user.click(
    screen.getByRole("button", { name: /Explore your own trade-off/ }),
  );
  fireEvent.change(screen.getByRole("slider"), { target: { value: "4" } });
  await user.type(
    screen.getByLabelText(/What would the smaller deliverable include/),
    "Outline only",
  );
  await user.click(screen.getByRole("button", { name: "Use this plan" }));
  expect(
    (screen.getByLabelText("Your proposal") as HTMLTextAreaElement).value,
  ).toContain("Outline only");
});

it("retains failed outcome-note edits and retries without losing the old saved record", async () => {
  const user = userEvent.setup();
  render(<App />);
  await demo(user);
  await chooseFirst(user);
  await user.click(screen.getByRole("button", { name: "Save decision" }));
  await user.click(screen.getByRole("button", { name: /My decisions/ }));
  const failed = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("quota");
    });
  await user.type(screen.getByLabelText("What was agreed?"), "Discuss Monday");
  expect(screen.getByLabelText("What was agreed?")).toHaveValue(
    "Discuss Monday",
  );
  expect(
    JSON.parse(localStorage.getItem(STORAGE_KEY)!).decisions[0].notes,
  ).toBe("");
  failed.mockRestore();
  await user.click(screen.getByRole("button", { name: "Retry saving note" }));
  expect(
    JSON.parse(localStorage.getItem(STORAGE_KEY)!).decisions[0].notes,
  ).toBe("Discuss Monday");
});
it("guards manual proposal text and disables stale proposals after simulation edits", async () => {
  const user = userEvent.setup();
  render(<App />);
  await demo(user);
  await chooseFirst(user);
  await user.type(screen.getByLabelText("Your proposal"), " Added detail.");
  await user.click(screen.getByRole("button", { name: "Compare options" }));
  await user.click(
    screen.getByRole("button", { name: /Explore your own trade-off/ }),
  );
  await user.click(
    screen.getByRole("button", { name: "Reduce scope by 15 minutes" }),
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("slider")).toHaveAttribute(
    "aria-valuetext",
    "5 hours",
  );
  await user.click(
    screen.getByRole("button", { name: "Reduce scope by 15 minutes" }),
  );
  await user.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(
    screen.getByRole("button", { name: /Make your proposal/ }),
  ).toBeDisabled();
  expect(screen.getByRole("slider")).toHaveAttribute(
    "aria-valuetext",
    "4.75 hours",
  );
});

it("does not prompt when an edit is fully reverted to the clean input state", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Use my own workload" }));
  await user.type(screen.getByLabelText("New request name"), "Temporary");
  await user.clear(screen.getByLabelText("New request name"));
  await user.click(screen.getByRole("button", { name: "Reset example" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
