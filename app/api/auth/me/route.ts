import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn,
      userId: session.userId,
      username: session.username,
      name: session.name,
      role: session.role,
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
