import type { BeforeChangeHook } from 'payload/dist/collections/config/types'

type ParentValue = string | { id?: string } | null | undefined

const getParentID = (parent: ParentValue): string | null => {
  if (!parent) return null
  if (typeof parent === 'string') return parent
  if (typeof parent === 'object' && typeof parent.id === 'string') return parent.id
  return null
}

export const validateCategoryHierarchy: BeforeChangeHook = async args => {
  const { req, data, originalDoc } = args
  const { payload } = req

  const parentID = getParentID((data as { parent?: ParentValue })?.parent)
  const currentID = typeof originalDoc?.id === 'string' ? originalDoc.id : null

  if (!parentID || !currentID) {
    return data
  }

  if (parentID === currentID) {
    throw new Error('A category cannot be its own parent.')
  }

  // Prevent cycles: you cannot set a descendant category as the parent.
  const visited = new Set<string>()
  let cursor: string | null = parentID

  while (cursor) {
    if (cursor === currentID) {
      throw new Error('Invalid parent category. This change creates a circular hierarchy.')
    }

    if (visited.has(cursor)) break
    visited.add(cursor)

    const parentDoc = await payload.findByID({
      collection: 'categories',
      id: cursor,
      depth: 0,
    })

    cursor = getParentID((parentDoc as { parent?: ParentValue })?.parent)
  }

  return data
}
