import fc from "fast-check"
import { expect, it } from "vitest"
import { defineEndpoint } from "../src/index.js"
import { decodeEventStream } from "../src/sse.js"

const endpoint = defineEndpoint({
  id: "events",
  method: "GET",
  path: "/events",
  kind: "query",
  responses: {},
})

it("preserves arbitrary JSON and UTF-8 across randomized byte boundaries and line endings", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.jsonValue(), { minLength: 1, maxLength: 8 }),
      fc.array(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 20 }),
      fc.constantFrom("\n", "\r", "\r\n"),
      async (values, sizes, newline) => {
        const text =
          `\ufeff: heartbeat${newline}${newline}` +
          values
            .map(
              (value, index) =>
                `id: ${index}${newline}event: update${newline}data: ${JSON.stringify(value)}${newline}${newline}`,
            )
            .join("")
        const bytes = new TextEncoder().encode(text)
        let offset = 0
        let index = 0
        const body = new ReadableStream<Uint8Array>({
          pull(controller) {
            if (offset >= bytes.length) return controller.close()
            const end = Math.min(offset + sizes[index++ % sizes.length]!, bytes.length)
            controller.enqueue(bytes.slice(offset, end))
            offset = end
          },
        })
        const result: unknown[] = []
        for await (const event of decodeEventStream(new Response(body), endpoint, {
          update: { mediaType: "application/json" },
        })) {
          expect(event.id).toBe(String(result.length))
          result.push(event.data)
        }
        // JSON transport canonicalizes -0 to 0 (also inside arrays/objects).
        expect(result).toEqual(JSON.parse(JSON.stringify(values)))
        expect(body.locked).toBe(false)
      },
    ),
    { numRuns: 150 },
  )
})
