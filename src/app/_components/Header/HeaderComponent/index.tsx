import React from 'react'
import Link from 'next/link'

import { Category, Header } from '../../../../payload/payload-types'
import { noHeaderFooterUrls } from '../../../constants'
import { Gutter } from '../../Gutter'
import { HeaderNav } from '../Nav'

import classes from './index.module.scss'

const HeaderComponent = ({ header, categories }: { header: Header; categories: Category[] }) => {
  return (
    <nav
      className={[classes.header].filter(Boolean).join(' ')}
    >
      <Gutter className={classes.wrap}>
        <Link href="/" className={classes.logoLink}>
          <span className={classes.brandText}>Ecommerce</span>
        </Link>

        <HeaderNav header={header} categories={categories} />
      </Gutter>
    </nav>
  )
}

export default HeaderComponent
