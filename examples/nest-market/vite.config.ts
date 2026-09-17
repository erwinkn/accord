import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

export default defineConfig({
  root: fileURLToPath(new URL("./web", import.meta.url)),
  build: { outDir: "../dist/web", emptyOutDir: true },
  server: {
    host: "127.0.0.1",
    port: Number(process.env["WEB_PORT"] ?? 5173),
    strictPort: true,
    proxy: {
      "/api": `http://127.0.0.1:${process.env["PORT"] ?? 3100}`,
      "/docs": `http://127.0.0.1:${process.env["PORT"] ?? 3100}`,
    },
  },
})
