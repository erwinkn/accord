import { createClient, HttpError, ValidationError } from "@accord/client"
import { type } from "arktype"
import { describe, expect, it } from "vitest"
import { arkTask, zodTask } from "../../examples/adapters/schemas.js"
import { api as assetApi } from "../../examples/assets/sdk.js"
import { api as importApi } from "../../examples/imports/sdk.js"
import {
  TasksGetResponseT200ApplicationJsonSchema,
  api as taskApi,
} from "../../examples/tasks/sdk.js"

const task = { id: "t1", title: "Review", status: "open", createdAt: "2026-09-16T12:00:00Z" }
describe("committed example SDKs", () => {
  it("wraps Standard Schema for Zod and ArkType with paths and unchanged output", async () => {
    expect(await zodTask.parseAsync(task)).toBe(task)
    expect(arkTask.assert(task)).toBe(task)
    const invalid = { ...task, title: 42 }
    const zodResult = await zodTask.safeParseAsync(invalid)
    expect(zodResult.success).toBe(false)
    if (!zodResult.success) expect(zodResult.error.issues[0]?.path).toEqual(["title"])
    const arkResult = arkTask(invalid)
    expect(arkResult).toBeInstanceOf(type.errors)
    if (arkResult instanceof type.errors)
      expect(Array.from(arkResult[0]?.path ?? [])).toEqual(["title"])
  })
  it("validates tasks while preserving readOnly fields, dates and value identity", async () => {
    const checked = await TasksGetResponseT200ApplicationJsonSchema["~standard"].validate(task)
    if (checked.issues) throw new Error("Expected valid task")
    expect(checked.value).toBe(task)
    const client = createClient(taskApi, {
      credentials: { bearer: "token" },
      fetch: async (_url, init) => {
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer token")
        expect(JSON.parse(String(init?.body))).toEqual({ title: "Review", status: "open" })
        return Response.json(task, { status: 201 })
      },
    })
    expect(await client.tasks.create({ title: "Review", status: "open" })).toEqual(task)
    const invalid = createClient(taskApi, {
      fetch: async () => Response.json({ ...task, createdAt: "yesterday" }),
    })
    await expect(invalid.tasks.get({ id: "t1" })).rejects.toBeInstanceOf(ValidationError)
  })
  it("selects CSV transport and discriminates accepted import jobs", async () => {
    const client = createClient(importApi, {
      fetch: async (_url, init) => {
        expect(new Headers(init?.headers).get("content-type")).toBe("text/csv")
        expect(init?.body).toBe("email\na@example.test")
        return Response.json(
          { state: "queued", jobId: "j1" },
          { status: 202, headers: { location: "/imports/j1" } },
        )
      },
    })
    const result = await client.imports.create(
      { body: "email\na@example.test" },
      { headers: { "content-type": "text/csv" } },
    )
    expect(result).toEqual({ status: 202, data: { state: "queued", jobId: "j1" } })
  })
  it("uses the declared default representation despite a global content-type header", async () => {
    const client = createClient(importApi, {
      headers: { "Content-Type": "text/csv" },
      fetch: async (_url, init) => {
        expect(new Headers(init?.headers).get("content-type")).toBe("application/json")
        expect(init?.body).toBe('{"rows":[{"email":"a@example.test"}]}')
        return Response.json({ state: "queued", jobId: "j1" }, { status: 202 })
      },
    })
    await client.imports.create({ body: { rows: [{ email: "a@example.test" }] } })
  })
  it("retains HTTP metadata without exposing a failed validation as a typed error body", async () => {
    const client = createClient(importApi, {
      fetch: async () =>
        Response.json({ message: 42 }, { status: 400, headers: { "x-request-id": "r1" } }),
    })
    try {
      await client.imports.create({ body: { rows: [{ email: "a@example.test" }] } })
      throw new Error("Expected HttpError")
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError)
      if (!(error instanceof HttpError)) throw error
      expect(error.status).toBe(400)
      expect(error.headers.get("x-request-id")).toBe("r1")
      expect(error.body).toBeUndefined()
      expect(error.cause).toBeInstanceOf(ValidationError)
    }
  })
  it("returns validated binary downloads as ArrayBuffer", async () => {
    const client = createClient(importApi, {
      fetch: async () =>
        new Response(new Uint8Array([0, 128, 255]), {
          headers: { "content-type": "application/octet-stream" },
        }),
    })
    expect(new Uint8Array(await client.imports.report.download({ jobId: "j1" }))).toEqual(
      new Uint8Array([0, 128, 255]),
    )
  })
  it("encodes multipart bytes, repeated fields, JSON parts and security headers", async () => {
    const client = createClient(assetApi, {
      credentials: { apiKey: "secret" },
      serverVariables: { region: "us" },
      fetch: async (url, init) => {
        expect(String(url)).toBe("https://assets.example.test/us/v1/assets")
        expect(new Headers(init?.headers).get("x-api-key")).toBe("secret")
        const parsed = await new Response(init?.body, { headers: init?.headers }).formData()
        const file = parsed.get("file")
        expect(file).toBeInstanceOf(File)
        if (!(file instanceof File)) throw new Error("Missing file")
        expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([0, 255]))
        expect(parsed.getAll("tags")).toEqual(["a", "b"])
        expect(parsed.get("metadata")).toBe('{"name":"sample"}')
        return Response.json({ id: "a1", name: "sample", size: 2 }, { status: 201 })
      },
    })
    expect(
      await client.assets.upload({
        file: new Blob([new Uint8Array([0, 255])]),
        metadata: { name: "sample" },
        tags: ["a", "b"],
      }),
    ).toEqual({ id: "a1", name: "sample", size: 2 })
  })
})
