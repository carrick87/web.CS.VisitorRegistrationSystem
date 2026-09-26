import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  generatePin,
  generateBrowserToken,
  normalizePlate,
  normalizeVehicleType,
  truckPlateError,
} from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const tagCode = params.code.toUpperCase()
    const body = await request.json()
    const { name, visitorType, company, department, purpose, carPlate, vehicleType } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

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

    let visitorData: {
      tagId: string
      warehouseId: string
      name: string
      visitorType: string
      company: string | null
      department: string | null
      purpose: string
      carPlate: string | null
      vehicleType: string | null
      pin: string
      browserToken: string
      status: string
      isGroupLeader: boolean
      timeIn: Date
    }

    if (hasActiveGroup && groupLeader) {
      visitorData = {
        tagId: tag.id,
        warehouseId: tag.warehouse.id,
        name,
        visitorType: groupLeader.visitorType,
        company: groupLeader.company,
        department: groupLeader.department,
        purpose: groupLeader.purpose,
        carPlate: groupLeader.carPlate,
        vehicleType: groupLeader.vehicleType,
        pin: generatePin(),
        browserToken: generateBrowserToken(),
        status: 'ACTIVE',
        isGroupLeader: false,
        timeIn: new Date(),
      }
    } else {
      if (!visitorType || !purpose) {
        return NextResponse.json(
          { error: 'Visitor type and purpose are required for the first visitor' },
          { status: 400 }
        )
      }

      if (visitorType === 'EXTERNAL' && !company) {
        return NextResponse.json(
          { error: 'Company is required for external visitors' },
          { status: 400 }
        )
      }

      if (visitorType === 'STAFF' && !department) {
        return NextResponse.json(
          { error: 'Department is required for staff visitors' },
          { status: 400 }
        )
      }

      const plateError = truckPlateError(vehicleType, carPlate)
      if (plateError) {
        return NextResponse.json({ error: plateError }, { status: 400 })
      }

      visitorData = {
        tagId: tag.id,
        warehouseId: tag.warehouse.id,
        name,
        visitorType,
        company: visitorType === 'EXTERNAL' ? company : null,
        department: visitorType === 'STAFF' ? department : null,
        purpose,
        carPlate: visitorType === 'EXTERNAL' ? normalizePlate(carPlate) : null,
        vehicleType: normalizeVehicleType(vehicleType),
        pin: generatePin(),
        browserToken: generateBrowserToken(),
        status: 'ACTIVE',
        isGroupLeader: true,
        timeIn: new Date(),
      }
    }

    const visitor = await prisma.visitor.create({
      data: visitorData,
      include: {
        tag: {
          select: { id: true, code: true, displayNumber: true },
        },
        warehouse: {
          select: { id: true, code: true, name: true },
        },
      },
    })

    const newCount = activeVisitors.length + 1

    return NextResponse.json({
      success: true,
      visitorId: visitor.id,
      tag: {
        code: tag.code,
        displayNumber: tag.displayNumber,
      },
      warehouse: {
        code: tag.warehouse.code,
        name: tag.warehouse.name,
        siteName: tag.warehouse.site.name,
      },
      isGroupLeader: visitor.isGroupLeader,
      groupSize: newCount,
    })
  } catch (error) {
    console.error('Tag check-in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
