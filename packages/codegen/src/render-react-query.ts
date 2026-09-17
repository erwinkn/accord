import { sanitizeIdentifier, sanitizeTypeIdentifier } from "./naming.js"

/** Keep branding in generated exports; execution and type inference stay in the shared runtime. */
export function renderReactQuery(prefix: string) {
  const brand = sanitizeTypeIdentifier(prefix)
  const name = sanitizeIdentifier(prefix)
  const hooks = {
    Provider: `${brand}Provider`,
    useQuery: `use${brand}`,
    useMutation: `use${brand}Mutation`,
  }
  const helpers = {
    apiQuery: `${name}Query`,
    apiQueryResponse: `${name}QueryResponse`,
    apiQueryKey: `${name}QueryKey`,
    apiMutation: `${name}Mutation`,
    apiMutationCall: `${name}MutationCall`,
    apiMutationKey: `${name}MutationKey`,
  }
  return {
    names: ["createQueryHooks", ...Object.values(hooks), ...Object.values(helpers)],
    source: [
      'import { createQueryHooks } from "@accord/react-query"',
      `export const {\n${Object.entries(hooks)
        .map(([key, value]) => `  ${key}: ${value}`)
        .join(",\n")}\n} = createQueryHooks()`,
      `export {\n${Object.entries(helpers)
        .map(([key, value]) => `  ${key} as ${value}`)
        .join(",\n")}\n} from "@accord/react-query"`,
    ].join("\n\n"),
  }
}
