import { PrismaClient } from '@prisma/client'
// @ts-ignore
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing if re-running
  await prisma.user.deleteMany({ where: { email: 'admin@test.com' } })
  await prisma.clinic.deleteMany({ where: { email: 'clinic@test.com' } })

  const hashedPassword = await bcrypt.hash('admin123', 10)

  const clinic = await prisma.clinic.create({
    data: {
      name: 'Super Admin Clinic',
      email: 'executive@dentalcare.com',
      phone: '1234567890',
      address: 'N/A',

      // ✅ REQUIRED FIXES
      businessHours: {},   // temporary empty JSON
      features: {},        // temporary empty JSON
      licenseKey: 'Executive',
      licenseType: 'Executive',
      activationEmail: 'clinic@test.com',
    },
  })

  await prisma.user.create({
    data: {
      email: 'admin@dentalcare.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      clinicId: clinic.id,

      // ✅ REQUIRED FIX
      firstName: 'Admin',
      lastName: 'User',
    },
  })

  console.log('✅ Super Admin Created')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())