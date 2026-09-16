import ts from "typescript"
import { typeReferences } from "./type-projections.js"

export function sourceTypeReferences(source: string): ReadonlySet<string> {
  return typeReferences(ts.createSourceFile("module.ts", source, ts.ScriptTarget.Latest, true))
}

/**
 * Direct operation uses establish ownership. Nested types inherit their parents'
 * slices unless they already have an owner. Cross-slice references become type
 * imports; they do not pull domain models into the shared module.
 */
export function modelModules(
  models: ReadonlyMap<string, string>,
  families: readonly (readonly string[])[],
  groups: readonly { readonly name: string; readonly types: string }[],
): ReadonlyMap<string, string | undefined> {
  const familyByName = new Map(families.flatMap((names, id) => names.map((name) => [name, id])))
  const owners = families.map(() => new Set<string>())
  const dependencies = families.map(() => new Set<number>())
  for (const [name, source] of models) {
    const family = familyByName.get(name)!
    for (const reference of sourceTypeReferences(source)) {
      const dependency = familyByName.get(reference)
      if (dependency !== undefined && dependency !== family) dependencies[family]!.add(dependency)
    }
  }
  for (const group of groups)
    for (const reference of sourceTypeReferences(group.types)) {
      const family = familyByName.get(reference)
      if (family !== undefined) owners[family]!.add(group.name)
    }
  const rooted = new Set(owners.flatMap((names, id) => (names.size ? [id] : [])))
  const queue = owners.flatMap((names, family) => [...names].map((name) => ({ family, name })))
  for (const { family, name } of queue) {
    for (const dependency of dependencies[family]!) {
      if (rooted.has(dependency) || owners[dependency]!.has(name)) continue
      owners[dependency]!.add(name)
      queue.push({ family: dependency, name })
    }
  }
  return new Map(
    [...models.keys()].map((name) => {
      const slices = owners[familyByName.get(name)!]!
      // Shared and unreferenced public components have no single domain owner.
      return [name, slices.size === 1 ? [...slices][0] : undefined]
    }),
  )
}
