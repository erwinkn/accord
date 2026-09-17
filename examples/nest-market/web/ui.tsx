import type { ReactNode } from "react"

export function Mark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M4 25V7l12 12L28 7v18M4 7h7v9m17-9h-7v9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
    </svg>
  )
}

export function Arrow({ direction = "right" }: { direction?: "right" | "down" }) {
  return (
    <svg className={`arrow arrow-${direction}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Badge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>
      <span />
      {status}
    </span>
  )
}

export function Loading({ label = "Loading your workspace…" }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      {label}
      <div className="skeleton" />
      <div className="skeleton short" />
    </div>
  )
}

export function ErrorNotice({
  message = "We couldn’t load this data. Please try again.",
  retry,
}: {
  message?: string
  retry?: () => void
}) {
  return (
    <div className="error-notice" role="alert">
      <span>{message}</span>
      {retry && (
        <button className="text-button" type="button" onClick={retry}>
          Try again ↗
        </button>
      )}
    </div>
  )
}

export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-mark">∅</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
}
