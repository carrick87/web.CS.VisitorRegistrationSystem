import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getManagedWarehouses } from '@/lib/rbac'
import { sortByCode } from '@/lib/utils'

export async function GET() {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({
        isLoggedIn: false,
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { site: true },
    })

    if (!user) {
      return NextResponse.json({
        isLoggedIn: false,
      })
    }

    const warehouses = sortByCode(await getManagedWarehouses(user))

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn,
      userId: session.userId,
      username: session.username,
      name: session.name,
      role: session.role,
      siteId: session.siteId,
      siteName: session.siteName,
      warehouseIds: warehouses.map((warehouse) => warehouse.id),
      warehouses,
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
