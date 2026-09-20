import { fileURLToPath } from "node:url"
import { zodAdapter } from "@accord/zod"
import { expect, it } from "vitest"
import { generate, generateFromFile } from "../src/generate.js"
import type { JsonObject } from "../src/types.js"

const fixture = fileURLToPath(
  new URL("../../../tests/fixtures/events.openapi.yaml", import.meta.url),
)

it("loads external event references and indexes nested schema resources and anchors", async () => {
  const directory = await mkdtemp(join(tmpdir(), "accord-sse-"))
  try {
    await writeFile(
      join(directory, "payload.json"),
      JSON.stringify({ type: "string", enum: ["external"] }),
    )
    await writeFile(
      join(directory, "api.json"),
      JSON.stringify({
        openapi: "3.1.0",
        info: { title: "Events", version: "1" },
        paths: {
          "/events": {
            get: {
              operationId: "watch",
              "x-accord-sse": {
                events: {
                  // Event names are arbitrary map keys, including names that are OpenAPI keywords.
                  schema: { mediaType: "application/json", schema: { $ref: "./payload.json" } },
                  scoped: {
                    mediaType: "application/json",
                    schema: {
                      $id: "./scoped.json",
                      type: "object",
                      additionalProperties: false,
                      required: ["count"],
                      $defs: { Count: { $anchor: "count", type: "integer" } },
                      properties: { count: { $ref: "#count" } },
                    },
                  },
                },
              },
              responses: {
                "200": {
                  description: "Events",
                  content: { "text/event-stream": { schema: { type: "string" } } },
                },
              },
            },
          },
        },
      }),
    )
    const result = await generateFromFile(join(directory, "api.json"), { validators: zodAdapter() })
    expect(result.source).toContain('"count": number')
    expect(result.source).toContain('"external"')
    expect(result.source).toContain("WatchScopedSchema")
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

it("generates named event unions, raw streams and POST streams from the same response model", async () => {
  const result = await generateFromFile(fixture)
  expect(result.source).toContain(
    'AsyncIterable<SseEvent<Change, "changed"> | SseEvent<string, "notice">>',
  )
  expect(result.source).toContain("WatchRawResponse = AsyncIterable<SseEvent>")
  expect(result.source).toContain('RunJobResponse = AsyncIterable<SseEvent<number, "message">>')
  expect(result.source).toContain('"secret"?: never')
  expect(result.source).not.toContain("Schema")
  expect(
    result.model.operations.find((operation) => operation.key === "watchEvents")?.plan.responses[
      "200"
    ],
  ).toEqual({
    mediaType: "text/event-stream",
    events: { changed: { mediaType: "application/json" }, notice: { mediaType: "text/plain" } },
  })
  expect(result.files["types/events.ts"]).toContain("SseEvent")
})

it("recognizes case-insensitive event-stream media types with parameters", async () => {
  const result = await generate({
    openapi: "3.1.0",
    info: { title: "Events", version: "1" },
    paths: {
      "/events": {
        get: {
          operationId: "watch",
          responses: {
            "200": {
              description: "Events",
              content: { "Text/Event-Stream; charset=utf-8": { schema: { type: "string" } } },
            },
          },
        },
      },
    },
  })
  expect(result.source).toContain("type SseEvent")
  expect(result.source).toContain("AsyncIterable<SseEvent>")
  expect(result.model.operations[0]?.plan.responses["200"]).toEqual({
    mediaType: "Text/Event-Stream; charset=utf-8",
  })
})

it("attaches readable adapter-generated schemas to each event payload, never the stream", async () => {
  const result = await generateFromFile(fixture, { validators: zodAdapter() })
  const endpoint = result.files["endpoints/events.ts"]!
  expect(endpoint).toMatch(
    /"changed":\s*\{\s*"mediaType": "application\/json",\s*"schema": WatchEventsChangedSchema/,
  )
  expect(endpoint).toMatch(
    /"notice":\s*\{\s*"mediaType": "text\/plain",\s*"schema": WatchEventsNoticeSchema/,
  )
  expect(result.files["schemas.ts"]).toContain("WatchEventsChangedSchema")
  expect(result.files["schemas.ts"]).not.toContain('"secret": z.string()')
  expect(result.files["schemas.ts"]).not.toContain("WatchRaw200Schema")
})

it.each<JsonObject>([
  {},
  { events: {} },
  { events: { bad: { mediaType: "application/xml" } } },
  { events: { "bad\nname": { mediaType: "text/plain" } } },
  { events: { bad: { mediaType: "text/plain", schema: { type: "number" } } } },
])(
  "rejects invalid event contracts instead of silently generating unsound types: %j",
  async (extension) => {
    await expect(
      generate({
        openapi: "3.1.0",
        info: { title: "Events", version: "1" },
        paths: {
          "/events": {
            get: {
              operationId: "watch",
              "x-accord-sse": extension,
              responses: {
                "200": {
                  description: "Events",
                  content: { "text/event-stream": { schema: { type: "string" } } },
                },
              },
            },
          },
        },
      }),
    ).rejects.toThrow()
  },
)

import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
