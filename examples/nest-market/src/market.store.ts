import { randomUUID } from "node:crypto"
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Module,
  NotFoundException,
} from "@nestjs/common"
import type { DocumentDto, DocumentFieldsDto } from "./documents/document.dto.js"
import type {
  CompanyInvestorDto,
  CreateCompanyInvestorDto,
  CreateIndividualInvestorDto,
  IndividualInvestorDto,
  Investor,
} from "./investors/investor.dto.js"
import {
  type CreateOfferingDto,
  Currency,
  type OfferingDto,
  OfferingStatus,
  type UpdateOfferingDto,
} from "./offerings/offering.dto.js"
import {
  type CreateSubscriptionDto,
  type SubmissionJobDto,
  type SubscriptionDto,
  SubscriptionStatus,
} from "./subscriptions/subscription.dto.js"

export const SAMPLE_OFFERING_ID = "11111111-1111-4111-8111-111111111111"
interface StoredDocument {
  metadata: DocumentDto
  bytes: Uint8Array
}

/** In-memory state is per app instance: generation and tests need no infrastructure. */
@Injectable()
export class MarketStore {
  private readonly offerings = new Map<string, OfferingDto>([
    [
      SAMPLE_OFFERING_ID,
      {
        id: SAMPLE_OFFERING_ID,
        name: "Harbor Renewable Fund",
        terms: {
          minimumInvestment: "1000.00",
          currency: Currency.EUR,
          closesAt: "2027-12-31T23:59:59Z",
        },
        description: null,
        tags: ["renewables"],
        status: OfferingStatus.Open,
        createdAt: "2026-01-01T00:00:00Z",
      },
    ],
  ])
  private readonly investors = new Map<string, Investor>()
  private readonly subscriptions = new Map<string, SubscriptionDto>()
  private readonly documents = new Map<string, StoredDocument>()
  private readonly jobs = new Map<string, SubmissionJobDto>()

  listOfferings(status?: OfferingStatus[]): OfferingDto[] {
    return [...this.offerings.values()].filter(
      (offering) => !status || status.includes(offering.status),
    )
  }
  offering(id: string): OfferingDto {
    const offering = this.offerings.get(id)
    if (!offering) throw new NotFoundException("Offering not found")
    return offering
  }
  createOffering(input: CreateOfferingDto): OfferingDto {
    const offering: OfferingDto = {
      ...input,
      id: randomUUID(),
      status: OfferingStatus.Draft,
      createdAt: new Date().toISOString(),
    }
    this.offerings.set(offering.id, offering)
    return offering
  }
  updateOffering(id: string, input: UpdateOfferingDto): OfferingDto {
    const offering = this.offering(id)
    Object.assign(offering, input)
    return offering
  }
  deleteOffering(id: string): void {
    this.offering(id)
    if (this.listSubscriptions(id).length)
      throw new ConflictException("An offering with subscriptions cannot be deleted")
    this.offerings.delete(id)
    for (const [key, document] of this.documents)
      if (document.metadata.offeringId === id) this.documents.delete(key)
  }

  createIndividual(input: CreateIndividualInvestorDto): IndividualInvestorDto {
    const { onboardingNote: _note, ...publicFields } = input
    const investor: IndividualInvestorDto = { ...publicFields, id: randomUUID() }
    this.investors.set(investor.id, investor)
    return investor
  }
  createCompany(input: CreateCompanyInvestorDto): CompanyInvestorDto {
    const { onboardingNote: _note, ...publicFields } = input
    const investor: CompanyInvestorDto = { ...publicFields, id: randomUUID() }
    this.investors.set(investor.id, investor)
    return investor
  }
  investor(id: string): Investor {
    const investor = this.investors.get(id)
    if (!investor) throw new NotFoundException("Investor not found")
    return investor
  }

  createSubscription(offeringId: string, input: CreateSubscriptionDto): SubscriptionDto {
    const offering = this.offering(offeringId)
    this.investor(input.investorId)
    if (
      BigInt(input.amount.replace(".", "")) <
      BigInt(offering.terms.minimumInvestment.replace(".", ""))
    )
      throw new BadRequestException("Amount is below the offering's minimum investment")
    const subscription: SubscriptionDto = {
      ...input,
      id: randomUUID(),
      offeringId,
      status: SubscriptionStatus.Draft,
      submittedAt: null,
    }
    this.subscriptions.set(subscription.id, subscription)
    return subscription
  }
  listSubscriptions(offeringId: string, investorId?: string): SubscriptionDto[] {
    this.offering(offeringId)
    return [...this.subscriptions.values()].filter(
      (item) => item.offeringId === offeringId && (!investorId || item.investorId === investorId),
    )
  }
  subscription(id: string): SubscriptionDto {
    const subscription = this.subscriptions.get(id)
    if (!subscription) throw new NotFoundException("Subscription not found")
    return subscription
  }
  submit(id: string): SubscriptionDto {
    const subscription = this.subscription(id)
    subscription.status = SubscriptionStatus.Submitted
    subscription.submittedAt ??= new Date().toISOString()
    return subscription
  }
  createSubmissionJob(id: string): SubmissionJobDto {
    // Real services would enqueue work. The demo completes it inline and exposes the job resource.
    const job: SubmissionJobDto = { id: randomUUID(), state: "completed", result: this.submit(id) }
    this.jobs.set(job.id, job)
    return job
  }
  job(id: string): SubmissionJobDto {
    const job = this.jobs.get(id)
    if (!job) throw new NotFoundException("Job not found")
    return job
  }

  upload(offeringId: string, fields: DocumentFieldsDto, file: Express.Multer.File): DocumentDto {
    this.offering(offeringId)
    const metadata: DocumentDto = {
      ...fields,
      id: randomUUID(),
      offeringId,
      filename: file.originalname,
      size: file.size,
    }
    this.documents.set(metadata.id, { metadata, bytes: new Uint8Array(file.buffer) })
    return metadata
  }
  document(id: string): StoredDocument {
    const document = this.documents.get(id)
    if (!document) throw new NotFoundException("Document not found")
    return document
  }
  deleteDocument(id: string): void {
    this.document(id)
    this.documents.delete(id)
  }
}

@Module({ providers: [MarketStore], exports: [MarketStore] })
export class MarketStoreModule {}
