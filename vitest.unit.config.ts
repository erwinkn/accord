import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["packages/**/*.unit.test.{ts,tsx}"],
    testTimeout: 10_000,
  },
})
