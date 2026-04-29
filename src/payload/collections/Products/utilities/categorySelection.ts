type CategoryValue =
  | string
  | {
      id?: string
      value?: string | { id?: string }
      relationTo?: string
    }

type PayloadLike = {
  findByID: (args: { collection: 'categories'; id: string; depth: number }) => Promise<unknown>
}

export const extractCategoryID = (category: CategoryValue): string | null => {
  if (typeof category === 'string') return category

  if (category && typeof category === 'object') {
    if (typeof category.id === 'string') return category.id
    if (typeof category.value === 'string') return category.value
    if (category.value && typeof category.value === 'object' && typeof category.value.id === 'string') {
      return category.value.id
    }
  }

  return null
}

export const getSelectedCategoryIDs = (categories: unknown): string[] =>
  Array.from(
    new Set(
      ((Array.isArray(categories) ? categories : []) as CategoryValue[])
        .map(extractCategoryID)
        .filter((value): value is string => Boolean(value)),
    ),
  )

export const normalizeCategoryIDs = async (payload: PayloadLike, categories: unknown): Promise<string[]> => {
  const selectedIDs = getSelectedCategoryIDs(categories)

  if (selectedIDs.length <= 1) return selectedIDs

  const parentCache = new Map<string, string | null>()

  const getParentID = async (id: string): Promise<string | null> => {
    if (parentCache.has(id)) return parentCache.get(id) || null

    const categoryDoc = (await payload.findByID({
      collection: 'categories',
      id,
      depth: 0,
    })) as { parent?: string | { id?: string } }

    const parentID =
      typeof categoryDoc?.parent === 'string'
        ? categoryDoc.parent
        : typeof categoryDoc?.parent === 'object' && typeof categoryDoc.parent?.id === 'string'
          ? categoryDoc.parent.id
          : null

    parentCache.set(id, parentID)
    return parentID
  }

  const ancestors = new Set<string>()

  for (const id of selectedIDs) {
    const visited = new Set<string>()
    let cursor = await getParentID(id)

    while (cursor && !visited.has(cursor)) {
      ancestors.add(cursor)
      visited.add(cursor)
      cursor = await getParentID(cursor)
    }
  }

  return selectedIDs.filter(id => !ancestors.has(id))
}

export const getRemovedParentCount = async (payload: PayloadLike, categories: unknown): Promise<number> => {
  const selectedIDs = getSelectedCategoryIDs(categories)
  const normalized = await normalizeCategoryIDs(payload, categories)
  return Math.max(selectedIDs.length - normalized.length, 0)
}
