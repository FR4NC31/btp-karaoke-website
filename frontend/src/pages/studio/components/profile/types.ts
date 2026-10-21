export type ProfileLocation = {
  province: string
  cityMunicipality: string
  barangay: string
}

export type ProfileIdentity = {
  image?: string | null
  fullName: string
  email: string
  emailVerified: boolean
  phone: string
  handle: string
  memberSince: string
  location: ProfileLocation
}
