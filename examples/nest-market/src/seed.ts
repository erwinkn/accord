import { DocumentCategory, type DocumentDto } from "./documents/document.dto.js"
import type { Investor } from "./investors/investor.dto.js"
import { Currency, type OfferingDto, OfferingStatus } from "./offerings/offering.dto.js"
import { type SubscriptionDto, SubscriptionStatus } from "./subscriptions/subscription.dto.js"

export const SAMPLE_OFFERING_ID = "11111111-1111-4111-8111-111111111111"

export const demoOfferings: OfferingDto[] = [
  {
    id: SAMPLE_OFFERING_ID,
    name: "Harbor Renewable Fund",
    description:
      "Backing the next generation of European solar and wind infrastructure. Long-term assets, built for a changing world.",
    terms: {
      minimumInvestment: "1000.00",
      currency: Currency.EUR,
      closesAt: "2027-12-31T23:59:59Z",
    },
    tags: ["Infrastructure", "Energy transition"],
    status: OfferingStatus.Open,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111112",
    name: "Atelier Growth Partners",
    description:
      "Partnering with independent European brands as they enter their next chapter of growth.",
    terms: {
      minimumInvestment: "5000.00",
      currency: Currency.EUR,
      closesAt: "2027-06-30T23:59:59Z",
    },
    tags: ["Private equity", "Consumer"],
    status: OfferingStatus.Open,
    createdAt: "2026-02-12T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111113",
    name: "Northline Urban Living",
    description:
      "Thoughtfully designed rental housing in connected, walkable neighborhoods across northern Europe.",
    terms: {
      minimumInvestment: "2500.00",
      currency: Currency.EUR,
      closesAt: "2027-09-30T23:59:59Z",
    },
    tags: ["Real estate", "Residential"],
    status: OfferingStatus.Open,
    createdAt: "2026-03-08T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111114",
    name: "Signal Ventures II",
    description:
      "Early-stage capital for founders making essential industries more productive. Preparing our second vintage.",
    terms: {
      minimumInvestment: "10000.00",
      currency: Currency.USD,
      closesAt: "2028-03-31T23:59:59Z",
    },
    tags: ["Venture capital", "Technology"],
    status: OfferingStatus.Draft,
    createdAt: "2026-04-04T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111115",
    name: "Fieldwork Food Systems",
    description:
      "Patient capital for resilient agriculture, from better soil to shorter supply chains.",
    terms: {
      minimumInvestment: "1000.00",
      currency: Currency.EUR,
      closesAt: "2028-01-31T23:59:59Z",
    },
    tags: ["Natural capital", "Agriculture"],
    status: OfferingStatus.Draft,
    createdAt: "2026-05-18T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111116",
    name: "Meridian Credit I",
    description:
      "Direct lending to established businesses with a focus on operational resilience. This vintage is fully subscribed.",
    terms: {
      minimumInvestment: "25000.00",
      currency: Currency.USD,
      closesAt: "2026-06-30T23:59:59Z",
    },
    tags: ["Private credit", "Direct lending"],
    status: OfferingStatus.Closed,
    createdAt: "2025-11-20T00:00:00Z",
  },
]

export const demoInvestors: Investor[] = [
  {
    id: "22222222-2222-4222-8222-222222222221",
    kind: "individual",
    displayName: "Alex Morgan",
    email: "alex@example.test",
    country: "FR",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    kind: "company",
    displayName: "North Star Partners",
    email: "investments@northstar.example.test",
    country: "GB",
    registrationNumber: "NSP-2048",
  },
  {
    id: "22222222-2222-4222-8222-222222222223",
    kind: "individual",
    displayName: "Camille Laurent",
    email: "camille@example.test",
    country: "FR",
  },
  {
    id: "22222222-2222-4222-8222-222222222224",
    kind: "company",
    displayName: "Birch Family Office",
    email: "hello@birch.example.test",
    country: "NL",
    registrationNumber: "BFO-1092",
  },
]

export const demoSubscriptions: SubscriptionDto[] = demoOfferings.flatMap((offering, index) =>
  offering.status === OfferingStatus.Draft
    ? []
    : demoInvestors.slice(0, 3).map((investor, position) => ({
        id: `33333333-3333-4333-8333-${String(index * 10 + position + 1).padStart(12, "0")}`,
        offeringId: offering.id,
        investorId: investor.id,
        amount: `${BigInt(offering.terms.minimumInvestment.split(".")[0]!) * BigInt(position + 2)}.00`,
        status: position === 2 ? SubscriptionStatus.Draft : SubscriptionStatus.Submitted,
        submittedAt: position === 2 ? null : "2026-06-12T10:30:00Z",
        metadata: { source: "demo" },
      })),
)

export const demoDocuments = demoOfferings.map((offering, index) => {
  const bytes = new TextEncoder().encode(
    `# ${offering.name}\n\n${offering.description}\n\nMinimum subscription: ${offering.terms.minimumInvestment} ${offering.terms.currency}\n\nFictional example document for the Market demo.\n`,
  )
  const metadata: DocumentDto = {
    id: `44444444-4444-4444-8444-${String(index + 1).padStart(12, "0")}`,
    offeringId: offering.id,
    category: DocumentCategory.Prospectus,
    filename: `${offering.name.toLowerCase().replaceAll(" ", "-")}-overview.txt`,
    note: "An introduction to the offering",
    size: bytes.byteLength,
  }
  return { metadata, bytes }
})
