import { useState } from "react"
import { api } from "../sdk/index.js"
import { useMarket } from "../sdk/react-query.js"
import { money, queryClient } from "./market.js"

interface Activity {
  id: string
  label: string
  time: string
}

export function LiveEvents({ offeringId, currency }: { offeringId: string; currency: string }) {
  const [enabled, setEnabled] = useState(true)
  const [activity, setActivity] = useState<Activity[]>([])
  const stream = useMarket(
    api.offerings.watchOffering,
    { offeringId },
    {
      enabled,
      onEvent(event) {
        let label: string
        switch (event.event) {
          case "connected":
          case "heartbeat":
            return
          case "subscription.created":
            label = `Subscription created · ${money(event.data.amount, currency)}`
            break
          case "subscription.submitted":
            label = `Subscription submitted · ${money(event.data.amount, currency)}`
            break
          case "document.uploaded":
            label = `Document uploaded · ${event.data.filename}`
            break
          case "offering.updated":
            label = `Offering updated · ${event.data.name}`
            break
        }
        setActivity((previous) =>
          [{ id: event.id, label, time: new Date().toLocaleTimeString() }, ...previous].slice(
            0,
            20,
          ),
        )
        // The same event reaches every open tab. Refresh the affected offering's cached lists.
        void queryClient.invalidateQueries({ queryKey: ["market", "api", "v1", "offerings"] })
      },
    },
  )
  return (
    <section className="panel live-events" aria-label="Live activity">
      <div className="section-bar">
        <div>
          <h2>Live activity</h2>
          <p>Changes appear here as they happen, including in other tabs.</p>
        </div>
        <span className="demo-pill" data-testid="stream-status">
          {stream.connectionState === "open" && <span className="live-dot" />}
          {stream.connectionState === "open"
            ? "Live"
            : stream.connectionState === "connecting"
              ? "Connecting…"
              : stream.connectionState === "error"
                ? "Disconnected"
                : "Paused"}
        </span>
      </div>
      {activity.length ? (
        <ol className="activity-list" aria-live="polite">
          {activity.map((item) => (
            <li key={item.id}>
              <span>{item.label}</span>
              <time>{item.time}</time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="activity-empty">
          Create a subscription or upload a document to see a live event.
        </p>
      )}
      <div className="activity-controls">
        <small>
          {stream.error
            ? "Connection lost. Pause and resume to reconnect."
            : "Showing the latest 20 events received in this tab."}
        </small>
        <button
          type="button"
          className="button secondary"
          onClick={() => setEnabled((value) => !value)}
        >
          {enabled ? "Pause live updates" : "Resume live updates"}
        </button>
      </div>
    </section>
  )
}
