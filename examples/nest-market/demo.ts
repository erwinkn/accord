import { createApplication } from "./dist/src/app.js"
import { DEMO_TOKEN } from "./dist/src/common.js"
import { createMarketClient, runInvestmentWorkflow } from "./usage.js"

const app = await createApplication()
try {
  await app.listen(0, "127.0.0.1")
  const result = await runInvestmentWorkflow(createMarketClient(await app.getUrl(), DEMO_TOKEN))
  console.log(
    JSON.stringify(
      {
        offering: result.offering.name,
        investor: result.investor.displayName,
        subscription: { status: result.subscription.status, amount: result.subscription.amount },
        document: { name: result.document.filename, downloadedBytes: result.downloadedBytes },
        report: result.reportSummary,
      },
      null,
      2,
    ),
  )
} finally {
  await app.close()
}
