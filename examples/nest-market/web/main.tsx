import { QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { MarketProvider } from "../sdk/react-query.js"
import { App } from "./app.js"
import { marketOptions, queryClient } from "./market.js"
import "./style.css"

const root = document.getElementById("root")
if (!root) throw new Error("Missing application root")
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MarketProvider options={marketOptions}>
        <App />
      </MarketProvider>
    </QueryClientProvider>
  </StrictMode>,
)
