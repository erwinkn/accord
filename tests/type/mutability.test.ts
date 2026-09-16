import { createClient, type DefaultInputOf, type ReadonlyInput } from "@accord/client"
import {
  apiMutation,
  apiMutationCall,
  apiQuery,
  apiQueryResponse,
  useApiMutation,
  useApiQuery,
} from "@accord/react-query"
import type { MutationFunctionContext } from "@tanstack/react-query"
import {
  api,
  type CreateOfferingArguments,
  type CreateOfferingDto,
  type ListOfferingsFullResponse,
  type OfferingDto,
  type OfferingDtoPage,
  type UpdateOfferingInput,
} from "../../examples/nest-market/sdk/index.js"
import { api as featureApi, type Node } from "../generated/features.js"

type Equal<L, R> =
  (<T>() => T extends L ? 1 : 2) extends <T>() => T extends R ? 1 : 2 ? true : false
type Expect<T extends true> = T
type _NativeBytes = Expect<Equal<ReadonlyInput<Uint8Array>, Uint8Array>>
type _NativeBlob = Expect<Equal<ReadonlyInput<Blob>, Blob>>
type _NativeDate = Expect<Equal<ReadonlyInput<Date>, Date>>

const draft: CreateOfferingDto = {
  name: "Draft",
  tags: [],
  terms: { currency: "EUR", closesAt: "2030-01-01", minimumInvestment: "100" },
}
draft.name = "Revised"
draft.description = "Added later"
draft.tags?.push("private")
draft.terms.currency = "USD"
const checked = { name: "Draft", tags: ["initial"] } satisfies Pick<
  CreateOfferingDto,
  "name" | "tags"
>
checked.name = "Revised"
checked.tags.push("another")

const update: UpdateOfferingInput = { offeringId: "o1" }
update.body = {}
update.body.name = "New name"
const defaultInput: DefaultInputOf<typeof api.offerings.createOffering> = draft
defaultInput.tags?.push("another")
const args: CreateOfferingArguments = [draft]
args[0].terms.minimumInvestment = "200"

declare const page: OfferingDtoPage
page.total = 2
page.items[0]!.tags?.push("reviewed")
page.items[0]!.terms.currency = "USD"
page.items.push(page.items[0]!)
function sortOfferings(offerings: OfferingDto[]) {
  offerings.sort((a, b) => a.name.localeCompare(b.name))
}
sortOfferings(page.items)
declare const full: ListOfferingsFullResponse
full.data = page
full.data.items = []

const tree: Node = { name: "root", children: [] }
tree.children?.push({ name: "leaf" })
tree.name = "renamed"
createClient(featureApi).nodes.createNode({
  body: { name: "root", children: [{ name: "leaf" }] },
} as const)

const client = createClient(api)
const immutable = {
  name: "Immutable",
  tags: ["private"],
  terms: { currency: "EUR", closesAt: "2030-01-01", minimumInvestment: "100" },
} as const
client.offerings.createOffering(immutable)
client.offerings.createOffering.withResponse(immutable)
client.documents.uploadDocument({
  offeringId: "o1",
  category: "terms",
  file: new Uint8Array(),
} as const)
client.offerings.listOfferings({ status: ["draft", "open"] } as const)
apiQuery(api.offerings.listOfferings, { status: ["draft", "open"] } as const)
apiQueryResponse(api.offerings.listOfferings, { status: ["draft"] } as const)
useApiQuery(api.offerings.listOfferings, { status: ["open"] } as const)
useApiMutation(api.offerings.createOffering).mutate(immutable)
declare const context: MutationFunctionContext
apiMutation(api.offerings.createOffering).mutationFn!(immutable, context)
apiMutationCall(api.offerings.createOffering).mutationFn!([immutable], context)

// @ts-expect-error Readonly input acceptance does not allow an invalid enum value.
client.offerings.listOfferings({ status: ["unknown"] } as const)
// @ts-expect-error Request fields still honor their schema types.
draft.terms.minimumInvestment = 100
// @ts-expect-error Mutability does not permit unknown DTO fields.
draft.undeclared = true
// @ts-expect-error Generated endpoint metadata stays readonly.
api.offerings.createOffering.path = "/changed"
