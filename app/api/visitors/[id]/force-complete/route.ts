import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { checkoutBy, remarks } = await request.json()

    if (!checkoutBy) {
      return NextResponse.json({ error: 'Checkout by name is required' }, { status: 400 })
    }

    const visitor = await prisma.visitor.findUnique({
      where: { id: params.id },
    })

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
    }

    if (visitor.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Visitor is not currently active' }, { status: 400 })
    }

    const updatedVisitor = await prisma.visitor.update({
      where: { id: params.id },
      data: {
        status: 'FORCE_COMPLETED',
        timeOut: new Date(),
        checkoutBy,
        remarks: remarks || null,
      },
    })

    return NextResponse.json({
      success: true,
      visitor: updatedVisitor,
    })
  } catch (error) {
    console.error('Force complete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
