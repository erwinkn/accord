import type { AccordCodegenConfig, JsonValue } from "@accord/codegen"

export type Phase = "generate" | "compile" | "execute" | "assert" | "harness"
export type Area = "generation" | "types" | "wire" | "responses" | "query" | "distribution"

export interface DiagnosticExpectation {
  readonly marker: string
  readonly codes: readonly number[]
}

export interface Consumer {
  readonly source: string
  /** Separate declaration audit; ordinary cases still semantically check generated .ts and consumers. */
  readonly checkDeclarations?: boolean
  /** Each marker must occur once, immediately before the offending source line. */
  readonly diagnostics?: readonly DiagnosticExpectation[]
}

export interface Fixture {
  readonly id: string
  readonly title: string
  readonly area: Area
  readonly reference: string
  readonly document: JsonValue
  readonly config?: AccordCodegenConfig
  readonly consumer?: Consumer
  /** Expected diagnostics are tested through the public generator, not its internals. */
  readonly rejection?: string
  /** Extra documents are resolved relative to openapi.json; no network is needed. */
  readonly files?: Readonly<Record<string, string>>
}

export interface KnownGap {
  readonly id: string
  readonly phase: Phase
  readonly signature: string
  readonly reason: string
  readonly since: string
}

export interface Failure {
  readonly phase: Phase
  readonly signature: string
  readonly message: string
}

export interface Result {
  readonly id: string
  readonly title: string
  readonly area: Area
  readonly reference: string
  readonly status: "pass" | "known-gap" | "unexpected-pass" | "fail"
  readonly durationMs: number
  readonly failure?: Failure
}

export class ContractFailure extends Error {
  constructor(
    readonly phase: Phase,
    readonly signature: string,
    message: string,
  ) {
    super(message)
    this.name = "ContractFailure"
  }
}
