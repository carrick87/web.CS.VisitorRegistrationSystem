import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SITE_ADMIN: 'SITE_ADMIN',
  STOREKEEPER: 'STOREKEEPER',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export interface SessionData {
  userId?: string
  username?: string
  name?: string
  role?: UserRole
  siteId?: string | null
  siteName?: string | null
  warehouseIds?: string[]
  isLoggedIn: boolean
}

function getSessionPassword(): string {
  const secret = process.env.SESSION_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error(
        'SESSION_SECRET environment variable is required in production and must be at least 32 characters long'
      )
    }
    return secret
  }
  return secret || 'harrisons-visitor-registration-dev-secret-32!'
}

export const sessionOptions: SessionOptions = {
  password: getSessionPassword(),
  cookieName: 'harrisons-visitor-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
}

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn
  }
  return session
}
