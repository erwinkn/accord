import type { EndpointDefinition, HttpResult, InputOf, RequestOptions } from "@accord/client"

type Input = {
  readonly resourceId: string
  readonly body?: { readonly name: string; readonly description?: string }
}
type Contract = {
  readonly input: Input
  readonly args: [input: Input, options?: RequestOptions]
  readonly response: undefined
  readonly error: never
  readonly responses: { readonly 204: undefined }
  readonly fullResponse: HttpResult<204, undefined>
}
type OptionalBody = InputOf<EndpointDefinition<Contract, "mutation">>
const absent: OptionalBody = { resourceId: "1" }
const present: OptionalBody = { resourceId: "1", body: { name: "Alice" } }
// @ts-expect-error Supplying an optional body still requires its required properties.
const incomplete: OptionalBody = { resourceId: "1", body: { description: "missing name" } }
void [absent, present, incomplete]
