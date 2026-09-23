import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaff, getAccessibleWarehouseIds } from '@/lib/rbac'

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
      warehouseId?: string | { in: string[] }
    }

    const where: WhereClause = {}

    if (statusParam) {
      const statuses = statusParam.split(',')
      where.status = { in: statuses }
    }

    if (warehouseId) {
      if (!accessibleWarehouseIds.includes(warehouseId)) {
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
      where.warehouseId = { in: accessibleWarehouseIds }
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
      },
      orderBy: { timeIn: 'desc' },
    })

    return NextResponse.json({ visitors })
  } catch (error) {
    console.error('Get visitors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
