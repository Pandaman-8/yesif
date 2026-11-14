import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "/yesif/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    // Bound worker contention so real interaction tests retain their time budget.
    maxWorkers: 2,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
