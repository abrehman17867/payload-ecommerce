import type { Page } from '../payload-types'

export const staticHome: Page = {
  id: '',
  title: 'Home',
  slug: 'home',
  createdAt: '',
  updatedAt: '',
  meta: {
    title: 'Ecommerce',
    description: 'Shop the latest products and offers.',
  },
  hero: {
    type: 'lowImpact',
    richText: [
      {
        children: [
          {
            text: 'Welcome to Ecommerce',
          },
        ],
        type: 'h1',
      },
      {
        children: [
          {
            text: 'Discover curated products, premium quality, and a smooth shopping experience.',
          },
        ],
      },
    ],
    media: '',
  },
  layout: [],
}
