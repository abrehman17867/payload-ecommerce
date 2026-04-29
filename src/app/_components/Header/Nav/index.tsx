'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Category, Header as HeaderType } from '../../../../payload/payload-types'
import { useAuth } from '../../../_providers/Auth'
import { Button } from '../../Button'
import { CartLink } from '../../CartLink'
import { MenuIcon } from '../../icons/Menu'

import classes from './index.module.scss'

type CategoryNode = {
  id: string
  title: string
  children: CategoryNode[]
}

const collectDescendantIds = (node: CategoryNode): string[] => {
  const directChildren = node.children.map(child => child.id)
  const nested = node.children.flatMap(child => collectDescendantIds(child))
  return [...directChildren, ...nested]
}

const resolveHref = (link: HeaderType['navItems'][0]['link']) => {
  if (
    link?.type === 'reference' &&
    typeof link?.reference?.value === 'object' &&
    link.reference.value?.slug
  ) {
    return (
      `/${link.reference.value.slug === 'home' ? '' : link.reference.value.slug}`.replace(
        /\/$/,
        '',
      ) || '/'
    )
  }

  if (link?.type === 'custom' && link?.url) return link.url
  return null
}

export const HeaderNav: React.FC<{ header: HeaderType; categories: Category[] }> = ({
  header,
  categories,
}) => {
  const navItems = header?.navItems || []
  const { user } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)
  const [shopOpen, setShopOpen] = React.useState(false)
  const [desktopShopOpen, setDesktopShopOpen] = React.useState(false)
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  React.useEffect(() => {
    setIsOpen(false)
    setShopOpen(false)
  }, [pathname])

  React.useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const openDesktopDropdown = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setDesktopShopOpen(true)
  }

  const closeDesktopDropdown = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = setTimeout(() => {
      setDesktopShopOpen(false)
    }, 140)
  }

  const categoryTree = React.useMemo(() => {
    const nodeMap = new Map<string, CategoryNode>()
    const parentLookup = new Map<string, string | null>()

    categories.forEach(category => {
      nodeMap.set(category.id, {
        id: category.id,
        title: category.title,
        children: [],
      })

      const parentId =
        typeof category.parent === 'string'
          ? category.parent
          : category.parent && typeof category.parent === 'object'
          ? category.parent.id
          : null

      parentLookup.set(category.id, parentId || null)
    })

    const roots: CategoryNode[] = []

    nodeMap.forEach((node, id) => {
      const parentId = parentLookup.get(id)

      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId)?.children.push(node)
      } else {
        roots.push(node)
      }
    })

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => a.title.localeCompare(b.title))
      nodes.forEach(node => sortTree(node.children))
    }

    sortTree(roots)
    return roots
  }, [categories])

  return (
    <>
      <nav className={[classes.nav, user === undefined && classes.hide].filter(Boolean).join(' ')}>
        <div className={classes.desktopMenu}>
          <div
            className={classes.desktopDropdown}
            onMouseEnter={openDesktopDropdown}
            onMouseLeave={closeDesktopDropdown}
          >
            <button
              type="button"
              className={[
                classes.menuLink,
                classes.dropdownTrigger,
                desktopShopOpen && classes.activeLink,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setDesktopShopOpen(prev => !prev)}
            >
              Shop
              <span
                className={[classes.expandIcon, desktopShopOpen && classes.expandIconOpen].join(
                  ' ',
                )}
              >
                ▾
              </span>
            </button>
            <div
              className={[
                classes.desktopDropdownMenu,
                desktopShopOpen && classes.desktopDropdownMenuOpen,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {categoryTree.map(parent => (
                <div key={parent.id} className={classes.desktopCategoryGroup}>
                  <Link
                    href={`/products?categories=${[parent.id, ...collectDescendantIds(parent)].join(
                      ',',
                    )}`}
                    className={classes.parentCategoryLink}
                  >
                    {parent.title}
                  </Link>
                  {parent.children.map(child => (
                    <Link
                      key={child.id}
                      href={`/products?categories=${child.id}`}
                      className={classes.childCategoryLink}
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {navItems.map(({ link }, i) => {
            const href = resolveHref(link)
            if (!href) return null

            return (
              <Link
                key={i}
                href={href}
                className={[classes.menuLink, pathname === href && classes.activeLink]
                  .filter(Boolean)
                  .join(' ')}
              >
                {link?.label}
              </Link>
            )
          })}
          {user && (
            <Link
              className={[classes.menuLink, pathname.startsWith('/account') && classes.activeLink]
                .filter(Boolean)
                .join(' ')}
              href="/account"
            >
              Account
            </Link>
          )}
          {!user && (
            <Button
              el="link"
              href="/login"
              label="Login"
              appearance="primary"
              onClick={() => (window.location.href = '/login')}
            />
          )}
        </div>

        <div className={classes.actions}>
          <CartLink iconOnly className={classes.desktopCart} />
          <CartLink iconOnly className={classes.mobileCart} />
          <button
            type="button"
            className={classes.menuButton}
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      <div
        className={[classes.overlay, isOpen && classes.overlayOpen].filter(Boolean).join(' ')}
        onClick={() => setIsOpen(false)}
      />
      <aside className={[classes.drawer, isOpen && classes.drawerOpen].filter(Boolean).join(' ')}>
        <div className={classes.drawerHeader}>
          <h6 className={classes.drawerTitle}>Menu</h6>
          <button
            type="button"
            className={classes.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <nav
          className={classes.drawerLinks}
          onClick={event => {
            const target = event.target as HTMLElement
            if (target.closest('a')) setIsOpen(false)
          }}
        >
          {navItems.map(({ link }, i) => {
            const href = resolveHref(link)
            if (!href) return null
            return (
              <Link
                key={i}
                href={href}
                className={[classes.drawerLink, pathname === href && classes.activeDrawerLink]
                  .filter(Boolean)
                  .join(' ')}
              >
                {link?.label}
              </Link>
            )
          })}
          <button
            type="button"
            className={classes.drawerExpand}
            onClick={() => setShopOpen(prev => !prev)}
          >
            <span>Shop by category</span>
            <span className={[classes.expandIcon, shopOpen && classes.expandIconOpen].join(' ')}>
              ▾
            </span>
          </button>
          <div className={[classes.categoryGroup, shopOpen && classes.categoryGroupOpen].join(' ')}>
            {categoryTree.map(parent => (
              <div key={parent.id} className={classes.mobileCategoryGroup}>
                <Link
                  href={`/products?categories=${[parent.id, ...collectDescendantIds(parent)].join(
                    ',',
                  )}`}
                  className={[classes.categoryLink, classes.parentMobileCategory].join(' ')}
                >
                  {parent.title}
                </Link>
                {parent.children.map(child => (
                  <Link
                    key={child.id}
                    href={`/products?categories=${child.id}`}
                    className={[classes.categoryLink, classes.childMobileCategory].join(' ')}
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          {user ? (
            <Link
              href="/account"
              className={[
                classes.drawerLink,
                pathname.startsWith('/account') && classes.activeDrawerLink,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setIsOpen(false)}
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className={[classes.drawerLink, pathname === '/login' && classes.activeDrawerLink]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
          )}
          <Link
            href="/cart"
            className={[classes.drawerLink, pathname === '/cart' && classes.activeDrawerLink]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setIsOpen(false)}
          >
            Cart
          </Link>
        </nav>
      </aside>
    </>
  )
}
