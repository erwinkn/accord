import { zodAdapter } from "@accord/zod"
import { consumer, document, references } from "./fixture.js"
import type { Fixture } from "./model.js"

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const roundTrip = (root: string) => ({
  "/probe": {
    post: {
      operationId: "call",
      requestBody: { required: true, content: { "application/json": { schema: ref(root) } } },
      responses: {
        200: { description: "ok", content: { "application/json": { schema: ref(root) } } },
      },
    },
  },
})

export const projectionCases: Fixture[] = [
  {
    id: "types.shared-recursive-projection",
    title:
      "A recursive model is shared between request and response, with native validation and correct wire data",
    area: "types",
    reference: references.accord,
    document: document(roundTrip("Page"), {
      schemas: {
        Page: {
          type: "object",
          required: ["items"],
          additionalProperties: false,
          properties: { items: { type: "array", items: ref("Node") } },
        },
        Node: {
          type: "object",
          required: ["name"],
          additionalProperties: false,
          properties: { name: { type: "string" }, child: ref("Node") },
        },
      },
    }),
    config: { validators: zodAdapter() },
    consumer: {
      source: consumer(`import type { Page, Node } from "./generated.js"
      type SharedInput = Expect<Equal<InputOf<typeof api.probe.call>, Page>>
      type SharedResponse = Expect<Equal<ResponseOf<typeof api.probe.call>, Page>>
      function invalid() {
        // @negative NESTED_VALUE
        createClient(api).probe.call({ items: [{ name: "root", child: { name: 42 } }] })
      }
      export async function run() {
        const root: Node = { name: "root", child: { name: "leaf" } }
        await withServer(async (baseUrl, requests) => {
          const result = await createClient(api, { baseUrl }).probe.call({ items: [root] })
          assert.deepEqual(JSON.parse(requests[0]!.body.toString()), { items: [root] })
          assert.deepEqual(result.items[0], root)
        }, { status: 200, headers: { "content-type": "application/json" }, body: '{"items":[{"name":"root","child":{"name":"leaf"}}]}' })
      }`),
      diagnostics: [{ marker: "NESTED_VALUE", codes: [2322, 2345] }],
    },
  },
  {
    id: "types.transitive-projection-difference",
    title: "Read/write differences propagate through mutually recursive model references",
    area: "types",
    reference: references.schema,
    document: document(roundTrip("A"), {
      schemas: {
        A: { type: "object", additionalProperties: false, properties: { next: ref("B") } },
        B: { type: "object", additionalProperties: false, properties: { next: ref("C") } },
        C: {
          type: "object",
          required: ["id", "password"],
          properties: {
            next: ref("A"),
            id: { type: "string", readOnly: true },
            password: { type: "string", writeOnly: true },
          },
        },
      },
    }),
    config: { validators: zodAdapter() },
    consumer: {
      source: consumer(`import type { ARequest, A } from "./generated.js"
      type Input = Expect<Equal<InputOf<typeof api.probe.call>, ARequest>>
      type Output = Expect<Equal<ResponseOf<typeof api.probe.call>, A>>
      type InputLeaf = NonNullable<NonNullable<ARequest["next"]>["next"]>
      type OutputLeaf = NonNullable<NonNullable<A["next"]>["next"]>
      type InputId = Expect<Equal<InputLeaf["id"], undefined>>
      type OutputPassword = Expect<Equal<OutputLeaf["password"], undefined>>
      function invalid() {
        // @negative READONLY_NESTED_INPUT
        createClient(api).probe.call({ next: { next: { id: "forbidden", password: "secret" } } })
      }
      export async function run() {
        await withServer(async (baseUrl, requests) => {
          const result = await createClient(api, { baseUrl }).probe.call({ next: { next: { password: "secret" } } })
          assert.deepEqual(JSON.parse(requests[0]!.body.toString()), { next: { next: { password: "secret" } } })
          assert.equal(result.next?.next?.id, "id1")
          assert.equal(result.next?.next?.password, undefined)
        }, { status: 200, headers: { "content-type": "application/json" }, body: '{"next":{"next":{"id":"id1"}}}' })
      }`),
      diagnostics: [{ marker: "READONLY_NESTED_INPUT", codes: [2322, 2345] }],
    },
  },
]
