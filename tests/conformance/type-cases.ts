import {
  bodyDocument,
  consumer,
  document,
  endpoint,
  integerSchema,
  references,
  responseDocument,
  stringSchema,
} from "./fixture.js"
import type { Fixture } from "./model.js"

const queryInput = endpoint(
  {
    parameters: [
      { name: "user-id", in: "path", required: true, schema: stringSchema },
      { name: "limit", in: "query", schema: integerSchema },
      { name: "x-session", in: "header", required: true, schema: stringSchema },
    ],
  },
  "get",
  "/probe/{user-id}",
)

export const typeCases: Fixture[] = [
  {
    id: "types.published-declarations",
    title: "Published package declarations are valid with skipLibCheck disabled",
    area: "types",
    reference: references.accord,
    document: endpoint(),
    consumer: { checkDeclarations: true, source: consumer("export {}") },
  },
  {
    id: "types.ref-siblings",
    title: "OpenAPI 3.1 schema ref siblings participate in the generated input type",
    area: "types",
    reference: references.schema,
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
    consumer: {
      source: consumer(`// @contract ACCORD_REF_SIBLING_TYPE
type InputContract = Expect<Equal<Pick<InputOf<typeof api.probe.call>["body"], "a" | "b">, { readonly a: string; readonly b: string }>>`),
    },
  },
  {
    id: "types.parameter-groups",
    title: "Renamed path/header inputs are required; optional query values remain optional",
    area: "types",
    reference: references.accord,
    document: queryInput,
    consumer: {
      source: consumer(`type Input = InputOf<typeof api.probe.call>
      type InputContract = Expect<Equal<Input, { readonly userId: string; readonly limit?: number; readonly xSession: string }>>
      const accepted: Input = { userId: "u", xSession: "s" }
      const client = createClient(api, { baseUrl: "http://localhost" })
      function examples() {
        client.probe.call(accepted)
        // @negative MISSING_PATH
        client.probe.call({ xSession: "s" })
        // @negative WRONG_QUERY_TYPE
        client.probe.call({ userId: "u", xSession: "s", limit: "bad" })
        // @negative MISSING_HEADER
        client.probe.call({ userId: "u" })
        // @negative MISSPELLED_INPUT
        client.probe.call({ userId: "u", xSession: "s", limti: 1 })
      }`),
      diagnostics: [
        { marker: "MISSING_PATH", codes: [2345] },
        { marker: "WRONG_QUERY_TYPE", codes: [2322, 2345] },
        { marker: "MISSING_HEADER", codes: [2345] },
        { marker: "MISSPELLED_INPUT", codes: [2561, 2353, 2345] },
      ],
    },
  },
  {
    id: "types.required-input-argument",
    title: "A required parameter makes the entire function argument required",
    area: "types",
    reference: references.parameter,
    document: queryInput,
    consumer: {
      source: consumer(`const client = createClient(api)
      function examples() {
        // @negative MISSING_ARGUMENT
        client.probe.call()
      }`),
      diagnostics: [{ marker: "MISSING_ARGUMENT", codes: [2554, 2345] }],
    },
  },
  {
    id: "types.optional-body-presence",
    title: "An optional body can be wholly absent but not partially satisfy its required fields",
    area: "types",
    reference: references.accord,
    document: bodyDocument(
      {
        type: "object",
        properties: { name: stringSchema, age: integerSchema },
        required: ["name", "age"],
      },
      "application/json",
      false,
    ),
    consumer: {
      source: consumer(`const client = createClient(api)
      function examples() {
        client.probe.call()
        client.probe.call({})
        client.probe.call({ body: { name: "Alice", age: 30 } })
        // @negative PARTIAL_BODY
        client.probe.call({ body: { name: "Alice" } })
      }`),
      diagnostics: [{ marker: "PARTIAL_BODY", codes: [2345, 2741] }],
    },
  },
  {
    id: "types.separate-required-body",
    title: "Separate required bodies are not made optional",
    area: "types",
    reference: references.accord,
    document: bodyDocument({ type: "array", items: integerSchema }),
    config: { body: { mode: "separate" } },
    consumer: {
      source: consumer(`const client = createClient(api)
      function examples() {
        client.probe.call({ body: [1, 2] })
        // @negative MISSING_BODY
        client.probe.call({})
        // @negative WRONG_BODY_ITEM
        client.probe.call({ body: ["bad"] })
      }`),
      diagnostics: [
        { marker: "MISSING_BODY", codes: [2345] },
        { marker: "WRONG_BODY_ITEM", codes: [2322, 2345] },
      ],
    },
  },
  {
    id: "types.nullable-not-optional",
    title: "Required nullable properties accept null, not omission",
    area: "types",
    reference: references.schema,
    document: bodyDocument({
      type: "object",
      properties: { name: { type: ["string", "null"] } },
      required: ["name"],
    }),
    consumer: {
      source: consumer(`const client = createClient(api)
      function examples() {
        client.probe.call({ body: { name: null } })
        client.probe.call({ body: { name: "Alice" } })
        // @negative OMIT_NULLABLE
        client.probe.call({})
      }`),
      diagnostics: [{ marker: "OMIT_NULLABLE", codes: [2345] }],
    },
  },
  {
    id: "types.union-correlation",
    title: "Discriminated union fields remain correlated",
    area: "types",
    reference: references.schema,
    document: bodyDocument({
      oneOf: [
        {
          type: "object",
          properties: { kind: { const: "person" }, name: stringSchema },
          required: ["kind", "name"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: { kind: { const: "company" }, registration: integerSchema },
          required: ["kind", "registration"],
          additionalProperties: false,
        },
      ],
    }),
    consumer: {
      source: consumer(`const client = createClient(api)
      function examples() {
        client.probe.call({ kind: "person", name: "Alice" })
        client.probe.call({ kind: "company", registration: 123 })
        // @negative INVALID_UNION_BRANCH
        client.probe.call({ kind: "person", registration: 123 })
      }`),
      diagnostics: [{ marker: "INVALID_UNION_BRANCH", codes: [2353, 2345] }],
    },
  },
  {
    id: "types.recursive-response",
    title: "Recursive schema references preserve nested response types",
    area: "types",
    reference: references.schema,
    document: {
      ...responseDocument({ $ref: "#/components/schemas/Node" }),
      components: {
        schemas: {
          Node: {
            type: "object",
            properties: {
              name: stringSchema,
              children: { type: "array", items: { $ref: "#/components/schemas/Node" } },
            },
            required: ["name"],
          },
        },
      },
    },
    consumer: {
      source: consumer(`type Node = ResponseOf<typeof api.probe.call>
      function inspect(node: Node) {
        const name: string | undefined = node.children?.[0]?.name
        // @negative RECURSIVE_TYPE
        const invalid: number = node.name
      }`),
      diagnostics: [{ marker: "RECURSIVE_TYPE", codes: [2322] }],
    },
  },
  {
    id: "types.query-mutation-separation",
    title: "Query and mutation adapters reject the wrong operation kind",
    area: "types",
    reference: references.accord,
    document: document({
      "/probe": {
        get: { operationId: "read", responses: { "204": { description: "OK" } } },
        post: { operationId: "write", responses: { "204": { description: "OK" } } },
      },
    }),
    consumer: {
      source: consumer(`function examples() {
      apiQuery(api.probe.read, {})
      apiMutation(api.probe.write)
      // @negative QUERY_ON_MUTATION
      apiQuery(api.probe.write, {})
      // @negative MUTATION_ON_QUERY
      apiMutation(api.probe.read)
    }`),
      diagnostics: [
        { marker: "QUERY_ON_MUTATION", codes: [2345, 2379] },
        { marker: "MUTATION_ON_QUERY", codes: [2345, 2379] },
      ],
    },
  },
  {
    id: "types.response-union",
    title: "Successful statuses, including wildcard 2XX, determine the returned union",
    area: "types",
    reference: references.response,
    document: endpoint({
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: stringSchema } } },
        "2XX": {
          description: "Success",
          content: { "application/json": { schema: integerSchema } },
        },
        "400": {
          description: "Error",
          content: { "application/json": { schema: { type: "boolean" } } },
        },
      },
    }),
    consumer: {
      source: consumer(`type Result = ResponseOf<typeof api.probe.call>
      type Success = Expect<Equal<Result["data"], string | number | undefined>>
      type Exact = Expect<Equal<Extract<Result, { status: 200 }>["data"], string>>
      type NoContent = Expect<Equal<Extract<Result, { status: 204 | 205 }>["data"], undefined>>
      type Failure = Expect<Equal<ErrorOf<typeof api.probe.call>, boolean>>
      type Status = Expect<Equal<ResponsesOf<typeof api.probe.call>[200], string>>`),
    },
  },
]
