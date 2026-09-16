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
    id: "types.recursive-domain-slices",
    title: "Domain DTO imports support mutual recursion, shared types and native validators",
    area: "types",
    reference: references.accord,
    document: document(
      {
        "/users": {
          get: {
            operationId: "getUser",
            responses: {
              200: { description: "ok", content: { "application/json": { schema: ref("User") } } },
            },
          },
        },
        "/teams": {
          get: {
            operationId: "getTeam",
            responses: {
              200: { description: "ok", content: { "application/json": { schema: ref("Team") } } },
            },
          },
        },
      },
      {
        schemas: {
          User: {
            type: "object",
            required: ["name"],
            additionalProperties: false,
            properties: { name: { type: "string" }, team: ref("Team"), detail: ref("Detail") },
          },
          Team: {
            type: "object",
            required: ["name"],
            additionalProperties: false,
            properties: { name: { type: "string" }, owner: ref("User"), detail: ref("Detail") },
          },
          Detail: { type: "object", additionalProperties: { type: "string" } },
        },
      },
    ),
    config: { validators: zodAdapter() },
    consumer: {
      source: consumer(`import type { User, Team, Detail } from "./generated.js"
      import type { User as SliceUser } from "./generated/types/users.js"
      import type { Team as SliceTeam } from "./generated/types/teams.js"
      import type { Detail as SharedDetail } from "./generated/types/shared.js"
      type UserExport = Expect<Equal<User, SliceUser>>
      type TeamExport = Expect<Equal<Team, SliceTeam>>
      type SharedExport = Expect<Equal<Detail, SharedDetail>>
      function invalid() {
        // @negative CROSS_SLICE_VALUE
        const value: User = { name: "Ada", team: { name: "Platform", owner: { name: 42 } } }
      }
      export async function run() {
        const value: User & Team = {
          name: "root",
          team: { name: "Platform", owner: { name: "Ada" }, detail: { label: "team" } },
          detail: { label: "root" }
        }
        await withServer(async (baseUrl) => {
          const client = createClient(api, { baseUrl })
          assert.deepEqual(await client.users.getUser(), value)
        }, { status: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(value) })
        await withServer(async (baseUrl) => {
          const client = createClient(api, { baseUrl })
          assert.deepEqual(await client.teams.getTeam(), value.team)
        }, { status: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(value.team) })
      }`),
      diagnostics: [{ marker: "CROSS_SLICE_VALUE", codes: [2322] }],
    },
  },
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
