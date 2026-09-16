import { expect, it } from "vitest"
import { generate } from "../src/generate.js"
import type { JsonObject } from "../src/types.js"

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const record = (properties: JsonObject) => ({
  type: "object",
  properties,
  additionalProperties: false,
})
const response = (schema: JsonObject) => ({
  description: "response",
  content: { "application/json": { schema } },
})

it("places DTOs by use, keeps projections together, and imports domain types across slices", async () => {
  const { files } = await generate({
    openapi: "3.1.0",
    info: { title: "Slices", version: "1" },
    paths: {
      "/subscriptions": {
        post: {
          operationId: "createSubscription",
          requestBody: {
            required: true,
            content: { "application/json": { schema: ref("Subscription") } },
          },
          responses: { 200: response(ref("Subscription")), 400: response(ref("Error")) },
        },
      },
      "/jobs": {
        get: {
          operationId: "getJob",
          responses: { 200: response(ref("Job")), 400: response(ref("Error")) },
        },
      },
    },
    components: {
      schemas: {
        Subscription: record({
          id: { type: "string", readOnly: true },
          secret: { type: "string", writeOnly: true },
          job: ref("Job"),
          detail: ref("Detail"),
        }),
        Job: record({ result: ref("Subscription"), detail: ref("Detail") }),
        Detail: record({ value: { type: "string" } }),
        Error: record({ message: { type: "string" } }),
        UnusedPublic: record({ value: { type: "number" } }),
      },
    },
  })
  const subscriptions = files["types/subscriptions.ts"]!
  const jobs = files["types/jobs.ts"]!
  const shared = files["types/shared.ts"]!
  expect(subscriptions).toContain("export type Subscription =")
  expect(subscriptions).toContain("export type SubscriptionRequest =")
  expect(subscriptions).toContain('import type { Job, JobRequest } from "./jobs.js"')
  expect(jobs).toContain("export type Job =")
  expect(jobs).toContain("export type JobRequest =")
  expect(jobs).toContain(
    'import type { Subscription, SubscriptionRequest } from "./subscriptions.js"',
  )
  expect(jobs).toContain('import type { Detail, Error } from "./shared.js"')
  for (const name of ["Detail", "Error", "UnusedPublic"])
    expect(shared).toContain(`export type ${name} =`)
  expect(shared).not.toContain("export type Subscription")
  expect(shared).not.toContain("export type Job")
  expect(shared).not.toContain("ObjectConstraints")
  expect(Object.keys(files)).not.toContain("types/models.ts")
  expect(files["index.ts"]).toContain('export type * from "./types/shared.js"')
})

it("emits local helpers only where needed and avoids a shared module for one domain", async () => {
  const { files } = await generate({
    openapi: "3.1.0",
    info: { title: "Local helpers", version: "1" },
    paths: {
      "/users": {
        get: {
          operationId: "getUser",
          responses: {
            200: response({
              ...ref("User"),
              properties: { extra: { type: "string" } },
            }),
          },
        },
      },
    },
    components: { schemas: { User: record({ name: { type: "string" } }) } },
  })
  expect(files["types/users.ts"]).toContain("type ObjectConstraints<T, R>")
  expect(files["types/users.ts"]).not.toContain("export type ObjectConstraints")
  expect(files["types/users.ts"]).not.toContain("ArrayConstraints")
  expect(files["types/users.ts"]).toContain("export type User =")
  expect(Object.keys(files)).not.toContain("types/shared.ts")
})
