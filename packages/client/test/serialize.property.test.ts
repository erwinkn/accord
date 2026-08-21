import fc from "fast-check"
import { describe, expect, it } from "vitest"
import { interpolatePath, type ParameterDescriptor } from "../src/index.js"

describe("path serialization properties", () => {
  it("leaves no unresolved placeholders after valid input", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.stringMatching(/^[A-Za-z][A-Za-z0-9_]{0,12}$/),
          { minLength: 1, maxLength: 8 },
        ).filter(names => new Set(names).size === names.length),
        fc.array(fc.string(), { minLength: 1, maxLength: 8 }),
        (names, values) => {
          const alignedValues = names.map((_, index) => values[index % values.length] ?? "")
          const descriptors: ParameterDescriptor[] = names.map(name => ({
            name,
            in: "path",
            required: true,
            style: "simple",
            explode: false,
            allowReserved: false,
          }))
          const input = Object.fromEntries(names.map((name, index) => [name, alignedValues[index]]))
          const template = `/${names.map(name => `{${name}}`).join("/")}`
          expect(interpolatePath(template, descriptors, input)).not.toMatch(/\{[^}]+\}/)
        },
      ),
      { numRuns: 500 },
    )
  })
})
