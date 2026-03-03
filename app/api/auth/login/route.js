/**
 * LOGIN API ENDPOINT
 * 
 * This handles user login requests
 * URL: POST /api/auth/login
 * 
 * IN CODEIGNITER:
 * This would be: application/controllers/Auth.php → login() method
 * 
 * HOW IT WORKS:
 * 1. Receive email + password from frontend
 * 2. Find user in database by email
 * 3. Check if password matches
 * 4. If yes: Create JWT token and send it back
 * 5. If no: Send error message
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword, generateToken } from '@/lib/auth'

export async function POST(request) {
  try {
    // STEP 1: Get data from request body
    // In CodeIgniter: $this->input->post('email')
    const body = await request.json()
    const { email, password } = body

    // STEP 2: Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // STEP 3: Find user in database
    // CODEIGNITER EQUIVALENT:
    // $this->db->where('email', $email)->get('users')->row()
    const user = await prisma.user.findUnique({
      where: { email: email },
      include: {
        clinic: true, // Also get clinic info (JOIN in SQL)
        doctor: true  // And doctor info if user is a doctor
      }
    })

    // STEP 4: Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 } // 401 = Unauthorized
      )
    }

    // STEP 5: Check if account is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is inactive. Contact administrator.' },
        { status: 403 } // 403 = Forbidden
      )
    }

    // STEP 6: Compare password with hashed password in database
    // This is secure - we NEVER store plain text passwords!
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // STEP 7: Update last login time
    // CODEIGNITER EQUIVALENT:
    // $this->db->where('id', $user_id)->update('users', ['last_login' => date('Y-m-d H:i:s')])
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        loginCount: user.loginCount + 1
      }
    })

    // STEP 8: Generate JWT token
    // This token will be sent to frontend and used for authentication
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId
    })

    // STEP 9: Send success response with token and user data
    // Frontend will store this token and send it with every request
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        clinicName: user.clinic?.name || null
      }
    })

  } catch (error) {
    // STEP 10: Handle any errors
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 } // 500 = Server Error
    )
  }
}

/**
 * HOW FRONTEND WILL CALL THIS:
 * 
 * fetch('/api/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ 
 *     email: 'user@example.com',
 *     password: 'password123' 
 *   })
 * })
 * .then(res => res.json())
 * .then(data => {
 *   if (data.success) {
 *     // Save token to localStorage or cookie
 *     localStorage.setItem('token', data.token)
 *     localStorage.setItem('user', JSON.stringify(data.user))
 *     // Redirect to dashboard
 *     window.location.href = '/dashboard'
 *   } else {
 *     // Show error message
 *     alert(data.error)
 *   }
 * })
 * 
 * CODEIGNITER EQUIVALENT:
 * AJAX call to: site_url('auth/login')
 */
