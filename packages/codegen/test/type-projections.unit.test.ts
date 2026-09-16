import { zodAdapter } from "@accord/zod"
import { expect, it } from "vitest"
import { generate } from "../src/generate.js"
import type { JsonObject } from "../src/types.js"

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const record = (properties: JsonObject) => ({
  type: "object",
  properties,
  additionalProperties: false,
})
const spec = (schemas: JsonObject, root: string, mediaType?: string): JsonObject => {
  const operation: JsonObject = {
    operationId: "call",
    responses: {
      200: { description: "ok", content: { "application/json": { schema: ref(root) } } },
    },
  }
  if (mediaType)
    operation["requestBody"] = { required: true, content: { [mediaType]: { schema: ref(root) } } }
  return {
    openapi: "3.1.0",
    info: { title: "Projections", version: "1" },
    paths: { "/probe": { [mediaType ? "post" : "get"]: operation } },
    components: { schemas },
  }
}

it("shares identical models through nested arrays, dictionaries and recursive references", async () => {
  const { files } = await generate(
    spec(
      {
        Node: record({ NodeRequest: { const: "NodeRequest" }, child: ref("Node") }),
        Page: record({
          items: { type: "array", items: ref("Node") },
          lookup: { type: "object", additionalProperties: ref("Node") },
        }),
      },
      "Page",
      "application/json",
    ),
    { validators: zodAdapter() },
  )
  const models = files["types/probe.ts"]!
  expect(models).toContain('readonly "NodeRequest"?: "NodeRequest"')
  expect(models).toContain('readonly "child"?: Node')
  expect(models).toContain("ReadonlyArray<Node>")
  expect(models).not.toContain("export type NodeRequest")
  expect(models).not.toContain("export type PageRequest")
  expect(files["types/probe.ts"]).toContain("export type CallInput = Page;")
  expect(files["schemas.ts"]).toContain("z.lazy")
})

it("keeps differences throughout mutually recursive models and shares their unchanged children", async () => {
  const { files } = await generate(
    spec(
      {
        A: record({ next: ref("B"), common: ref("Common") }),
        B: record({ next: ref("C") }),
        C: record({
          next: ref("A"),
          id: { type: "string", readOnly: true },
          password: { type: "string", writeOnly: true },
        }),
        Common: record({ value: { type: "string" } }),
      },
      "A",
      "application/json",
    ),
  )
  const models = files["types/probe.ts"]!
  for (const name of ["A", "B", "C"]) expect(models).toContain(`export type ${name}Request =`)
  expect(models).toContain('readonly "common"?: Common;')
  expect(models).not.toContain("CommonRequest")
  expect(files["types/probe.ts"]).toContain("export type CallInput = ARequest;")
  expect(files["types/probe.ts"]).toContain("export type CallResponse = A;")
})

it("omits unused request variants even when a response model has read-only properties", async () => {
  const { files } = await generate(
    spec(
      {
        Subscription: record({
          id: { type: "string", readOnly: true },
          amount: { type: "string" },
        }),
        Page: record({ items: { type: "array", items: ref("Subscription") } }),
      },
      "Page",
    ),
  )
  const models = files["types/probe.ts"]!
  expect(models).toContain("export type Subscription =")
  expect(models).toContain("export type Page =")
  expect(models).not.toContain("SubscriptionRequest")
  expect(models).not.toContain("PageRequest")
  expect(files["index.ts"]).not.toContain("SubscriptionRequest")
})

it("retains the upload representation when the shared JSON model uses a string", async () => {
  const { files } = await generate(
    spec(
      {
        Upload: record({ file: { type: "string", format: "binary" } }),
      },
      "Upload",
      "multipart/form-data",
    ),
  )
  const models = files["types/probe.ts"]!
  expect(models).toContain('readonly "file"?: string;')
  expect(models).toContain('readonly "file"?: BinaryUpload;')
  expect(files["types/probe.ts"]).toContain("export type CallInput = UploadForm;")
  expect(files["types/probe.ts"]).toContain("export type CallResponse = Upload;")
})
