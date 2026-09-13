// Compatibility entry point. The public-package, shrinking harness replaces the syntax-only smoke loop.
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", fileURLToPath(new URL("../tests/conformance/fuzz.ts", import.meta.url))],
  { stdio: "inherit", env: process.env },
)
if (result.error) throw result.error
process.exitCode = result.status ?? 1
