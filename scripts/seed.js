/**
 * Database Seeding Script for Dental SaaS Platform
 * 
 * This script populates the database with demo data for testing
 * and development purposes.
 * 
 * Usage:
 *   node scripts/seed.js
 *   node scripts/seed.js --clear  (clear existing data first)
 *   node scripts/seed.js --users-only (seed only users)
 *   node scripts/seed.js --patients-only (seed only patients)
 * 
 * Environment Variables:
 *   DATABASE_URL - PostgreSQL connection string
 *   NODE_ENV - development | production
 */

const { Client } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Configuration
const CONFIG = {
  defaultClinic: {
    name: 'Smile Dental Clinic',
    address: '123 Healthcare Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    phone: '+1 (555) 123-4567',
    email: 'info@smiledental.com',
    timezone: 'America/New_York',
    workingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '14:00' },
      sunday: null
    }
  }
};

// Sample Data
const SAMPLE_USERS = [
  {
    name: 'Admin User',
    email: 'admin@dentalcare.com',
    password: 'admin123',
    role: 'ADMIN',
    phone: '+1 (555) 100-0001',
    specialty: null
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@dentalcare.com',
    password: 'doctor123',
    role: 'DOCTOR',
    phone: '+1 (555) 100-0002',
    specialty: 'Orthodontics'
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@dentalcare.com',
    password: 'doctor123',
    role: 'DOCTOR',
    phone: '+1 (555) 100-0003',
    specialty: 'Endodontics'
  },
  {
    name: 'Dr. Emily Williams',
    email: 'emily.williams@dentalcare.com',
    password: 'doctor123',
    role: 'DOCTOR',
    phone: '+1 (555) 100-0004',
    specialty: 'Pediatric Dentistry'
  },
  {
    name: 'Receptionist Brown',
    email: 'reception@dentalcare.com',
    password: 'reception123',
    role: 'RECEPTIONIST',
    phone: '+1 (555) 100-0005',
    specialty: null
  },
  {
    name: 'Billing Manager',
    email: 'billing@dentalcare.com',
    password: 'billing123',
    role: 'BILLING',
    phone: '+1 (555) 100-0006',
    specialty: null
  }
];

const SAMPLE_PATIENTS = [
  { name: 'James Anderson', email: 'james.anderson@email.com', phone: '+1 (555) 200-0001', dateOfBirth: '1985-03-15', gender: 'MALE' },
  { name: 'Maria Garcia', email: 'maria.garcia@email.com', phone: '+1 (555) 200-0002', dateOfBirth: '1990-07-22', gender: 'FEMALE' },
  { name: 'Robert Taylor', email: 'robert.taylor@email.com', phone: '+1 (555) 200-0003', dateOfBirth: '1978-11-08', gender: 'MALE' },
  { name: 'Jennifer Martinez', email: 'jennifer.martinez@email.com', phone: '+1 (555) 200-0004', dateOfBirth: '1995-01-30', gender: 'FEMALE' },
  { name: 'David Wilson', email: 'david.wilson@email.com', phone: '+1 (555) 200-0005', dateOfBirth: '1982-09-12', gender: 'MALE' },
  { name: 'Lisa Brown', email: 'lisa.brown@email.com', phone: '+1 (555) 200-0006', dateOfBirth: '1988-04-25', gender: 'FEMALE' },
  { name: 'Michael Davis', email: 'michael.davis@email.com', phone: '+1 (555) 200-0007', dateOfBirth: '1975-12-03', gender: 'MALE' },
  { name: 'Emma Thompson', email: 'emma.thompson@email.com', phone: '+1 (555) 200-0008', dateOfBirth: '1992-06-18', gender: 'FEMALE' },
  { name: 'William Johnson', email: 'william.johnson@email.com', phone: '+1 (555) 200-0009', dateOfBirth: '1980-08-27', gender: 'MALE' },
  { name: 'Olivia Moore', email: 'olivia.moore@email.com', phone: '+1 (555) 200-0010', dateOfBirth: '1997-02-14', gender: 'FEMALE' },
  { name: 'Christopher Lee', email: 'christopher.lee@email.com', phone: '+1 (555) 200-0011', dateOfBirth: '1983-10-05', gender: 'MALE' },
  { name: 'Sophia White', email: 'sophia.white@email.com', phone: '+1 (555) 200-0012', dateOfBirth: '1991-05-20', gender: 'FEMALE' },
  { name: 'Daniel Harris', email: 'daniel.harris@email.com', phone: '+1 (555) 200-0013', dateOfBirth: '1977-07-09', gender: 'MALE' },
  { name: 'Isabella Clark', email: 'isabella.clark@email.com', phone: '+1 (555) 200-0014', dateOfBirth: '1994-03-28', gender: 'FEMALE' },
  { name: 'Matthew Lewis', email: 'matthew.lewis@email.com', phone: '+1 (555) 200-0015', dateOfBirth: '1989-09-16', gender: 'MALE' }
];

const SAMPLE_TREATMENTS = [
  { name: 'Regular Checkup', description: 'Routine dental examination', duration: 30, price: 75.00, category: 'PREVENTIVE' },
  { name: 'Teeth Cleaning', description: 'Professional teeth cleaning', duration: 45, price: 120.00, category: 'PREVENTIVE' },
  { name: 'Dental Filling', description: 'Cavity filling with composite resin', duration: 45, price: 180.00, category: 'RESTORATIVE' },
  { name: 'Root Canal', description: 'Endodontic treatment', duration: 90, price: 850.00, category: 'RESTORATIVE' },
  { name: 'Tooth Extraction', description: 'Simple tooth removal', duration: 30, price: 150.00, category: 'SURGICAL' },
  { name: 'Wisdom Tooth Extraction', description: 'Surgical wisdom tooth removal', duration: 60, price: 350.00, category: 'SURGICAL' },
  { name: 'Teeth Whitening', description: 'Professional teeth whitening', duration: 60, price: 400.00, category: 'COSMETIC' },
  { name: 'Dental Crown', description: 'Porcelain crown placement', duration: 60, price: 1200.00, category: 'RESTORATIVE' },
  { name: 'Dental Bridge', description: 'Bridge placement for missing teeth', duration: 90, price: 2500.00, category: 'RESTORATIVE' },
  { name: 'Invisalign Consultation', description: 'Orthodontic consultation', duration: 45, price: 200.00, category: 'ORTHODONTIC' },
  { name: 'Dental X-Ray', description: 'Panoramic dental x-ray', duration: 15, price: 85.00, category: 'DIAGNOSTIC' },
  { name: 'Gum Treatment', description: 'Periodontal treatment', duration: 45, price: 250.00, category: 'PREVENTIVE' }
];

// Utility Functions
function generateId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function generateUUID() {
  return crypto.randomUUID();
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Database Functions
async function clearDatabase(client) {
  console.log('Clearing existing data...');
  
  await client.query('BEGIN');
  
  try {
    // Disable foreign key checks temporarily
    await client.query('SET CONSTRAINTS ALL DEFERRED');
    
    // Clear all tables in reverse order of dependencies
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM invoices');
    await client.query('DELETE FROM invoice_items');
    await client.query('DELETE FROM appointments');
    await client.query('DELETE FROM documents');
    await client.query('DELETE FROM treatments');
    await client.query('DELETE FROM patients');
    await client.query('DELETE FROM doctors');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM clinics');
    
    // Re-enable constraints
    await client.query('SET CONSTRAINTS ALL IMMEDIATE');
    await client.query('COMMIT');
    
    console.log('Database cleared successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function seedClinic(client) {
  console.log('Seeding clinic...');
  
  const clinicId = generateId('clinic');
  const clinic = {
    id: clinicId,
    ...CONFIG.defaultClinic,
    licenseKey: 'DEMO-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    plan: 'PREMIUM',
    status: 'ACTIVE',
    settings: {
      appointmentDuration: 30,
      reminderHours: 24,
      currency: 'USD',
      taxRate: 8.875
    }
  };
  
  await client.query(
    `INSERT INTO clinics (id, name, address, city, state, "zipCode", country, phone, email, 
     timezone, "workingHours", "licenseKey", plan, status, settings, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
    [clinic.id, clinic.name, clinic.address, clinic.city, clinic.state, clinic.zipCode, 
     clinic.country, clinic.phone, clinic.email, clinic.timezone, JSON.stringify(clinic.workingHours),
     clinic.licenseKey, clinic.plan, clinic.status, JSON.stringify(clinic.settings)]
  );
  
  console.log(`Clinic created: ${clinic.name} (${clinic.id})`);
  return clinic;
}

async function seedUsers(client, clinicId) {
  console.log('Seeding users...');
  
  const users = [];
  
  for (const userData of SAMPLE_USERS) {
    const userId = generateId('user');
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    await client.query(
      `INSERT INTO users (id, name, email, password, role, phone, specialty, "clinicId", 
       "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [userId, userData.name, userData.email, passwordHash, userData.role, 
       userData.phone, userData.specialty, clinicId]
    );
    
    users.push({ ...userData, id: userId, clinicId });
    console.log(`User created: ${userData.name} (${userData.role})`);
  }
  
  return users;
}

async function seedDoctors(client, users, clinicId) {
  console.log('Seeding doctors...');
  
  const doctors = [];
  const doctorUsers = users.filter(u => u.role === 'DOCTOR');
  
  for (const user of doctorUsers) {
    const doctorId = generateId('doctor');
    const schedule = {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '10:00', end: '14:00' },
      sunday: null
    };
    
    await client.query(
      `INSERT INTO doctors (id, "userId", "clinicId", specialty, schedule, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [doctorId, user.id, clinicId, user.specialty, JSON.stringify(schedule)]
    );
    
    doctors.push({ ...user, doctorId });
    console.log(`Doctor created: ${user.name} - ${user.specialty}`);
  }
  
  return doctors;
}

async function seedPatients(client, clinicId) {
  console.log('Seeding patients...');
  
  const patients = [];
  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
  
  for (const patientData of SAMPLE_PATIENTS) {
    const patientId = generateId('patient');
    const lastVisit = randomDate(twoYearsAgo, now);
    
    await client.query(
      `INSERT INTO patients (id, name, email, phone, "dateOfBirth", gender, 
       "clinicId", "lastVisit", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [patientId, patientData.name, patientData.email, patientData.phone, 
       patientData.dateOfBirth, patientData.gender, clinicId, lastVisit, 'ACTIVE']
    );
    
    // Create address
    const address = `${randomInt(100, 999)} ${randomElement(['Main', 'Oak', 'Pine', 'Maple', 'Cedar'])} ${randomElement(['St', 'Ave', 'Blvd', 'Dr'])}`;
    const city = randomElement(['New York', 'Brooklyn', 'Queens', 'Manhattan', 'Bronx']);
    
    await client.query(
      `UPDATE patients SET address = $1, city = $2, state = 'NY', "zipCode" = $3 WHERE id = $4`,
      [address, city, `${randomInt(10000, 11999)}`, patientId]
    );
    
    patients.push({ ...patientData, id: patientId, lastVisit });
    console.log(`Patient created: ${patientData.name}`);
  }
  
  return patients;
}

async function seedTreatments(client, clinicId) {
  console.log('Seeding treatments...');
  
  const treatments = [];
  
  for (const treatmentData of SAMPLE_TREATMENTS) {
    const treatmentId = generateId('treatment');
    
    await client.query(
      `INSERT INTO treatments (id, name, description, duration, price, category, "clinicId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [treatmentId, treatmentData.name, treatmentData.description, 
       treatmentData.duration, treatmentData.price, treatmentData.category, clinicId]
    );
    
    treatments.push({ ...treatmentData, id: treatmentId });
    console.log(`Treatment created: ${treatmentData.name}`);
  }
  
  return treatments;
}

async function seedAppointments(client, patients, doctors, treatments, clinicId) {
  console.log('Seeding appointments...');
  
  const now = new Date();
  const appointmentStatuses = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  const appointmentTypes = ['CHECKUP', 'FOLLOWUP', 'TREATMENT', 'EMERGENCY', 'CONSULTATION'];
  
  // Create appointments for past 30 days and next 14 days
  for (let i = -30; i <= 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    // Skip Sundays
    if (date.getDay() === 0) continue;
    
    // Create 5-15 appointments per day
    const numAppointments = randomInt(5, 15);
    
    for (let j = 0; j < numAppointments; j++) {
      const patient = randomElement(patients);
      const doctor = randomElement(doctors);
      const treatment = randomElement(treatments);
      
      // Random time between 9 AM and 5 PM
      const hour = randomInt(9, 17);
      const minute = randomInt(0, 1) * 30;
      const appointmentDate = new Date(date);
      appointmentDate.setHours(hour, minute, 0, 0);
      
      // Status based on date
      let status;
      if (i < 0) {
        status = Math.random() > 0.1 ? 'COMPLETED' : randomElement(['CANCELLED', 'NO_SHOW']);
      } else if (i === 0) {
        status = randomElement(['SCHEDULED', 'CONFIRMED', 'COMPLETED']);
      } else {
        status = randomElement(['SCHEDULED', 'CONFIRMED']);
      }
      
      const appointmentId = generateId('appointment');
      
      await client.query(
        `INSERT INTO appointments (id, "patientId", "doctorId", "clinicId", "treatmentId", 
         "dateTime", duration, type, status, notes, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [appointmentId, patient.id, doctor.doctorId, clinicId, treatment.id,
         appointmentDate, treatment.duration, randomElement(appointmentTypes), 
         status, `Appointment for ${treatment.name}`]
      );
    }
  }
  
  console.log('Appointments created for 30 days history and 14 days future');
}

async function seedInvoices(client, patients, treatments, doctors, clinicId) {
  console.log('Seeding invoices...');
  
  const invoiceStatuses = ['PENDING', 'PAID', 'OVERDUE', 'PARTIAL'];
  const now = new Date();
  
  // Create invoices for completed appointments
  for (const patient of patients) {
    // Create 1-5 invoices per patient
    const numInvoices = randomInt(1, 5);
    
    for (let i = 0; i < numInvoices; i++) {
      const invoiceId = generateId('invoice');
      const invoiceDate = randomDate(new Date(now.getFullYear() - 1, 0, 1), now);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);
      
      // Generate 1-5 items per invoice
      const numItems = randomInt(1, 5);
      let totalAmount = 0;
      const items = [];
      
      for (let j = 0; j < numItems; j++) {
        const treatment = randomElement(treatments);
        const quantity = randomInt(1, 3);
        const unitPrice = treatment.price;
        const itemTotal = unitPrice * quantity;
        totalAmount += itemTotal;
        
        items.push({
          description: treatment.name,
          quantity,
          unitPrice,
          total: itemTotal,
          treatmentId: treatment.id
        });
      }
      
      // Status based on due date
      let status;
      if (invoiceDate < new Date(now.getFullYear(), now.getMonth() - 2, 1)) {
        status = Math.random() > 0.3 ? 'PAID' : 'OVERDUE';
      } else {
        status = randomElement(invoiceStatuses);
      }
      
      let paidAmount = 0;
      if (status === 'PAID') paidAmount = totalAmount;
      else if (status === 'PARTIAL') paidAmount = totalAmount * randomElement([0.25, 0.5, 0.75]);
      
      await client.query(
        `INSERT INTO invoices (id, "patientId", "clinicId", "invoiceNumber", date, "dueDate", 
         subtotal, tax, total, status, "paidAmount", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [invoiceId, patient.id, clinicId, `INV-${Date.now()}-${randomInt(1000, 9999)}`,
         invoiceDate, dueDate, totalAmount, totalAmount * 0.08875, totalAmount * 1.08875,
         status, paidAmount]
      );
      
      // Insert invoice items
      for (const item of items) {
        await client.query(
          `INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", total, "treatmentId")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [invoiceId, item.description, item.quantity, item.unitPrice, item.total, item.treatmentId]
        );
      }
      
      console.log(`Invoice created: ${patient.name} - $${(totalAmount * 1.08875).toFixed(2)}`);
    }
  }
}

async function seedNotifications(client, users, patients, doctors, clinicId) {
  console.log('Seeding notifications...');
  
  const notificationTypes = ['appointment', 'payment', 'patient', 'system'];
  const notificationMessages = {
    appointment: [
      'New appointment scheduled for tomorrow',
      'Appointment reminder: Patient arriving in 30 minutes',
      'Appointment cancelled by patient',
      'Appointment rescheduled successfully'
    ],
    payment: [
      'Payment received for invoice',
      'Invoice overdue - payment required',
      'Partial payment recorded',
      'New invoice generated'
    ],
    patient: [
      'New patient registered',
      'Patient medical history updated',
      'Patient contact information changed'
    ],
    system: [
      'System backup completed',
      'Weekly report generated',
      'New feature update available'
    ]
  };
  
  const now = new Date();
  
  for (const user of users) {
    // Create 5-15 notifications per user
    const numNotifications = randomInt(5, 15);
    
    for (let i = 0; i < numNotifications; i++) {
      const type = randomElement(notificationTypes);
      const message = randomElement(notificationMessages[type]);
      const createdAt = randomDate(new Date(now.getFullYear(), now.getMonth() - 1, 1), now);
      const read = Math.random() > 0.3;
      
      await client.query(
        `INSERT INTO notifications ("userId", "clinicId", type, message, read, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, clinicId, type, message, read, createdAt]
      );
    }
  }
  
  console.log('Notifications created for all users');
}

// Main Seeding Function
async function seedDatabase(options = {}) {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dental_saas';
  
  console.log('========================================');
  console.log('  Dental SaaS Platform - Database Seeder');
  console.log('========================================\n');
  
  const client = new Client({
    connectionString: dbUrl
  });
  
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Clear existing data if requested
    if (options.clear) {
      await clearDatabase(client);
      console.log('');
    }
    
    // Seed clinic
    const clinic = await seedClinic(client);
    console.log('');
    
    // Seed users
    const users = await seedUsers(client, clinic.id);
    console.log('');
    
    // Seed doctors
    const doctors = await seedDoctors(client, users, clinic.id);
    console.log('');
    
    // Seed patients
    const patients = await seedPatients(client, clinic.id);
    console.log('');
    
    // Seed treatments
    const treatments = await seedTreatments(client, clinic.id);
    console.log('');
    
    // Seed appointments (if not users-only)
    if (!options.usersOnly) {
      await seedAppointments(client, patients, doctors, treatments, clinic.id);
      console.log('');
    }
    
    // Seed invoices (if not users-only)
    if (!options.usersOnly) {
      await seedInvoices(client, patients, treatments, doctors, clinic.id);
      console.log('');
    }
    
    // Seed notifications
    await seedNotifications(client, users, patients, doctors, clinic.id);
    console.log('');
    
    console.log('========================================');
    console.log('  Seeding Complete!');
    console.log('========================================\n');
    console.log('Login Credentials:');
    console.log('-----------------');
    console.log('Admin:        admin@dentalcare.com / admin123');
    console.log('Doctor 1:     sarah.johnson@dentalcare.com / doctor123');
    console.log('Doctor 2:     michael.chen@dentalcare.com / doctor123');
    console.log('Doctor 3:     emily.williams@dentalcare.com / doctor123');
    console.log('Receptionist: reception@dentalcare.com / reception123');
    console.log('Billing:      billing@dentalcare.com / billing123');
    console.log('');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  clear: args.includes('--clear'),
  usersOnly: args.includes('--users-only'),
  patientsOnly: args.includes('--patients-only')
};

// Run seeder
seedDatabase(options).then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
