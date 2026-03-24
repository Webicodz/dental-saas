/**
 * CLINIC USER DETAIL API
 * 
 * GET /api/clinic/users/[id] - Get a specific user
 * PUT /api/clinic/users/[id] - Update a user
 * DELETE /api/clinic/users/[id] - Delete a user
 * 
 * IN CODEIGNITER:
 * Like: application/controllers/api/Clinic_users.php (with ID parameter)
 * 
 * PERMISSIONS:
 * - ADMIN: Can view, update, delete any user in their clinic
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, forbiddenError } from '@/lib/middleware'
import { hashPassword, comparePassword } from '@/lib/auth'

// Helper function to check if user belongs to clinic
async function getUserWithClinicCheck(userId, clinicId) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      clinicId
    },
    include: {
      doctor: true
    }
  })
  return user
}

// GET - Get a specific user
export async function GET(request, { params }) {
  try {
    const { id } = params
    
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    // CHECK PERMISSIONS - Only ADMIN can view user details
    if (user.role !== 'ADMIN') {
      return forbiddenError('Only administrators can view user details')
    }

    const clinicId = user.clinicId

    // FETCH USER
    const targetUser = await getUserWithClinicCheck(id, clinicId)

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role,
        status: targetUser.status,
        avatarUrl: targetUser.avatarUrl,
        lastLogin: targetUser.lastLogin,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
        isDoctor: targetUser.role === 'DOCTOR',
        doctor: targetUser.doctor ? {
          id: targetUser.doctor.id,
          specialization: targetUser.doctor.specialization,
          licenseNumber: targetUser.doctor.licenseNumber,
          qualification: targetUser.doctor.qualification,
          experience: targetUser.doctor.experience,
          consultationFee: targetUser.doctor.consultationFee,
          workingDays: targetUser.doctor.workingDays,
          workingHours: targetUser.doctor.workingHours,
          bio: targetUser.doctor.bio,
          isActive: targetUser.doctor.isActive
        } : null
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// PUT - Update a user
export async function PUT(request, { params }) {
  try {
    const { id } = params
    
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    // CHECK PERMISSIONS - Only ADMIN can update users
    if (user.role !== 'ADMIN') {
      return forbiddenError('Only administrators can update users')
    }

    const clinicId = user.clinicId

    // CHECK IF USER EXISTS AND BELONGS TO CLINIC
    const targetUser = await getUserWithClinicCheck(id, clinicId)

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Prevent admin from deactivating themselves
    if (id === user.userId && targetUser.status === 'ACTIVE') {
      // Allow status changes but warn in the response
    }

    // PARSE REQUEST BODY
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      status,
      avatarUrl,
      password,
      currentPassword,
      // Doctor-specific fields
      specialization,
      licenseNumber,
      qualification,
      experience,
      consultationFee,
      workingDays,
      workingHours,
      bio,
      doctorActive
    } = body

    // VALIDATE EMAIL IF CHANGED
    if (email && email !== targetUser.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid email format'
          },
          { status: 400 }
        )
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      })

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already in use',
            code: 'EMAIL_EXISTS'
          },
          { status: 409 }
        )
      }
    }

    // VALIDATE PASSWORD CHANGE
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: 'Password must be at least 6 characters'
          },
          { status: 400 }
        )
      }

      // If it's not self-edit, require current password verification
      if (id !== user.userId && currentPassword) {
        const isValid = await comparePassword(currentPassword, targetUser.password)
        if (!isValid) {
          return NextResponse.json(
            {
              success: false,
              error: 'Current password is incorrect'
            },
            { status: 400 }
          )
        }
      }
    }

    // VALIDATE ROLE CHANGE
    if (role && !['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid role'
        },
        { status: 400 }
      )
    }

    // PREPARE USER UPDATE DATA
    const userUpdateData = {}

    if (firstName !== undefined) userUpdateData.firstName = firstName.trim()
    if (lastName !== undefined) userUpdateData.lastName = lastName.trim()
    if (email !== undefined) userUpdateData.email = email.toLowerCase().trim()
    if (phone !== undefined) userUpdateData.phone = phone?.trim() || null
    if (role !== undefined) userUpdateData.role = role
    if (status !== undefined) userUpdateData.status = status
    if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl
    if (password) userUpdateData.password = await hashPassword(password)

    // UPDATE USER AND DOCTOR PROFILE WITH TRANSACTION
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user
      const user = await tx.user.update({
        where: { id },
        data: userUpdateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // Update doctor profile if user is a DOCTOR
      if (targetUser.role === 'DOCTOR' && targetUser.doctor) {
        const doctorUpdateData = {}

        if (specialization !== undefined) doctorUpdateData.specialization = specialization
        if (licenseNumber !== undefined) doctorUpdateData.licenseNumber = licenseNumber
        if (qualification !== undefined) doctorUpdateData.qualification = qualification
        if (experience !== undefined) doctorUpdateData.experience = experience
        if (consultationFee !== undefined) doctorUpdateData.consultationFee = consultationFee
        if (workingDays !== undefined) doctorUpdateData.workingDays = workingDays
        if (workingHours !== undefined) doctorUpdateData.workingHours = workingHours
        if (bio !== undefined) doctorUpdateData.bio = bio
        if (doctorActive !== undefined) doctorUpdateData.isActive = doctorActive

        if (Object.keys(doctorUpdateData).length > 0) {
          await tx.doctor.update({
            where: { id: targetUser.doctor.id },
            data: doctorUpdateData
          })
        }
      }

      return user
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...updatedUser,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        isDoctor: updatedUser.role === 'DOCTOR'
      }
    })

  } catch (error) {
    console.error('Update user error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already in use',
          code: 'EMAIL_EXISTS'
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete a user
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    // CHECK PERMISSIONS - Only ADMIN can delete users
    if (user.role !== 'ADMIN') {
      return forbiddenError('Only administrators can delete users')
    }

    const clinicId = user.clinicId

    // PREVENT SELF-DELETION
    if (id === user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'You cannot delete your own account'
        },
        { status: 400 }
      )
    }

    // CHECK IF USER EXISTS AND BELONGS TO CLINIC
    const targetUser = await getUserWithClinicCheck(id, clinicId)

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // CHECK FOR ASSOCIATED DATA
    // Check if user has appointments
    const appointmentCount = await prisma.appointment.count({
      where: { createdById: id }
    })

    if (appointmentCount > 0) {
      // Option 1: Prevent deletion
      // Option 2: Reassign appointments (not implemented here)
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete user with ${appointmentCount} associated appointments. Reassign appointments first.`,
          code: 'HAS_ASSOCIATED_DATA'
        },
        { status: 400 }
      )
    }

    // DELETE USER (CASCADE WILL HANDLE DOCTOR PROFILE)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user',
        details: error.message
      },
      { status: 500 }
    )
  }
}
