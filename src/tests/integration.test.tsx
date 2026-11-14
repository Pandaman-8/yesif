import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { STORAGE_KEY } from "../storage/scenarios";
describe("complete product flows", () => {
  it("recomputes scope in precise quarter-hour steps and blocks expanded scope", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Try a real example" }),
    );
    expect(
      screen.getByRole("button", { name: "Increase scope by 15 minutes" }),
    ).toBeDisabled();
    for (let n = 0; n < 12; n++)
      await user.click(
        screen.getByRole("button", { name: "Reduce scope by 15 minutes" }),
      );
    expect(
      screen.getByRole("slider", { name: "New request’s scope" }),
    ).toHaveAttribute("aria-valuetext", "2 hours");
    expect(screen.getByRole("button", { name: "Use this plan" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Use this plan" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Your proposal",
        }) as HTMLTextAreaElement
      ).value,
    ).toContain("smaller, 2-hour version");
  });
  it("simulates an example, edits and copies the proposal, practices, saves and reopens", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Try a real example" }),
    );
    expect(
      screen.getByRole("heading", { name: "Something has to give. Not you." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use this plan" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Defer Launch QA")).toBeDisabled();
    await user.click(screen.getByLabelText("Defer Weekly report"));
    expect(screen.getByRole("button", { name: "Use this plan" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Use this plan" }));
    const text = screen.getByRole("textbox", { name: "Your proposal" });
    expect((text as HTMLTextAreaElement).value).toContain("Weekly report");
    await user.clear(text);
    await user.type(text, "Can we agree on the report date?");
    await user.click(screen.getByRole("button", { name: "Copy proposal" }));
    expect(await navigator.clipboard.readText()).toBe(
      "Can we agree on the report date?",
    );
    await user.click(
      screen.getByRole("button", { name: /C.*focused hours available/ }),
    );
    expect(
      screen.getByText("You made the decision explicit."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save decision" }));
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).decisions[0].message,
    ).toBe("Can we agree on the report date?");
    await user.click(screen.getByRole("button", { name: /My decisions/ }));
    await user.selectOptions(
      screen.getByLabelText("Conversation outcome"),
      "agreed",
    );
    await user.click(screen.getByRole("button", { name: "Open decision" }));
    expect(screen.getByRole("textbox", { name: "Your proposal" })).toHaveValue(
      "Can we agree on the report date?",
    );
  });
  it("validates custom inputs, computes new data and removes stale results after edits", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Use my own workload" }),
    );
    await user.click(screen.getByRole("button", { name: "Find my options" }));
    expect(screen.getByRole("alert")).toHaveTextContent("New request");
    await user.type(screen.getByLabelText("New request name"), "Client brief");
    const mon = screen.getByLabelText("Monday focused hours");
    await user.clear(mon);
    await user.type(mon, "2");
    await user.click(screen.getByRole("button", { name: "Find my options" }));
    expect(
      screen.getByRole("heading", { name: "There’s room for this yes." }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use this plan" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Your proposal",
        }) as HTMLTextAreaElement
      ).value,
    ).toContain("Client brief (1 hour)");
    await user.click(screen.getByRole("button", { name: "Compare options" }));
    await user.click(screen.getByRole("button", { name: "Edit workload" }));
    const hrs = screen.getByLabelText("New request hours");
    await user.clear(hrs);
    await user.type(hrs, "4");
    await user.click(screen.getByRole("button", { name: "Find my options" }));
    expect(
      screen.getByRole("button", { name: "Use this plan" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("textbox", { name: "Your proposal" }),
    ).not.toBeInTheDocument();
  });
  it("unlocks a working no-payment notebook demo without limiting calculations", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "My decisions" }));
    await user.click(screen.getByRole("button", { name: "Unlock free demo" }));
    expect(
      screen.getByRole("button", { name: "Demo unlocked" }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("No payment");
    await user.click(screen.getByRole("button", { name: "Try the example" }));
    await user.click(screen.getByRole("button", { name: "Find my options" }));
    await user.click(screen.getByLabelText("Defer Weekly report"));
    await user.click(screen.getByRole("button", { name: "Use this plan" }));
    await user.click(screen.getByRole("button", { name: "Save decision" }));
    await user.click(screen.getByRole("button", { name: "Compare options" }));
    const opts = screen.getAllByRole("article");
    await user.click(
      within(opts[1]).getByRole("button", { name: "Use this trade-off" }),
    );
    await user.click(screen.getByRole("button", { name: "Save decision" }));
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).decisions,
    ).toHaveLength(2);
  });
  it("gives a manual-copy fallback when clipboard access is denied", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Try a real example" }),
    );
    await user.click(screen.getByLabelText("Defer Weekly report"));
    await user.click(screen.getByRole("button", { name: "Use this plan" }));
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    await user.click(screen.getByRole("button", { name: "Copy proposal" }));
    expect(screen.getByRole("status")).toHaveTextContent("copy it manually");
  });
  it("keeps the current proposal available through the free-slot limit and demo unlock", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Try a real example" }),
    );
    await user.click(screen.getByLabelText("Defer Weekly report"));
    await user.click(screen.getByRole("button", { name: "Use this plan" }));
    await user.click(screen.getByRole("button", { name: "Save decision" }));
    await user.click(screen.getByRole("button", { name: "Compare options" }));
    const options = screen.getAllByRole("article");
    await user.click(
      within(options[1]).getByRole("button", { name: "Use this trade-off" }),
    );
    await user.click(screen.getByRole("button", { name: "Save decision" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your free saved decision is safe",
    );
    await user.click(screen.getByRole("button", { name: "Unlock free demo" }));
    await user.click(
      screen.getByRole("button", { name: "Back to my proposal" }),
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "Your proposal",
        }) as HTMLTextAreaElement
      ).value,
    ).toContain("smaller, 2-hour version");
    await user.click(screen.getByRole("button", { name: "Save decision" }));
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).decisions,
    ).toHaveLength(2);
  });
});
