import { api, type DocumentDto } from "../../examples/nest-market/sdk/index.js"
import {
  marketMutationCall,
  marketQuery,
  marketQueryResponse,
  useMarket,
  useMarketMutation,
} from "../../examples/nest-market/sdk/react-query.js"

const result = useMarket(api.documents.getDocument, { documentId: "doc1" })
const document: DocumentDto | undefined = result.data
void document
useMarket(api.offerings.listOfferings)
useMarket(api.offerings.listOfferings, { status: ["open", "draft"] } as const)
useMarket(
  api.documents.getDocument,
  { documentId: "doc1" },
  { headers: { accept: "application/json" } },
)

// @ts-expect-error the endpoint's required input is preserved
useMarket(api.documents.getDocument)
// @ts-expect-error documentId is a string
useMarket(api.documents.getDocument, { documentId: 42 })
// @ts-expect-error unknown query fields remain rejected
useMarket(api.documents.getDocument, { documentId: "doc1", unknown: true })
// @ts-expect-error mutation endpoints cannot be queried
useMarket(api.documents.deleteDocument, { documentId: "doc1" })
// @ts-expect-error query endpoints cannot be mutated
useMarketMutation(api.documents.getDocument)

const removal = useMarketMutation(api.documents.deleteDocument)
removal.mutate({ documentId: "doc1" })
// @ts-expect-error mutation input is inferred from its endpoint
removal.mutate({ documentId: 42 })
marketQuery(api.documents.getDocument, { documentId: "doc1" })
marketQueryResponse(api.documents.getDocument, { documentId: "doc1" })
marketMutationCall(api.documents.uploadDocument)
