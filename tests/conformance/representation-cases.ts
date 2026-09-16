import {
  bodyDocument,
  consumer,
  endpoint,
  references,
  responseDocument,
  stringSchema,
  wireConsumer,
} from "./fixture.js"
import type { Fixture } from "./model.js"

export const representationCases: Fixture[] = [
  {
    id: "representation.direct-schema-selection",
    title:
      "Direct schema references follow status precedence and media type, including text numbers",
    area: "responses",
    reference: references.response,
    document: endpoint({
      responses: {
        200: {
          description: "Ready",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ready"],
                additionalProperties: false,
                properties: { ready: { const: true } },
              },
            },
            "text/plain": { schema: { type: "integer", minimum: 5 } },
          },
        },
        "2XX": {
          description: "Queued",
          content: { "application/json": { schema: { const: "queued" } } },
        },
        default: {
          description: "Error",
          content: { "application/json": { schema: { const: "denied" } } },
        },
      },
    }),
    config: { validators: true },
    consumer: {
      source: consumer(`import { ValidationError } from "@accord/client"
      export async function run() {
        for (const [status, mediaType, body, expected] of [
          [200, "application/json", '{"ready":true}', { ready: true }],
          [200, "text/plain", "7", 7],
          [201, "application/json", '"queued"', "queued"],
        ] as const) await withServer(async baseUrl => {
          assert.deepEqual(await createClient(api, { baseUrl }).probe.call(), { status, data: expected })
        }, { status, headers: { "content-type": mediaType }, body })
        for (const [status, mediaType, body] of [
          [200, "application/json", '"queued"'],
          [200, "text/plain", "3"],
          [201, "application/json", '{"ready":true}'],
        ] as const) await withServer(async baseUrl => {
          await assert.rejects(createClient(api, { baseUrl }).probe.call(), ValidationError)
        }, { status, headers: { "content-type": mediaType }, body })
        await withServer(async baseUrl => {
          try { await createClient(api, { baseUrl }).probe.call(); assert.fail("Expected an HTTP error") }
          catch (error) {
            assert(error instanceof HttpError)
            assert.equal(error.status, 403)
            assert.equal(error.body, "denied")
            assert.equal(error.cause, undefined)
          }
        }, { status: 403, headers: { "content-type": "application/json" }, body: '"denied"' })
      }`),
    },
  },
  {
    id: "representation.multipart-style",
    title: "Explicit multipart field style chooses its delimiter and ignores contentType",
    area: "wire",
    reference: references.encoding,
    document: bodyDocument(
      {
        type: "object",
        required: ["ids"],
        additionalProperties: false,
        properties: { ids: { type: "array", items: { type: "integer" } } },
      },
      "multipart/form-data",
      true,
      {
        encoding: {
          ids: { style: "spaceDelimited", explode: false, contentType: "application/json" },
        },
      },
    ),
    consumer: {
      source: wireConsumer(
        { ids: [1, 2] },
        `const form = await new Response(request.body.toString(), { headers: { "content-type": request.headers["content-type"]! } }).formData()
      assert.equal(form.get("ids"), "1 2", "ACCORD_MULTIPART_STYLE")`,
      ),
    },
  },
  {
    id: "representation.xml-roundtrip",
    title: "XML uses schema names, attributes, wrapped arrays and entity decoding",
    area: "responses",
    reference: references.schema,
    document: responseDocument(
      {
        type: "object",
        xml: { name: "person" },
        required: ["id", "name", "tags"],
        additionalProperties: false,
        properties: {
          id: { type: "integer", readOnly: true, xml: { attribute: true } },
          name: { type: "string" },
          tags: {
            type: "array",
            xml: { wrapped: true },
            items: { type: "string", xml: { name: "tag" } },
          },
        },
      },
      "application/xml",
    ),
    config: { validators: true },
    consumer: {
      source: consumer(`export async function run() { await withServer(async baseUrl => {
      const result = await createClient(api, { baseUrl }).probe.call()
      assert.deepEqual(result, { id: 42, name: "A & B", tags: ["one", "two"] }, "ACCORD_XML_VALUE")
    }, { status: 200, headers: { "content-type": "application/xml" }, body: '<person id="42"><name>A &amp; B</name><tags><tag>one</tag><tag>two</tag></tags></person>' }) }`),
    },
  },
  {
    id: "representation.xml-content-parameter",
    title: "Content-typed XML parameters use the XML codec before query escaping",
    area: "wire",
    reference: references.parameter,
    document: endpoint({
      parameters: [
        {
          name: "filter",
          in: "query",
          required: true,
          content: {
            "application/xml": {
              schema: {
                type: "object",
                xml: { name: "filter" },
                required: ["name"],
                additionalProperties: false,
                properties: { name: stringSchema },
              },
            },
          },
        },
      ],
    }),
    consumer: {
      source: wireConsumer(
        { filter: { name: "Ada" } },
        'assert.equal(new URL(request.url, "http://localhost").searchParams.get("filter"), "<filter><name>Ada</name></filter>", "ACCORD_XML_PARAMETER")',
      ),
    },
  },
  {
    id: "representation.head",
    title: "HEAD returns undefined even when content is declared on its response",
    area: "responses",
    reference: references.response,
    document: endpoint(
      {
        responses: {
          "200": {
            description: "Metadata",
            content: { "application/json": { schema: stringSchema } },
          },
        },
      },
      "head",
    ),
    config: { validators: true },
    consumer: {
      source: consumer(`type Empty = Expect<Equal<ResponseOf<typeof api.probe.call>, undefined>>
      export async function run() { await withServer(async baseUrl => {
        assert.equal(await createClient(api, { baseUrl }).probe.call(), undefined, "ACCORD_HEAD")
      }, { status: 200, headers: { "content-type": "application/json" }, body: '' }) }`),
    },
  },
  {
    id: "representation.range-empty",
    title:
      "A wildcard success group gives 204 an undefined payload without requiring media selection",
    area: "responses",
    reference: references.response,
    document: endpoint({
      responses: {
        "2XX": {
          description: "Success",
          content: {
            "application/json": { schema: stringSchema },
            "text/plain": { schema: stringSchema },
          },
        },
      },
    }),
    config: { validators: true },
    consumer: {
      source:
        consumer(`type Empty = Expect<Equal<Extract<ResponseOf<typeof api.probe.call>, {status: 204 | 205}>["data"], undefined>>
      export async function run() { await withServer(async baseUrl => {
        assert.deepEqual(await createClient(api, { baseUrl }).probe.call(), { status: 204, data: undefined }, "ACCORD_RANGE_EMPTY")
      }, { status: 204, headers: {}, body: '' }) }`),
    },
  },
  {
    id: "representation.nullable-enum",
    title: "OpenAPI 3.0 nullable changes the type domain without overriding enum constraints",
    area: "types",
    reference: references.schema,
    document: {
      ...responseDocument({ type: "string", nullable: true, enum: ["one", "two"] }),
      openapi: "3.0.3",
    },
    config: { validators: true },
    consumer: {
      source: consumer(
        'type Exact = Expect<Equal<ResponseOf<typeof api.probe.call>, "one" | "two">>',
      ),
    },
  },
  {
    id: "representation.unevaluated",
    title: "Validator projection preserves evaluated properties across allOf",
    area: "responses",
    reference: references.schema,
    document: responseDocument({
      type: "object",
      allOf: [
        { properties: { a: stringSchema }, required: ["a"] },
        { properties: { b: { type: "integer" } }, required: ["b"] },
      ],
      unevaluatedProperties: false,
    }),
    config: { validators: true },
    consumer: {
      source: consumer(`export async function run() { await withServer(async baseUrl => {
      assert.deepEqual(await createClient(api, { baseUrl }).probe.call(), { a: "ok", b: 2 }, "ACCORD_UNEVALUATED")
    }, { status: 200, headers: { "content-type": "application/json" }, body: '{"a":"ok","b":2}' }) }`),
    },
  },
  {
    id: "representation.ref-nullable-siblings",
    title: "Object-only ref sibling constraints preserve a referenced nullable branch",
    area: "types",
    reference: references.schema,
    document: {
      ...responseDocument({
        $ref: "#/components/schemas/Base",
        properties: { b: stringSchema },
        required: ["b"],
      }),
      components: {
        schemas: {
          Base: { type: ["object", "null"], properties: { a: stringSchema }, required: ["a"] },
        },
      },
    },
    consumer: {
      source: consumer(`type Value = ResponseOf<typeof api.probe.call>
      const empty: Value = null
      const present: Value = { a: "a", b: "b" }
      // @negative MISSING_SIBLING
      const invalid: Value = { a: "a" }`),
      diagnostics: [{ marker: "MISSING_SIBLING", codes: [2322] }],
    },
  },
]

representationCases.push({
  id: "representation.form-defaults",
  title: "OpenAPI 3.1 URL form defaults encode object fields as JSON and repeat array items",
  area: "wire",
  reference: references.encoding,
  document: bodyDocument(
    {
      type: "object",
      required: ["metadata", "ids"],
      additionalProperties: false,
      properties: {
        metadata: {
          type: "object",
          required: ["name"],
          additionalProperties: false,
          properties: { name: stringSchema },
        },
        ids: { type: "array", items: { type: "integer" } },
      },
    },
    "application/x-www-form-urlencoded",
  ),
  consumer: {
    source: wireConsumer(
      { metadata: { name: "Ada" }, ids: [1, 2] },
      `const form = new URLSearchParams(request.body.toString())
    assert.equal(form.get("metadata"), '{"name":"Ada"}', "ACCORD_FORM_JSON_DEFAULT")
    assert.deepEqual(form.getAll("ids"), ["1", "2"], "ACCORD_FORM_ARRAY_DEFAULT")`,
    ),
  },
})

representationCases.push(
  {
    id: "representation.form-response",
    title: "URL form response decoding follows declared scalar, array and JSON codecs",
    area: "responses",
    reference: references.encoding,
    document: responseDocument(
      {
        type: "object",
        required: ["count", "flags", "metadata"],
        additionalProperties: false,
        properties: {
          count: { type: "integer" },
          flags: { type: "array", items: { type: "boolean" } },
          metadata: {
            type: "object",
            required: ["name"],
            additionalProperties: false,
            properties: { name: stringSchema },
          },
        },
      },
      "application/x-www-form-urlencoded",
    ),
    config: { validators: true },
    consumer: {
      source: consumer(`export async function run() { await withServer(async baseUrl => {
      const result = await createClient(api, { baseUrl }).probe.call()
      assert.deepEqual(result, { count: 2, flags: [true, false], metadata: { name: "Ada" } }, "ACCORD_FORM_DECODE")
    }, { status: 200, headers: { "content-type": "application/x-www-form-urlencoded" }, body: 'count=2&flags=true&flags=false&metadata=%7B%22name%22%3A%22Ada%22%7D' }) }`),
    },
  },
  {
    id: "representation.multipart-response-binary",
    title: "Multipart response types and validators describe decoded ArrayBuffer fields",
    area: "responses",
    reference: references.encoding,
    document: responseDocument(
      {
        type: "object",
        required: ["file", "count"],
        additionalProperties: false,
        properties: {
          file: { type: "string", format: "binary", minLength: 2, maxLength: 2 },
          count: { type: "integer" },
        },
      },
      "multipart/form-data",
    ),
    config: { validators: true },
    consumer: {
      source:
        consumer(`type FileValue = Expect<Equal<ResponseOf<typeof api.probe.call>["file"], ArrayBuffer>>
      export async function run() { await withServer(async baseUrl => {
        const value = await createClient(api, { baseUrl }).probe.call()
        assert.deepEqual(new Uint8Array(value.file), new Uint8Array([0, 65]), "ACCORD_MULTIPART_BINARY_DECODE")
        assert.equal(value.count, 2)
      }, { status: 200, headers: { "content-type": "multipart/form-data; boundary=test" }, body: '--test\\r\\nContent-Disposition: form-data; name="file"; filename="file.bin"\\r\\nContent-Type: application/octet-stream\\r\\n\\r\\n\\u0000A\\r\\n--test\\r\\nContent-Disposition: form-data; name="count"\\r\\n\\r\\n2\\r\\n--test--\\r\\n' }) }`),
    },
  },
)

representationCases.push(
  {
    id: "representation.false-binary-schema",
    title: "A false schema stays impossible even for a binary representation",
    area: "types",
    reference: references.schema,
    document: responseDocument(false, "application/octet-stream"),
    config: { validators: true },
    consumer: {
      source: consumer(`import { ValidationError } from "@accord/client"
      type Impossible = Expect<Equal<ResponseOf<typeof api.probe.call>, never>>
      export async function run() { await withServer(async baseUrl => {
        await assert.rejects(createClient(api, { baseUrl }).probe.call(), ValidationError)
      }, { status: 200, headers: { "content-type": "application/octet-stream" }, body: 'abc' }) }`),
    },
  },
  {
    id: "representation.unproductive-recursion",
    title: "Alias-only recursion produces a source diagnostic rather than invalid TypeScript",
    area: "generation",
    reference: references.schema,
    document: {
      ...responseDocument({ $ref: "#/components/schemas/Loop" }),
      components: { schemas: { Loop: { $ref: "#/components/schemas/Loop" } } },
    },
    rejection: "INVALID_SCHEMA",
  },
  {
    id: "representation.invalid-boolean",
    title: "Malformed text booleans fail decoding instead of becoming a validated false",
    area: "responses",
    reference: references.response,
    document: responseDocument({ type: "boolean" }, "text/plain"),
    config: { validators: true },
    consumer: {
      source: consumer(`import { DecodeError } from "@accord/client"
      type BooleanResponse = Expect<Equal<ResponseOf<typeof api.probe.call>, boolean>>
      export async function run() { await withServer(async baseUrl => {
        await assert.rejects(createClient(api, { baseUrl }).probe.call(), DecodeError)
      }, { status: 200, headers: { "content-type": "text/plain" }, body: 'not-a-boolean' }) }`),
    },
  },
  {
    id: "representation.xml-root",
    title: "XML decoding requires the declared root name",
    area: "responses",
    reference: references.schema,
    document: responseDocument({ type: "object", xml: { name: "person" } }, "application/xml"),
    config: { validators: true },
    consumer: {
      source: consumer(`import { DecodeError } from "@accord/client"
      export async function run() { await withServer(async baseUrl => {
        await assert.rejects(createClient(api, { baseUrl }).probe.call(), DecodeError)
      }, { status: 200, headers: { "content-type": "application/xml" }, body: '<wrong/>' }) }`),
    },
  },
)
