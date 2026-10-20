import { createContext, useContext, useEffect } from 'react'

export const PageTitleContext = createContext<(title: string | null) => void>(() => {})

export function usePageTitle(title: string | null) {
  const setTitle = useContext(PageTitleContext)

  useEffect(() => {
    setTitle(title)
  }, [setTitle, title])

  useEffect(() => {
    return () => setTitle(null)
  }, [setTitle])
}
