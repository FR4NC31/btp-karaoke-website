/** Session identity rendered by the profile tabs. */
export type ProfileIdentity = {
  image?: string | null
  fullName: string
  email: string
  /** Better Auth's email-verification flag — password sign-ups start false. */
  emailVerified: boolean
  phone: string
  handle: string
  memberSince: string
}
