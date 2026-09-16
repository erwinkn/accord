import { execFile } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { promisify } from "node:util"

const destination = resolve("artifacts/alpha")
await mkdir(destination, { recursive: true })
for (const name of ["client", "codegen", "react-query"]) {
  const result = await promisify(execFile)("pnpm", ["pack", "--pack-destination", destination], {
    cwd: resolve("packages", name),
  })
  process.stdout.write(result.stdout)
}
const checksums: string[] = []
for (const name of (await readdir(destination)).filter((name) => name.endsWith(".tgz")).sort()) {
  checksums.push(
    `${createHash("sha256")
      .update(await readFile(resolve(destination, name)))
      .digest("hex")}  ${name}`,
  )
}
await writeFile(resolve(destination, "SHA256SUMS"), `${checksums.join("\n")}\n`)
console.log(`Alpha packages: ${destination}`)
