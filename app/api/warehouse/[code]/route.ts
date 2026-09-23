import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { code: params.code.toUpperCase() },
      include: {
        site: {
          select: { id: true, name: true },
        },
      },
    })

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    if (!warehouse.isActive) {
      return NextResponse.json({ error: 'Warehouse is not active' }, { status: 400 })
    }

    return NextResponse.json({
      warehouse: {
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        site: warehouse.site,
      },
    })
  } catch (error) {
    console.error('Get warehouse error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
