import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        first_name: { type: 'string', required: true },
        last_name: { type: 'string', required: true },
        contact_num: { type: 'string', required: true },
        province: { type: 'string', required: false },
        city_municipality: { type: 'string', required: false },
        barangay: { type: 'string', required: false },
        role: { type: 'string', required: false },
        membershipTier: { type: 'string', required: false },
        membershipExpiresAt: { type: 'date', required: false },
      },
    }),
  ],
})

export const { signIn, signUp, signOut, useSession } = authClient
