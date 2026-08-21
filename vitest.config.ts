import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: [
      "packages/**/*.{unit,golden,property,integration}.test.{ts,tsx}",
      "tests/**/*.integration.test.ts",
    ],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
})
