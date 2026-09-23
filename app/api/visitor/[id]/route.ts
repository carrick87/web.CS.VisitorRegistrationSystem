import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQRCode } from '@/lib/qr'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visitor = await prisma.visitor.findUnique({
      where: { id: params.id },
      include: {
        warehouse: {
          include: {
            site: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
    }

    const qrData = JSON.stringify({
      visitorId: visitor.id,
      pin: visitor.pin,
    })
    const qrCode = await generateQRCode(qrData)

    return NextResponse.json({
      id: visitor.id,
      name: visitor.name,
      visitorType: visitor.visitorType,
      company: visitor.company,
      department: visitor.department,
      purpose: visitor.purpose,
      carPlate: visitor.carPlate,
      pin: visitor.pin,
      timeIn: visitor.timeIn,
      status: visitor.status,
      qrCode,
      warehouse: {
        code: visitor.warehouse.code,
        name: visitor.warehouse.name,
        siteName: visitor.warehouse.site.name,
      },
    })
  } catch (error) {
    console.error('Get visitor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
