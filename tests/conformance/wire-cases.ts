import type { JsonValue } from "@accord/codegen"
import {
  arraySchema,
  bodyDocument,
  consumer,
  endpoint,
  integerSchema,
  objectSchema,
  references,
  responseDocument,
  stringSchema,
  wireConsumer,
} from "./fixture.js"
import type { Fixture } from "./model.js"

interface ParameterVector {
  readonly id: string
  readonly location: "path" | "query" | "header" | "cookie"
  readonly style: string
  readonly explode: boolean
  readonly value: JsonValue
  readonly schema: JsonValue
  readonly expected: string
}

// Literal oracle from OAS style examples, not values calculated by Accord's serializers.
const pathVectors: readonly [string, boolean, JsonValue, JsonValue, string][] = [
  ["simple", false, "blue", stringSchema, "blue"],
  ["simple", false, ["blue", "black", "brown"], arraySchema, "blue,black,brown"],
  ["simple", true, ["blue", "black", "brown"], arraySchema, "blue,black,brown"],
  [
    "simple",
    false,
    { role: "admin", firstName: "Alex" },
    objectSchema,
    "role,admin,firstName,Alex",
  ],
  ["simple", true, { role: "admin", firstName: "Alex" }, objectSchema, "role=admin,firstName=Alex"],
  ["label", false, "blue", stringSchema, ".blue"],
  ["label", false, ["blue", "black", "brown"], arraySchema, ".blue,black,brown"],
  ["label", true, ["blue", "black", "brown"], arraySchema, ".blue.black.brown"],
  [
    "label",
    false,
    { role: "admin", firstName: "Alex" },
    objectSchema,
    ".role,admin,firstName,Alex",
  ],
  ["label", true, { role: "admin", firstName: "Alex" }, objectSchema, ".role=admin.firstName=Alex"],
  ["matrix", false, "blue", stringSchema, ";color=blue"],
  ["matrix", false, ["blue", "black", "brown"], arraySchema, ";color=blue,black,brown"],
  ["matrix", true, ["blue", "black", "brown"], arraySchema, ";color=blue;color=black;color=brown"],
  [
    "matrix",
    false,
    { role: "admin", firstName: "Alex" },
    objectSchema,
    ";color=role,admin,firstName,Alex",
  ],
  [
    "matrix",
    true,
    { role: "admin", firstName: "Alex" },
    objectSchema,
    ";role=admin;firstName=Alex",
  ],
  ["simple", false, "a/b ?#%é", stringSchema, "a%2Fb%20%3F%23%25%C3%A9"],
]

export const wireCases: Fixture[] = pathVectors.map(
  ([style, explode, value, schema, expected], i) =>
    parameterCase({ id: `path-${i}`, location: "path", style, explode, value, schema, expected }),
)

function parameterCase(vector: ParameterVector): Fixture {
  const parameter = {
    name: "color",
    in: vector.location,
    required: true,
    style: vector.style,
    explode: vector.explode,
    schema: vector.schema,
  }
  const path = vector.location === "path" ? "/probe/{color}" : "/probe"
  let assertion: string
  if (vector.location === "path") {
    assertion = `assert.equal(request.url, ${JSON.stringify(`/base/probe/${vector.expected}`)}, "ACCORD_PATH_ENCODING")`
  } else if (vector.location === "query") {
    // Query key order is not a contract. Each vector has just one logical parameter.
    assertion = `assert.equal(decodeURIComponent(request.url.split("?")[1]!), ${JSON.stringify(vector.expected)}, "ACCORD_QUERY_ENCODING")`
  } else {
    const name = vector.location === "header" ? "color" : "cookie"
    assertion = `assert.equal(request.headers[${JSON.stringify(name)}], ${JSON.stringify(vector.expected)}, "ACCORD_HEADER_ENCODING")`
  }
  return {
    id: `wire.${vector.id}`,
    title: `${vector.location} ${vector.style} explode=${vector.explode}: ${JSON.stringify(vector.value)}`,
    area: "wire",
    reference: references.parameter,
    document: endpoint({ parameters: [parameter] }, "get", path),
    consumer: { source: wireConsumer({ color: vector.value }, assertion) },
  }
}

const moreVectors: readonly ParameterVector[] = [
  {
    id: "query-string",
    location: "query",
    style: "form",
    explode: true,
    value: "blue",
    schema: stringSchema,
    expected: "color=blue",
  },
  {
    id: "query-array",
    location: "query",
    style: "form",
    explode: false,
    value: ["blue", "black"],
    schema: arraySchema,
    expected: "color=blue,black",
  },
  {
    id: "query-exploded",
    location: "query",
    style: "form",
    explode: true,
    value: ["blue", "black"],
    schema: arraySchema,
    expected: "color=blue&color=black",
  },
  {
    id: "query-object",
    location: "query",
    style: "form",
    explode: false,
    value: { role: "admin", firstName: "Alex" },
    schema: objectSchema,
    expected: "color=role,admin,firstName,Alex",
  },
  {
    id: "query-object-exploded",
    location: "query",
    style: "form",
    explode: true,
    value: { role: "admin", firstName: "Alex" },
    schema: objectSchema,
    expected: "role=admin&firstName=Alex",
  },
  {
    id: "query-space",
    location: "query",
    style: "spaceDelimited",
    explode: false,
    value: ["blue", "black"],
    schema: arraySchema,
    expected: "color=blue black",
  },
  {
    id: "query-pipe",
    location: "query",
    style: "pipeDelimited",
    explode: false,
    value: ["blue", "black"],
    schema: arraySchema,
    expected: "color=blue|black",
  },
  {
    id: "query-deep",
    location: "query",
    style: "deepObject",
    explode: true,
    value: { role: "admin", firstName: "Alex" },
    schema: objectSchema,
    expected: "color[role]=admin&color[firstName]=Alex",
  },
  {
    id: "header-array",
    location: "header",
    style: "simple",
    explode: false,
    value: ["blue", "black"],
    schema: arraySchema,
    expected: "blue,black",
  },
  {
    id: "header-object",
    location: "header",
    style: "simple",
    explode: true,
    value: { role: "admin", firstName: "Alex" },
    schema: objectSchema,
    expected: "role=admin,firstName=Alex",
  },
  {
    id: "cookie-string",
    location: "cookie",
    style: "form",
    explode: true,
    value: "blue",
    schema: stringSchema,
    expected: "color=blue",
  },
]
wireCases.push(...moreVectors.map(parameterCase))

function bodyCase(id: string, schema: JsonValue, input: JsonValue, expected: JsonValue): Fixture {
  return {
    id,
    title: "Generated input must reach the server without field loss",
    area: "wire",
    reference: references.schema,
    document: bodyDocument(schema),
    consumer: {
      source: wireConsumer(
        input,
        `assert.deepEqual(JSON.parse(request.body.toString()), ${JSON.stringify(expected)}, "ACCORD_BODY_FIELDS")`,
      ),
    },
  }
}

const plainBody = {
  type: "object",
  properties: { name: stringSchema, count: integerSchema },
  required: ["name"],
  additionalProperties: false,
} as const
const composedBody = {
  type: "object",
  properties: { b: stringSchema },
  required: ["b"],
  allOf: [{ type: "object", properties: { a: stringSchema }, required: ["a"] }],
} as const

wireCases.push(
  bodyCase("wire.body-merge", plainBody, { name: "Alice", count: 0 }, { name: "Alice", count: 0 }),
  bodyCase(
    "wire.body-allof-siblings",
    composedBody,
    { body: { a: "A", b: "B" } },
    { a: "A", b: "B" },
  ),
  {
    ...bodyCase(
      "wire.body-ref-siblings",
      {
        $ref: "#/components/schemas/Base",
        properties: { b: stringSchema },
        required: ["b"],
      },
      { a: "A", b: "B" },
      { a: "A", b: "B" },
    ),
    consumer: {
      source:
        consumer(`export async function run() { await withServer(async (baseUrl, requests) => {
      const input = { a: "A", b: "B" }
      await createClient(api, { baseUrl }).probe.call({ body: input })
      assert.deepEqual(JSON.parse(requests[0]!.body.toString()), input, "ACCORD_BODY_FIELDS")
    }) }`),
    },
    document: {
      ...bodyDocument({
        $ref: "#/components/schemas/Base",
        properties: { b: stringSchema },
        required: ["b"],
      }),
      components: {
        schemas: { Base: { type: "object", properties: { a: stringSchema }, required: ["a"] } },
      },
    },
  },
  {
    ...bodyCase("wire.body-separate", plainBody, { body: { name: "Alice" } }, { name: "Alice" }),
    config: { body: { mode: "separate" } },
  },
  {
    ...bodyCase(
      "wire.body-array",
      { type: "array", items: integerSchema },
      { body: [1, 2] },
      [1, 2],
    ),
    config: { body: { mode: "separate" } },
  },
  {
    ...bodyCase(
      "wire.body-null",
      { type: ["object", "null"], properties: { name: stringSchema } },
      { body: null },
      null,
    ),
    config: { body: { mode: "separate" } },
  },
  {
    id: "wire.optional-body-absent",
    title: "Absent optional body must not become an empty JSON object",
    area: "wire",
    reference: references.body,
    document: bodyDocument(plainBody, "application/json", false),
    consumer: {
      source: wireConsumer({}, 'assert.equal(request.body.length, 0, "ACCORD_BODY_ABSENCE")'),
    },
  },
  {
    id: "wire.json-parameter",
    title: "A parameter with application/json content retains its name and JSON representation",
    area: "wire",
    reference: references.parameter,
    document: endpoint({
      parameters: [
        {
          name: "filter",
          in: "query",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { status: stringSchema },
                required: ["status"],
              },
            },
          },
        },
      ],
    }),
    consumer: {
      source: wireConsumer(
        { filter: { status: "active" } },
        'assert.deepEqual([...new URL(request.url, "http://localhost").searchParams], [["filter", \'{"status":"active"}\']], "ACCORD_JSON_PARAMETER")',
      ).replace(
        "    await client.probe.call(",
        "    // @contract ACCORD_JSON_PARAMETER_TYPE\n    await client.probe.call(",
      ),
    },
  },
  {
    id: "wire.query-reserved-escaping",
    title: "Default encoding cannot turn a parameter value into extra parameters or a fragment",
    area: "wire",
    reference: references.parameter,
    document: endpoint({ parameters: [{ name: "q", in: "query", schema: stringSchema }] }),
    consumer: {
      source: wireConsumer(
        { q: "x&admin=true#é+%" },
        'assert.deepEqual([...new URL(request.url, "http://localhost").searchParams], [["q", "x&admin=true#é+%"]], "ACCORD_QUERY_ESCAPE")',
      ),
    },
  },
  {
    id: "wire.relative-base-url",
    title: "A browser-relative configured base URL resolves against the browser origin",
    area: "wire",
    reference: references.accord,
    document: endpoint(),
    consumer: {
      source: consumer(`export async function run() {
      await withServer(async (baseUrl, requests) => {
        Object.defineProperty(globalThis, "location", { configurable: true, value: { href: baseUrl + "/page" } })
        const client = createClient(api, { baseUrl: "/api" })
        let error: Error | undefined
        try { await client.probe.call() } catch (cause) {
          if (!(cause instanceof TypeError) || cause.message !== "Invalid URL") throw cause
          error = cause
        }
        assert.equal(error, undefined, "ACCORD_RELATIVE_BASE")
        assert.equal(requests[0]?.url, "/api/probe")
      })
    }`),
    },
  },
  {
    id: "wire.input-immutability",
    title: "Frozen generated descriptors and caller input are not mutated by requests",
    area: "wire",
    reference: references.accord,
    document: bodyDocument(plainBody),
    consumer: {
      source: consumer(`export async function run() {
      Object.freeze(api.probe.call)
      const input = Object.freeze({ name: "Alice", count: 0 })
      const before = JSON.stringify(api)
      await withServer(async baseUrl => {
        const client = createClient(api, { baseUrl })
        await client.probe.call(input)
        await client.probe.call(input)
      })
      assert.equal(JSON.stringify(api), before, "ACCORD_DESCRIPTOR_IMMUTABLE")
      assert.deepEqual(input, { name: "Alice", count: 0 })
    }`),
    },
  },
)

for (const style of ["form", "pipeDelimited", "spaceDelimited"] as const) {
  const expected = { form: "1,2", pipeDelimited: "1|2", spaceDelimited: "1 2" }[style]
  wireCases.push({
    id: `wire.form-${style.toLowerCase()}`,
    title: `URL-encoded ${style} follows its declared delimiter`,
    area: "wire",
    reference: references.encoding,
    document: bodyDocument(
      {
        type: "object",
        properties: { ids: { type: "array", items: integerSchema } },
        required: ["ids"],
      },
      "application/x-www-form-urlencoded",
      true,
      { encoding: { ids: { style, explode: false } } },
    ),
    consumer: {
      source: wireConsumer(
        { body: { ids: [1, 2] } },
        `assert.equal(new URLSearchParams(request.body.toString()).get("ids"), ${JSON.stringify(expected)}, "ACCORD_FORM_STYLE")`,
      ),
    },
  })
}

wireCases.push({
  id: "wire.multipart-object",
  title: "Multipart fields are decoded independently by Fetch's form parser",
  area: "wire",
  reference: references.encoding,
  document: bodyDocument(plainBody, "multipart/form-data"),
  consumer: {
    source: wireConsumer(
      { name: "Alice", count: 2 },
      `
    const parsed = await new Response(request.body.toString(), {
      headers: { "content-type": request.headers["content-type"]! },
    }).formData()
    assert.deepEqual([...parsed].sort(([a], [b]) => a.localeCompare(b)), [["count", "2"], ["name", "Alice"]], "ACCORD_MULTIPART_FIELDS")
  `,
    ),
  },
})

export const responseCases: Fixture[] = [
  {
    id: "response.json",
    title: "JSON response decoding and inferred payload agree",
    area: "responses",
    reference: references.response,
    document: responseDocument({
      type: "object",
      properties: { id: integerSchema },
      required: ["id"],
      additionalProperties: false,
    }),
    consumer: {
      source:
        consumer(`type ResponseContract = Expect<Equal<ResponseOf<typeof api.probe.call>, { readonly id: number }>>
      export async function run() { await withServer(async baseUrl => {
        const value = await createClient(api, { baseUrl }).probe.call()
        assert.equal(value.id, 42, "ACCORD_JSON_RESPONSE")
      }, { status: 200, headers: { "content-type": "application/json; charset=utf-8" }, body: '{"id":42}' }) }`),
    },
  },
  {
    id: "response.text",
    title: "Text payload remains text",
    area: "responses",
    reference: references.response,
    document: responseDocument(stringSchema, "text/plain"),
    consumer: {
      source:
        consumer(`type ResponseContract = Expect<Equal<ResponseOf<typeof api.probe.call>, string>>
      export async function run() { await withServer(async baseUrl => {
        assert.equal(await createClient(api, { baseUrl }).probe.call(), "hello", "ACCORD_TEXT_RESPONSE")
      }, { status: 200, headers: { "content-type": "text/plain" }, body: "hello" }) }`),
    },
  },
  {
    id: "response.empty-text",
    title: "An empty 200 text representation is the empty string, not an absent body",
    area: "responses",
    reference: references.accord,
    document: responseDocument(stringSchema, "text/plain"),
    consumer: {
      source: consumer(`export async function run() { await withServer(async baseUrl => {
      assert.equal(await createClient(api, { baseUrl }).probe.call(), "", "ACCORD_EMPTY_TEXT")
    }, { status: 200, headers: { "content-type": "text/plain" }, body: "" }) }`),
    },
  },
  {
    id: "response.no-content",
    title: "204 has an undefined runtime payload and return type",
    area: "responses",
    reference: references.response,
    document: endpoint(),
    consumer: {
      source:
        consumer(`type ResponseContract = Expect<Equal<ResponseOf<typeof api.probe.call>, undefined>>
      export async function run() { await withServer(async baseUrl => {
        assert.equal(await createClient(api, { baseUrl }).probe.call(), undefined, "ACCORD_NO_CONTENT")
      }) }`),
    },
  },
  {
    id: "response.binary-type",
    title: "Binary payload type is the runtime's ArrayBuffer representation",
    area: "types",
    reference: references.accord,
    document: responseDocument({ type: "string", format: "binary" }, "application/octet-stream"),
    consumer: {
      source: consumer(`// @contract ACCORD_BINARY_TYPE
type ResponseContract = Expect<Equal<ResponseOf<typeof api.probe.call>, ArrayBuffer>>`),
    },
  },
  {
    id: "response.http-error",
    title: "Non-success HTTP responses retain endpoint, status, and parsed payload",
    area: "responses",
    reference: references.accord,
    document: endpoint({
      responses: {
        "200": { description: "OK" },
        "404": {
          description: "Not found",
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
    consumer: {
      source: consumer(`export async function run() { await withServer(async baseUrl => {
      await assert.rejects(createClient(api, { baseUrl }).probe.call(), error => {
        assert(error instanceof HttpError, "ACCORD_HTTP_ERROR")
        assert.equal(error.status, 404)
        assert.equal(error.endpoint.operationId, "call")
        assert.deepEqual(JSON.parse(JSON.stringify(error.body)), { message: "missing" })
        return true
      })
    }, { status: 404, headers: { "content-type": "application/json" }, body: '{"message":"missing"}' }) }`),
    },
  },
  {
    id: "response.malformed-http-error",
    title: "Invalid error JSON cannot erase HTTP status and response metadata",
    area: "responses",
    reference: references.accord,
    document: endpoint(),
    consumer: {
      source: consumer(`export async function run() { await withServer(async baseUrl => {
      await assert.rejects(createClient(api, { baseUrl }).probe.call(), error => {
        assert(error instanceof HttpError, "ACCORD_MALFORMED_HTTP_ERROR")
        assert.equal(error.status, 500)
        assert.equal(error.response.headers.get("x-request-id"), "test-request")
        return true
      })
    }, { status: 500, headers: { "content-type": "application/json", "x-request-id": "test-request" }, body: "{broken" }) }`),
    },
  },
]
