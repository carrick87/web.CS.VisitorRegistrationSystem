import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSiteAdmin, canAccessWarehouse } from '@/lib/rbac'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const tag = await prisma.tag.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            visitors: { where: { status: 'ACTIVE' } },
          },
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

    if (tag._count.visitors > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tag with active visitors. Check out all visitors first.' },
        { status: 400 }
      )
    }

    await prisma.tag.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete tag error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
