import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const user = await prisma.user.upsert({
    where: { username: 'storekeeper' },
    update: {
      password: 'demo1234',
      name: 'Store Keeper',
      role: 'ADMIN',
    },
    create: {
      username: 'storekeeper',
      password: 'demo1234',
      name: 'Store Keeper',
      role: 'ADMIN',
    },
  })

  console.log('✅ Upserted demo user:', user.username)

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
