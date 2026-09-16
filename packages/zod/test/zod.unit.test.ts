/* eslint-disable unicorn/no-thenable -- Test fixtures use the JSON Schema then keyword. */
import {
  allocateIdentifiers,
  generate,
  type JsonObject,
  type ValidationSchema,
} from "@accord/codegen"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { zodAdapter } from "../src/index.js"
import * as accordZod from "../src/runtime.js"

function compile(schema: ValidationSchema, documents: readonly JsonObject[] = []) {
  const source = zodAdapter().generate({
    documents,
    schemas: [{ name: "ExampleSchema", type: "unknown", schema }],
    referenceTypes: new Map(),
    allocateIdentifiers,
  })
  const code = ts.transpileModule(
    source.declarations.join("\n").replaceAll("export const", "const"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } },
  ).outputText
  // SAFETY: evaluate only generated test fixtures, supplying the real Zod runtime; no evaluation ships in the adapter.
  const validator = new Function("z", "accordZod", `${code}; return ExampleSchema`)(
    z,
    accordZod,
  ) as z.ZodType
  return { validator, source: source.declarations.join("\n") }
}
describe("native Zod adapter", () => {
  it("produces an inspectable native object without coercion, defaults, or stripping", () => {
    const { validator, source } = compile({
      type: "object",
      required: ["id"],
      properties: { id: { type: "integer" }, name: { type: "string", default: "injected" } },
    })
    expect(validator).toBeInstanceOf(z.ZodObject)
    expect(source).toContain("z.looseObject")
    expect(validator.parse({ id: 1, extra: true })).toEqual({ id: 1, extra: true })
    expect(validator.safeParse({ id: "1" }).success).toBe(false)
    expect(validator.safeParse({}).success).toBe(false)
  })
  it("enforces JSON Schema constraints on the appropriate instance types", () => {
    const { validator } = compile({
      allOf: [
        { properties: { a: { type: "string" } }, required: ["a"] },
        { properties: { b: { type: "integer" } }, required: ["b"] },
      ],
      unevaluatedProperties: false,
    })
    expect(validator.safeParse({ a: "ok", b: 2 }).success).toBe(true)
    expect(validator.safeParse({ a: "ok", b: 2, c: 3 }).success).toBe(false)
    expect(validator.safeParse({ a: "ok" }).success).toBe(false)
    expect(validator.safeParse(null).success).toBe(true)
    expect(
      compile({
        type: "object",
        required: ["missing"],
        additionalProperties: false,
      }).validator.safeParse({ missing: 1 }).success,
    ).toBe(false)
  })
  it("retains references, sibling constraints, and recursion", () => {
    const documents = [
      {
        $id: "urn:test",
        $defs: {
          Node: {
            type: "object",
            required: ["name"],
            properties: { name: { type: "string" }, child: { $ref: "urn:test#/$defs/Node" } },
          },
        },
      },
    ]
    const { validator, source } = compile(
      { $ref: "urn:test#/$defs/Node", required: ["child"] },
      documents,
    )
    expect(source).toContain("z.lazy")
    expect(validator.safeParse({ name: "root", child: { name: "leaf" } }).success).toBe(true)
    expect(validator.safeParse({ name: "root" }).success).toBe(false)
    expect(validator.safeParse({ name: "root", child: { name: 42 } }).success).toBe(false)
  })
  it("preserves oneOf exclusivity and conditional/dependency rules", () => {
    expect(
      compile({ oneOf: [{ type: "number" }, { type: "integer" }] }).validator.safeParse(1).success,
    ).toBe(false)
    expect(
      compile({ oneOf: [{ type: "number" }, { type: "integer" }] }).validator.safeParse(1.5)
        .success,
    ).toBe(true)
    const { validator } = compile({
      type: "object",
      if: { required: ["card"] },
      // biome-ignore lint/suspicious/noThenProperty: JSON Schema conditional keyword, not a promise.
      then: { required: ["address"] },
      dependentRequired: { name: ["email"] },
    })
    expect(validator.safeParse({ card: "123" }).success).toBe(false)
    expect(validator.safeParse({ card: "123", address: "Here" }).success).toBe(true)
    expect(validator.safeParse({ name: "Ada" }).success).toBe(false)
  })
  it("validates code-point lengths, tuple bounds, unique values and contains", () => {
    const emoji = compile({ type: "string", minLength: 1, maxLength: 1 }).validator
    expect(emoji.safeParse("😀").success).toBe(true)
    expect(emoji.safeParse("ab").success).toBe(false)
    const tuple = compile({
      type: "array",
      prefixItems: [{ type: "string" }, { type: "integer" }],
      items: false,
      minItems: 1,
    }).validator
    expect(tuple.safeParse(["a"]).success).toBe(true)
    expect(tuple.safeParse([]).success).toBe(false)
    expect(tuple.safeParse(["a", 2, 3]).success).toBe(false)
    const unique = compile({
      type: "array",
      uniqueItems: true,
      contains: { type: "integer" },
      minContains: 1,
      maxContains: 2,
    }).validator
    expect(unique.safeParse([1, { a: 1, b: 2 }, { b: 2, a: 1 }]).success).toBe(false)
    expect(unique.safeParse([1, 2]).success).toBe(true)
    expect(unique.safeParse([1, 2, 3]).success).toBe(false)
    expect(unique.safeParse(["a"]).success).toBe(false)
  })
  it("checks pattern properties without incorrectly rejecting them as additional", () => {
    const { validator } = compile({
      type: "object",
      properties: { label: { type: "string" } },
      patternProperties: { "^x-": { type: "integer" } },
      additionalProperties: false,
    })
    expect(validator.safeParse({ label: "a", "x-count": 3 }).success).toBe(true)
    expect(validator.safeParse({ label: "a", "x-count": "3" }).success).toBe(false)
    expect(validator.safeParse({ label: "a", surprise: true }).success).toBe(false)
  })
  it("validates decoded bytes and rejects unsupported semantics at generation", () => {
    const { validator } = compile({ accordBinary: { minByteLength: 2, maxByteLength: 3 } })
    expect(validator.safeParse(new ArrayBuffer(2)).success).toBe(true)
    expect(validator.safeParse(new ArrayBuffer(1)).success).toBe(false)
    expect(validator.safeParse("ab").success).toBe(false)
    expect(() => compile({ $dynamicRef: "#node" })).toThrow(/unsupported.*\$dynamicRef/)
    expect(() =>
      compile({
        anyOf: [{ properties: { a: true } }, { properties: { b: true } }],
        unevaluatedProperties: false,
      }),
    ).toThrow(/conditional evaluation/)
  })
  it("emits no validation unless an adapter is supplied", async () => {
    const doc = {
      openapi: "3.1.0",
      info: { title: "Test", version: "1" },
      paths: {
        "/test": {
          get: {
            operationId: "get",
            responses: {
              200: {
                description: "ok",
                content: { "application/json": { schema: { type: "string" } } },
              },
            },
          },
        },
      },
    }
    const plain = await generate(doc)
    expect(plain.source).not.toContain('from "zod"')
    expect(plain.source).not.toContain("Schema =")
    const validated = await generate(doc, { validators: zodAdapter() })
    expect(validated.source).toContain('from "zod"')
    expect(validated.source).toContain("Get200Schema")
    expect(validated.source).not.toMatch(/check0|createSchemaRegistry|ajv/)
  })
})

it("preserves percent-escaped reference targets in projected documents", async () => {
  const document = {
    openapi: "3.1.0",
    info: {
      title: "Escaping",
      version: "1",
    },
    components: {
      schemas: {
        Container: {
          $defs: {
            "%2F": {
              type: "string",
              const: "ok",
            },
          },
        },
      },
    },
    paths: {
      "/probe": {
        get: {
          responses: {
            "200": {
              description: "ok",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Container/$defs/%252F",
                  },
                },
              },
            },
          },
        },
      },
    },
  }
  const result = await generate(document, { validators: zodAdapter() })
  expect(result.source).toContain('z.literal("ok")')
})
