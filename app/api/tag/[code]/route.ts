import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const tagCode = params.code.toUpperCase()

    const tag = await prisma.tag.findUnique({
      where: { code: tagCode },
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
            purpose: true,
            vehicleType: true,
            carPlate: true,
            isGroupLeader: true,
            timeIn: true,
          },
        },
      },
    })

    if (!tag) {
      return NextResponse.json({ error: 'Invalid tag code' }, { status: 404 })
    }

    if (!tag.warehouse.isActive) {
      return NextResponse.json(
        { error: 'This warehouse is not accepting visitors' },
        { status: 400 }
      )
    }

    const activeVisitors = tag.visitors
    const hasActiveGroup = activeVisitors.length > 0
    const groupLeader = activeVisitors.find((v) => v.isGroupLeader)

    return NextResponse.json({
      tag: {
        id: tag.id,
        code: tag.code,
        displayNumber: tag.displayNumber,
      },
      warehouse: {
        id: tag.warehouse.id,
        code: tag.warehouse.code,
        name: tag.warehouse.name,
        siteName: tag.warehouse.site.name,
      },
      hasActiveGroup,
      activeVisitorCount: activeVisitors.length,
      groupInfo: hasActiveGroup
        ? {
            company: groupLeader?.company || null,
            purpose: groupLeader?.purpose || null,
            vehicleType: groupLeader?.vehicleType || null,
            carPlate: groupLeader?.carPlate || null,
            startTime: groupLeader?.timeIn || activeVisitors[0]?.timeIn,
          }
        : null,
    })
  } catch (error) {
    console.error('Tag lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
