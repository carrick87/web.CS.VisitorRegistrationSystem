import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSiteAdmin, isSuperAdmin, isSiteAdmin, getAccessibleSiteIds, getAccessibleWarehouseIds } from '@/lib/rbac'
import { ROLES } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const role = searchParams.get('role')

    let where: { siteId?: string | { in: string[] } | null; role?: string } = {}

    if (isSuperAdmin(authResult.session)) {
      if (siteId) {
        where.siteId = siteId
      }
    } else if (isSiteAdmin(authResult.session)) {
      where.siteId = authResult.session.siteId!
    }

    if (role) {
      where.role = role
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        siteId: true,
        site: {
          select: { id: true, name: true },
        },
        warehouses: {
          include: {
            warehouse: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { username, password, name, role, siteId, warehouseIds } = await request.json()

    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: 'Username, password, name, and role are required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    if (isSuperAdmin(authResult.session)) {
      if (role === ROLES.SITE_ADMIN) {
        if (!siteId) {
          return NextResponse.json({ error: 'Site ID is required for Site Admin' }, { status: 400 })
        }
        const site = await prisma.site.findUnique({ where: { id: siteId } })
        if (!site) {
          return NextResponse.json({ error: 'Site not found' }, { status: 404 })
        }
      } else if (role === ROLES.STOREKEEPER) {
        if (!warehouseIds || warehouseIds.length === 0) {
          return NextResponse.json({ error: 'At least one warehouse assignment is required for Storekeeper' }, { status: 400 })
        }
      }
    } else if (isSiteAdmin(authResult.session)) {
      if (role !== ROLES.STOREKEEPER) {
        return NextResponse.json({ error: 'Site Admins can only create Storekeepers' }, { status: 403 })
      }
      if (!warehouseIds || warehouseIds.length === 0) {
        return NextResponse.json({ error: 'At least one warehouse assignment is required' }, { status: 400 })
      }

      const accessibleWarehouseIds = await getAccessibleWarehouseIds(authResult.session)
      const invalidWarehouses = warehouseIds.filter((id: string) => !accessibleWarehouseIds.includes(id))
      if (invalidWarehouses.length > 0) {
        return NextResponse.json({ error: 'Cannot assign warehouses outside your site' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.create({
      data: {
        username,
        password,
        name,
        role,
        siteId: role === ROLES.SITE_ADMIN ? siteId : null,
        warehouses: warehouseIds && warehouseIds.length > 0
          ? {
              create: warehouseIds.map((warehouseId: string) => ({
                warehouseId,
              })),
            }
          : undefined,
      },
      include: {
        site: { select: { id: true, name: true } },
        warehouses: {
          include: {
            warehouse: { select: { id: true, code: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        siteId: user.siteId,
        site: user.site,
        warehouses: user.warehouses.map(uw => uw.warehouse),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
