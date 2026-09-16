import type {
  CompanyInvestorDto,
  IndividualInvestorDto,
  OfferingDto,
  SubscriptionDto,
} from "../sdk/sdk.js"
import type { MarketClient } from "../usage.js"

// Compiled, never executed: negative assertions must remain rejected by the generated SDK.
export async function callerContract(client: MarketClient) {
  const page = await client.offerings.listOfferings({ status: ["open", "draft"], limit: 5 })
  const offering: OfferingDto | undefined = page.items[0]
  void offering
  // @ts-expect-error page DTOs describe fixed records, not arbitrary dictionaries
  page.unlistedField
  if (offering) {
    // @ts-expect-error response DTOs reject misspelled or undeclared properties
    offering.unlistedField
  }
  // @ts-expect-error nested terms are required
  client.offerings.createOffering({ name: "Incomplete" })
  // @ts-expect-error money is a decimal string
  client.subscriptions.createSubscription({
    offeringId: "id",
    investorId: "id",
    amount: 2500,
  })
  // @ts-expect-error unsupported enum member
  client.offerings.listOfferings({ status: ["paused"] })
  // @ts-expect-error partial does not mean nullable
  client.offerings.updateOffering({ offeringId: "id", body: { terms: null } })
  // @ts-expect-error uploads accept bytes, not a local filesystem path
  client.documents.uploadDocument({
    offeringId: "id",
    category: "terms",
    file: "/tmp/file.pdf",
  })
  // @ts-expect-error an optional whole body stays separate from path parameters
  client.offerings.updateOffering({ offeringId: "id", description: null })
  await client.offerings.updateOffering({ offeringId: "id" })
  await client.offerings.updateOffering({ offeringId: "id", body: {} })

  const investor = await client.investors.getInvestor({ investorId: "id" })
  if (investor.kind === "company") investor satisfies CompanyInvestorDto
  else investor satisfies IndividualInvestorDto

  const result = await client.subscriptions.submitSubscription({ subscriptionId: "id" })
  if (result.status === 200) result.data satisfies SubscriptionDto
  else {
    const job: string = result.data.jobId
    void job
    // @ts-expect-error a queued result does not have a typed subscription amount
    const amount: string = result.data.amount
    void amount
  }
  const downloaded: ArrayBuffer = await client.documents.downloadDocument({ documentId: "id" })
  const removed: undefined = await client.documents.deleteDocument({ documentId: "id" })
  void downloaded
  void removed
  const report = await client.offerings.exportOffering.withResponse({ offeringId: "id" })
  if (report.mediaType === "text/csv") report.data satisfies string
  else report.data.subscriptionCount satisfies number
}
