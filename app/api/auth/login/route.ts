import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, UserRole } from '@/lib/session'
import { sortByCode } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        site: true,
        warehouses: {
          orderBy: { warehouse: { code: 'asc' } },
          include: {
            warehouse: true,
          },
        },
      },
    })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const warehouseIds = user.warehouses.map(uw => uw.warehouseId)

    const session = await getSession()
    session.userId = user.id
    session.username = user.username
    session.name = user.name
    session.role = user.role as UserRole
    session.siteId = user.siteId
    session.siteName = user.site?.name || null
    session.warehouseIds = warehouseIds
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        siteId: user.siteId,
        siteName: user.site?.name || null,
        warehouseIds,
        warehouses: sortByCode(
          user.warehouses.map((uw) => ({
            id: uw.warehouse.id,
            code: uw.warehouse.code,
            name: uw.warehouse.name,
          }))
        ),
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
