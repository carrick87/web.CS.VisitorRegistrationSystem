import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin, requireSiteAdmin, canAccessWarehouse } from '@/lib/rbac'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const canAccess = await canAccessWarehouse(authResult.session, params.id)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
      include: {
        site: true,
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: { visitors: true, users: true },
        },
      },
    })

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    return NextResponse.json({ warehouse })
  } catch (error) {
    console.error('Get warehouse error:', error)
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

    const { name, code, isActive } = await request.json()

    const existing = await prisma.warehouse.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    if (code && code.toUpperCase() !== existing.code) {
      const existingCode = await prisma.warehouse.findUnique({ where: { code: code.toUpperCase() } })
      if (existingCode) {
        return NextResponse.json({ error: 'Warehouse code already exists' }, { status: 400 })
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: { id: params.id },
      data: {
        name: name || existing.name,
        code: code ? code.toUpperCase() : existing.code,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
      include: {
        site: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    return NextResponse.json({ warehouse })
  } catch (error) {
    console.error('Update warehouse error:', error)
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

    const existing = await prisma.warehouse.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { visitors: true, users: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    if (existing._count.visitors > 0) {
      return NextResponse.json(
        { error: 'Cannot delete warehouse with existing visitor records' },
        { status: 400 }
      )
    }

    await prisma.warehouse.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete warehouse error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
