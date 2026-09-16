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
  const visit = (child: ts.Node, shadowed: ReadonlySet<string>): void => {
    const scoped = new Set(shadowed)
    if (ts.isTypeAliasDeclaration(child) || ts.isFunctionTypeNode(child))
      for (const parameter of child.typeParameters ?? []) scoped.add(parameter.name.text)
    if (ts.isMappedTypeNode(child)) scoped.add(child.typeParameter.name.text)
    if (
      ts.isTypeReferenceNode(child) &&
      ts.isIdentifier(child.typeName) &&
      !scoped.has(child.typeName.text)
    )
      names.add(child.typeName.text)
    ts.forEachChild(child, (node) => visit(node, scoped))
  }
  visit(node, new Set())
  return names
}
