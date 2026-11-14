import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
Object.defineProperty(window, "scrollTo", { value: vi.fn(), writable: true });
// jsdom has no native top-layer implementation; real modal focus is checked in browser QA.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
