import { HttpError } from "@accord/client"
import { useState } from "react"
import { api } from "../sdk/index.js"
import { useMarket, useMarketMutation } from "../sdk/react-query.js"
import { marketClient, queryClient, saveFile } from "./market.js"
import { Arrow, Empty, ErrorNotice, Loading } from "./ui.js"

export function Documents({ offeringId }: { offeringId: string }) {
  const documents = useMarket(api.documents.listDocuments, { offeringId })
  const upload = useMarketMutation(api.documents.uploadDocument)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  async function download(documentId: string, filename: string) {
    setDownloading(documentId)
    setError(null)
    try {
      saveFile(await marketClient.documents.downloadDocument({ documentId }), filename)
    } catch {
      setError("The document couldn’t be downloaded. Please try again.")
    } finally {
      setDownloading(null)
    }
  }
  return (
    <section className="panel documents-panel" aria-labelledby="documents-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">THE DETAILS MATTER</p>
          <h2 id="documents-heading">
            Documents <span>{documents.data?.length ?? "—"}</span>
          </h2>
        </div>
      </div>
      {documents.isPending ? (
        <Loading label="Finding documents…" />
      ) : documents.isError ? (
        <ErrorNotice retry={() => void documents.refetch()} />
      ) : !documents.data.length ? (
        <Empty title="A fresh folder">Upload the first document for this offering.</Empty>
      ) : (
        <div className="document-list">
          {documents.data.map((document) => (
            <button
              className="document-row"
              type="button"
              key={document.id}
              disabled={downloading !== null}
              onClick={() => void download(document.id, document.filename)}
              aria-label={`Download ${document.filename}`}
            >
              <span className="file-icon" aria-hidden="true">
                ↳
              </span>
              <span className="document-name">
                <strong>{document.filename}</strong>
                <small>
                  {downloading === document.id
                    ? "Downloading…"
                    : `${document.category} · ${Math.max(1, Math.round(document.size / 1024))} KB`}
                </small>
              </span>
              <Arrow direction="down" />
            </button>
          ))}
        </div>
      )}
      <label className={`upload-area ${upload.isPending ? "uploading" : ""}`}>
        <input
          type="file"
          aria-label="Upload document"
          disabled={upload.isPending}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (!file) return
            setError(null)
            if (file.size > 1024 * 1024) {
              setError("Please choose a file smaller than 1 MB.")
              return
            }
            upload.mutate(
              { offeringId, file, category: "other" },
              {
                onSuccess: () => {
                  void queryClient.invalidateQueries({
                    queryKey: ["market", "api", "v1", "offerings", "{offeringId}", "documents"],
                  })
                },
              },
            )
          }}
        />
        <span className="upload-symbol" aria-hidden="true">
          ＋
        </span>
        <strong>{upload.isPending ? "Uploading document…" : "Add a document"}</strong>
        <small>Choose a file · up to 1 MB</small>
      </label>
      {upload.isSuccess && (
        <p className="success-notice" role="status">
          Document uploaded.
        </p>
      )}
      {error && <ErrorNotice message={error} />}
      {upload.isError && (
        <ErrorNotice
          message={
            upload.error instanceof HttpError
              ? (upload.error.body?.message ?? "Upload failed.")
              : "Unable to upload. Please try again."
          }
        />
      )}
    </section>
  )
}
