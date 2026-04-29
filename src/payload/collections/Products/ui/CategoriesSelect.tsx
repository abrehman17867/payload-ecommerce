import * as React from 'react'
import { SelectInput, useField } from 'payload/components/forms'

type CategoryDoc = {
  id: string
  title: string
  parent?: string | { id?: string } | null
}

type OptionShape = {
  label: string
  value: string
}

const getParentID = (parent: CategoryDoc['parent']): string | null => {
  if (!parent) return null
  if (typeof parent === 'string') return parent
  if (typeof parent === 'object' && typeof parent.id === 'string') return parent.id
  return null
}

const normalizeSelection = (
  selectedIDs: string[],
  parentByID: Map<string, string | null>,
): string[] => {
  if (selectedIDs.length <= 1) return selectedIDs

  const ancestors = new Set<string>()

  selectedIDs.forEach(id => {
    const visited = new Set<string>()
    let cursor = parentByID.get(id) || null

    while (cursor && !visited.has(cursor)) {
      ancestors.add(cursor)
      visited.add(cursor)
      cursor = parentByID.get(cursor) || null
    }
  })

  return selectedIDs.filter(id => !ancestors.has(id))
}

export const CategoriesSelect: React.FC<{
  name: string
  label?: string
  required?: boolean
}> = props => {
  const { name, label = 'Categories', required } = props
  const { value, setValue, errorMessage, showError } = useField<string[]>({ path: name })
  const [warning, setWarning] = React.useState<string>('')
  const [options, setOptions] = React.useState<OptionShape[]>([])
  const parentByID = React.useRef<Map<string, string | null>>(new Map())

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?limit=300&depth=0&sort=title', {
          credentials: 'include',
        })
        const json = await response.json()
        const docs = ((json?.docs || []) as CategoryDoc[]).filter(Boolean)

        parentByID.current = new Map(
          docs.map(doc => {
            return [doc.id, getParentID(doc.parent)]
          }),
        )

        setOptions(
          docs.map(doc => ({
            label: doc.title,
            value: doc.id,
          })),
        )
      } catch (error) {
        // Keep field usable even if categories fetch fails.
      }
    }

    fetchCategories()
  }, [])

  const handleChange = (incoming: unknown) => {
    const incomingArray = Array.isArray(incoming) ? incoming : incoming ? [incoming] : []

    const selectedIDs = incomingArray
      .map(item => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'value' in item) {
          const option = item as { value?: unknown }
          return typeof option.value === 'string' ? option.value : null
        }
        return null
      })
      .filter((id): id is string => Boolean(id))

    const normalized = normalizeSelection(selectedIDs, parentByID.current)
    setValue(normalized, true)

    const removedCount = selectedIDs.length - normalized.length
    if (removedCount > 0) {
      setWarning(
        `Parent categor${
          removedCount > 1 ? 'ies were' : 'y was'
        } removed automatically. Keep only the most specific child categories.`,
      )
    } else {
      setWarning('')
    }
  }

  return (
    <div>
      <SelectInput
        path={name}
        name={name}
        label={label}
        hasMany
        options={options}
        onChange={handleChange}
        value={Array.isArray(value) ? value : []}
        required={required}
        showError={showError}
        errorMessage={errorMessage}
      />

      {warning && (
        <p
          style={{
            marginTop: '8px',
            marginBottom: 0,
            color: 'var(--theme-warning-600)',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          {warning}
        </p>
      )}
    </div>
  )
}
