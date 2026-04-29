import React from 'react'

import { Gutter } from '../../_components/Gutter'

import classes from './loading.module.scss'

export default function Loading() {
  return (
    <div className={classes.wrap}>
      <Gutter>
        <div className={classes.layout}>
          <div className={classes.filterSkeleton} />
          <div className={classes.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={classes.card} />
            ))}
          </div>
        </div>
      </Gutter>
    </div>
  )
}
