import ts from "typescript"

/** Rename references by allocated identity, leaving property names and literals intact. */
export function renameTypeReferences(
  type: ts.TypeNode,
  names: ReadonlyMap<string, string>,
): ts.TypeNode {
  const result = ts.transform(type, [
    (context) => {
      const visit: ts.Visitor = (node) => {
        const updated = ts.visitEachChild(node, visit, context)
        if (ts.isTypeReferenceNode(updated) && ts.isIdentifier(updated.typeName)) {
          const name = names.get(updated.typeName.text)
          if (name)
            return ts.factory.updateTypeReferenceNode(
              updated,
              ts.factory.createIdentifier(name),
              updated.typeArguments,
            )
        }
        return updated
      }
      return (node) => ts.visitNode(node, visit, ts.isTypeNode)!
    },
  ])
  try {
    return result.transformed[0]!
  } finally {
    result.dispose()
  }
}

export function typeReferences(node: ts.Node): ReadonlySet<string> {
  const names = new Set<string>()
  const visit = (child: ts.Node): void => {
    if (ts.isTypeReferenceNode(child) && ts.isIdentifier(child.typeName))
      names.add(child.typeName.text)
    ts.forEachChild(child, visit)
  }
  visit(node)
  return names
}
