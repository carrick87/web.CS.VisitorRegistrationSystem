import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSiteAdmin, canAccessWarehouse, isSuperAdmin } from '@/lib/rbac'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const visitor = await prisma.visitor.findUnique({
      where: { id: params.id },
      include: { warehouse: true },
    })

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
    }

    if (visitor.warehouseId && !isSuperAdmin(authResult.session)) {
      const canAccess = await canAccessWarehouse(authResult.session, visitor.warehouseId)
      if (!canAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await prisma.visitor.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete visitor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
