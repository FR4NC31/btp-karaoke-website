import { useOutletContext } from 'react-router'

export type AuthMode = 'signin' | 'signup'

export type AuthDialogApi = { openAuth: (mode: AuthMode) => void }

/** RootLayout exposes the auth modal through the router outlet context. */
export function useAuthDialog(): AuthDialogApi {
  return useOutletContext<AuthDialogApi>()
}
