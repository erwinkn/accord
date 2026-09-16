import { bodyDocument, consumer, endpoint, references, stringSchema } from "./fixture.js"
import type { Fixture } from "./model.js"

export const requestBodyCases: Fixture[] = [
  {
    id: "request-body.compact-multipart",
    title: "A single field map preserves multipart uploads and excludes query inputs",
    area: "wire",
    reference: references.encoding,
    document: endpoint(
      {
        parameters: [{ name: "audit", in: "query", schema: { type: "boolean" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["category", "file"],
                properties: {
                  category: stringSchema,
                  file: { type: "string", format: "binary" },
                  note: stringSchema,
                },
              },
            },
          },
        },
      },
      "post",
    ),
    consumer: {
      source: consumer(`export async function run() {
      assert.deepEqual(api.probe.call.requestBody, {
        type: "multipart", required: true,
        fields: { category: {}, file: { type: "binary" }, note: {} },
      })
      await withServer(async (baseUrl, requests) => {
        await createClient(api, { baseUrl }).probe.call({ audit: true, category: "report", file: new File(["PDF bytes"], "report.pdf", { type: "application/pdf" }) })
        const request = requests[0]!
        assert.equal(request.url, "/base/probe?audit=true")
        const form = await new Response(request.body.toString(), { headers: { "content-type": request.headers["content-type"]! } }).formData()
        assert.deepEqual([...form.keys()], ["category", "file"])
        assert.equal(form.get("category"), "report")
        const file = form.get("file")
        assert(file instanceof File)
        assert.equal(file.name, "report.pdf")
        assert.equal(file.type, "application/pdf")
        assert.equal(await file.text(), "PDF bytes")
      })
    }`),
    },
  },
  {
    id: "request-body.multipart-overrides",
    title: "Compact fields retain repeated values, custom part headers, media overrides and styles",
    area: "wire",
    reference: references.encoding,
    document: bodyDocument(
      {
        type: "object",
        additionalProperties: false,
        required: ["attachments", "labels", "metadata", "ids", "table"],
        properties: {
          attachments: { type: "array", items: { type: "string", format: "binary" } },
          labels: { type: "array", items: stringSchema },
          metadata: {
            type: "object",
            additionalProperties: false,
            required: ["title"],
            properties: { title: stringSchema },
          },
          ids: { type: "array", items: { type: "integer" } },
          table: stringSchema,
        },
      },
      "multipart/form-data",
      true,
      {
        encoding: {
          ids: { style: "pipeDelimited", explode: false },
          table: { contentType: "text/csv", headers: { "x-part": { schema: { const: "trace" } } } },
        },
      },
    ),
    consumer: {
      source: consumer(`export async function run() {
      assert.deepEqual(api.probe.call.requestBody, {
        type: "multipart", required: true, fields: {
          attachments: { type: "binary", multiple: true }, labels: { multiple: true },
          metadata: { type: "json" }, ids: { type: "parameter", style: "pipeDelimited" },
          table: { mediaType: "text/csv", headers: { "x-part": "trace" } },
        },
      })
      await withServer(async (baseUrl, requests) => {
        await createClient(api, { baseUrl }).probe.call({
          attachments: [new File(["one"], "one.bin"), new File(["two"], "two.bin")],
          labels: ["a", "b"], metadata: { title: "Title" }, ids: [1, 2], table: "a,b",
        })
        const request = requests[0]!
        const raw = request.body.toString()
        assert(raw.includes("content-type: text/csv"))
        assert(raw.includes("x-part: trace"))
        const form = await new Response(raw, { headers: { "content-type": request.headers["content-type"]! } }).formData()
        const files = form.getAll("attachments")
        assert(files.every(file => file instanceof File))
        assert.deepEqual(files.map(file => file.name), ["one.bin", "two.bin"])
        assert.deepEqual(await Promise.all(files.map(file => file.text())), ["one", "two"])
        assert.deepEqual(form.getAll("labels"), ["a", "b"])
        assert.equal(form.get("metadata"), '{"title":"Title"}')
        assert.equal(form.get("ids"), "1|2")
        assert.equal(form.get("table"), "a,b")
      })
    }`),
    },
  },
  {
    id: "request-body.dynamic-fields",
    title: "Additional and pattern-based form fields preserve dynamic own keys",
    area: "wire",
    reference: references.encoding,
    document: bodyDocument(
      {
        type: "object",
        additionalProperties: stringSchema,
        patternProperties: { "^meta_": { type: "object", additionalProperties: stringSchema } },
      },
      "multipart/form-data",
    ),
    consumer: {
      source: consumer(`export async function run() {
      assert.deepEqual(api.probe.call.requestBody, {
        type: "multipart", mode: "separate", required: true,
        patterns: { "^meta_": { type: "json" } }, additional: {},
      })
      const body = { label: "kept", constructor: "own", ["__proto__"]: "also own", meta_flags: { state: "active" } }
      await withServer(async (baseUrl, requests) => {
        await createClient(api, { baseUrl }).probe.call({ body })
        const request = requests[0]!
        const form = await new Response(request.body.toString(), { headers: { "content-type": request.headers["content-type"]! } }).formData()
        assert.deepEqual([...form.entries()], [
          ["label", "kept"], ["constructor", "own"], ["__proto__", "also own"], ["meta_flags", '{"state":"active"}'],
        ])
        assert.equal(body.constructor, "own")
      })
    }
    function negative() {
      // @negative PATTERN_VALUE
      createClient(api).probe.call({ body: { meta_flags: "must be an object" } })
    }`),
      diagnostics: [{ marker: "PATTERN_VALUE", codes: [2345] }],
    },
  },
  {
    id: "request-body.default-media",
    title: "The first flat request variant controls default headers and correlated caller types",
    area: "wire",
    reference: references.accord,
    document: endpoint(
      {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                properties: { title: stringSchema },
                required: ["title"],
              },
            },
            "text/csv": { schema: stringSchema },
          },
        },
      },
      "post",
    ),
    config: { defaultMediaTypes: { call: "text/csv" } },
    consumer: {
      source: consumer(`export async function run() {
      assert.deepEqual(api.probe.call.requestBody, [
        { type: "text", mediaType: "text/csv", required: true, mode: "separate" },
        { type: "json", required: true, mode: "separate" },
      ])
      await withServer(async (baseUrl, requests) => {
        const client = createClient(api, { baseUrl })
        await client.probe.call({ body: "a,b" })
        await client.probe.call({ body: { title: "JSON" } }, { headers: { "content-type": "application/json" } })
        assert.equal(requests[0]?.body.toString(), "a,b")
        assert.equal(requests[0]?.headers["content-type"], "text/csv")
        assert.equal(requests[1]?.body.toString(), '{"title":"JSON"}')
        assert.equal(requests[1]?.headers["content-type"], "application/json")
      })
    }
    function negative() {
      // @negative JSON_REQUIRES_SELECTOR
      createClient(api).probe.call({ body: { title: "JSON" } })
    }`),
      diagnostics: [{ marker: "JSON_REQUIRES_SELECTOR", codes: [2345] }],
    },
  },
  {
    id: "request-body.xml",
    title: "A flat XML body retains element and attribute metadata and custom media type",
    area: "wire",
    reference: references.encoding,
    document: bodyDocument(
      {
        type: "object",
        additionalProperties: false,
        xml: { name: "person" },
        required: ["id", "name"],
        properties: { id: { type: "integer", xml: { attribute: true } }, name: stringSchema },
      },
      "text/xml",
    ),
    consumer: {
      source: consumer(`export async function run() {
      await withServer(async (baseUrl, requests) => {
        await createClient(api, { baseUrl }).probe.call({ id: 1, name: "A & B" })
        assert.equal(requests[0]?.headers["content-type"], "text/xml")
        assert.equal(requests[0]?.body.toString(), '<person id="1"><name>A &amp; B</name></person>')
      })
    }`),
    },
  },
]
