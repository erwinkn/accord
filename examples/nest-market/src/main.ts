import { startApplication } from "./server.js"

const app = await startApplication()
app.enableShutdownHooks()
