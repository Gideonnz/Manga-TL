import { IronSession, getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  isLoggedIn: boolean
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'development-secret-change-me-min-32-chars-long!!',
  cookieName: 'manga-tl-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: 'lax' as const,
    path: '/',
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  const session = getIronSession<SessionData>(cookieStore, sessionOptions)
  return session
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session.isLoggedIn === true
}

export async function requireAuth() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    throw new Error('UNAUTHORIZED')
  }
}

export function verifyPassword(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD
}
