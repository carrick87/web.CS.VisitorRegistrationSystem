import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin, requireSiteAdmin, canAccessSite } from '@/lib/rbac'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const canAccess = await canAccessSite(authResult.session, params.id)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const site = await prisma.site.findUnique({
      where: { id: params.id },
      include: {
        warehouses: {
          include: {
            _count: {
              select: { visitors: true, users: true },
            },
          },
          orderBy: { code: 'asc' },
        },
        users: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
          },
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

    return NextResponse.json({ site })
  } catch (error) {
    console.error('Get site error:', error)
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
