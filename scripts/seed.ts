import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.user.deleteMany()
  await prisma.visitor.deleteMany()

  const user = await prisma.user.create({
    data: {
      username: 'storekeeper',
      password: 'demo1234',
      name: 'Store Keeper',
      role: 'ADMIN',
    },
  })

  console.log('✅ Created demo user:', user.username)

  const demoVisitor = await prisma.visitor.create({
    data: {
      name: 'John Smith',
      visitorType: 'EXTERNAL',
      company: 'ABC Logistics',
      purpose: 'TRUCK',
      carPlate: 'ABC 1234',
      pin: '1234',
      browserToken: 'demo-token-123',
      status: 'COMPLETED',
      timeIn: new Date(Date.now() - 2 * 60 * 60 * 1000),
      timeOut: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Created demo visitor:', demoVisitor.name)

  console.log('')
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('Demo credentials:')
  console.log('  Username: storekeeper')
  console.log('  Password: demo1234')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
