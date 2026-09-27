import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin, requireSiteAdmin, canAccessSite } from '@/lib/rbac'
import { ROLES } from '@/lib/session'

const siteUserSelect = {
  id: true,
  username: true,
  name: true,
  role: true,
} as const

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const site = await prisma.site.findUnique({
      where: { id: params.id },
      include: {
        warehouses: {
          include: {
            _count: {
              select: {
                visitors: { where: { status: 'ACTIVE' } },
                tags: true,
              },
            },
            tags: {
              where: { visitors: { some: { status: 'ACTIVE' } } },
              select: { id: true },
            },
          },
          orderBy: { code: 'asc' },
        },
        users: {
          where: { role: { in: [ROLES.SITE_ADMIN, ROLES.STOREKEEPER] } },
          select: siteUserSelect,
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            warehouses: true,
            users: true,
          },
        },
      },
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const canAccess = await canAccessSite(authResult.session, params.id)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const storekeepers = await prisma.user.findMany({
      where: {
        role: ROLES.STOREKEEPER,
        warehouses: { some: { warehouse: { siteId: site.id } } },
      },
      select: siteUserSelect,
      orderBy: { name: 'asc' },
    })

    const usersById = new Map(site.users.map((user) => [user.id, user]))
    for (const storekeeper of storekeepers) {
      if (!usersById.has(storekeeper.id)) {
        usersById.set(storekeeper.id, storekeeper)
      }
    }

    const users = Array.from(usersById.values()).sort((a, b) => {
      const roleDiff = a.role.localeCompare(b.role)
      if (roleDiff !== 0) return roleDiff
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      site: {
        ...site,
        users,
        warehouses: site.warehouses.map((warehouse) => ({
          id: warehouse.id,
          code: warehouse.code,
          name: warehouse.name,
          isActive: warehouse.isActive,
          activeVisitorCount: warehouse._count.visitors,
          tagCount: warehouse._count.tags,
          tagsInUse: warehouse.tags.length,
        })),
      },
    })
  } catch (error) {
    console.error('Get site error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSuperAdmin()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const existing = await prisma.site.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'Site name is required' }, { status: 400 })
    }

    const site = await prisma.site.update({
      where: { id: params.id },
      data: { name },
    })

    return NextResponse.json({ site })
  } catch (error) {
    console.error('Update site error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSuperAdmin()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { name, code } = await request.json()

    const existing = await prisma.site.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (code && code !== existing.code) {
      const existingCode = await prisma.site.findUnique({ where: { code } })
      if (existingCode) {
        return NextResponse.json({ error: 'Site code already exists' }, { status: 400 })
      }
    }

    const site = await prisma.site.update({
      where: { id: params.id },
      data: {
        name: name || existing.name,
        code: code !== undefined ? (code || null) : existing.code,
      },
    })

    return NextResponse.json({ site })
  } catch (error) {
    console.error('Update site error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSuperAdmin()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const existing = await prisma.site.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { warehouses: true, users: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (existing._count.warehouses > 0 || existing._count.users > 0) {
      return NextResponse.json(
        { error: 'Cannot delete site with existing warehouses or users' },
        { status: 400 }
      )
    }

    await prisma.site.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete site error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
