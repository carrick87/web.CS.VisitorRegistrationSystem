import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

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
      include: {
        site: true,
        warehouses: {
          include: {
            warehouse: {
              include: {
                site: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({
        isLoggedIn: false,
      })
    }

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn,
      userId: session.userId,
      username: session.username,
      name: session.name,
      role: session.role,
      siteId: session.siteId,
      siteName: session.siteName,
      warehouseIds: session.warehouseIds,
      warehouses: user.warehouses.map(uw => ({
        id: uw.warehouse.id,
        code: uw.warehouse.code,
        name: uw.warehouse.name,
        siteId: uw.warehouse.siteId,
        siteName: uw.warehouse.site.name,
      })),
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
