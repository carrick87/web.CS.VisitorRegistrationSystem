import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSiteAdmin, isSuperAdmin, isSiteAdmin, getAccessibleWarehouseIds } from '@/lib/rbac'
import { ROLES } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        site: { select: { id: true, name: true } },
        warehouses: {
          include: {
            warehouse: {
              select: { id: true, code: true, name: true, siteId: true },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!isSuperAdmin(authResult.session)) {
      if (isSiteAdmin(authResult.session)) {
        const userSiteId = user.siteId || user.warehouses[0]?.warehouse.siteId
        if (userSiteId !== authResult.session.siteId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        siteId: user.siteId,
        site: user.site,
        warehouses: user.warehouses.map(uw => uw.warehouse),
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { name, password, warehouseIds } = await request.json()

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        warehouses: {
          include: { warehouse: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!isSuperAdmin(authResult.session)) {
      if (existing.role === ROLES.SUPER_ADMIN) {
        return NextResponse.json({ error: 'Cannot modify Super Admin' }, { status: 403 })
      }
      if (existing.role === ROLES.SITE_ADMIN && !isSuperAdmin(authResult.session)) {
        return NextResponse.json({ error: 'Only Super Admin can modify Site Admins' }, { status: 403 })
      }
      if (isSiteAdmin(authResult.session)) {
        const userSiteId = existing.siteId || existing.warehouses[0]?.warehouse.siteId
        if (userSiteId !== authResult.session.siteId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }

    if (warehouseIds !== undefined && existing.role === ROLES.STOREKEEPER) {
      if (!isSuperAdmin(authResult.session)) {
        const accessibleWarehouseIds = await getAccessibleWarehouseIds(authResult.session)
        const invalidWarehouses = warehouseIds.filter((id: string) => !accessibleWarehouseIds.includes(id))
        if (invalidWarehouses.length > 0) {
          return NextResponse.json({ error: 'Cannot assign warehouses outside your site' }, { status: 403 })
        }
      }

      await prisma.userWarehouse.deleteMany({ where: { userId: params.id } })

      if (warehouseIds.length > 0) {
        await prisma.userWarehouse.createMany({
          data: warehouseIds.map((warehouseId: string) => ({
            userId: params.id,
            warehouseId,
          })),
        })
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: name || existing.name,
        password: password || existing.password,
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
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        warehouses: {
          include: { warehouse: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (existing.id === authResult.session.userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    if (!isSuperAdmin(authResult.session)) {
      if (existing.role === ROLES.SUPER_ADMIN) {
        return NextResponse.json({ error: 'Cannot delete Super Admin' }, { status: 403 })
      }
      if (existing.role === ROLES.SITE_ADMIN) {
        return NextResponse.json({ error: 'Only Super Admin can delete Site Admins' }, { status: 403 })
      }
      if (isSiteAdmin(authResult.session)) {
        const userSiteId = existing.siteId || existing.warehouses[0]?.warehouse.siteId
        if (userSiteId !== authResult.session.siteId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }

    await prisma.user.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
