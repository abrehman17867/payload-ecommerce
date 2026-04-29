import React from 'react'
import { draftMode } from 'next/headers'

import { Category, Page } from '../../../payload/payload-types'
import { fetchDoc } from '../../_api/fetchDoc'
import { fetchDocs } from '../../_api/fetchDocs'
import { Blocks } from '../../_components/Blocks'
import { CollectionArchive } from '../../_components/CollectionArchive'
import { Gutter } from '../../_components/Gutter'
import { HR } from '../../_components/HR'
import Filters from './Filters'

import classes from './index.module.scss'

const Products = async ({
  searchParams,
}: {
  searchParams?: { categories?: string }
}) => {
  const { isEnabled: isDraftMode } = draftMode()

  let page: Page | null = null
  let categories: Category[] | null = null

  try {
    page = await fetchDoc<Page>({
      collection: 'pages',
      slug: 'products',
      draft: isDraftMode,
    })

    categories = await fetchDocs<Category>('categories')
  } catch (error) {
    console.log(error)
  }

  const initialCategoryFilters =
    typeof searchParams?.categories === 'string'
      ? searchParams.categories
          .split(',')
          .map(value => value.trim())
          .filter(Boolean)
      : []

  return (
    <div className={classes.container}>
      <Gutter className={classes.products}>
        <Filters categories={categories} initialCategoryFilters={initialCategoryFilters} />
        {page?.layout?.length ? (
          <Blocks blocks={page.layout} disableTopPadding={true} />
        ) : (
          <CollectionArchive relationTo="products" populateBy="collection" limit={10} />
        )}
      </Gutter>
      <HR />
    </div>
  )
}

export default Products
