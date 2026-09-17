import { HttpError } from "@accord/client"
import { type FormEvent, useState } from "react"
import { api, type OfferingDto } from "../sdk/index.js"
import { useMarket, useMarketMutation } from "../sdk/react-query.js"
import { date, money, queryClient } from "./market.js"
import { Badge, Empty, ErrorNotice, initials, Loading } from "./ui.js"

export function Subscriptions({ offering }: { offering: OfferingDto }) {
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState("")
  const subscriptions = useMarket(api.subscriptions.listSubscriptions, {
    offeringId: offering.id,
    limit: 100,
  })
  const investors = useMarket(api.investors.listInvestors)
  const submit = useMarketMutation(api.subscriptions.submitSubscription)
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["market", "api", "v1", "offerings"] })
  return (
    <section className="panel" aria-labelledby="subscriptions-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PARTICIPATION</p>
          <h2 id="subscriptions-heading">
            Subscriptions <span>{subscriptions.data?.total ?? "—"}</span>
          </h2>
        </div>
        {offering.status === "open" && (
          <button
            className="button primary small"
            type="button"
            onClick={() => setCreating(!creating)}
          >
            {creating ? "Cancel" : "+ New subscription"}
          </button>
        )}
      </div>
      {creating && (
        <SubscriptionForm
          offering={offering}
          onCreated={() => {
            setCreating(false)
            setNotice("Subscription created. You can submit it when you’re ready.")
            void refresh()
          }}
        />
      )}
      {notice && (
        <p className="success-notice" role="status">
          {notice}
        </p>
      )}
      {submit.isError && (
        <ErrorNotice
          message={
            submit.error instanceof HttpError
              ? (submit.error.body?.message ?? "Submission failed.")
              : "Unable to submit. Please try again."
          }
        />
      )}
      {subscriptions.isPending || investors.isPending ? (
        <Loading label="Loading subscriptions…" />
      ) : subscriptions.isError || investors.isError ? (
        <ErrorNotice
          retry={() => {
            void subscriptions.refetch()
            void investors.refetch()
          }}
        />
      ) : !subscriptions.data.items.length ? (
        <Empty title="The first chapter is yours">New subscriptions will appear here.</Empty>
      ) : (
        <div className="subscription-list">
          {subscriptions.data.items.map((subscription) => {
            const investor = investors.data.find((item) => item.id === subscription.investorId)
            return (
              <article className="subscription-row" key={subscription.id}>
                <span className="avatar">{initials(investor?.displayName ?? "Investor")}</span>
                <div className="subscription-person">
                  <strong>{investor?.displayName ?? "Investor"}</strong>
                  <span>
                    {subscription.submittedAt
                      ? `Submitted ${date(subscription.submittedAt)}`
                      : "Awaiting submission"}
                  </span>
                </div>
                <div className="subscription-value">
                  <strong>{money(subscription.amount, offering.terms.currency)}</strong>
                  <Badge status={subscription.status} />
                </div>
                {subscription.status === "draft" && (
                  <button
                    className="text-button"
                    type="button"
                    disabled={submit.isPending}
                    onClick={() =>
                      submit.mutate(
                        { subscriptionId: subscription.id },
                        {
                          onSuccess: (result) => {
                            setNotice(
                              result.status === 200
                                ? "Subscription submitted successfully."
                                : "Submission accepted for processing.",
                            )
                            void refresh()
                          },
                        },
                      )
                    }
                  >
                    {submit.isPending && submit.variables?.subscriptionId === subscription.id
                      ? "Submitting…"
                      : "Submit →"}
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function SubscriptionForm({
  offering,
  onCreated,
}: {
  offering: OfferingDto
  onCreated: () => void
}) {
  const investors = useMarket(api.investors.listInvestors)
  const create = useMarketMutation(api.subscriptions.createSubscription)
  const [investorId, setInvestorId] = useState("")
  const [amount, setAmount] = useState(offering.terms.minimumInvestment)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Preserve the exact decimal string; pad cents without floating-point arithmetic.
    const [whole, cents = ""] = amount.split(".")
    create.mutate(
      { offeringId: offering.id, investorId, amount: `${whole}.${cents.padEnd(2, "0")}` },
      { onSuccess: onCreated },
    )
  }
  return (
    <form className="subscription-form" onSubmit={submit} aria-label="New subscription">
      <h3>A new commitment</h3>
      <p>Choose an investor and an amount to get started.</p>
      <label>
        Investor
        <select
          required
          value={investorId}
          onChange={(event) => setInvestorId(event.target.value)}
          disabled={investors.isPending || create.isPending}
        >
          <option value="">Choose an investor</option>
          {investors.data?.map((investor) => (
            <option value={investor.id} key={investor.id}>
              {investor.displayName}
            </option>
          ))}
        </select>
      </label>
      {investors.isError && <ErrorNotice retry={() => void investors.refetch()} />}
      <label>
        Amount ({offering.terms.currency})
        <input
          required
          inputMode="decimal"
          pattern="[0-9]+([.][0-9]{1,2})?"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          disabled={create.isPending}
          aria-describedby="minimum-amount"
        />
      </label>
      <small id="minimum-amount">
        Minimum {money(offering.terms.minimumInvestment, offering.terms.currency)}
      </small>
      {create.isError && (
        <ErrorNotice
          message={
            create.error instanceof HttpError
              ? (create.error.body?.message ?? "Unable to create subscription.")
              : "Unable to connect. Please try again."
          }
        />
      )}
      <button
        className="button primary"
        type="submit"
        disabled={create.isPending || !investors.data?.length}
      >
        {create.isPending ? "Creating subscription…" : "Create subscription"}
      </button>
    </form>
  )
}
