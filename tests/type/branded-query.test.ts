import { createClient } from "@accord/client"
import type { ClientError } from "@accord/react-query"
import { api, type DocumentDto } from "../../examples/nest-market/sdk/index.js"
import {
  marketMutationCall,
  marketQuery,
  marketQueryResponse,
  useMarket,
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
// @ts-expect-error mutation input belongs to mutate(), not the hook call
useMarket(api.documents.deleteDocument, { documentId: "doc1" })
// @ts-expect-error a query result has no mutation API
result.mutate({ documentId: "doc1" })

const extraInput = { documentId: "doc1", unknown: true }
// @ts-expect-error unknown fields remain rejected even outside an object literal
useMarket(api.documents.getDocument, extraInput)

const removal = useMarket(api.documents.deleteDocument)
removal.mutate({ documentId: "doc1" })
const deleted: Promise<void> = removal.mutateAsync({ documentId: "doc1" })
const error: ClientError<typeof api.documents.deleteDocument> | null = removal.error
void deleted
void error
// @ts-expect-error mutation input is inferred from its endpoint
removal.mutate({ documentId: 42 })
// @ts-expect-error required mutation inputs are preserved
removal.mutate({})
// @ts-expect-error a mutation result has no query API
removal.refetch()

const client = createClient(api)
const boundQuery = useMarket(client.documents.getDocument, { documentId: "doc1" })
const boundDocument: DocumentDto | undefined = boundQuery.data
void boundDocument
useMarket(client.documents.deleteDocument).mutate({ documentId: "doc1" })
// @ts-expect-error bound queries still require their input
useMarket(client.documents.getDocument)
// @ts-expect-error bound mutations preserve input types
useMarket(client.documents.deleteDocument).mutate({ documentId: 42 })

const upload = useMarket(api.documents.uploadDocument)
const uploaded: Promise<DocumentDto> = upload.mutateAsync({
  offeringId: "offering1",
  category: "terms",
  file: new Blob(["terms"]),
} as const)
void uploaded
// @ts-expect-error file uploads require binary values
upload.mutate({ offeringId: "offering1", category: "terms", file: "terms" })

declare const uncertain: typeof api.documents.getDocument | typeof api.documents.deleteDocument
// @ts-expect-error narrow a mixed query/mutation endpoint before choosing its arguments
useMarket(uncertain)
marketQuery(api.documents.getDocument, { documentId: "doc1" })
marketQueryResponse(api.documents.getDocument, { documentId: "doc1" })
marketMutationCall(api.documents.uploadDocument)
