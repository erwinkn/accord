import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["packages/**/*.golden.test.ts"],
    testTimeout: 15_000,
  },
})
