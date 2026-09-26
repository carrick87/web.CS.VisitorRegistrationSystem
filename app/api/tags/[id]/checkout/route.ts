import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaff, canAccessWarehouse } from '@/lib/rbac'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { checkoutBy, remarks, visitorId } = await request.json()

    if (!checkoutBy) {
      return NextResponse.json({ error: 'Checkout by name is required' }, { status: 400 })
    }

    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
      include: {
        warehouse: true,
        visitors: {
          where: { status: 'ACTIVE' },
        },
      },
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    const canAccess = await canAccessWarehouse(authResult.session, tag.warehouseId)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (tag.visitors.length === 0) {
      return NextResponse.json({ error: 'No active visitors on this tag' }, { status: 400 })
    }

    const timeOut = new Date()

    if (visitorId) {
      const visitor = tag.visitors.find((v) => v.id === visitorId)
      if (!visitor) {
        return NextResponse.json(
          { error: 'Visitor not found on this tag' },
          { status: 404 }
        )
      }

      await prisma.visitor.update({
        where: { id: visitorId },
        data: {
          status: 'STAFF_CHECKOUT',
          timeOut,
          checkoutBy,
          remarks: remarks || null,
        },
      })

      return NextResponse.json({
        success: true,
        checkedOut: 1,
        message: 'Visitor checked out successfully',
      })
    } else {
      const visitorIds = tag.visitors.map((v) => v.id)

      await prisma.visitor.updateMany({
        where: { id: { in: visitorIds } },
        data: {
          status: 'STAFF_CHECKOUT',
          timeOut,
          checkoutBy,
          remarks: remarks || null,
        },
      })

      return NextResponse.json({
        success: true,
        checkedOut: visitorIds.length,
        message: `Group of ${visitorIds.length} checked out successfully`,
      })
    }
  } catch (error) {
    console.error('Tag checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
