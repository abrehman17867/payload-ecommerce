import type { BeforeChangeHook } from 'payload/dist/collections/config/types'
import Stripe from 'stripe'

import { getRemovedParentCount, normalizeCategoryIDs } from '../utilities/categorySelection'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' })

const logs = false

export const beforeProductChange: BeforeChangeHook = async ({ req, data }) => {
  const { payload } = req
  const removedParentCount = await getRemovedParentCount(payload, data.categories)
  const normalizedCategories = await normalizeCategoryIDs(payload, data.categories)

  if (removedParentCount > 0) {
    throw new Error(
      `Category selection invalid: you selected parent and child categories together. Remove parent categor${
        removedParentCount > 1 ? 'ies' : 'y'
      } and keep only the most specific child categories.`,
    )
  }

  const newDoc: Record<string, unknown> = {
    ...data,
    skipSync: false, // Set back to 'false' so that all changes continue to sync to Stripe
    categories: normalizedCategories,
  }

  if (data.skipSync) {
    if (logs) payload.logger.info(`Skipping product 'beforeChange' hook`)
    return newDoc
  }

  if (!data.stripeProductID) {
    if (logs)
      payload.logger.info(
        `No Stripe product assigned to this document, skipping product 'beforeChange' hook`,
      )
    return newDoc
  }

  if (logs) payload.logger.info(`Looking up product from Stripe...`)

  try {
    const stripeProduct = await stripe.products.retrieve(data.stripeProductID)
    if (logs) payload.logger.info(`Found product from Stripe: ${stripeProduct.name}`)
    // newDoc.name = stripeProduct.name;
    newDoc.description = stripeProduct.description
  } catch (error: unknown) {
    payload.logger.error(`Error fetching product from Stripe: ${error}`)
    return newDoc
  }

  if (logs) payload.logger.info(`Looking up price from Stripe...`)

  try {
    const allPrices = await stripe.prices.list({
      product: data.stripeProductID,
      limit: 100,
    })

    newDoc.priceJSON = JSON.stringify(allPrices)
  } catch (error: unknown) {
    payload.logger.error(`Error fetching prices from Stripe: ${error}`)
  }

  return newDoc
}
