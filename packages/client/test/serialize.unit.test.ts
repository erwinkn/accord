import { describe, expect, it } from "vitest"
import {
  encodeValue,
  interpolatePath,
  renderQueryString,
  serializePathParameter,
  serializeQueryParameter,
  type ParameterDescriptor,
} from "../src/index.js"

const parameter = (
  overrides: Partial<ParameterDescriptor> = {},
): ParameterDescriptor => ({
  name: "value",
  in: "query",
  required: false,
  style: "form",
  explode: true,
  allowReserved: false,
  ...overrides,
})

describe("parameter serialization", () => {
  it("serializes simple, label, and matrix path parameters", () => {
    expect(
      serializePathParameter(parameter({ in: "path", style: "simple", explode: false }), [
        "a",
        "b",
      ]),
    ).toBe("a,b")
    expect(
      serializePathParameter(
        parameter({ in: "path", style: "label", explode: true }),
        { role: "admin", active: true },
      ),
    ).toBe(".role=admin.active=true")
    expect(
      serializePathParameter(
        parameter({ name: "id", in: "path", style: "matrix", explode: false }),
        [3, 4],
      ),
    ).toBe(";id=3,4")
  })

  it("serializes form arrays and deep objects", () => {
    expect(
      renderQueryString(
        serializeQueryParameter(parameter({ name: "tag", explode: true }), ["a", "b"]),
      ),
    ).toBe("tag=a&tag=b")

    expect(
      renderQueryString(
        serializeQueryParameter(
          parameter({ name: "filter", style: "deepObject", explode: true }),
          { role: "admin", active: true },
        ),
      ),
    ).toBe("filter%5Brole%5D=admin&filter%5Bactive%5D=true")
  })

  it("honors allowReserved for query values", () => {
    expect(encodeValue("a/b?c=d", false)).toBe("a%2Fb%3Fc%3Dd")
    expect(encodeValue("a/b?c=d", true)).toBe("a/b?c=d")
  })

  it("interpolates every path placeholder and reports omissions", () => {
    const descriptor = parameter({
      name: "userId",
      in: "path",
      required: true,
      style: "simple",
      explode: false,
    })
    expect(interpolatePath("/users/{userId}", [descriptor], { userId: "a/b" })).toBe(
      "/users/a%2Fb",
    )
    expect(() => interpolatePath("/users/{userId}", [descriptor], {})).toThrow(
      "Missing required path parameter: userId",
    )
  })
})
