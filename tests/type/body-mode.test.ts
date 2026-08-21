import type { EndpointDescriptor, InputOf } from "@accord/client"

type OptionalMergedTypes = {
  path: { resourceId: string }
  query: {}
  headers: {}
  cookies: {}
  body: { name: string; description?: string }
  bodyRequired: false
  response: void
  error: never
  responses: { 204: undefined }
}

type OptionalMergedEndpoint = EndpointDescriptor<OptionalMergedTypes, "merge", "mutation">
type OptionalMergedInput = InputOf<OptionalMergedEndpoint>

const omittedBody: OptionalMergedInput = { resourceId: "1" }
const completeBody: OptionalMergedInput = { resourceId: "1", name: "Alice" }
const completeOptionalBody: OptionalMergedInput = {
  resourceId: "1",
  name: "Alice",
  description: "updated",
}
void omittedBody
void completeBody
void completeOptionalBody

// @ts-expect-error Supplying any merged body field must preserve required body properties.
const incompleteBody: OptionalMergedInput = { resourceId: "1", description: "missing name" }
void incompleteBody

type OptionalSeparateEndpoint = EndpointDescriptor<OptionalMergedTypes, "separate", "mutation">
type OptionalSeparateInput = InputOf<OptionalSeparateEndpoint>
const omittedSeparateBody: OptionalSeparateInput = { resourceId: "1" }
const presentSeparateBody: OptionalSeparateInput = { resourceId: "1", body: { name: "Alice" } }
void omittedSeparateBody
void presentSeparateBody
