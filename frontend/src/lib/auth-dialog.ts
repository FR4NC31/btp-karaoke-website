import { useOutletContext } from 'react-router'

export type AuthMode = 'signin' | 'signup'

export type AuthDialogApi = { openAuth: (mode: AuthMode) => void }

export function useAuthDialog(): AuthDialogApi {
  return useOutletContext<AuthDialogApi>()
}
