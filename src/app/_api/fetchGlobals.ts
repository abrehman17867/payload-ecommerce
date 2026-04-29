import type { Footer, Header, Settings } from '../../payload/payload-types'
import { FOOTER_QUERY, HEADER_QUERY, SETTINGS_QUERY } from '../_graphql/globals'
import { GRAPHQL_API_URL } from './shared'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const fetchGlobalWithRetry = async <T>(query: string, label: string): Promise<T> => {
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const data = await fetch(`${GRAPHQL_API_URL}/api/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({ query }),
      })
        .then(res => {
          if (!res.ok) throw new Error(`Error fetching ${label}`)
          return res.json()
        })
        .then(res => {
          if (res?.errors) throw new Error(res?.errors?.[0]?.message || `Error fetching ${label}`)
          return res.data?.[label] as T
        })

      return data
    } catch (error) {
      lastError = error

      if (attempt === 3) break

      await wait(attempt * 250)
    }
  }

  throw lastError
}

export async function fetchSettings(): Promise<Settings> {
  if (!GRAPHQL_API_URL) throw new Error('NEXT_PUBLIC_SERVER_URL not found')
  return fetchGlobalWithRetry<Settings>(SETTINGS_QUERY, 'Settings')
}

export async function fetchHeader(): Promise<Header> {
  if (!GRAPHQL_API_URL) throw new Error('NEXT_PUBLIC_SERVER_URL not found')
  return fetchGlobalWithRetry<Header>(HEADER_QUERY, 'Header')
}

export async function fetchFooter(): Promise<Footer> {
  if (!GRAPHQL_API_URL) throw new Error('NEXT_PUBLIC_SERVER_URL not found')
  return fetchGlobalWithRetry<Footer>(FOOTER_QUERY, 'Footer')
}

export const fetchGlobals = async (): Promise<{
  settings: Settings
  header: Header
  footer: Footer
}> => {
  // initiate requests in parallel, then wait for them to resolve
  // this will eagerly start to the fetch requests at the same time
  // see https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
  const settingsData = fetchSettings()
  const headerData = fetchHeader()
  const footerData = fetchFooter()

  const [settings, header, footer]: [Settings, Header, Footer] = await Promise.all([
    await settingsData,
    await headerData,
    await footerData,
  ])

  return {
    settings,
    header,
    footer,
  }
}
