import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["packages/**/*.property.test.ts"],
    testTimeout: 20_000,
  },
})
