'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

import { useCart } from '../../_providers/Cart'

import classes from './index.module.scss'

export const CartLink: React.FC<{
  className?: string
  iconOnly?: boolean
}> = props => {
  const { className, iconOnly = false } = props
  const { cart } = useCart()
  const [length, setLength] = useState<number>()

  useEffect(() => {
    setLength(cart?.items?.length || 0)
  }, [cart])

  return (
    <Link className={[classes.cartLink, className].filter(Boolean).join(' ')} href="/cart">
      <span className={classes.icon} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M3 4H5L6.2 10.2C6.3 10.7 6.7 11 7.2 11H17.8C18.3 11 18.7 10.7 18.8 10.2L20 6H7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="18" r="1.8" fill="currentColor" />
          <circle cx="17" cy="18" r="1.8" fill="currentColor" />
        </svg>
      </span>
      {!iconOnly && <span className={classes.label}>Cart</span>}
      {typeof length === 'number' && length > 0 && (
        <small className={classes.quantity}>{length > 99 ? '99+' : length}</small>
      )}
    </Link>
  )
}
