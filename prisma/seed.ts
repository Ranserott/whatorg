import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  })

  if (existingAdmin) {
    console.log('Admin user already exists. Skipping creation.')
  } else {
    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true
      }
    })
    console.log('Created admin user:', admin.username)
    console.log('⚠️  Please change the password after first login!')
  }

  // Create a test regular user
  const existingTestUser = await prisma.user.findUnique({
    where: { username: 'testuser' }
  })

  if (!existingTestUser) {
    const passwordHash = await bcrypt.hash('test123', 10)
    const testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        passwordHash,
        name: 'Usuario de Prueba',
        role: 'USER',
        isActive: true
      }
    })
    console.log('Created test user:', testUser.username)
  }

  console.log('Database seed completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
