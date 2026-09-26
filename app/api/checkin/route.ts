import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  generatePin,
  generateBrowserToken,
  normalizePlate,
  normalizeVehicleType,
  truckPlateError,
} from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { warehouseCode, name, visitorType, company, department, purpose, carPlate, vehicleType } =
      body

    if (!warehouseCode) {
      return NextResponse.json({ error: 'Warehouse code is required' }, { status: 400 })
    }

    if (!name || !visitorType || !purpose) {
      return NextResponse.json({ error: 'Name, visitor type, and purpose are required' }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { code: warehouseCode.toUpperCase() },
      include: { site: true },
    })

    if (!warehouse) {
      return NextResponse.json({ error: 'Invalid warehouse code' }, { status: 404 })
    }

    if (!warehouse.isActive) {
      return NextResponse.json({ error: 'This warehouse is not accepting visitors' }, { status: 400 })
    }

    if (visitorType === 'EXTERNAL' && !company) {
      return NextResponse.json({ error: 'Company is required for external visitors' }, { status: 400 })
    }

    if (visitorType === 'STAFF' && !department) {
      return NextResponse.json({ error: 'Department is required for staff visitors' }, { status: 400 })
    }

    const plateError = truckPlateError(vehicleType, carPlate, purpose)
    if (plateError) {
      return NextResponse.json({ error: plateError }, { status: 400 })
    }

    const pin = generatePin()
    const browserToken = generateBrowserToken()

    const visitor = await prisma.visitor.create({
      data: {
        warehouseId: warehouse.id,
        name,
        visitorType,
        company: visitorType === 'EXTERNAL' ? company : null,
        department: visitorType === 'STAFF' ? department : null,
        purpose,
        carPlate: visitorType === 'EXTERNAL' ? normalizePlate(carPlate) : null,
        vehicleType: normalizeVehicleType(vehicleType),
        pin,
        browserToken,
        status: 'ACTIVE',
        timeIn: new Date(),
      },
      include: {
        warehouse: {
          select: { id: true, code: true, name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      visitorId: visitor.id,
      browserToken,
      warehouse: {
        code: warehouse.code,
        name: warehouse.name,
        siteName: warehouse.site.name,
      },
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
