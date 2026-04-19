/**
 * Database Seeding Script using Prisma
 * Usage: node scripts/seed-prisma.js
 */

require('dotenv').config();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('  Dental SaaS Platform - Database Seeder');
  console.log('========================================\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.apiUsage.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.message.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();
  console.log('Existing data cleared.\n');

  // Create Clinic
  console.log('Creating clinic...');
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Smile Dental Clinic',
      address: '123 Healthcare Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      phone: '+1 (555) 123-4567',
      email: 'info@smiledental.com',
      timezone: 'America/New_York',
      businessHours: {
        monday: { start: '09:00', end: '18:00', closed: false },
        tuesday: { start: '09:00', end: '18:00', closed: false },
        wednesday: { start: '09:00', end: '18:00', closed: false },
        thursday: { start: '09:00', end: '18:00', closed: false },
        friday: { start: '09:00', end: '17:00', closed: false },
        saturday: { start: '10:00', end: '14:00', closed: false },
        sunday: null
      },
      licenseKey: 'DEMO-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      licenseType: 'PROFESSIONAL',
      licenseStatus: 'ACTIVE',
      activationEmail: 'admin@smiledental.com',
      features: {
        appointmentDuration: 30,
        reminderHours: 24,
        currency: 'USD',
        taxRate: 8.875
      }
    }
  });
  console.log(`Clinic created: ${clinic.name} (${clinic.id})\n`);

  // Create Users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@dentalcare.com',
      password: passwordHash,
      phone: '+1 (555) 100-0001',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log(`Super Admin created: Admin User (admin@dentalcare.com / admin123)`);

  const doctorUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@dentalcare.com',
      password: await bcrypt.hash('doctor123', 10),
      phone: '+1 (555) 100-0002',
      role: 'DOCTOR',
      status: 'ACTIVE'
    }
  });
  console.log(`Doctor created: Sarah Johnson (sarah.johnson@dentalcare.com / doctor123)`);

  const receptionist = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      firstName: 'Reception',
      lastName: 'Staff',
      email: 'reception@dentalcare.com',
      password: await bcrypt.hash('reception123', 10),
      phone: '+1 (555) 100-0003',
      role: 'RECEPTIONIST',
      status: 'ACTIVE'
    }
  });
  console.log(`Receptionist created: Reception Staff (reception@dentalcare.com / reception123)\n`);

  // Create Doctor Profile for Sarah
  console.log('Creating doctor profile...');
  const doctor = await prisma.doctor.create({
    data: {
      clinicId: clinic.id,
      userId: doctorUser.id,
      specialization: 'General Dentistry',
      licenseNumber: 'DENT-12345',
      experience: 5,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: { start: '09:00', end: '17:00' },
      isActive: true
    }
  });
  console.log(`Doctor profile created.\n`);

  // Create Patients
  console.log('Creating patients...');
  const patients = [
    { firstName: 'James', lastName: 'Anderson', email: 'james@email.com', phone: '+1 (555) 200-0001', dateOfBirth: new Date('1985-03-15') },
    { firstName: 'Maria', lastName: 'Garcia', email: 'maria@email.com', phone: '+1 (555) 200-0002', dateOfBirth: new Date('1990-07-22') },
    { firstName: 'Robert', lastName: 'Smith', email: 'robert@email.com', phone: '+1 (555) 200-0003', dateOfBirth: new Date('1978-11-08') },
    { firstName: 'Emily', lastName: 'Brown', email: 'emily@email.com', phone: '+1 (555) 200-0004', dateOfBirth: new Date('1995-02-28') },
    { firstName: 'Michael', lastName: 'Davis', email: 'michael@email.com', phone: '+1 (555) 200-0005', dateOfBirth: new Date('1982-06-14') }
  ];

  for (const patientData of patients) {
    await prisma.patient.create({
      data: {
        ...patientData,
        clinicId: clinic.id,
        status: 'ACTIVE'
      }
    });
    console.log(`Patient created: ${patientData.firstName} ${patientData.lastName}`);
  }

  console.log('\n========================================');
  console.log('  Database seeded successfully!');
  console.log('========================================');
  console.log('\nLogin credentials:');
  console.log('  Admin:         admin@dentalcare.com / admin123');
  console.log('  Doctor:        sarah.johnson@dentalcare.com / doctor123');
  console.log('  Receptionist:  reception@dentalcare.com / reception123');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
