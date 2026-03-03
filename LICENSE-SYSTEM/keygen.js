#!/usr/bin/env node

/**
 * License Key Generator
 * 
 * Generates license keys for the Dental Practice Management System
 * 
 * Usage:
 *   node keygen.js --type PROFESSIONAL --email client@clinic.com
 * 
 * License Key Format: DXK-2024-PRO-A8F92X
 *   DXK      = Product code (Dental X Key)
 *   2024     = Year
 *   PRO      = License type (STD, PRO, ENT)
 *   A8F92X   = Random verification code
 */

const crypto = require('crypto');

// License types
const LICENSE_TYPES = {
  STANDARD: 'STD',
  PROFESSIONAL: 'PRO',
  ENTERPRISE: 'ENT'
};

// License prices (for reference)
const PRICES = {
  STANDARD: 7999,
  PROFESSIONAL: 12999,
  ENTERPRISE: 19999
};

/**
 * Generate a random verification code
 */
function generateVerificationCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars
  let code = '';
  const bytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  
  return code;
}

/**
 * Generate license key
 */
function generateLicenseKey(type, email) {
  const year = new Date().getFullYear();
  const typeCode = LICENSE_TYPES[type] || LICENSE_TYPES.PROFESSIONAL;
  const verificationCode = generateVerificationCode();
  
  // Format: DXK-YEAR-TYPE-VERIFICATION
  const licenseKey = `DXK-${year}-${typeCode}-${verificationCode}`;
  
  // Generate activation code (hash of email + license key)
  const activationCode = crypto
    .createHash('sha256')
    .update(email + licenseKey + 'SECRET_SALT_CHANGE_THIS')
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
  
  return {
    licenseKey,
    activationCode,
    type,
    email,
    year,
    price: PRICES[type],
    generatedAt: new Date().toISOString()
  };
}

/**
 * Validate license key format
 */
function validateLicenseKeyFormat(licenseKey) {
  const pattern = /^DXK-\d{4}-(STD|PRO|ENT)-[A-Z0-9]{6}$/;
  return pattern.test(licenseKey);
}

/**
 * Parse license key
 */
function parseLicenseKey(licenseKey) {
  if (!validateLicenseKeyFormat(licenseKey)) {
    return null;
  }
  
  const parts = licenseKey.split('-');
  return {
    product: parts[0],
    year: parseInt(parts[1]),
    type: parts[2],
    code: parts[3]
  };
}

/**
 * Generate multiple licenses (batch)
 */
function generateBatch(count, type, domain) {
  const licenses = [];
  
  for (let i = 0; i < count; i++) {
    const email = `client${i + 1}@${domain}`;
    licenses.push(generateLicenseKey(type, email));
  }
  
  return licenses;
}

/**
 * Save to database format (example)
 */
function formatForDatabase(license) {
  return {
    license_key: license.licenseKey,
    activation_code: license.activationCode,
    license_type: license.type,
    customer_email: license.email,
    price: license.price,
    status: 'ACTIVE',
    activation_date: null,
    expiry_date: null, // Set manually or 1 year from activation
    created_at: license.generatedAt
  };
}

/**
 * CLI Interface
 */
function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let type = 'PROFESSIONAL';
  let email = 'customer@example.com';
  let batch = false;
  let count = 1;
  let domain = 'example.com';
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--type':
      case '-t':
        type = args[++i].toUpperCase();
        break;
      case '--email':
      case '-e':
        email = args[++i];
        break;
      case '--batch':
      case '-b':
        batch = true;
        count = parseInt(args[++i]) || 10;
        break;
      case '--domain':
      case '-d':
        domain = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        return;
    }
  }
  
  // Validate type
  if (!LICENSE_TYPES[type]) {
    console.error(`Invalid license type: ${type}`);
    console.error(`Valid types: ${Object.keys(LICENSE_TYPES).join(', ')}`);
    process.exit(1);
  }
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Dental Practice Management - License Generator       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  if (batch) {
    // Generate batch
    console.log(`Generating ${count} ${type} licenses...\n`);
    const licenses = generateBatch(count, type, domain);
    
    console.log('License Keys Generated:\n');
    console.log('─'.repeat(100));
    console.log('KEY'.padEnd(30), 'EMAIL'.padEnd(35), 'TYPE'.padEnd(15), 'PRICE');
    console.log('─'.repeat(100));
    
    licenses.forEach(license => {
      console.log(
        license.licenseKey.padEnd(30),
        license.email.padEnd(35),
        license.type.padEnd(15),
        `$${license.price}`
      );
    });
    
    console.log('─'.repeat(100));
    console.log(`\nTotal Value: $${licenses.reduce((sum, l) => sum + l.price, 0).toLocaleString()}\n`);
    
    // Save to file
    const fs = require('fs');
    const filename = `licenses_${type}_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(licenses, null, 2));
    console.log(`✓ Saved to: ${filename}\n`);
    
  } else {
    // Generate single license
    const license = generateLicenseKey(type, email);
    
    console.log('License Generated:\n');
    console.log('─'.repeat(60));
    console.log(`License Key:       ${license.licenseKey}`);
    console.log(`Activation Code:   ${license.activationCode}`);
    console.log(`Type:              ${license.type}`);
    console.log(`Customer Email:    ${license.email}`);
    console.log(`Price:             $${license.price.toLocaleString()}`);
    console.log(`Generated:         ${new Date(license.generatedAt).toLocaleString()}`);
    console.log('─'.repeat(60));
    
    console.log('\n📋 Instructions for Customer:\n');
    console.log('1. Install the Dental Practice Management System');
    console.log('2. On first launch, enter this license key:');
    console.log(`   ${license.licenseKey}`);
    console.log('3. Enter your email for activation:');
    console.log(`   ${license.email}`);
    console.log('4. Complete the setup wizard\n');
    
    // Database format
    console.log('📊 Database Insert (SQL):\n');
    const db = formatForDatabase(license);
    console.log(`INSERT INTO licenses (
  license_key, activation_code, license_type, customer_email,
  price, status, created_at
) VALUES (
  '${db.license_key}',
  '${db.activation_code}',
  '${db.license_type}',
  '${db.customer_email}',
  ${db.price},
  '${db.status}',
  NOW()
);\n`);
  }
}

/**
 * Print help
 */
function printHelp() {
  console.log(`
License Key Generator

Usage:
  node keygen.js [options]

Options:
  -t, --type TYPE        License type (STANDARD, PROFESSIONAL, ENTERPRISE)
  -e, --email EMAIL      Customer email address
  -b, --batch COUNT      Generate multiple licenses
  -d, --domain DOMAIN    Domain for batch emails (default: example.com)
  -h, --help            Show this help message

Examples:
  # Generate single license
  node keygen.js --type PROFESSIONAL --email client@clinic.com

  # Generate 10 standard licenses
  node keygen.js --type STANDARD --batch 10 --domain dentalclinic.com

License Types & Prices:
  STANDARD     - $7,999   (1-3 doctors, basic AI)
  PROFESSIONAL - $12,999  (unlimited doctors, full AI)
  ENTERPRISE   - $19,999  (multi-location, custom)

Annual Maintenance: 20% of license price
  `);
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  generateLicenseKey,
  validateLicenseKeyFormat,
  parseLicenseKey,
  generateBatch,
  LICENSE_TYPES,
  PRICES
};
