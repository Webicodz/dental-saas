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
  console.log('[LOGIN API] Request received at:', new Date().toISOString())
  console.log('[LOGIN API] Request URL:', request.url)
  console.log('[LOGIN API] Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    // STEP 1: Get data from request body
    // In CodeIgniter: $this->input->post('email')
    console.log('[LOGIN API] Parsing request body...')
    const body = await request.json()
    console.log('[LOGIN API] Request body parsed:', { email: body.email, hasPassword: !!body.password })
    const { email, password } = body
    
    if (!email || !password) {
      console.log('[LOGIN API] Missing email or password')
    } else {
      console.log('[LOGIN API] Attempting login for email:', email)
    }

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
    console.log('[LOGIN API] Querying database for user:', email)
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: email },
        include: {
          clinic: true, // Also get clinic info (JOIN in SQL)
          doctor: true  // And doctor info if user is a doctor
        }
      })
      console.log('[LOGIN API] Database query completed. User found:', !!user)
    } catch (dbError) {
      console.error('[LOGIN API] Database query failed:', dbError.message)
      console.error('[LOGIN API] Database error stack:', dbError.stack)
      throw dbError
    }

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

    // Determine redirect URL based on role
    const redirectUrl = user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/dashboard'

    // STEP 9: Create response with cookie for middleware auth
    const response = NextResponse.json({
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
      },
      redirectUrl
    })

    // Set auth cookie for middleware to read during page navigation
    response.cookies.set('auth_token', token, {
      httpOnly: false, // Allow JS to read for localStorage sync
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    // STEP 10: Handle any errors
    console.error('[LOGIN API] CRITICAL ERROR:', error.message)
    console.error('[LOGIN API] Error name:', error.name)
    console.error('[LOGIN API] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'An error occurred during login', details: error.message },
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
