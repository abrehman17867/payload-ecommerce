import type { CollectionConfig } from 'payload/types'

import { validateCategoryHierarchy } from './Categories/hooks/validateCategoryHierarchy'

const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [validateCategoryHierarchy],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}

export default Categories
