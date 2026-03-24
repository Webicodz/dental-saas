/**
 * CLINIC SETTINGS API
 * 
 * GET /api/clinic/settings - Get clinic settings
 * PUT /api/clinic/settings - Update clinic settings
 * 
 * IN CODEIGNITER:
 * Like: application/controllers/api/Clinic_settings.php
 * 
 * PERMISSIONS:
 * - ADMIN: Can view and update settings
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, forbiddenError } from '@/lib/middleware'

// GET - Get clinic settings
export async function GET(request) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    const clinicId = user.clinicId

    // FETCH CLINIC
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        // Branding
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        // Settings
        timezone: true,
        currency: true,
        dateFormat: true,
        timeFormat: true,
        // Business hours
        businessHours: true,
        // Features
        features: true,
        // License info (for display)
        licenseType: true,
        licenseStatus: true,
        licenseExpiry: true,
        // Timestamps
        createdAt: true,
        updatedAt: true
      }
    })

    if (!clinic) {
      return NextResponse.json(
        {
          success: false,
          error: 'Clinic not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: {
        // Basic info
        id: clinic.id,
        name: clinic.name,
        email: clinic.email,
        phone: clinic.phone,
        address: clinic.address,
        city: clinic.city,
        state: clinic.state,
        zipCode: clinic.zipCode,
        country: clinic.country,
        
        // Branding
        logoUrl: clinic.logoUrl,
        primaryColor: clinic.primaryColor,
        secondaryColor: clinic.secondaryColor,
        
        // Preferences
        timezone: clinic.timezone,
        currency: clinic.currency,
        dateFormat: clinic.dateFormat,
        timeFormat: clinic.timeFormat,
        
        // Business hours
        businessHours: clinic.businessHours,
        
        // Features
        features: clinic.features,
        
        // License (read-only)
        license: {
          type: clinic.licenseType,
          status: clinic.licenseStatus,
          expiry: clinic.licenseExpiry
        },
        
        // Metadata
        createdAt: clinic.createdAt,
        updatedAt: clinic.updatedAt
      }
    })

  } catch (error) {
    console.error('Get clinic settings error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch clinic settings',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// PUT - Update clinic settings
export async function PUT(request) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    // CHECK PERMISSIONS - Only ADMIN can update settings
    if (user.role !== 'ADMIN') {
      return forbiddenError('Only administrators can update clinic settings')
    }

    const clinicId = user.clinicId

    // PARSE REQUEST BODY
    const body = await request.json()
    const {
      // Basic info
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      // Branding
      logoUrl,
      primaryColor,
      secondaryColor,
      // Preferences
      timezone,
      currency,
      dateFormat,
      timeFormat,
      // Business hours
      businessHours,
      // Features
      features
    } = body

    // VALIDATE INPUT
    const errors = []

    if (name !== undefined && (!name || !name.trim())) {
      errors.push('Clinic name is required')
    }

    if (email !== undefined) {
      if (!email || !email.trim()) {
        errors.push('Email is required')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format')
      }
    }

    if (phone !== undefined && phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      errors.push('Invalid phone number format')
    }

    if (primaryColor !== undefined && primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      errors.push('Invalid primary color format (use hex format, e.g., #2563eb)')
    }

    if (secondaryColor !== undefined && secondaryColor && !/^#[0-9A-Fa-f]{6}$/.test(secondaryColor)) {
      errors.push('Invalid secondary color format (use hex format, e.g., #7c3aed)')
    }

    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'PKR', 'PHP', 'MYR', 'SGD']
    if (currency !== undefined && !validCurrencies.includes(currency)) {
      errors.push(`Invalid currency. Supported: ${validCurrencies.join(', ')}`)
    }

    const validTimezones = [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris',
      'Europe/Berlin', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 
      'Asia/Manila', 'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland'
    ]
    if (timezone !== undefined && !validTimezones.includes(timezone)) {
      errors.push(`Invalid timezone. Supported: ${validTimezones.join(', ')}`)
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      )
    }

    // PREPARE UPDATE DATA
    const updateData = {}

    // Basic info
    if (name !== undefined) updateData.name = name.trim()
    if (email !== undefined) updateData.email = email.toLowerCase().trim()
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (address !== undefined) updateData.address = address?.trim() || null
    if (city !== undefined) updateData.city = city?.trim() || null
    if (state !== undefined) updateData.state = state?.trim() || null
    if (zipCode !== undefined) updateData.zipCode = zipCode?.trim() || null
    if (country !== undefined) updateData.country = country?.trim() || 'US'

    // Branding
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl?.trim() || null
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor || '#2563eb'
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor || '#7c3aed'

    // Preferences
    if (timezone !== undefined) updateData.timezone = timezone
    if (currency !== undefined) updateData.currency = currency
    if (dateFormat !== undefined) updateData.dateFormat = dateFormat
    if (timeFormat !== undefined) updateData.timeFormat = timeFormat

    // Business hours
    if (businessHours !== undefined) {
      // Validate business hours structure
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const validatedHours = {}

      for (const [day, hours] of Object.entries(businessHours)) {
        if (!validDays.includes(day.toLowerCase())) {
          continue
        }

        validatedHours[day.toLowerCase()] = {
          start: hours.start || '09:00',
          end: hours.end || '17:00',
          closed: hours.closed || false
        }
      }

      updateData.businessHours = validatedHours
    }

    // Features
    if (features !== undefined) {
      // Merge with existing features
      const currentClinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { features: true }
      })

      updateData.features = {
        ...(currentClinic.features || {}),
        ...features
      }
    }

    // UPDATE CLINIC
    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        timezone: true,
        currency: true,
        dateFormat: true,
        timeFormat: true,
        businessHours: true,
        features: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Clinic settings updated successfully',
      settings: {
        ...updatedClinic,
        // Include formatted data
        primaryColor: updatedClinic.primaryColor,
        secondaryColor: updatedClinic.secondaryColor
      }
    })

  } catch (error) {
    console.error('Update clinic settings error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update clinic settings',
        details: error.message
      },
      { status: 500 }
    )
  }
}
