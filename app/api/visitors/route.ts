import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaff, getAccessibleWarehouseIds, isSuperAdmin, isSiteAdmin, isStorekeeper } from '@/lib/rbac'
import { SessionData } from '@/lib/session'

/** History may filter by an inactive warehouse. Storekeeper assignments stay as they are. */
async function canFilterHistoryWarehouse(session: SessionData, warehouseId: string): Promise<boolean> {
  if (isSuperAdmin(session)) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { id: true },
    })
    return !!warehouse
  }

  if (isSiteAdmin(session) && session.siteId) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, siteId: session.siteId },
      select: { id: true },
    })
    return !!warehouse
  }

  if (isStorekeeper(session)) {
    return session.warehouseIds?.includes(warehouseId) ?? false
  }

  return false
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStaff()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    const warehouseId = searchParams.get('warehouseId')
    const warehouseCode = searchParams.get('warehouseCode')

    const accessibleWarehouseIds = await getAccessibleWarehouseIds(authResult.session)

    interface WhereClause {
      status?: { in: string[] }
      warehouseId?: string | { in: string[] } | null
      OR?: Array<{ warehouseId: string | { in: string[] } | null }>
    }

    const where: WhereClause = {}

    if (statusParam) {
      const statuses = statusParam.split(',')
      where.status = { in: statuses }
    }

    if (warehouseId) {
      const canFilter = await canFilterHistoryWarehouse(authResult.session, warehouseId)
      if (!canFilter) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      where.warehouseId = warehouseId
    } else if (warehouseCode) {
      const warehouse = await prisma.warehouse.findUnique({ where: { code: warehouseCode } })
      if (!warehouse || !accessibleWarehouseIds.includes(warehouse.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      where.warehouseId = warehouse.id
    } else {
      // Include visitors from accessible warehouses plus legacy visitors with null warehouseId
      where.OR = [
        { warehouseId: { in: accessibleWarehouseIds } },
        { warehouseId: null },
      ]
    }

    const visitors = await prisma.visitor.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
            site: {
              select: { id: true, name: true },
            },
          },
        },
        tag: {
          select: {
            id: true,
            code: true,
            displayNumber: true,
          },
        },
      },
      orderBy: { timeIn: 'desc' },
    })

    return NextResponse.json({ visitors })
  } catch (error) {
    console.error('Get visitors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
