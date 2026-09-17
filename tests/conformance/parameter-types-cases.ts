import type { JsonObject } from "@accord/codegen"
import { consumer, endpoint, references } from "./fixture.js"
import type { Fixture } from "./model.js"

const schemas = {
  text: { type: "string" },
  integer: { type: "integer" },
  decimal: { type: "number" },
  enabled: { type: "boolean" },
  ids: { type: "array", items: { type: "integer" } },
  flags: { type: "array", items: { type: "boolean" } },
  filter: {
    type: "object",
    additionalProperties: false,
    properties: { count: { type: "integer" }, active: { type: "boolean" } },
    required: ["count", "active"],
  },
  date: { type: "string", format: "date" },
  uuid: { type: "string", format: "uuid" },
  state: { type: "string", enum: ["open", "closed"] },
  choice: { oneOf: [{ type: "integer" }, { type: "string" }] },
} satisfies Readonly<Record<string, JsonObject>>

const input = {
  text: "a/b",
  integer: 0,
  decimal: -1.25,
  enabled: false,
  ids: [0, -2, 3],
  flags: [true, false],
  filter: { count: 0, active: false },
  date: "2026-09-17",
  uuid: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  state: "open",
  choice: 7,
}

const expectedType = `{
  text: string; integer: number; decimal: number; enabled: boolean;
  ids: number[]; flags: boolean[]; filter: { count: number; active: boolean };
  date: string; uuid: string; state: "open" | "closed"; choice: number | string;
}`

export const parameterTypeCases: Fixture[] = ["3.0.4", "3.1.1"].flatMap((version) =>
  (["path", "query"] as const).map((location): Fixture => {
    const path =
      location === "path"
        ? `/probe/${Object.keys(schemas)
            .map((name) => `{${name}}`)
            .join("/")}`
        : "/probe"
    const parameters = Object.entries(schemas).map(([name, schema]) => ({
      name,
      in: location,
      required: true,
      schema,
    }))
    const nullable = version.startsWith("3.0")
      ? { type: "string", nullable: true }
      : { type: ["string", "null"] }
    const extras =
      location === "query"
        ? [
            { name: "nullable", in: "query", schema: nullable },
            { name: "optional", in: "query", schema: { type: "boolean" } },
          ]
        : []
    const value = location === "query" ? { ...input, nullable: null } : input
    const extraType =
      location === "query" ? "{ nullable?: string | null; optional?: boolean }" : "unknown"
    const assertion =
      location === "path"
        ? `assert.equal(url.pathname, "/base/probe/a%2Fb/0/-1.25/false/0,-2,3/true,false/count,0,active,false/2026-09-17/3fa85f64-5717-4562-b3fc-2c963f66afa6/open/7")`
        : `assert.deepEqual([...url.searchParams], [
          ["text", "a/b"], ["integer", "0"], ["decimal", "-1.25"], ["enabled", "false"],
          ["ids", "0"], ["ids", "-2"], ["ids", "3"], ["flags", "true"], ["flags", "false"],
          ["count", "0"], ["active", "false"], ["date", "2026-09-17"],
          ["uuid", "3fa85f64-5717-4562-b3fc-2c963f66afa6"], ["state", "open"], ["choice", "7"],
          ["nullable", ""],
        ])`
    return {
      id: `wire.parameter-types-${version}-${location}`,
      title: `OpenAPI ${version} ${location} parameters preserve scalar, collection and union input types`,
      area: "wire",
      reference: references.parameter,
      document: {
        ...endpoint({ parameters: [...parameters, ...extras] }, "get", path),
        openapi: version,
      },
      consumer: {
        source: consumer(`type Expected = ${expectedType} & ${extraType}
          type Input = InputOf<typeof api.probe.call>
          // Check both directions without relying on how intersections are printed.
          type Accepted = Expect<Expected extends Input ? true : false>
          type Preserved = Expect<Input extends Expected ? true : false>
          type Scalars = Expect<Equal<Pick<Input, "integer" | "decimal" | "enabled">, {
            integer: number; decimal: number; enabled: boolean;
          }>>
          export async function run() {
            const input: Expected = ${JSON.stringify(value)}
            await withServer(async (baseUrl, requests) => {
              await createClient(api, { baseUrl }).probe.call(input)
              assert.equal(requests.length, 1)
              const url = new URL(requests[0]!.url, baseUrl)
              ${assertion}
            })
          }`),
      },
    }
  }),
)
