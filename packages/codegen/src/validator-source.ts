import ts from "typescript"

const f = ts.factory
const valueType = () => f.createTypeReferenceNode("JsValue")

/** Embed bundled JavaScript behind a typed boundary without disabling SDK type checking.
 * Ajv and its runtime helpers use dynamic locals, optional JS arguments, and function
 * properties. Annotating those implementation details does not change their execution.
 */
export function validatorSource(javascript: string): string {
  const source = ts.createSourceFile("checks.js", javascript, ts.ScriptTarget.Latest, true)
  const exports = new Map<string, string>()
  const functions = new Set<string>()
  const collect = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name) functions.add(node.name.text)
    ts.forEachChild(node, collect)
  }
  collect(source)
  const parameter = (node: ts.ParameterDeclaration) =>
    f.updateParameterDeclaration(
      node,
      node.modifiers,
      node.dotDotDotToken,
      node.name,
      !node.initializer && !node.dotDotDotToken && ts.isIdentifier(node.name)
        ? f.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      node.dotDotDotToken ? f.createArrayTypeNode(valueType()) : valueType(),
      node.initializer,
    )
  const thisParameter = () =>
    f.createParameterDeclaration(undefined, undefined, "this", undefined, valueType())
  const transformed = ts.transform(source, [
    (context) => {
      const visit: ts.Visitor = (original) => {
        if (ts.isExportDeclaration(original)) {
          if (!original.exportClause || !ts.isNamedExports(original.exportClause))
            throw new Error("Expected named exports from the validator bundle")
          for (const entry of original.exportClause.elements)
            exports.set(entry.name.text, (entry.propertyName ?? entry.name).text)
          return undefined
        }
        const node = ts.visitEachChild(original, visit, context)
        if (
          ts.isPropertyAccessExpression(node) &&
          ts.isIdentifier(node.expression) &&
          functions.has(node.expression.text)
        )
          return f.updatePropertyAccessExpression(
            node,
            f.createAsExpression(node.expression, valueType()),
            node.name,
          )
        if (ts.isVariableDeclaration(node)) {
          const loop = original.parent?.parent
          // TypeScript forbids annotations on for-in/of binding declarations.
          if (loop && (ts.isForInStatement(loop) || ts.isForOfStatement(loop))) return node
          return f.updateVariableDeclaration(
            node,
            node.name,
            node.exclamationToken,
            valueType(),
            node.initializer,
          )
        }
        if (ts.isFunctionDeclaration(node))
          return f.updateFunctionDeclaration(
            node,
            node.modifiers,
            node.asteriskToken,
            node.name,
            node.typeParameters,
            [thisParameter(), ...node.parameters.map(parameter)],
            valueType(),
            node.body,
          )
        if (ts.isFunctionExpression(node))
          return f.updateFunctionExpression(
            node,
            node.modifiers,
            node.asteriskToken,
            node.name,
            node.typeParameters,
            [thisParameter(), ...node.parameters.map(parameter)],
            valueType(),
            node.body,
          )
        if (ts.isArrowFunction(node))
          return f.updateArrowFunction(
            node,
            node.modifiers,
            node.typeParameters,
            node.parameters.map(parameter),
            valueType(),
            node.equalsGreaterThanToken,
            node.body,
          )
        if (ts.isMethodDeclaration(node))
          return f.updateMethodDeclaration(
            node,
            node.modifiers,
            node.asteriskToken,
            node.name,
            node.questionToken,
            node.typeParameters,
            node.parameters.map(parameter),
            valueType(),
            node.body,
          )
        // Expando properties (validate.errors/evaluated) are mutable JavaScript state.
        if (ts.isObjectLiteralExpression(node) || ts.isArrayLiteralExpression(node))
          return f.createAsExpression(node, valueType())
        return node
      }
      return (root) => ts.visitNode(root, visit, ts.isSourceFile) ?? root
    },
  ])
  try {
    const body = ts.createPrinter().printFile(transformed.transformed[0]!)
    return [
      "/** Private, precompiled response checks. No runtime schema compilation. */",
      `function createAccordValidators(): { ${[...exports.keys()].map((name) => `readonly ${name}: AccordValidationFunction`).join("; ")} } {`,
      "// Ajv emits JavaScript. Dynamic implementation values stay inside this typed boundary.",
      "type JsValue = any",
      body,
      `return { ${[...exports].map(([name, local]) => `${name}: ${local}`).join(", ")} }`,
      "}",
    ].join("\n")
  } finally {
    transformed.dispose()
  }
}
