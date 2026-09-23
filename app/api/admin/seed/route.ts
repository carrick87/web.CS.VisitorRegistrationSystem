import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const setupSecret = process.env.SETUP_SECRET
  
  if (!setupSecret) {
    return NextResponse.json(
      { error: 'SETUP_SECRET environment variable is not configured' },
      { status: 500 }
    )
  }

  const providedSecret = request.headers.get('x-setup-secret')
  
  if (providedSecret !== setupSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Create Sites
    const sarawakSite = await prisma.site.upsert({
      where: { code: 'SWK' },
      update: { name: 'Sarawak Region' },
      create: { name: 'Sarawak Region', code: 'SWK' },
    })

    const sabahSite = await prisma.site.upsert({
      where: { code: 'SBH' },
      update: { name: 'Sabah Region' },
      create: { name: 'Sabah Region', code: 'SBH' },
    })

    // Create Warehouses - Sarawak
    const kuchingMain = await prisma.warehouse.upsert({
      where: { code: 'KCH01' },
      update: { name: 'Kuching Main Warehouse', siteId: sarawakSite.id },
      create: { siteId: sarawakSite.id, code: 'KCH01', name: 'Kuching Main Warehouse' },
    })

    const kuchingCold = await prisma.warehouse.upsert({
      where: { code: 'KCH02' },
      update: { name: 'Kuching Cold Storage', siteId: sarawakSite.id },
      create: { siteId: sarawakSite.id, code: 'KCH02', name: 'Kuching Cold Storage' },
    })

    const sibuWarehouse = await prisma.warehouse.upsert({
      where: { code: 'SBU01' },
      update: { name: 'Sibu Distribution Center', siteId: sarawakSite.id },
      create: { siteId: sarawakSite.id, code: 'SBU01', name: 'Sibu Distribution Center' },
    })

    // Create Warehouses - Sabah
    const kkMain = await prisma.warehouse.upsert({
      where: { code: 'KK01' },
      update: { name: 'Kota Kinabalu Main Warehouse', siteId: sabahSite.id },
      create: { siteId: sabahSite.id, code: 'KK01', name: 'Kota Kinabalu Main Warehouse' },
    })

    const sandakanWarehouse = await prisma.warehouse.upsert({
      where: { code: 'SDK01' },
      update: { name: 'Sandakan Warehouse', siteId: sabahSite.id },
      create: { siteId: sabahSite.id, code: 'SDK01', name: 'Sandakan Warehouse' },
    })

    // Create Super Admin
    const superAdmin = await prisma.user.upsert({
      where: { username: 'superadmin' },
      update: { password: 'admin123', name: 'System Administrator', role: 'SUPER_ADMIN', siteId: null },
      create: { username: 'superadmin', password: 'admin123', name: 'System Administrator', role: 'SUPER_ADMIN' },
    })

    // Create Site Admins
    const sarawakAdmin = await prisma.user.upsert({
      where: { username: 'kuching_admin' },
      update: { password: 'admin123', name: 'Ahmad bin Hassan', role: 'SITE_ADMIN', siteId: sarawakSite.id },
      create: { username: 'kuching_admin', password: 'admin123', name: 'Ahmad bin Hassan', role: 'SITE_ADMIN', siteId: sarawakSite.id },
    })

    const sabahAdmin = await prisma.user.upsert({
      where: { username: 'kk_admin' },
      update: { password: 'admin123', name: 'Maria Wong', role: 'SITE_ADMIN', siteId: sabahSite.id },
      create: { username: 'kk_admin', password: 'admin123', name: 'Maria Wong', role: 'SITE_ADMIN', siteId: sabahSite.id },
    })

    // Create Storekeepers
    const storekeeper1 = await prisma.user.upsert({
      where: { username: 'storekeeper' },
      update: { password: 'demo1234', name: 'Lee Wei Ming', role: 'STOREKEEPER', siteId: null },
      create: { username: 'storekeeper', password: 'demo1234', name: 'Lee Wei Ming', role: 'STOREKEEPER' },
    })

    await prisma.userWarehouse.deleteMany({ where: { userId: storekeeper1.id } })
    await prisma.userWarehouse.createMany({
      data: [
        { userId: storekeeper1.id, warehouseId: kuchingMain.id },
        { userId: storekeeper1.id, warehouseId: kuchingCold.id },
      ],
    })

    const storekeeper2 = await prisma.user.upsert({
      where: { username: 'sibu_keeper' },
      update: { password: 'demo1234', name: 'Ting Siew Hua', role: 'STOREKEEPER', siteId: null },
      create: { username: 'sibu_keeper', password: 'demo1234', name: 'Ting Siew Hua', role: 'STOREKEEPER' },
    })

    await prisma.userWarehouse.deleteMany({ where: { userId: storekeeper2.id } })
    await prisma.userWarehouse.create({
      data: { userId: storekeeper2.id, warehouseId: sibuWarehouse.id },
    })

    const storekeeper3 = await prisma.user.upsert({
      where: { username: 'kk_keeper' },
      update: { password: 'demo1234', name: 'Roslan bin Abdullah', role: 'STOREKEEPER', siteId: null },
      create: { username: 'kk_keeper', password: 'demo1234', name: 'Roslan bin Abdullah', role: 'STOREKEEPER' },
    })

    await prisma.userWarehouse.deleteMany({ where: { userId: storekeeper3.id } })
    await prisma.userWarehouse.createMany({
      data: [
        { userId: storekeeper3.id, warehouseId: kkMain.id },
        { userId: storekeeper3.id, warehouseId: sandakanWarehouse.id },
      ],
    })

    // Backfill legacy visitors without warehouseId to default warehouse (KCH01)
    const migrationResult = await prisma.visitor.updateMany({
      where: {
        OR: [
          { warehouseId: null },
          { warehouseId: '' },
        ],
      },
      data: { warehouseId: kuchingMain.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        sites: [
          { name: sarawakSite.name, code: sarawakSite.code },
          { name: sabahSite.name, code: sabahSite.code },
        ],
        warehouses: [
          { code: kuchingMain.code, name: kuchingMain.name, site: 'Sarawak' },
          { code: kuchingCold.code, name: kuchingCold.name, site: 'Sarawak' },
          { code: sibuWarehouse.code, name: sibuWarehouse.name, site: 'Sarawak' },
          { code: kkMain.code, name: kkMain.name, site: 'Sabah' },
          { code: sandakanWarehouse.code, name: sandakanWarehouse.name, site: 'Sabah' },
        ],
        users: {
          superAdmin: { username: superAdmin.username },
          siteAdmins: [
            { username: sarawakAdmin.username, site: 'Sarawak' },
            { username: sabahAdmin.username, site: 'Sabah' },
          ],
          storekeepers: [
            { username: storekeeper1.username, warehouses: ['KCH01', 'KCH02'] },
            { username: storekeeper2.username, warehouses: ['SBU01'] },
            { username: storekeeper3.username, warehouses: ['KK01', 'SDK01'] },
          ],
        },
        backfilledLegacyVisitors: migrationResult.count,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
