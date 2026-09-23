import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { browserToken, pin } = await request.json()

    if (!browserToken || !pin) {
      return NextResponse.json({ error: 'Browser token and PIN are required' }, { status: 400 })
    }

    const visitor = await prisma.visitor.findFirst({
      where: {
        browserToken,
        status: 'ACTIVE',
      },
    })

    if (!visitor) {
      return NextResponse.json({ error: 'No active check-in found' }, { status: 404 })
    }

    if (visitor.pin !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    const timeOut = new Date()

    const updatedVisitor = await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        status: 'COMPLETED',
        timeOut,
      },
    })

    return NextResponse.json({
      success: true,
      name: updatedVisitor.name,
      timeIn: updatedVisitor.timeIn,
      timeOut: updatedVisitor.timeOut,
    })
  } catch (error) {
    console.error('Check-out error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
