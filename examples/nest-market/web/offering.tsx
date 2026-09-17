import { useState } from "react"
import { api, type OfferingDto } from "../sdk/index.js"
import { useMarket } from "../sdk/react-query.js"
import { Documents } from "./documents.js"
import { date, marketClient, money, saveFile } from "./market.js"
import { Subscriptions } from "./subscriptions.js"
import { Arrow, Badge, ErrorNotice, initials, Loading } from "./ui.js"

export function OfferingDetail({ offeringId }: { offeringId: string }) {
  const offering = useMarket(api.offerings.getOffering, { offeringId })
  return (
    <>
      <a className="back-link" href="#offerings">
        ← All offerings
      </a>
      {offering.isPending ? (
        <Loading label="Opening this offering…" />
      ) : offering.isError ? (
        <ErrorNotice retry={() => void offering.refetch()} />
      ) : (
        <OfferingContent offering={offering.data} />
      )}
    </>
  )
}

function OfferingContent({ offering }: { offering: OfferingDto }) {
  const [exporting, setExporting] = useState(false)
  const [exportFailed, setExportFailed] = useState(false)
  async function exportReport() {
    setExporting(true)
    setExportFailed(false)
    try {
      const report = await marketClient.offerings.exportOffering.withResponse(
        { offeringId: offering.id },
        { headers: { accept: "text/csv" } },
      )
      if (report.mediaType === "text/csv") saveFile(report.data, "offering-report.csv", "text/csv")
      else throw new Error("Expected the CSV representation")
    } catch {
      setExportFailed(true)
    } finally {
      setExporting(false)
    }
  }
  return (
    <>
      <div className="detail-heading">
        <span className="fund-mark large">{initials(offering.name)}</span>
        <div>
          <div className="detail-kicker">
            <p className="eyebrow">{offering.tags?.join(" / ") ?? "Private markets"}</p>
            <Badge status={offering.status} />
          </div>
          <h1>{offering.name}</h1>
          <p className="intro">{offering.description}</p>
        </div>
      </div>
      <div className="detail-facts">
        <div>
          <span>Minimum investment</span>
          <strong>{money(offering.terms.minimumInvestment, offering.terms.currency)}</strong>
        </div>
        <div>
          <span>Closing date</span>
          <strong>{date(offering.terms.closesAt)}</strong>
        </div>
        <div>
          <span>Currency</span>
          <strong>{offering.terms.currency}</strong>
        </div>
        <button
          className="button secondary"
          type="button"
          disabled={exporting}
          onClick={() => void exportReport()}
        >
          {exporting ? "Preparing…" : "Export report"}
          <Arrow direction="down" />
        </button>
      </div>
      {exportFailed && (
        <ErrorNotice
          message="The report couldn’t be downloaded."
          retry={() => void exportReport()}
        />
      )}
      <div className="detail-grid">
        <Subscriptions offering={offering} />
        <Documents offeringId={offering.id} />
      </div>
    </>
  )
}
