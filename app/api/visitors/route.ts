import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')

    let where = {}
    if (statusParam) {
      const statuses = statusParam.split(',')
      where = { status: { in: statuses } }
    }

    const visitors = await prisma.visitor.findMany({
      where,
      orderBy: { timeIn: 'desc' },
    })

    return NextResponse.json({ visitors })
  } catch (error) {
    console.error('Get visitors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
