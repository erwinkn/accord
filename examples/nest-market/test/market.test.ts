import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import { after, before, test } from "node:test"
import { createClient, HttpError, ValidationError } from "@accord/client"
import { generateFromFile } from "@accord/codegen"
import { QueryClient } from "@tanstack/react-query"
import { createApplication, createOpenApiDocument } from "../dist/src/app.js"
import { DEMO_TOKEN } from "../dist/src/common.js"
import { SAMPLE_OFFERING_ID } from "../dist/src/market.store.js"
import { api } from "../sdk/sdk.js"
import { createMarketClient, openOfferings, runInvestmentWorkflow } from "../usage.js"

const app = await createApplication()
let baseUrl: string
before(async () => {
  await app.listen(0, "127.0.0.1")
  baseUrl = await app.getUrl()
})
after(async () => {
  await app.close()
})

function httpError(status: number, code: string) {
  // eslint-disable-next-line anti-slop/no-unknown-parameters -- assert.rejects supplies arbitrary thrown values at this test boundary.
  return (error: unknown): boolean => {
    assert(error instanceof HttpError)
    assert.equal(error.status, status)
    assert.deepEqual(error.body?.code, code)
    assert.equal(
      error.cause,
      undefined,
      "The declared error validator must accept the server's error body",
    )
    return true
  }
}

test("Nest's exported document and Accord output match the committed artifacts", async () => {
  const document = createOpenApiDocument(app)
  assert.equal(`${JSON.stringify(document, null, 2)}\n`, await readFile("openapi.json", "utf8"))
  const generated = await generateFromFile("openapi.json", { namespace: "tag", validators: true })
  assert.equal(generated.model.operations.length, 18)
  assert.equal(Object.keys(document.components?.schemas ?? {}).length, 21)
  assert.deepEqual(
    Object.fromEntries(
      generated.model.operations
        .filter((operation) => operation.body)
        .map((operation) => [operation.key, operation.body?.mode]),
    ),
    {
      createOffering: "merge",
      updateOffering: "separate",
      createIndividualInvestor: "merge",
      createCompanyInvestor: "merge",
      createSubscription: "merge",
      uploadDocument: "merge",
    },
  )
  assert.equal(generated.source, await readFile("sdk/sdk.ts", "utf8"))
  const companions = (await readdir("sdk")).filter((file) => file.includes(".validators."))
  assert.deepEqual(companions.sort(), Object.keys(generated.files).sort())
  for (const [name, source] of Object.entries(generated.files))
    assert.equal(await readFile(`sdk/${name}`, "utf8"), source)
})

test("the generated SDK completes the real HTTP investment workflow", async () => {
  const result = await runInvestmentWorkflow(createMarketClient(baseUrl, DEMO_TOKEN))
  assert.equal(result.subscription.status, "submitted")
  assert.equal(result.subscription.amount, "2500.00")
  assert.deepEqual(result.subscription.metadata, { advisor: "demo", campaign: "autumn" })
  assert.equal(result.label, "REG-123456")
  assert.equal("onboardingNote" in result.investor, false)
  assert.equal(result.document.filename, "terms.txt")
  assert.equal(result.downloadedBytes, Buffer.byteLength("Harbor offering terms\n"))
  assert.match(result.contentDisposition ?? "", /terms\.txt/)
  assert.equal(
    result.reportSummary,
    `offeringId,subscriptionCount,currency\n${result.offering.id},1,EUR`,
  )
})

test("query arrays, pagination, mapped DTOs and nullable updates agree with Nest", async () => {
  const client = createMarketClient(baseUrl, DEMO_TOKEN)
  const first = await client.offerings.listOfferings({ status: ["open"], page: 1, limit: 1 })
  assert.equal(first.items[0]?.id, SAMPLE_OFFERING_ID)
  const created = await client.offerings.createOffering({
    name: "Update Test Fund",
    terms: { currency: "USD", minimumInvestment: "100.00", closesAt: "2027-01-01T00:00:00Z" },
    description: "Before",
  })
  const combined = await client.offerings.listOfferings({ status: ["open", "draft"], limit: 100 })
  assert(combined.items.some((item) => item.id === created.id && item.status === "draft"))
  const updated = await client.offerings.updateOffering({
    offeringId: created.id,
    body: { description: null },
  })
  assert.equal(updated.description, null)
  assert.equal(updated.name, created.name)
  assert.deepEqual(updated.terms, created.terms)
  assert.deepEqual(await client.offerings.updateOffering({ offeringId: created.id }), updated)
  assert.deepEqual(
    await client.offerings.updateOffering({ offeringId: created.id, body: {} }),
    updated,
  )
  const full = await client.offerings.getOffering.withResponse(
    { offeringId: created.id },
    { headers: { "x-request-id": "test-trace" } },
  )
  assert.equal(full.headers.get("x-request-id"), "test-trace")
  assert.equal(await client.offerings.deleteOffering({ offeringId: created.id }), undefined)
  await assert.rejects(
    client.offerings.getOffering({ offeringId: created.id }),
    httpError(404, "NOT_FOUND"),
  )
})

test("polymorphic investors and both submission statuses stay correlated", async () => {
  const client = createMarketClient(baseUrl, DEMO_TOKEN)
  const investor = await client.investors.createIndividualInvestor({
    kind: "individual",
    displayName: "Alex Morgan",
    email: "alex@example.test",
    country: "FR",
  })
  const profile = await client.investors.getInvestor({ investorId: investor.id })
  assert.equal(profile.kind, "individual")
  const subscription = await client.subscriptions.createSubscription({
    offeringId: SAMPLE_OFFERING_ID,
    investorId: investor.id,
    amount: "1500.00",
  })
  assert.equal(subscription.submittedAt, null)
  const instant = await client.subscriptions.submitSubscription({ subscriptionId: subscription.id })
  assert.equal(instant.status, 200)
  if (instant.status === 200) assert.equal(instant.data.status, "submitted")
  const accepted = await client.subscriptions.submitSubscription.withResponse({
    subscriptionId: subscription.id,
    background: true,
  })
  assert.equal(accepted.status, 202)
  if (accepted.status === 202) {
    assert.equal(accepted.headers.get("location"), `/api/v1/jobs/${accepted.data.jobId}`)
    const job = await client.jobs.getSubmissionJob({ jobId: accepted.data.jobId })
    assert.equal(job.result.id, subscription.id)
  }
  const fetched = await client.subscriptions.getSubscription({ subscriptionId: subscription.id })
  assert.equal(fetched.submittedAt, instant.data.submittedAt)
  const page = await client.subscriptions.listSubscriptions({
    offeringId: SAMPLE_OFFERING_ID,
    investorId: investor.id,
  })
  assert.deepEqual(
    page.items.map((item) => item.id),
    [subscription.id],
  )
  await assert.rejects(
    client.offerings.deleteOffering({ offeringId: SAMPLE_OFFERING_ID }),
    httpError(409, "CONFLICT"),
  )
})

test("multipart survives real Multer parsing and binary download preserves every byte", async () => {
  const client = createMarketClient(baseUrl, DEMO_TOKEN)
  const bytes = new Uint8Array([0, 1, 127, 128, 255, 10, 13])
  const uploaded = await client.documents.uploadDocument({
    offeringId: SAMPLE_OFFERING_ID,
    file: new File([bytes], "proof.bin"),
    category: "other",
    note: "Exact bytes",
  })
  const metadata = await client.documents.getDocument({ documentId: uploaded.id })
  assert.equal(metadata.note, "Exact bytes")
  assert.equal(metadata.size, bytes.byteLength)
  assert.deepEqual(
    new Uint8Array(await client.documents.downloadDocument({ documentId: uploaded.id })),
    bytes,
  )
  assert.equal(await client.documents.deleteDocument({ documentId: uploaded.id }), undefined)
  await assert.rejects(
    client.documents.getDocument({ documentId: uploaded.id }),
    httpError(404, "NOT_FOUND"),
  )
})

test("content negotiation discriminates JSON and CSV full responses", async () => {
  const client = createMarketClient(baseUrl, DEMO_TOKEN)
  const report = await client.offerings.exportOffering.withResponse({
    offeringId: SAMPLE_OFFERING_ID,
  })
  assert.equal(report.mediaType, "application/json")
  if (report.mediaType === "application/json") assert.equal(report.data.currency, "EUR")
  const csv = await client.offerings.exportOffering.withResponse(
    { offeringId: SAMPLE_OFFERING_ID },
    { headers: { accept: "text/csv" } },
  )
  assert.equal(csv.mediaType, "text/csv")
  if (csv.mediaType === "text/csv")
    assert(csv.data.startsWith("offeringId,subscriptionCount,currency\n"))
})

test("all binary upload input types work with Multer, including empty and unnamed files", async () => {
  const client = createMarketClient(baseUrl, DEMO_TOKEN)
  const bytes = new Uint8Array([0, 128, 255])
  for (const file of [bytes, bytes.buffer, new Blob([bytes]), new File([], "empty.bin")]) {
    const uploaded = await client.documents.uploadDocument({
      offeringId: SAMPLE_OFFERING_ID,
      file,
      category: "other",
    })
    const downloaded = await client.documents.downloadDocument({ documentId: uploaded.id })
    assert.deepEqual(new Uint8Array(downloaded), file instanceof File ? new Uint8Array() : bytes)
    await client.documents.deleteDocument({ documentId: uploaded.id })
  }
})

test("authentication and request validation run on Nest and retain typed HTTP errors", async () => {
  await assert.rejects(
    createMarketClient(baseUrl, "wrong-token").offerings.listOfferings(),
    httpError(401, "UNAUTHORIZED"),
  )
  const client = createMarketClient(baseUrl, DEMO_TOKEN)
  // A string satisfies the caller type; its format is the server's responsibility.
  await assert.rejects(
    client.investors.createIndividualInvestor({
      kind: "individual",
      displayName: "Alex Morgan",
      email: "not-an-email",
      country: "FR",
    }),
    httpError(400, "BAD_REQUEST"),
  )
  await assert.rejects(
    client.offerings.listOfferings({ limit: 101 }),
    httpError(400, "BAD_REQUEST"),
  )
})

test("the server enforces the closed DTOs declared in OpenAPI", async () => {
  const terms = { currency: "EUR", minimumInvestment: "1000.00", closesAt: "2027-01-01T00:00:00Z" }
  for (const body of [
    { name: "Invalid Fund", terms, unexpected: "rejected" },
    { name: "Invalid Fund", terms: { ...terms, unexpected: "rejected" } },
  ]) {
    // Bypass the typed SDK to exercise invalid input at the actual HTTP boundary.
    const response = await fetch(`${baseUrl}/api/v1/offerings`, {
      method: "POST",
      headers: { authorization: `Bearer ${DEMO_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    assert.equal(response.status, 400)
    assert.match(await response.text(), /property unexpected should not exist/)
  }
})

test("generated response validators reject a corrupted response after a real HTTP exchange", async () => {
  const client = createClient(api, {
    baseUrl,
    credentials: { bearer: DEMO_TOKEN },
    fetch: async (url, init) => {
      const response = await fetch(url, init)
      const offering = await response.json()
      return Response.json(
        { ...offering, terms: { ...offering.terms, currency: "NOT_A_CURRENCY" } },
        { status: response.status, headers: response.headers },
      )
    },
  })
  await assert.rejects(
    client.offerings.getOffering({ offeringId: SAMPLE_OFFERING_ID }),
    ValidationError,
  )
})

test("React Query options execute the generated endpoint against the live app", async () => {
  const cache = new QueryClient()
  try {
    const page = await cache.fetchQuery(openOfferings(createMarketClient(baseUrl, DEMO_TOKEN)))
    assert.equal(page.items[0]?.id, SAMPLE_OFFERING_ID)
  } finally {
    cache.clear()
  }
})
