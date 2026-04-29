import type { AfterChangeHook } from 'payload/dist/collections/config/types'

import type { Order } from '../../../payload-types'
import { retryTransientWrite } from '../../../utilities/retryTransientWrite'

export const clearUserCart: AfterChangeHook<Order> = async ({ doc, req, operation }) => {
  const { payload } = req

  if (operation === 'create' && doc.orderedBy) {
    const orderedBy = typeof doc.orderedBy === 'string' ? doc.orderedBy : doc.orderedBy.id

    const user = await payload.findByID({
      collection: 'users',
      id: orderedBy,
    })

    if (user) {
      await retryTransientWrite(async () =>
        payload.update({
          collection: 'users',
          id: orderedBy,
          data: {
            cart: {
              items: [],
            },
          },
        }),
      )
    }
  }

  return
}
