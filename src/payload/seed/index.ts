import fs from 'fs'
import https from 'https'
import path from 'path'
import type { Payload } from 'payload'

import { cartPage } from './cart-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { image3 } from './image-3'
import { product1 } from './product-1'
import { product2 } from './product-2'
import { product3 } from './product-3'
import { productsPage } from './products-page'

const collections = ['categories', 'media', 'orders', 'pages', 'products', 'users']
const globals = ['header', 'settings', 'footer']

const downloadImage = async (url: string, filePath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath)

    const request = https.get(url, response => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        file.close()
        fs.unlink(filePath, () => {
          void downloadImage(response.headers.location as string, filePath)
            .then(resolve)
            .catch(reject)
        })
        return
      }

      if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
        file.close()
        reject(new Error(`Failed to download image from ${url} (${response.statusCode ?? 'n/a'})`))
        return
      }

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    })

    request.on('error', error => {
      file.close()
      reject(error)
    })
  })

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not

  payload.logger.info(`— Clearing media...`)

  const mediaDir = path.resolve(__dirname, '../../media')
  if (fs.existsSync(mediaDir)) {
    fs.rmdirSync(mediaDir, { recursive: true })
  }

  payload.logger.info(`— Clearing collections and globals...`)

  for (const collection of collections) {
    await payload.delete({
      collection: collection as 'media',
      where: {},
    })
  }

  for (const global of globals) {
    await payload.updateGlobal({
      slug: global as 'header',
      data: {},
    })
  }

  payload.logger.info(`— Seeding media...`)

  const seedImagesDir = path.resolve(__dirname, './.seed-images')
  fs.mkdirSync(seedImagesDir, { recursive: true })

  const imageDownloads = [
    {
      fileName: 'image-1.jpg',
      // Public image URL (Google-indexed source)
      source:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
      data: image1,
    },
    {
      fileName: 'image-2.jpg',
      source:
        'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
      data: image2,
    },
    {
      fileName: 'image-3.jpg',
      source:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      data: image3,
    },
    {
      fileName: 'avatar-admin.jpg',
      source:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
      data: {
        alt: 'Admin avatar',
      },
    },
    {
      fileName: 'avatar-customer.jpg',
      source:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80',
      data: {
        alt: 'Customer avatar',
      },
    },
  ]

  await Promise.all(
    imageDownloads.map(async image => {
      await downloadImage(image.source, path.resolve(seedImagesDir, image.fileName))
    }),
  )

  const [image1Doc, image2Doc, image3Doc, adminAvatarDoc, customerAvatarDoc] = await Promise.all([
    await payload.create({
      collection: 'media',
      filePath: path.resolve(seedImagesDir, 'image-1.jpg'),
      data: image1,
    }),
    await payload.create({
      collection: 'media',
      filePath: path.resolve(seedImagesDir, 'image-2.jpg'),
      data: image2,
    }),
    await payload.create({
      collection: 'media',
      filePath: path.resolve(seedImagesDir, 'image-3.jpg'),
      data: image3,
    }),
    await payload.create({
      collection: 'media',
      filePath: path.resolve(seedImagesDir, 'avatar-admin.jpg'),
      data: {
        alt: 'Admin avatar',
      },
    }),
    await payload.create({
      collection: 'media',
      filePath: path.resolve(seedImagesDir, 'avatar-customer.jpg'),
      data: {
        alt: 'Customer avatar',
      },
    }),
  ])

  let image1ID = image1Doc.id
  let image2ID = image2Doc.id
  let image3ID = image3Doc.id

  if (payload.db.defaultIDType === 'text') {
    image1ID = `"${image1ID}"`
    image2ID = `"${image2ID}"`
    image3ID = `"${image3ID}"`
  }

  payload.logger.info(`— Seeding users...`)

  const adminUser = await payload.create({
    collection: 'users',
    data: {
      name: 'Seed Admin',
      email: 'admin@example.com',
      password: 'admin123',
      roles: ['admin'],
      avatar: adminAvatarDoc.id,
      skipSync: true,
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'users',
    data: {
      name: 'Seed Customer',
      email: 'customer@example.com',
      password: 'customer123',
      avatar: customerAvatarDoc.id,
      cart: {
        items: [],
      },
      skipSync: true,
    },
    overrideAccess: true,
  })

  payload.logger.info(`— Seeding categories...`)

  const [apparelCategory, ebooksCategory, coursesCategory] = await Promise.all([
    await payload.create({
      collection: 'categories',
      data: {
        title: 'Apparel',
        media: image1Doc.id,
      },
    }),
    await payload.create({
      collection: 'categories',
      data: {
        title: 'E-books',
        media: image2Doc.id,
      },
    }),
    await payload.create({
      collection: 'categories',
      data: {
        title: 'Online courses',
        media: image3Doc.id,
      },
    }),
  ])

  payload.logger.info(`— Seeding products...`)

  // Do not create product with `Promise.all` because we want the products to be created in order
  // This way we can sort them by `createdAt` or `publishedOn` and they will be in the expected order
  const product1Doc = await payload.create({
    collection: 'products',
    data: JSON.parse(
      JSON.stringify({ ...product1, categories: [apparelCategory.id] }).replace(
        /"\{\{PRODUCT_IMAGE\}\}"/g,
        image1ID,
      ),
    ),
  })

  const product2Doc = await payload.create({
    collection: 'products',
    data: JSON.parse(
      JSON.stringify({ ...product2, categories: [ebooksCategory.id] }).replace(
        /"\{\{PRODUCT_IMAGE\}\}"/g,
        image2ID,
      ),
    ),
  })

  const product3Doc = await payload.create({
    collection: 'products',
    data: JSON.parse(
      JSON.stringify({ ...product3, categories: [coursesCategory.id] }).replace(
        /"\{\{PRODUCT_IMAGE\}\}"/g,
        image3ID,
      ),
    ),
  })

  // update each product with related products

  await Promise.all([
    await payload.update({
      collection: 'products',
      id: product1Doc.id,
      data: {
        relatedProducts: [product2Doc.id, product3Doc.id],
      },
    }),
    await payload.update({
      collection: 'products',
      id: product2Doc.id,
      data: {
        relatedProducts: [product1Doc.id, product3Doc.id],
      },
    }),
    await payload.update({
      collection: 'products',
      id: product3Doc.id,
      data: {
        relatedProducts: [product1Doc.id, product2Doc.id],
      },
    }),
  ])

  payload.logger.info(`— Seeding products page...`)

  const productsPageDoc = await payload.create({
    collection: 'pages',
    data: productsPage,
  })

  let productsPageID = productsPageDoc.id

  if (payload.db.defaultIDType === 'text') {
    productsPageID = `"${productsPageID}"`
  }

  payload.logger.info(`— Seeding home page...`)

  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(home)
        .replace(/"\{\{PRODUCT1_IMAGE\}\}"/g, image1ID)
        .replace(/"\{\{PRODUCT2_IMAGE\}\}"/g, image2ID)
        .replace(/"\{\{PRODUCTS_PAGE_ID\}\}"/g, productsPageID),
    ),
  })

  payload.logger.info(`— Seeding cart page...`)

  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(cartPage).replace(/"\{\{PRODUCTS_PAGE_ID\}\}"/g, productsPageID),
    ),
  })

  payload.logger.info(`— Seeding settings...`)

  await payload.updateGlobal({
    slug: 'settings',
    data: {
      productsPage: productsPageDoc.id,
    },
  })

  payload.logger.info(`— Seeding header...`)

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: productsPageDoc.id,
            },
            label: 'Shop',
          },
        },
      ],
    },
  })

  payload.logger.info(`— Seeding sample order...`)

  await payload.create({
    collection: 'orders',
    data: {
      orderedBy: adminUser.id,
      total: 159,
      items: [
        {
          product: product1Doc.id,
          price: 79,
          quantity: 1,
        },
        {
          product: product2Doc.id,
          price: 80,
          quantity: 1,
        },
      ],
    },
    overrideAccess: true,
  })

  fs.rmSync(seedImagesDir, { recursive: true, force: true })

  payload.logger.info('Seeded database successfully!')
}
