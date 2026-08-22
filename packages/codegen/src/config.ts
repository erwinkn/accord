import type { AccordCodegenConfig } from "./types.js"

export function defineConfig<const TConfig extends AccordCodegenConfig>(config: TConfig): TConfig {
  return config
}
