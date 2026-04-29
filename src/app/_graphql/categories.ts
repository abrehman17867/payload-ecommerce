export const PRODUCT_CATEGORIES = `categories {
  title
  id
  breadcrumbs {
    id
    label
  }
}`

export const CATEGORIES = `
  query Categories {
    Categories(limit: 300) {
      docs {
        id
        title
        parent {
          ... on Category {
            id
          }
        }
        media {
          alt
          width
          height
          url
        }
      }
    }
  }
`
