import fc from "fast-check"
import { describe, expect, it } from "vitest"
import { pathNamespace, sanitizeIdentifier } from "../src/naming.js"
import { canonicalize } from "../src/object.js"

describe("naming properties", () => {
  it("always emits syntactically valid deterministic ASCII identifiers", () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const first = sanitizeIdentifier(value)
        const second = sanitizeIdentifier(value)
        expect(first).toBe(second)
        expect(first).toMatch(/^[A-Za-z_$][A-Za-z0-9_$]*$/)
      }),
      { numRuns: 1_000 },
    )
  })

  it("never turns path parameters into namespace segments", () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[A-Za-z][A-Za-z0-9-]{0,12}$/), {
          minLength: 1,
          maxLength: 8,
        }),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 8 }),
        (segments, flags) => {
          const path = `/${segments
            .map((segment, index) => (flags[index % flags.length] ? `{${segment}}` : segment))
            .join("/")}`
          const expected = segments
            .filter((_, index) => !flags[index % flags.length])
            .map(sanitizeIdentifier)
          expect(pathNamespace(path)).toEqual(expected.length > 0 ? expected : ["root"])
        },
      ),
      { numRuns: 500 },
    )
  })

  it("canonicalizes object property order", () => {
    fc.assert(
      fc.property(fc.dictionary(fc.string(), fc.jsonValue()), (object) => {
        const reversed = Object.fromEntries(Object.entries(object).reverse())
        expect(JSON.stringify(canonicalize(object))).toBe(JSON.stringify(canonicalize(reversed)))
      }),
      { numRuns: 500 },
    )
  })
})
