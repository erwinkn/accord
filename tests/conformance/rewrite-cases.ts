import { zodAdapter } from "@accord/zod"
import {
  bodyDocument,
  consumer,
  document,
  endpoint,
  references,
  responseDocument,
  stringSchema,
  wireConsumer,
} from "./fixture.js"
import type { Fixture } from "./model.js"

export const rewriteCases: Fixture[] = [
  {
    id: "rewrite.body-collision-automatic",
    title: "A colliding body is automatically nested and both values reach the wire",
    area: "wire",
    reference: references.accord,
    document: endpoint(
      {
        parameters: [{ name: "id", in: "path", required: true, schema: stringSchema }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { id: stringSchema },
                required: ["id"],
                additionalProperties: false,
              },
            },
          },
        },
      },
      "post",
      "/probe/{id}",
    ),
    consumer: {
      source: wireConsumer(
        { id: "path", body: { id: "body" } },
        'assert.equal(request.url, "/base/probe/path", "ACCORD_COLLISION_PATH"); assert.deepEqual(JSON.parse(request.body.toString()), { id: "body" }, "ACCORD_COLLISION_BODY")',
      ),
    },
  },
  {
    id: "rewrite.dictionary-preservation",
    title: "Unlisted properties survive automatic body nesting",
    area: "wire",
    reference: references.schema,
    document: bodyDocument({
      type: "object",
      properties: { title: stringSchema },
      required: ["title"],
      additionalProperties: { type: "string" },
    }),
    consumer: {
      source: wireConsumer(
        { body: { title: "Kept", arbitrary: "Also kept" } },
        'assert.deepEqual(JSON.parse(request.body.toString()), { title: "Kept", arbitrary: "Also kept" }, "ACCORD_DYNAMIC_BODY")',
      ),
    },
  },
  {
    id: "rewrite.required-without-properties",
    title: "Required names inherit their value constraints from additionalProperties",
    area: "types",
    reference: references.schema,
    document: bodyDocument({
      type: "object",
      required: ["primary"],
      additionalProperties: { type: "string" },
    }),
    consumer: {
      source: consumer(`type Body = InputOf<typeof api.probe.call>["body"]
      type Required = Expect<Equal<Body["primary"], string>>
      function examples() {
        createClient(api).probe.call({ body: { primary: "a", other: "b" } })
        // @negative MISSING_PRIMARY
        createClient(api).probe.call({ body: { other: "b" } })
      }`),
      diagnostics: [{ marker: "MISSING_PRIMARY", codes: [2741, 2345] }],
    },
  },
  {
    id: "rewrite.status-envelope",
    title: "200 and 202 narrow payloads, and withResponse adds metadata without double wrapping",
    area: "responses",
    reference: references.accord,
    document: endpoint({
      responses: {
        "200": {
          description: "Ready",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { url: stringSchema },
                required: ["url"],
                additionalProperties: false,
              },
            },
          },
        },
        "202": {
          description: "Queued",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { jobId: stringSchema },
                required: ["jobId"],
                additionalProperties: false,
              },
            },
          },
        },
      },
    }),
    consumer: {
      source: consumer(`function narrow(value: ResponseOf<typeof api.probe.call>) {
      if (value.status === 200) { const url: string = value.data.url; return url }
      const id: string = value.data.jobId; return id
    }
    export async function run() {
      await withServer(async baseUrl => {
        const call = createClient(api, { baseUrl }).probe.call
        const normal = await call()
        assert.deepEqual(normal, { status: 202, data: { jobId: "j1" } }, "ACCORD_STATUS_ENVELOPE")
        const full = await call.withResponse()
        assert.equal(full.status, 202)
        assert.deepEqual(full.data, { jobId: "j1" }, "ACCORD_SINGLE_ENVELOPE")
        assert.equal(full.headers.get("x-request-id"), "r1")
      }, { status: 202, headers: { "content-type": "application/json", "x-request-id": "r1" }, body: '{"jobId":"j1"}' })
    }`),
    },
  },
  {
    id: "rewrite.default-and-keyword-names",
    title: "Default responses and properties named default/examples are indexed as schemas",
    area: "responses",
    reference: references.schema,
    document: endpoint({
      responses: {
        "200": {
          description: "Known",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { default: stringSchema, examples: { type: "integer" } },
                required: ["default", "examples"],
                additionalProperties: false,
              },
            },
          },
        },
        default: {
          description: "Fallback",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { message: stringSchema },
                required: ["message"],
              },
            },
          },
        },
      },
    }),
    config: { validators: zodAdapter() },
    consumer: {
      source: consumer(`export async function run() {
      await withServer(async baseUrl => {
        const result = await createClient(api, { baseUrl }).probe.call()
        if (result.status !== 200) throw new Error("Expected 200")
        assert.deepEqual(result.data, { default: "value", examples: 2 }, "ACCORD_KEYWORD_NAMES")
      }, { status: 200, headers: { "content-type": "application/json" }, body: '{"default":"value","examples":2}' })
    }`),
    },
  },
  {
    id: "rewrite.media-arguments",
    title: "Content-type and body types remain correlated across both arguments",
    area: "types",
    reference: references.accord,
    document: endpoint(
      {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { title: stringSchema },
                required: ["title"],
                additionalProperties: false,
              },
            },
            "text/csv": { schema: stringSchema },
          },
        },
      },
      "post",
    ),
    consumer: {
      source: consumer(`function examples() {
      const call = createClient(api).probe.call
      call({ body: { title: "JSON" } })
      call({ body: "csv,contents" }, { headers: { "content-type": "text/csv" } })
      // @negative CSV_WITHOUT_SELECTOR
      call({ body: "csv,contents" })
      // @negative MISMATCHED_MEDIA
      call({ body: { title: "JSON" } }, { headers: { "content-type": "text/csv" } })
      // @negative CASE_BYPASS
      call({ body: { title: "JSON" } }, { headers: { "Content-Type": "text/csv" } })
      const opaque: Record<string, string> = { "content-type": "text/csv" }
      // @negative OPAQUE_BYPASS
      call({ body: { title: "JSON" } }, { headers: opaque })
    }`),
      diagnostics: [
        { marker: "CSV_WITHOUT_SELECTOR", codes: [2345] },
        { marker: "MISMATCHED_MEDIA", codes: [2345] },
        { marker: "CASE_BYPASS", codes: [2345] },
        { marker: "OPAQUE_BYPASS", codes: [2345] },
      ],
    },
  },
  {
    id: "rewrite.media-wire",
    title: "The header selector chooses CSV bytes rather than JSON string quoting",
    area: "wire",
    reference: references.accord,
    document: endpoint(
      {
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { type: "object" } },
            "text/csv": { schema: stringSchema },
          },
        },
      },
      "post",
    ),
    consumer: {
      source:
        consumer(`export async function run() { await withServer(async (baseUrl, requests) => {
      await createClient(api, { baseUrl }).probe.call({ body: "a,b\\n1,2" }, { headers: { "content-type": "text/csv" } })
      assert.equal(requests[0]!.body.toString(), "a,b\\n1,2", "ACCORD_MEDIA_BYTES")
      assert.equal(requests[0]!.headers["content-type"], "text/csv")
    }) }`),
    },
  },
  {
    id: "rewrite.response-validation",
    title: "Generated validators reject bad responses and retain precise issue paths",
    area: "responses",
    reference: references.accord,
    document: responseDocument({
      type: "object",
      properties: { id: { type: "integer" }, name: { type: "string", minLength: 3 } },
      required: ["id", "name"],
      additionalProperties: false,
    }),
    config: { validators: zodAdapter() },
    consumer: {
      source: consumer(`import { ValidationError } from "@accord/client"
      export async function run() { await withServer(async baseUrl => {
        await assert.rejects(createClient(api, { baseUrl }).probe.call(), error => {
          assert(error instanceof ValidationError, "ACCORD_VALIDATION_ERROR")
          assert(error.issues.some(issue => issue.path?.[0] === "name"), "ACCORD_ISSUE_PATH")
          return true
        })
      }, { status: 200, headers: { "content-type": "application/json" }, body: '{"id":1,"name":"x"}' }) }`),
    },
  },
  {
    id: "rewrite.no-response-validator",
    title: "Without validators, response schemas do not cause coercion or rejection",
    area: "responses",
    reference: references.accord,
    document: responseDocument({
      type: "object",
      properties: { id: { type: "integer", default: 5 } },
      required: ["id"],
      additionalProperties: false,
    }),
    consumer: {
      source: consumer(`export async function run() { await withServer(async baseUrl => {
      const value = await createClient(api, { baseUrl }).probe.call()
      assert.deepEqual(value, { extra: true }, "ACCORD_VALIDATION_OPTIONAL")
    }, { status: 200, headers: { "content-type": "application/json" }, body: '{"extra":true}' }) }`),
    },
  },
  {
    id: "rewrite.read-write-projection",
    title: "Required readOnly and writeOnly properties have separate request and response views",
    area: "types",
    reference: references.schema,
    document: document(
      {
        "/probe": {
          post: {
            operationId: "call",
            requestBody: {
              required: true,
              content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
            },
            responses: {
              "200": {
                description: "User",
                content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
              },
            },
          },
        },
      },
      {
        schemas: {
          User: {
            type: "object",
            properties: {
              id: { type: "string", readOnly: true },
              password: { type: "string", writeOnly: true },
              name: stringSchema,
            },
            required: ["id", "password", "name"],
            additionalProperties: false,
          },
        },
      },
    ),
    config: { validators: zodAdapter() },
    consumer: {
      source: consumer(`function examples() {
      const call = createClient(api).probe.call
      call({ password: "secret", name: "Ada" })
      // @negative READONLY_INPUT
      call({ id: "forbidden", password: "secret", name: "Ada" })
    }
    type Output = ResponseOf<typeof api.probe.call>
    type Id = Expect<Equal<Output["id"], string>>
    type Password = Expect<Equal<Output["password"], undefined>>`),
      diagnostics: [{ marker: "READONLY_INPUT", codes: [2322, 2345] }],
    },
  },
  {
    id: "rewrite.external-schema-closure",
    title: "A referenced schema fragment loads its own external dependencies",
    area: "generation",
    reference: references.reference,
    document: responseDocument({ $ref: "./models.json#/Root" }),
    files: {
      "models.json": JSON.stringify({
        Root: {
          type: "object",
          properties: { value: { $ref: "./value.json" } },
          required: ["value"],
          additionalProperties: false,
        },
      }),
      "value.json": JSON.stringify({ type: "string", enum: ["ok"] }),
    },
    config: { validators: zodAdapter() },
    consumer: {
      source: consumer(
        'type Contract = Expect<Equal<ResponseOf<typeof api.probe.call>, { value: "ok" }>>',
      ),
    },
  },
  {
    id: "rewrite.embedded-schema-resource",
    title: "Embedded $id and anchors resolve against the innermost resource",
    area: "generation",
    reference: references.reference,
    document: responseDocument({
      $id: "https://example.test/envelope",
      type: "object",
      $defs: { Name: { $anchor: "Name", type: "string", enum: ["Ada"] } },
      properties: { name: { $ref: "#Name" } },
      required: ["name"],
      additionalProperties: false,
    }),
    config: { validators: zodAdapter() },
    consumer: {
      source: consumer(
        'type Contract = Expect<Equal<ResponseOf<typeof api.probe.call>, { name: "Ada" }>>',
      ),
    },
  },
]
