import { useEffect, useState } from 'react'
import { Outlet, useMatches } from 'react-router'
import { PageTitleContext } from '../lib/page-title'

export default function DocumentTitle() {
  const matches = useMatches()
  const [override, setOverride] = useState<string | null>(null)

  const routeTitle = matches.reduce<string | null>((title, match) => {
    const handle = match.handle as { title?: string } | undefined
    return handle?.title ?? title
  }, null)

  const pageTitle = override ?? routeTitle

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | BTP Karaoke` : 'BTP Karaoke'
  }, [pageTitle])

  return (
    <PageTitleContext.Provider value={setOverride}>
      <Outlet />
    </PageTitleContext.Provider>
  )
}
