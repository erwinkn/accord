import { useEffect, useState, useSyncExternalStore } from "react"
import { api, type OfferingStatus } from "../sdk/index.js"
import { useMarket } from "../sdk/react-query.js"
import { date, money, queryClient } from "./market.js"
import { OfferingDetail } from "./offering.js"
import { Arrow, Badge, Empty, ErrorNotice, initials, Loading, Mark } from "./ui.js"

type OfferingFilter = OfferingStatus | "all"
const filters = ["all", "open", "draft", "closed"] satisfies OfferingFilter[]

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener)
  return () => window.removeEventListener("hashchange", listener)
}
function currentRoute() {
  return window.location.hash.slice(1) || "offerings"
}

export function App() {
  const route = useSyncExternalStore(subscribe, currentRoute)
  const offeringId = route.startsWith("offerings/") ? route.slice("offerings/".length) : undefined
  useEffect(() => {
    if (route) window.scrollTo(0, 0)
  }, [route])
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a href="#offerings" className="brand" aria-label="Market home">
          <Mark />
          <span>
            market<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">H</span>
          <div>
            Harbor Capital<small>Demo workspace</small>
          </div>
          <span className="workspace-chevron">⌄</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Workspace">
          <a
            className={route !== "investors" ? "active" : ""}
            aria-current={route !== "investors" ? "page" : undefined}
            href="#offerings"
          >
            <span aria-hidden="true">▦</span>Offerings
            <Arrow />
          </a>
          <a
            className={route === "investors" ? "active" : ""}
            aria-current={route === "investors" ? "page" : undefined}
            href="#investors"
          >
            <span aria-hidden="true">◎</span>Investors
            <Arrow />
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-note">
            <span className="live-dot" />A little room to explore
            <p>Fictional investments. Real interactions. Make yourself at home.</p>
          </div>
          <a className="docs-link" href="/docs" target="_blank" rel="noreferrer">
            API reference <span>↗</span>
          </a>
          <div className="profile">
            <span className="avatar">AM</span>
            <div>
              Alex Morgan<small>Workspace admin</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <span>
            Workspace <span className="crumb-slash">/</span>{" "}
            <strong>{route === "investors" ? "Investors" : "Offerings"}</strong>
          </span>
          <span className="demo-pill">
            <span className="live-dot" />
            Live demo
          </span>
        </header>
        <main>
          {offeringId ? (
            <OfferingDetail key={offeringId} offeringId={offeringId} />
          ) : route === "investors" ? (
            <Investors />
          ) : (
            <Offerings />
          )}
        </main>
        <footer>
          <span>Private capital, connected.</span>
          <span>In-memory demo · resets when the server restarts</span>
        </footer>
      </div>
    </div>
  )
}

function Offerings() {
  const [filter, setFilter] = useState<OfferingFilter>("all")
  const [search, setSearch] = useState("")
  const overview = useMarket(api.offerings.listOfferings, { limit: 100 })
  const investors = useMarket(api.investors.listInvestors)
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">GOOD THINGS TAKE A LONG VIEW</p>
          <h1>Offerings</h1>
          <p className="intro">A home for your next investment chapter.</p>
        </div>
        <button
          className="button secondary"
          type="button"
          disabled={overview.isFetching}
          onClick={() =>
            void queryClient.invalidateQueries({ queryKey: ["market", "api", "v1", "offerings"] })
          }
        >
          <span aria-hidden="true">↻</span>
          {overview.isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="stats">
        <div>
          <span>In your workspace</span>
          <strong>
            {overview.data?.total ?? "—"}
            <small>offerings</small>
          </strong>
        </div>
        <div>
          <span>Open for investment</span>
          <strong>
            {overview.data?.items.filter((item) => item.status === "open").length ?? "—"}
            <small>opportunities</small>
          </strong>
        </div>
        <div>
          <span>A growing community</span>
          <strong>
            {investors.data?.length ?? "—"}
            <small>investors</small>
          </strong>
        </div>
      </div>
      {overview.isError && <ErrorNotice retry={() => void overview.refetch()} />}
      <section aria-label="Browse offerings">
        <div className="section-bar">
          <fieldset className="filter-tabs" aria-label="Offering status">
            {filters.map((status) => (
              <button
                type="button"
                key={status}
                aria-pressed={filter === status}
                className={filter === status ? "selected" : ""}
                onClick={() => setFilter(status)}
              >
                {status === "all" ? "All offerings" : status}
                <span>
                  {overview.data
                    ? status === "all"
                      ? overview.data.total
                      : overview.data.items.filter((item) => item.status === status).length
                    : "—"}
                </span>
              </button>
            ))}
          </fieldset>
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find an offering…"
              aria-label="Search offerings"
            />
          </label>
        </div>
        <OfferingGrid filter={filter} search={search} />
      </section>
    </>
  )
}

function OfferingGrid({ filter, search }: { filter: OfferingStatus | "all"; search: string }) {
  const offerings = useMarket(
    api.offerings.listOfferings,
    filter === "all" ? { limit: 100 } : { limit: 100, status: [filter] },
  )
  if (offerings.isPending) return <Loading label="Finding your offerings…" />
  if (offerings.isError) return <ErrorNotice retry={() => void offerings.refetch()} />
  const matches = offerings.data.items.filter((item) =>
    `${item.name} ${item.tags?.join(" ") ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  )
  if (!matches.length)
    return <Empty title="Nothing here just yet">Try another status or a different search.</Empty>
  return (
    <div className="offering-grid" aria-busy={offerings.isFetching}>
      {matches.map((offering, index) => (
        <a
          className={`offering-card tone-${index % 3}`}
          href={`#offerings/${offering.id}`}
          key={offering.id}
        >
          <div className="card-top">
            <span className="fund-mark">{initials(offering.name)}</span>
            <Badge status={offering.status} />
          </div>
          <p className="card-sector">{offering.tags?.[0] ?? "Private markets"}</p>
          <h2>{offering.name}</h2>
          <p className="card-description">{offering.description}</p>
          <div className="card-facts">
            <div>
              <span>Minimum investment</span>
              <strong>{money(offering.terms.minimumInvestment, offering.terms.currency)}</strong>
            </div>
            <div>
              <span>Closing date</span>
              <strong>{date(offering.terms.closesAt)}</strong>
            </div>
          </div>
          <div className="card-bottom">
            <span>Explore offering</span>
            <Arrow />
          </div>
        </a>
      ))}
    </div>
  )
}

function Investors() {
  const investors = useMarket(api.investors.listInvestors)
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CAPITAL IS PERSONAL</p>
          <h1>Your investors</h1>
          <p className="intro">The people and partners behind each opportunity.</p>
        </div>
      </div>
      {investors.isPending ? (
        <Loading label="Meeting your investors…" />
      ) : investors.isError ? (
        <ErrorNotice retry={() => void investors.refetch()} />
      ) : (
        <div className="investor-grid">
          {investors.data.map((investor) => (
            <article className="investor-card" key={investor.id}>
              <div className="investor-card-top">
                <span className="avatar large">{initials(investor.displayName)}</span>
                <span className="subtle-tag">{investor.kind}</span>
              </div>
              <h2>{investor.displayName}</h2>
              <p>{investor.email}</p>
              <div className="card-bottom">
                <span>{investor.country}</span>
                <span>
                  {investor.kind === "company"
                    ? investor.registrationNumber
                    : "Individual investor"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
