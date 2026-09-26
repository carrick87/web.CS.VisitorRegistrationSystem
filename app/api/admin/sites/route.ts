import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin, requireSiteAdmin, isSuperAdmin } from '@/lib/rbac'

export async function GET() {
  try {
    const authResult = await requireSiteAdmin()
    if (!authResult.authorized || !authResult.session) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    let where = {}
    if (!isSuperAdmin(authResult.session) && authResult.session.siteId) {
      where = { id: authResult.session.siteId }
    }

    const sites = await prisma.site.findMany({
      where,
      include: {
        warehouses: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
          orderBy: { code: 'asc' },
        },
        _count: {
          select: {
            warehouses: true,
            users: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ sites })
  } catch (error) {
    console.error('Get sites error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { name, code } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Site name is required' }, { status: 400 })
    }

    if (code) {
      const existingCode = await prisma.site.findUnique({ where: { code } })
      if (existingCode) {
        return NextResponse.json({ error: 'Site code already exists' }, { status: 400 })
      }
    }

    const site = await prisma.site.create({
      data: {
        name,
        code: code || null,
      },
      include: {
        _count: {
          select: {
            warehouses: true,
            users: true,
          },
        },
      },
    })

    return NextResponse.json({ site }, { status: 201 })
  } catch (error) {
    console.error('Create site error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
