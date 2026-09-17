import assert from "node:assert/strict"
import { test } from "node:test"
import { createClient } from "@accord/client"
import { createApplication } from "../dist/src/app.js"
import { DEMO_TOKEN } from "../dist/src/common.js"
import { SAMPLE_OFFERING_ID } from "../dist/src/market.store.js"
import { api } from "../sdk/index.js"

test("seeded workspace data is linked, validated and isolated between server instances", async () => {
  const app = await createApplication()
  const other = await createApplication()
  try {
    await app.listen(0, "127.0.0.1")
    await other.listen(0, "127.0.0.1")
    const client = createClient(api, { baseUrl: await app.getUrl(), token: DEMO_TOKEN })
    const otherClient = createClient(api, { baseUrl: await other.getUrl(), token: DEMO_TOKEN })
    const offerings = await client.offerings.listOfferings()
    assert.equal(offerings.total, 6)
    assert.deepEqual(
      new Set(offerings.items.map((item) => item.status)),
      new Set(["open", "draft", "closed"]),
    )
    const investors = await client.investors.listInvestors()
    assert.equal(investors.length, 4)
    assert.deepEqual(
      new Set(investors.map((item) => item.kind)),
      new Set(["individual", "company"]),
    )
    const subscriptions = await client.subscriptions.listSubscriptions({
      offeringId: SAMPLE_OFFERING_ID,
    })
    for (const subscription of subscriptions.items)
      assert(investors.some((item) => item.id === subscription.investorId))
    const documents = await client.documents.listDocuments({ offeringId: SAMPLE_OFFERING_ID })
    assert.equal(documents.length, 1)
    const document = documents[0]!
    const bytes = await client.documents.downloadDocument({ documentId: document.id })
    assert.equal(bytes.byteLength, document.size)
    assert.match(new TextDecoder().decode(bytes), /Harbor Renewable Fund/)
    const uploaded = await client.documents.uploadDocument({
      offeringId: SAMPLE_OFFERING_ID,
      category: "other",
      file: new File(["Hello"], "hello.txt"),
    })
    assert(
      (await client.documents.listDocuments({ offeringId: SAMPLE_OFFERING_ID })).some(
        (item) => item.id === uploaded.id,
      ),
    )
    assert.equal(
      (await otherClient.documents.listDocuments({ offeringId: SAMPLE_OFFERING_ID })).length,
      1,
    )
    await client.offerings.updateOffering({
      offeringId: SAMPLE_OFFERING_ID,
      body: {
        terms: { minimumInvestment: "12.00", currency: "USD", closesAt: "2027-01-01T00:00:00Z" },
      },
    })
    assert.equal(
      (await otherClient.offerings.getOffering({ offeringId: SAMPLE_OFFERING_ID })).terms
        .minimumInvestment,
      "1000.00",
    )
  } finally {
    await Promise.all([app.close(), other.close()])
  }
})

test("API requests experience randomized delay within the configured range, including errors", async () => {
  const app = await createApplication({ latency: { minMs: 40, maxMs: 90 } })
  try {
    await app.listen(0, "127.0.0.1")
    const url = await app.getUrl()
    const delays = await Promise.all(
      Array.from({ length: 10 }, async (_, index) => {
        const start = performance.now()
        const response = await fetch(`${url}/api/v1/offerings`, {
          headers: { authorization: index === 0 ? "invalid" : `Bearer ${DEMO_TOKEN}` },
        })
        await response.arrayBuffer()
        const delay = Number(response.headers.get("x-demo-latency-ms"))
        assert(delay >= 40 && delay <= 90)
        assert(
          performance.now() - start >= delay - 5,
          "The declared delay must actually be awaited",
        )
        assert.equal(response.status, index === 0 ? 401 : 200)
        return delay
      }),
    )
    // Ten draws from 51 values all matching would have probability 51^-9.
    assert(new Set(delays).size > 1)
  } finally {
    await app.close()
  }
  await assert.rejects(createApplication({ latency: { minMs: 100, maxMs: 50 } }), /Latency/)
  await assert.rejects(createApplication({ latency: { minMs: Number.NaN, maxMs: 50 } }), /Latency/)
})
