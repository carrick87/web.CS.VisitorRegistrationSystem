import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePin, generateBrowserToken } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, visitorType, company, department, purpose, carPlate } = body

    if (!name || !visitorType || !purpose) {
      return NextResponse.json({ error: 'Name, visitor type, and purpose are required' }, { status: 400 })
    }

    if (visitorType === 'EXTERNAL' && !company) {
      return NextResponse.json({ error: 'Company is required for external visitors' }, { status: 400 })
    }

    if (visitorType === 'STAFF' && !department) {
      return NextResponse.json({ error: 'Department is required for staff visitors' }, { status: 400 })
    }

    const pin = generatePin()
    const browserToken = generateBrowserToken()

    const visitor = await prisma.visitor.create({
      data: {
        name,
        visitorType,
        company: visitorType === 'EXTERNAL' ? company : null,
        department: visitorType === 'STAFF' ? department : null,
        purpose,
        carPlate: visitorType === 'EXTERNAL' ? carPlate : null,
        pin,
        browserToken,
        status: 'ACTIVE',
        timeIn: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      visitorId: visitor.id,
      browserToken,
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
