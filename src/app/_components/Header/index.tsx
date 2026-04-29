{
  /* eslint-disable @next/next/no-img-element */
}

import React from 'react'
import Link from 'next/link'

import { Category, Header } from '../../../payload/payload-types'
import { fetchDocs } from '../../_api/fetchDocs'
import { fetchHeader } from '../../_api/fetchGlobals'
import HeaderComponent from './HeaderComponent'

export async function Header() {
  let header: Header | null = null
  let categories: Category[] = []

  try {
    header = await fetchHeader()
    categories = await fetchDocs<Category>('categories')
  } catch (error) {
    console.log(error)
  }

  return (
    <>
      <HeaderComponent header={header} categories={categories} />
    </>
  )
}
