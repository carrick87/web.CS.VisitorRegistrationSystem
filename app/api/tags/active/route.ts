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
    const warehouseId = searchParams.get('warehouseId')
    const search = searchParams.get('search')?.toLowerCase()

    const accessibleWarehouseIds = await getAccessibleWarehouseIds(authResult.session)

    interface TagWhereClause {
      warehouseId: string | { in: string[] }
      visitors?: { some: { status: string } }
    }

    const tagWhere: TagWhereClause = warehouseId
      ? {
          warehouseId: accessibleWarehouseIds.includes(warehouseId) ? warehouseId : '',
          visitors: { some: { status: 'ACTIVE' } },
        }
      : {
          warehouseId: { in: accessibleWarehouseIds },
          visitors: { some: { status: 'ACTIVE' } },
        }

    const tags = await prisma.tag.findMany({
      where: tagWhere,
      include: {
        warehouse: {
          include: {
            site: { select: { id: true, name: true } },
          },
        },
        visitors: {
          where: { status: 'ACTIVE' },
          orderBy: { timeIn: 'asc' },
          select: {
            id: true,
            name: true,
            company: true,
            department: true,
            purpose: true,
            carPlate: true,
            vehicleType: true,
            visitorType: true,
            isGroupLeader: true,
            timeIn: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    })

    let filteredTags = tags

    if (search) {
      filteredTags = tags.filter((tag) => {
        if (tag.code.toLowerCase().includes(search)) return true
        if (tag.displayNumber.toLowerCase().includes(search)) return true
        return tag.visitors.some(
          (v) =>
            v.name.toLowerCase().includes(search) ||
            v.company?.toLowerCase().includes(search) ||
            v.carPlate?.toLowerCase().includes(search)
        )
      })
    }

    const activeTags = filteredTags.map((tag) => {
      const groupLeader = tag.visitors.find((v) => v.isGroupLeader)
      const startTime = groupLeader?.timeIn || tag.visitors[0]?.timeIn
      const now = new Date()
      const durationMs = startTime ? now.getTime() - new Date(startTime).getTime() : 0
      const durationHours = durationMs / (1000 * 60 * 60)

      return {
        id: tag.id,
        code: tag.code,
        displayNumber: tag.displayNumber,
        warehouse: {
          id: tag.warehouse.id,
          code: tag.warehouse.code,
          name: tag.warehouse.name,
          siteName: tag.warehouse.site.name,
        },
        visitors: tag.visitors,
        visitorCount: tag.visitors.length,
        groupInfo: groupLeader
          ? {
              company: groupLeader.company,
              purpose: groupLeader.purpose,
              vehicleType: groupLeader.vehicleType,
              carPlate: groupLeader.carPlate,
            }
          : null,
        startTime,
        durationMs,
        durationHours,
        isOverdue: durationHours > 8,
      }
    })

    activeTags.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      return new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()
    })

    return NextResponse.json({ activeTags })
  } catch (error) {
    console.error('Get active tags error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
