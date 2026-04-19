/**
 * SUPER ADMIN - License Generation API
 * 
 * Generate new license keys for clinics.
 * Super Admin only.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, forbiddenError } from '@/lib/middleware'
import crypto from 'crypto'

// ============================================================================
// SUPER ADMIN CHECK
// ============================================================================

/**
 * Verify user is a Super Admin
 */
function requireSuperAdmin(request) {
  const user = authenticate(request)
  
  if (!user) {
    return { authorized: false, error: 'Authentication required', user: null }
  }

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return { 
      authorized: false, 
      error: 'Super Admin access required',
      user 
    }
  }

  return { authorized: true, user }
}

// ============================================================================
// POST /api/admin/license/generate - Generate license key
// ============================================================================

export async function POST(request) {
  try {
    const { authorized, user, error } = requireSuperAdmin(request)
    
    if (!authorized) {
      return user ? forbiddenError(error) : authError(error)
    }

    const body = await request.json()
    const {
      licenseType = 'STANDARD',
      durationMonths = 12,
      clinicId,
      email,
      generateBatch = false,
      batchCount = 1
    } = body

    // Validate license type
    const validTypes = ['STANDARD', 'PROFESSIONAL', 'ENTERPRISE']
    if (!validTypes.includes(licenseType)) {
      return NextResponse.json(
        { success: false, error: `Invalid license type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate duration
    if (durationMonths < 1 || durationMonths > 60) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 1 and 60 months' },
        { status: 400 }
      )
    }

    // Validate batch count
    if (generateBatch && (batchCount < 1 || batchCount > 100)) {
      return NextResponse.json(
        { success: false, error: 'Batch count must be between 1 and 100' },
        { status: 400 }
      )
    }

    // License configuration
    const licenseConfig = {
      STANDARD: {
        code: 'STD',
        price: 7999,
        maxUsers: 10,
        maxPatients: 1000,
        maxStorage: 5000,
        features: {
          smsReminders: true,
          emailReminders: true,
          patientPortal: true,
          aiChatbot: false,
          voiceAgent: false,
          analytics: false,
          multiLocation: false,
          apiAccess: false
        }
      },
      PROFESSIONAL: {
        code: 'PRO',
        price: 12999,
        maxUsers: 50,
        maxPatients: 10000,
        maxStorage: 50000,
        features: {
          smsReminders: true,
          emailReminders: true,
          patientPortal: true,
          aiChatbot: true,
          voiceAgent: false,
          analytics: true,
          multiLocation: false,
          apiAccess: true
        }
      },
      ENTERPRISE: {
        code: 'ENT',
        price: 19999,
        maxUsers: 999,
        maxPatients: 999999,
        maxStorage: 999999,
        features: {
          smsReminders: true,
          emailReminders: true,
          patientPortal: true,
          aiChatbot: true,
          voiceAgent: true,
          analytics: true,
          multiLocation: true,
          apiAccess: true
        }
      }
    }

    const config = licenseConfig[licenseType]

    // Generate licenses
    const licenses = []

    for (let i = 0; i < (generateBatch ? batchCount : 1); i++) {
      const licenseKey = generateLicenseKey(licenseType)
      const activationCode = generateActivationCode(licenseKey, email || 'admin@system.local')
      const expiryDate = calculateExpiryDate(durationMonths)

      const licenseData = {
        licenseKey,
        activationCode,
        licenseType,
        durationMonths,
        expiryDate,
        price: config.price,
        maxUsers: config.maxUsers,
        maxPatients: config.maxPatients,
        maxStorage: config.maxStorage,
        features: config.features,
        generatedAt: new Date().toISOString(),
        generatedBy: user.userId
      }

      // If clinicId provided, activate license immediately
      if (clinicId) {
        await prisma.clinic.update({
          where: { id: clinicId },
          data: {
            licenseKey,
            licenseType,
            licenseStatus: 'ACTIVE',
            licenseExpiry: expiryDate,
            features: config.features
          }
        })

        licenseData.clinicId = clinicId
        licenseData.activatedAt = new Date().toISOString()
      }

      // Log the generation if we have a valid clinic context
      const logClinicId = clinicId || user.clinicId
      if (logClinicId) {
        await prisma.auditLog.create({
          data: {
            clinicId: logClinicId,
            userId: user.userId,
            action: 'GENERATE',
            entity: 'LICENSE',
            entityId: licenseKey,
            newValues: licenseData
          }
        })
      }

      licenses.push(licenseData)
    }

    return NextResponse.json({
      success: true,
      data: {
        licenses,
        summary: {
          total: licenses.length,
          type: licenseType,
          duration: `${durationMonths} months`,
          totalValue: config.price * licenses.length,
          currency: 'USD'
        }
      },
      message: generateBatch 
        ? `Generated ${batchCount} ${licenseType} licenses` 
        : 'License key generated successfully'
    })

  } catch (error) {
    console.error('Error generating license:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate license' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique license key
 * Format: DXK-2024-TYPE-XXXXXX
 */
function generateLicenseKey(licenseType) {
  const year = new Date().getFullYear()
  const typeCode = {
    'STANDARD': 'STD',
    'PROFESSIONAL': 'PRO',
    'ENTERPRISE': 'ENT'
  }[licenseType] || 'STD'
  
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomBytes(1)[0] % chars.length]
  }
  
  return `DXK-${year}-${typeCode}-${code}`
}

/**
 * Generate activation code (hash-based)
 */
function generateActivationCode(licenseKey, email) {
  return crypto
    .createHash('sha256')
    .update(licenseKey + email + process.env.JWT_SECRET || 'secret-salt')
    .digest('hex')
    .substring(0, 16)
    .toUpperCase()
}

/**
 * Calculate expiry date from duration
 */
function calculateExpiryDate(durationMonths) {
  const expiryDate = new Date()
  expiryDate.setMonth(expiryDate.getMonth() + durationMonths)
  return expiryDate
}

/**
 * Validate license key format
 */
export function validateLicenseKey(licenseKey) {
  const pattern = /^DXK-\d{4}-(STD|PRO|ENT)-[A-Z0-9]{6}$/
  return pattern.test(licenseKey)
}

/**
 * Parse license key
 */
export function parseLicenseKey(licenseKey) {
  if (!validateLicenseKey(licenseKey)) {
    return null
  }
  
  const parts = licenseKey.split('-')
  return {
    product: parts[0],
    year: parseInt(parts[1]),
    type: {
      'STD': 'STANDARD',
      'PRO': 'PROFESSIONAL',
      'ENT': 'ENTERPRISE'
    }[parts[2]],
    typeCode: parts[2],
    code: parts[3]
  }
}
