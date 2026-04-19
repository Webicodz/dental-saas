/**
 * REGISTER API ENDPOINT
 * 
 * This handles new user registration
 * URL: POST /api/auth/register
 * 
 * IN CODEIGNITER:
 * application/controllers/Auth.php → register() method
 * 
 * WHAT IT DOES:
 * 1. Receive user data (name, email, password, etc.)
 * 2. Validate data
 * 3. Check if email already exists
 * 4. Hash password
 * 5. Create user in database
 * 6. Create JWT token
 * 7. Return token (auto-login after registration)
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request) {
  try {
    // STEP 1: Get data from request
    const body = await request.json()
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone,
      role,
      clinicId 
    } = body

    // STEP 2: Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, and password are required' },
        { status: 400 }
      )
    }

    // STEP 3: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // STEP 4: Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // STEP 5: Check if email already exists
    // CODEIGNITER: $this->db->where('email', $email)->get('users')->num_rows()
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 } // 409 = Conflict
      )
    }

    // STEP 6: Hash the password
    // NEVER store plain text passwords!
    const hashedPassword = await hashPassword(password)

    // STEP 7: Create user in database
    // CODEIGNITER: $this->db->insert('users', $data)
    
    // For SUPER_ADMIN, clinicId is not required
    const userRole = role || 'RECEPTIONIST';
    const userClinicId = userRole === 'SUPER_ADMIN' ? null : (clinicId || null);
    
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword, // Store HASHED password, not plain text!
        phone: phone || null,
        role: userRole,
        clinicId: userClinicId,
        status: 'ACTIVE',
        loginCount: 0
      },
      include: {
        clinic: true // Get clinic data too
      }
    })

    // STEP 8: Generate JWT token (auto-login after registration)
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      clinicId: newUser.clinicId
    })

    // STEP 9: Return success with token and user data
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      token: token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        clinicId: newUser.clinicId,
        clinicName: newUser.clinic?.name || null
      }
    }, { status: 201 }) // 201 = Created

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}

/**
 * HOW FRONTEND CALLS THIS:
 * 
 * fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com',
 *     password: 'password123',
 *     phone: '+1234567890',
 *     role: 'RECEPTIONIST'
 *   })
 * })
 * .then(res => res.json())
 * .then(data => {
 *   if (data.success) {
 *     // Save token
 *     localStorage.setItem('token', data.token)
 *     localStorage.setItem('user', JSON.stringify(data.user))
 *     // Redirect to dashboard
 *     window.location.href = '/dashboard'
 *   }
 * })
 */
