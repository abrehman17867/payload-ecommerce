import React from 'react'

import classes from './loading.module.scss'

export default function Loading() {
  return (
    <div className={classes.wrap}>
      <div className={classes.title} />
      <div className={classes.list}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={classes.item} />
        ))}
      </div>
    </div>
  )
}
