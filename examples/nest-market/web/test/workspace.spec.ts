import { readFile } from "node:fs/promises"
import { expect, test } from "@playwright/test"

test("browse, validate a subscription, submit, upload and download against the real Nest API", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Offerings", exact: true })).toBeVisible()
  await expect(page.locator(".offering-card")).toHaveCount(6)
  await page.screenshot({ path: info.outputPath("offerings.png"), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )

  const filtered = page.waitForResponse((response) => response.url().includes("status=open"))
  await page.getByRole("button", { name: /^open/i }).click()
  expect((await filtered).ok()).toBe(true)
  await expect(page.locator(".offering-card")).toHaveCount(3)
  await page.getByRole("searchbox").fill("not-a-fund")
  await expect(page.getByText("Nothing here just yet")).toBeVisible()
  await page.getByRole("searchbox").fill("")
  await page.locator(".offering-card").filter({ hasText: "Harbor Renewable Fund" }).click()
  await expect(page.getByRole("heading", { name: "Harbor Renewable Fund" })).toBeVisible()
  await expect(page.getByRole("button", { name: /^Download harbor-renewable/ })).toBeVisible()
  await page.getByRole("button", { name: "+ New subscription", exact: true }).click()
  const form = page.getByRole("form", { name: "New subscription" })
  await form
    .getByRole("combobox", { name: "Investor", exact: true })
    .selectOption({ label: "Birch Family Office" })
  await form.getByLabel("Amount (EUR)").fill("1")
  await form.getByRole("button", { name: "Create subscription", exact: true }).click()
  await expect(form.getByRole("alert")).toContainText("below the offering's minimum")
  const amount = info.project.name === "desktop" ? "1733.00" : "1844.00"
  await form.getByLabel("Amount (EUR)").fill(amount)
  await form.getByRole("button", { name: "Create subscription", exact: true }).click()
  await expect(page.getByText("Subscription created.", { exact: false })).toBeVisible()
  const row = page
    .locator(".subscription-row")
    .filter({ hasText: "Birch Family Office" })
    .filter({ hasText: info.project.name === "desktop" ? "1,733" : "1,844" })
  await row.getByRole("button", { name: "Submit →", exact: true }).click()
  await expect(row.locator(".badge")).toHaveText("submitted")

  const filename = `browser-${info.project.name}.txt`
  const uploadInput = page.getByLabel("Upload document")
  await uploadInput.setInputFiles({
    name: filename,
    mimeType: "text/plain",
    buffer: Buffer.from("Uploaded through the generated Market SDK.\n"),
  })
  await expect(page.getByText("Document uploaded.")).toBeVisible()
  const downloading = page.waitForEvent("download")
  await page.getByRole("button", { name: `Download ${filename}`, exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe(filename)
  const path = await download.path()
  expect(await readFile(path!, "utf8")).toBe("Uploaded through the generated Market SDK.\n")
  const exporting = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export report" }).click()
  const report = await exporting
  expect(await readFile((await report.path())!, "utf8")).toContain(
    "offeringId,subscriptionCount,currency",
  )
  await page.reload()
  await expect(
    page.getByRole("button", { name: `Download ${filename}`, exact: true }),
  ).toBeVisible()
  await expect(row.locator(".badge")).toHaveText("submitted")
  await page.screenshot({ path: info.outputPath("offering-detail.png"), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )

  await page.getByRole("link", { name: "Investors", exact: false }).click()
  await expect(page.locator(".investor-card")).toHaveCount(4)
  await expect(page.getByText("NSP-2048")).toBeVisible()
  expect(errors).toEqual([])
})

test("shows loading, an API failure, and recovery without a page reload", async ({ page }) => {
  await page.route("**/api/v1/offerings?**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"message":"temporarily unavailable"}',
    })
  })
  await page.goto("/")
  await expect(page.getByRole("status")).toContainText("Finding your offerings")
  await expect(page.getByRole("alert").first()).toContainText("couldn’t load")
  await page.unroute("**/api/v1/offerings?**")
  await page.getByRole("button", { name: "Try again" }).first().click()
  await expect(page.locator(".offering-card")).toHaveCount(6)
})
