import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const setupSecret = process.env.SETUP_SECRET
  
  if (!setupSecret) {
    return NextResponse.json(
      { error: 'SETUP_SECRET environment variable is not configured' },
      { status: 500 }
    )
  }

  const providedSecret = request.headers.get('x-setup-secret')
  
  if (providedSecret !== setupSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const user = await prisma.user.upsert({
      where: { username: 'storekeeper' },
      update: {
        password: 'demo1234',
        name: 'Store Keeper',
        role: 'ADMIN',
      },
      create: {
        username: 'storekeeper',
        password: 'demo1234',
        name: 'Store Keeper',
        role: 'ADMIN',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Demo user seeded successfully',
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
