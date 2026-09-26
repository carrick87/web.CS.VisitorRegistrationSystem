import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSiteAdmin, canAccessWarehouse, isSuperAdmin, getAccessibleWarehouseIds } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')

    const accessibleWarehouseIds = await getAccessibleWarehouseIds(authResult.session)

    interface TagWhereClause {
      warehouseId: string | { in: string[] }
    }

    const where: TagWhereClause = warehouseId
      ? {
          warehouseId: accessibleWarehouseIds.includes(warehouseId) ? warehouseId : '',
        }
      : {
          warehouseId: { in: accessibleWarehouseIds },
        }

    const tags = await prisma.tag.findMany({
      where,
      include: {
        warehouse: {
          include: {
            site: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            visitors: { where: { status: 'ACTIVE' } },
          },
        },
      },
      orderBy: [{ warehouseId: 'asc' }, { displayNumber: 'asc' }],
    })

    const tagsWithStatus = tags.map((tag) => ({
      id: tag.id,
      code: tag.code,
      displayNumber: tag.displayNumber,
      warehouse: {
        id: tag.warehouse.id,
        code: tag.warehouse.code,
        name: tag.warehouse.name,
        siteName: tag.warehouse.site.name,
      },
      activeVisitorCount: tag._count.visitors,
      isInUse: tag._count.visitors > 0,
      createdAt: tag.createdAt,
    }))

    return NextResponse.json({ tags: tagsWithStatus })
  } catch (error) {
    console.error('Get tags error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { warehouseId, displayNumber } = await request.json()

    if (!warehouseId || !displayNumber) {
      return NextResponse.json(
        { error: 'Warehouse ID and display number are required' },
        { status: 400 }
      )
    }

    const canAccess = await canAccessWarehouse(authResult.session, warehouseId)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    })

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    const code = `${warehouse.code}-T${displayNumber.toString().padStart(2, '0')}`

    const existingTag = await prisma.tag.findUnique({
      where: { code },
    })

    if (existingTag) {
      return NextResponse.json({ error: 'Tag with this code already exists' }, { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: {
        warehouseId,
        code,
        displayNumber: displayNumber.toString().padStart(2, '0'),
      },
      include: {
        warehouse: {
          include: {
            site: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      tag: {
        id: tag.id,
        code: tag.code,
        displayNumber: tag.displayNumber,
        warehouse: {
          id: tag.warehouse.id,
          code: tag.warehouse.code,
          name: tag.warehouse.name,
          siteName: tag.warehouse.site.name,
        },
      },
    })
  } catch (error) {
    console.error('Create tag error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
