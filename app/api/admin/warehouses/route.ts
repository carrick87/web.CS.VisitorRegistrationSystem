import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin, requireSiteAdmin, isSuperAdmin, getAccessibleSiteIds } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    const accessibleSiteIds = await getAccessibleSiteIds(authResult.session)

    let where: { siteId?: string | { in: string[] } } = {}
    if (siteId) {
      if (!accessibleSiteIds.includes(siteId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      where.siteId = siteId
    } else if (!isSuperAdmin(authResult.session)) {
      where.siteId = { in: accessibleSiteIds }
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        site: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { visitors: true, users: true },
        },
      },
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ warehouses })
  } catch (error) {
    console.error('Get warehouses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { siteId, code, name } = await request.json()

    if (!siteId || !code || !name) {
      return NextResponse.json({ error: 'Site ID, warehouse code, and name are required' }, { status: 400 })
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const existingCode = await prisma.warehouse.findUnique({ where: { code } })
    if (existingCode) {
      return NextResponse.json({ error: 'Warehouse code already exists' }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        siteId,
        code: code.toUpperCase(),
        name,
      },
      include: {
        site: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { visitors: true, users: true },
        },
      },
    })

    return NextResponse.json({ warehouse }, { status: 201 })
  } catch (error) {
    console.error('Create warehouse error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
