import type { CodegenDiagnostic } from "../diagnostics.js"
import type { NormalizedOperation } from "../types.js"

interface MutableTrieNode {
  endpoint?: NormalizedOperation
  readonly children: Map<string, MutableTrieNode>
}

export function validateEndpointTree(
  operations: readonly NormalizedOperation[],
  diagnostics: CodegenDiagnostic[],
): void {
  const root: MutableTrieNode = { children: new Map() }
  for (const operation of operations) {
    const segments = [...operation.namespace, operation.operationName]
    let node = root
    const traversed: string[] = []
    for (const segment of segments) {
      if (node.endpoint) {
        diagnostics.push({
          code: "NAME_COLLISION",
          message:
            `${node.endpoint.key} creates endpoint ${traversed.join(".")}, which conflicts with ` +
            `namespace required by ${operation.key}`,
        })
      }
      traversed.push(segment)
      let child = node.children.get(segment)
      if (!child) {
        child = { children: new Map() }
        node.children.set(segment, child)
      }
      node = child
    }

    if (node.endpoint) {
      diagnostics.push({
        code: "NAME_COLLISION",
        message: `${node.endpoint.key} and ${operation.key} both generate api.${segments.join(".")}`,
      })
    }
    if (node.children.size > 0) {
      diagnostics.push({
        code: "NAME_COLLISION",
        message: `${operation.key} generates endpoint api.${segments.join(".")}, which is already a namespace`,
      })
    }
    node.endpoint = operation
  }
}
