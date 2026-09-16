import { createClient } from "@accord/client"
import { apiQuery } from "@accord/react-query"
import { api } from "./sdk/sdk.js"

export function createMarketClient(baseUrl: string, token: string) {
  return createClient(api, { baseUrl, credentials: { bearer: token }, cacheScope: "demo-account" })
}
export type MarketClient = ReturnType<typeof createMarketClient>

export function openOfferings(client: MarketClient) {
  return {
    ...apiQuery(client.offerings.listOfferings, { status: ["open"], page: 1, limit: 10 }),
    staleTime: 30_000,
  }
}

/** A complete workflow using only types and calls generated from Nest's OpenAPI output. */
export async function runInvestmentWorkflow(client: MarketClient) {
  const offering = await client.offerings.createOffering({
    body: {
      name: "Harbor Growth Fund",
      terms: { minimumInvestment: "1000.00", currency: "EUR", closesAt: "2027-12-31T23:59:59Z" },
      description: "Private market investments",
      tags: ["growth", "europe"],
    },
  })
  await client.offerings.updateOffering({ offeringId: offering.id, body: { description: null } })
  const investor = await client.investors.createCompanyInvestor({
    body: {
      kind: "company",
      displayName: "North Star Partners",
      email: "investments@example.test",
      country: "FR",
      registrationNumber: "REG-123456",
      onboardingNote: "Shown only during onboarding",
    },
  })
  const profile = await client.investors.getInvestor({ investorId: investor.id })
  const label = profile.kind === "company" ? profile.registrationNumber : profile.displayName

  const draft = await client.subscriptions.createSubscription({
    offeringId: offering.id,
    body: {
      investorId: investor.id,
      amount: "2500.00",
      metadata: { advisor: "demo", campaign: "autumn" },
    },
  })
  const outcome = await client.subscriptions.submitSubscription(
    { subscriptionId: draft.id, background: true },
    { headers: { "x-request-id": "example-submission" } },
  )
  const subscription =
    outcome.status === 200
      ? outcome.data
      : (await client.jobs.getSubmissionJob({ jobId: outcome.data.jobId })).result

  const document = await client.documents.uploadDocument({
    offeringId: offering.id,
    body: {
      file: new File(["Harbor offering terms\n"], "terms.txt", { type: "text/plain" }),
      category: "terms",
      note: "For investor review",
    },
  })
  const download = await client.documents.downloadDocument.withResponse({ documentId: document.id })
  const report = await client.offerings.exportOffering.withResponse(
    { offeringId: offering.id },
    { headers: { accept: "text/csv" } },
  )
  // mediaType correlates the decoded value even when one status has several formats.
  const reportSummary =
    report.mediaType === "text/csv" ? report.data.trim() : report.data.subscriptionCount
  return {
    offering,
    investor,
    label,
    subscription,
    document,
    downloadedBytes: download.data.byteLength,
    contentDisposition: download.headers.get("content-disposition"),
    reportSummary,
  }
}
