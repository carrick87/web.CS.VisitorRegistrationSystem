import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with multi-warehouse demo data...')
  console.log('')

  // Create Sites - Malaysian Harrisons-style regions
  console.log('📍 Creating sites...')
  
  const sarawakSite = await prisma.site.upsert({
    where: { code: 'SWK' },
    update: { name: 'Sarawak Region' },
    create: {
      name: 'Sarawak Region',
      code: 'SWK',
    },
  })
  console.log(`  ✅ Site: ${sarawakSite.name} (${sarawakSite.code})`)

  const sabahSite = await prisma.site.upsert({
    where: { code: 'SBH' },
    update: { name: 'Sabah Region' },
    create: {
      name: 'Sabah Region',
      code: 'SBH',
    },
  })
  console.log(`  ✅ Site: ${sabahSite.name} (${sabahSite.code})`)

  // Create Warehouses
  console.log('')
  console.log('🏭 Creating warehouses...')

  // Sarawak warehouses
  const kuchingMain = await prisma.warehouse.upsert({
    where: { code: 'KCH01' },
    update: { name: 'Kuching Main Warehouse', siteId: sarawakSite.id },
    create: {
      siteId: sarawakSite.id,
      code: 'KCH01',
      name: 'Kuching Main Warehouse',
    },
  })
  console.log(`  ✅ Warehouse: ${kuchingMain.name} (${kuchingMain.code})`)

  const kuchingCold = await prisma.warehouse.upsert({
    where: { code: 'KCH02' },
    update: { name: 'Kuching Cold Storage', siteId: sarawakSite.id },
    create: {
      siteId: sarawakSite.id,
      code: 'KCH02',
      name: 'Kuching Cold Storage',
    },
  })
  console.log(`  ✅ Warehouse: ${kuchingCold.name} (${kuchingCold.code})`)

  const sibuWarehouse = await prisma.warehouse.upsert({
    where: { code: 'SBU01' },
    update: { name: 'Sibu Distribution Center', siteId: sarawakSite.id },
    create: {
      siteId: sarawakSite.id,
      code: 'SBU01',
      name: 'Sibu Distribution Center',
    },
  })
  console.log(`  ✅ Warehouse: ${sibuWarehouse.name} (${sibuWarehouse.code})`)

  // Sabah warehouses
  const kkMain = await prisma.warehouse.upsert({
    where: { code: 'KK01' },
    update: { name: 'Kota Kinabalu Main Warehouse', siteId: sabahSite.id },
    create: {
      siteId: sabahSite.id,
      code: 'KK01',
      name: 'Kota Kinabalu Main Warehouse',
    },
  })
  console.log(`  ✅ Warehouse: ${kkMain.name} (${kkMain.code})`)

  const sandakanWarehouse = await prisma.warehouse.upsert({
    where: { code: 'SDK01' },
    update: { name: 'Sandakan Warehouse', siteId: sabahSite.id },
    create: {
      siteId: sabahSite.id,
      code: 'SDK01',
      name: 'Sandakan Warehouse',
    },
  })
  console.log(`  ✅ Warehouse: ${sandakanWarehouse.name} (${sandakanWarehouse.code})`)

  // Create Users
  console.log('')
  console.log('👥 Creating users...')

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      password: 'admin123',
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
      siteId: null,
    },
    create: {
      username: 'superadmin',
      password: 'admin123',
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
    },
  })
  console.log(`  ✅ Super Admin: ${superAdmin.username}`)

  // Sarawak Site Admin
  const sarawakAdmin = await prisma.user.upsert({
    where: { username: 'kuching_admin' },
    update: {
      password: 'admin123',
      name: 'Ahmad bin Hassan',
      role: 'SITE_ADMIN',
      siteId: sarawakSite.id,
    },
    create: {
      username: 'kuching_admin',
      password: 'admin123',
      name: 'Ahmad bin Hassan',
      role: 'SITE_ADMIN',
      siteId: sarawakSite.id,
    },
  })
  console.log(`  ✅ Site Admin (Sarawak): ${sarawakAdmin.username}`)

  // Sabah Site Admin
  const sabahAdmin = await prisma.user.upsert({
    where: { username: 'kk_admin' },
    update: {
      password: 'admin123',
      name: 'Maria Wong',
      role: 'SITE_ADMIN',
      siteId: sabahSite.id,
    },
    create: {
      username: 'kk_admin',
      password: 'admin123',
      name: 'Maria Wong',
      role: 'SITE_ADMIN',
      siteId: sabahSite.id,
    },
  })
  console.log(`  ✅ Site Admin (Sabah): ${sabahAdmin.username}`)

  // Storekeepers - Sarawak
  const storekeeper1 = await prisma.user.upsert({
    where: { username: 'storekeeper' },
    update: {
      password: 'demo1234',
      name: 'Lee Wei Ming',
      role: 'STOREKEEPER',
      siteId: null,
    },
    create: {
      username: 'storekeeper',
      password: 'demo1234',
      name: 'Lee Wei Ming',
      role: 'STOREKEEPER',
    },
  })
  console.log(`  ✅ Storekeeper: ${storekeeper1.username}`)

  // Assign storekeeper1 to multiple Kuching warehouses
  await prisma.userWarehouse.deleteMany({ where: { userId: storekeeper1.id } })
  await prisma.userWarehouse.createMany({
    data: [
      { userId: storekeeper1.id, warehouseId: kuchingMain.id },
      { userId: storekeeper1.id, warehouseId: kuchingCold.id },
    ],
  })
  console.log(`    → Assigned to: ${kuchingMain.code}, ${kuchingCold.code}`)

  const storekeeper2 = await prisma.user.upsert({
    where: { username: 'sibu_keeper' },
    update: {
      password: 'demo1234',
      name: 'Ting Siew Hua',
      role: 'STOREKEEPER',
      siteId: null,
    },
    create: {
      username: 'sibu_keeper',
      password: 'demo1234',
      name: 'Ting Siew Hua',
      role: 'STOREKEEPER',
    },
  })
  console.log(`  ✅ Storekeeper: ${storekeeper2.username}`)

  await prisma.userWarehouse.deleteMany({ where: { userId: storekeeper2.id } })
  await prisma.userWarehouse.create({
    data: { userId: storekeeper2.id, warehouseId: sibuWarehouse.id },
  })
  console.log(`    → Assigned to: ${sibuWarehouse.code}`)

  // Storekeeper - Sabah
  const storekeeper3 = await prisma.user.upsert({
    where: { username: 'kk_keeper' },
    update: {
      password: 'demo1234',
      name: 'Roslan bin Abdullah',
      role: 'STOREKEEPER',
      siteId: null,
    },
    create: {
      username: 'kk_keeper',
      password: 'demo1234',
      name: 'Roslan bin Abdullah',
      role: 'STOREKEEPER',
    },
  })
  console.log(`  ✅ Storekeeper: ${storekeeper3.username}`)

  await prisma.userWarehouse.deleteMany({ where: { userId: storekeeper3.id } })
  await prisma.userWarehouse.createMany({
    data: [
      { userId: storekeeper3.id, warehouseId: kkMain.id },
      { userId: storekeeper3.id, warehouseId: sandakanWarehouse.id },
    ],
  })
  console.log(`    → Assigned to: ${kkMain.code}, ${sandakanWarehouse.code}`)

  // Migrate legacy visitors without warehouseId to default warehouse (Kuching Main)
  console.log('')
  console.log('📦 Backfilling legacy visitors...')
  
  const migrationResult = await prisma.visitor.updateMany({
    where: {
      OR: [
        { warehouseId: null },
        { warehouseId: '' },
      ],
    },
    data: { warehouseId: kuchingMain.id },
  })
  
  if (migrationResult.count > 0) {
    console.log(`  ✅ Backfilled ${migrationResult.count} legacy visitor(s) to ${kuchingMain.code}`)
  } else {
    console.log('  ℹ️  No legacy visitors needed backfill')
  }

  // Create sample demo visitors
  console.log('')
  console.log('🧑‍💼 Creating demo visitors...')

  const demoVisitors = [
    {
      warehouseId: kuchingMain.id,
      name: 'John Smith',
      visitorType: 'EXTERNAL',
      company: 'ABC Trading Sdn Bhd',
      purpose: 'GENERAL',
      carPlate: 'QKA 1234',
      pin: '1234',
      browserToken: 'demo-token-1',
      status: 'ACTIVE',
    },
    {
      warehouseId: kuchingMain.id,
      name: 'Tan Mei Ling',
      visitorType: 'EXTERNAL',
      company: 'Express Logistics',
      purpose: 'TRUCK',
      carPlate: 'BDG 5678',
      pin: '5678',
      browserToken: 'demo-token-2',
      status: 'ACTIVE',
    },
    {
      warehouseId: kuchingCold.id,
      name: 'Rajesh Kumar',
      visitorType: 'STAFF',
      department: 'Quality Control',
      purpose: 'GENERAL',
      pin: '9012',
      browserToken: 'demo-token-3',
      status: 'ACTIVE',
    },
    {
      warehouseId: kkMain.id,
      name: 'Siti Nurhaliza',
      visitorType: 'EXTERNAL',
      company: 'Fresh Produce Sdn Bhd',
      purpose: 'TRUCK',
      carPlate: 'SAA 9999',
      pin: '3456',
      browserToken: 'demo-token-4',
      status: 'ACTIVE',
    },
  ]

  // Delete existing demo visitors by browserToken pattern and recreate
  await prisma.visitor.deleteMany({
    where: {
      browserToken: { startsWith: 'demo-token-' },
    },
  })
  
  for (const visitor of demoVisitors) {
    await prisma.visitor.create({
      data: visitor,
    })
  }
  console.log(`  ✅ Created ${demoVisitors.length} demo visitor(s)`)

  console.log('')
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('                        DEMO ACCOUNTS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log('SUPER ADMIN (Full system access)')
  console.log('  Username: superadmin')
  console.log('  Password: admin123')
  console.log('')
  console.log('SITE ADMINS (Site-level access)')
  console.log('  Sarawak: kuching_admin / admin123')
  console.log('  Sabah:   kk_admin / admin123')
  console.log('')
  console.log('STOREKEEPERS (Warehouse-level access)')
  console.log('  storekeeper / demo1234  → KCH01, KCH02 (Kuching)')
  console.log('  sibu_keeper / demo1234  → SBU01 (Sibu)')
  console.log('  kk_keeper / demo1234    → KK01, SDK01 (Kota Kinabalu)')
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('                     WAREHOUSE CHECK-IN URLs')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log('  /checkin/KCH01  → Kuching Main Warehouse')
  console.log('  /checkin/KCH02  → Kuching Cold Storage')
  console.log('  /checkin/SBU01  → Sibu Distribution Center')
  console.log('  /checkin/KK01   → Kota Kinabalu Main Warehouse')
  console.log('  /checkin/SDK01  → Sandakan Warehouse')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
