import type { JsonValue } from "@accord/codegen"
import { bodyDocument, consumer, document, endpoint, references, stringSchema } from "./fixture.js"
import type { Fixture } from "./model.js"

const response = { "204": { description: "OK" } }
export const generationCases: Fixture[] = [
  {
    id: "generation.compact-endpoint-defaults",
    title: "Flat location-specific bindings omit defaults without changing the HTTP request",
    area: "generation",
    reference: references.accord,
    document: endpoint(
      {
        parameters: [
          { name: "id", in: "path", required: true, schema: stringSchema },
          { name: "tags", in: "query", schema: { type: "array", items: stringSchema } },
          {
            name: "x-meta",
            in: "header",
            schema: { type: "object", additionalProperties: stringSchema },
          },
          {
            name: "prefs",
            in: "cookie",
            schema: { type: "object", additionalProperties: stringSchema },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["name"],
                properties: { name: stringSchema },
              },
            },
          },
        },
      },
      "post",
      "/probe/{id}",
    ),
    consumer: {
      source: consumer(`export async function run() {
        const endpoint = api.probe.call
        for (const field of ["apiId", "plan", "parameters", "servers", "resultMode", "security", "securitySchemes"])
          assert.equal(Object.hasOwn(endpoint, field), false, field)
        assert.deepEqual(endpoint.pathParams, [{ name: "id" }])
        assert.deepEqual(endpoint.queryParams, [{ name: "tags" }])
        assert.deepEqual(endpoint.responses, { 204: {} })
        assert.equal(endpoint.requestBody?.mode, undefined)
        assert.equal(endpoint.requestBody?.defaultMediaType, undefined)
        await withServer(async (baseUrl, requests) => {
          await createClient(api, { baseUrl }).probe.call({
            id: "a/b", tags: ["red", "blue"], xMeta: { role: "admin" }, prefs: { theme: "dark" }, name: "Ada",
          })
          assert.equal(requests[0]?.url, "/base/probe/a%2Fb?tags=red&tags=blue")
          assert.equal(requests[0]?.headers["x-meta"], "role,admin")
          assert.equal(requests[0]?.headers.cookie, "theme=dark")
          assert.equal(requests[0]?.body.toString(), '{"name":"Ada"}')
        })
      }`),
    },
  },

  {
    id: "generation.path-namespaces",
    title: "Only static path segments form namespaces; operation naming precedence is explicit",
    area: "generation",
    reference: references.accord,
    document: document({
      "/api/v1/users/{userId}/posts": {
        get: {
          operationId: "ignored",
          "x-sdk-name": "listPosts",
          tags: ["IgnoredTag"],
          parameters: [{ name: "userId", in: "path", required: true, schema: stringSchema }],
          responses: response,
        },
      },
    }),
    config: { basePath: "/api/v1" },
    consumer: {
      source: consumer(`type Namespace = Expect<Equal<keyof typeof api.users, "posts">>
      export async function run() {
        assert.equal(api.users.posts.listPosts.path, "/api/v1/users/{userId}/posts")
        assert.equal(api.users.posts.listPosts.id, "ignored")
      }`),
    },
  },
  {
    id: "generation.tag-namespaces",
    title: "Tag namespaces are opt-in",
    area: "generation",
    reference: references.accord,
    document: endpoint({ tags: ["Users API"] }),
    config: { namespace: "tag" },
    consumer: {
      source: consumer(
        'export async function run() { assert.equal(api.usersApi.call.path, "/probe") }',
      ),
    },
  },
  {
    id: "generation.fallback-name",
    title: "Missing operationId has a deterministic method-and-parameter fallback",
    area: "generation",
    reference: references.accord,
    document: document({
      "/users/{userId}/posts": {
        get: {
          parameters: [{ name: "userId", in: "path", required: true, schema: stringSchema }],
          responses: response,
        },
      },
    }),
    consumer: {
      source: consumer(
        'export async function run() { assert.equal(api.users.posts.getByUserId.path, "/users/{userId}/posts") }',
      ),
    },
  },
  {
    id: "generation.path-parameter-inheritance",
    title: "Path-item parameters are inherited into generated calls",
    area: "generation",
    reference: references.parameter,
    document: document({
      "/probe/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: stringSchema }],
        get: { operationId: "call", responses: response },
      },
    }),
    consumer: {
      source: consumer(
        "type InputContract = Expect<Equal<InputOf<typeof api.probe.call>, { readonly id: string }>>",
      ),
    },
  },
  {
    id: "generation.external-reference",
    title: "A file-relative request-body reference resolves from the input document",
    area: "generation",
    reference: references.reference,
    document: endpoint({ requestBody: { $ref: "./body.json" } }, "post"),
    files: {
      "body.json": JSON.stringify({
        required: true,
        content: {
          "application/json": {
            schema: { type: "object", properties: { name: stringSchema }, required: ["name"] },
          },
        },
      }),
    },
    consumer: {
      source: consumer(
        'type InputContract = Expect<Equal<InputOf<typeof api.probe.call>["body"]["name"], string>>',
      ),
    },
  },
]

const rejected: readonly [string, JsonValue, string][] = [
  ["null-document", null, "INVALID_DOCUMENT"],
  ["array-document", [], "INVALID_DOCUMENT"],
  ["missing-version", { paths: {} }, "INVALID_DOCUMENT"],
  ["unsupported-version", { openapi: "2.0", paths: {} }, "UNSUPPORTED_OPENAPI_VERSION"],
  ["paths-array", { openapi: "3.1.0", paths: [] }, "INVALID_DOCUMENT"],
  ["null-operation", document({ "/probe": { get: null } }), "INVALID_OPERATION"],
  [
    "optional-path",
    endpoint(
      { parameters: [{ name: "id", in: "path", required: false, schema: stringSchema }] },
      "get",
      "/probe/{id}",
    ),
    "INVALID_PARAMETER",
  ],
  ["missing-path-parameter", endpoint({}, "get", "/probe/{id}"), "INVALID_PARAMETER"],
  [
    "unused-path-parameter",
    endpoint({ parameters: [{ name: "id", in: "path", required: true, schema: stringSchema }] }),
    "INVALID_PARAMETER",
  ],
  [
    "invalid-parameter-style",
    endpoint({ parameters: [{ name: "id", in: "query", style: "matrix", schema: stringSchema }] }),
    "UNSUPPORTED_PARAMETER_STYLE",
  ],
  [
    "duplicate-operation-id",
    document({
      "/a": { get: { operationId: "same", responses: response } },
      "/b": { get: { operationId: "same", responses: response } },
    }),
    "DUPLICATE_OPERATION_ID",
  ],
  [
    "parameter-collision",
    endpoint({
      parameters: [
        { name: "id", in: "query", schema: stringSchema },
        { name: "id", in: "header", schema: stringSchema },
      ],
    }),
    "INPUT_COLLISION",
  ],
  [
    "body-parameter-collision",
    endpoint(
      {
        parameters: [{ name: "id", in: "query", schema: stringSchema }],
        requestBody: {
          content: {
            "application/json": { schema: { type: "object", properties: { id: stringSchema } } },
          },
        },
      },
      "post",
    ),
    "INPUT_COLLISION",
  ],
  ["merged-non-object", bodyDocument(stringSchema), "BODY_MERGE_REQUIRES_OBJECT"],
  [
    "merged-dictionary",
    bodyDocument({ type: "object", additionalProperties: stringSchema }),
    "BODY_MERGE_DYNAMIC_PROPERTIES",
  ],
  [
    "dangerous-input",
    endpoint({ parameters: [{ name: "__proto__", in: "query", schema: stringSchema }] }),
    "DANGEROUS_INPUT_NAME",
  ],
  [
    "unresolved-reference",
    endpoint({ requestBody: { $ref: "#/components/requestBodies/Missing" } }, "post"),
    "UNRESOLVED_REF",
  ],
  [
    "cyclic-reference-chain",
    document(
      { "/probe": { $ref: "#/components/pathItems/A" } },
      {
        pathItems: {
          A: { $ref: "#/components/pathItems/B" },
          B: { $ref: "#/components/pathItems/A" },
        },
      },
    ),
    "UNRESOLVED_REF",
  ],
  [
    "duplicate-parameter",
    endpoint({
      parameters: [
        { name: "q", in: "query", schema: stringSchema },
        { name: "q", in: "query", schema: stringSchema },
      ],
    }),
    "INVALID_PARAMETER",
  ],
]
for (const [id, input, rejection] of rejected) {
  const fixture: Fixture = {
    id: `rejection.${id}`,
    title: `Reject ${id} with a structured ${rejection} diagnostic`,
    area: "generation",
    reference: references.accord,
    document: input,
    rejection,
  }
  if (["body-parameter-collision", "merged-non-object", "merged-dictionary"].includes(id))
    generationCases.push({ ...fixture, config: { body: { mode: "merge" } } })
  else generationCases.push(fixture)
}
