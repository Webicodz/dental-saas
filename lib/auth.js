/**
 * AUTHENTICATION UTILITIES
 * 
 * Helper functions for authentication:
 * 1. Hash passwords (bcrypt)
 * 2. Compare passwords
 * 3. Generate JWT tokens
 * 4. Verify JWT tokens
 * 
 * IN CODEIGNITER: Like helper functions in application/helpers/auth_helper.php
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Get secret from environment variable
// THIS IS IMPORTANT: Never hardcode secrets!
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * HASH PASSWORD
 * 
 * Takes plain text password and returns encrypted version
 * 
 * Example:
 * Input: "password123"
 * Output: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
 * 
 * CODEIGNITER EQUIVALENT:
 * password_hash($password, PASSWORD_BCRYPT)
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10) // Generate salt (random data)
  const hashedPassword = await bcrypt.hash(password, salt)
  return hashedPassword
}

/**
 * COMPARE PASSWORD
 * 
 * Check if plain text password matches hashed password
 * 
 * Example:
 * Input: "password123", "$2a$10$N9qo8uLOickgx..."
 * Output: true (if match) or false (if no match)
 * 
 * CODEIGNITER EQUIVALENT:
 * password_verify($password, $hashedPassword)
 */
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * GENERATE JWT TOKEN
 * 
 * Create a token that proves user is logged in
 * Token contains user info (but is encrypted)
 * 
 * Example:
 * Input: { userId: '123', email: 'user@example.com' }
 * Output: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE2MzI5MTIzNjIsImV4cCI6MTYzMjk5ODc2Mn0.h-Qq5jH5cZnVjP_2l5HQqWqYxVlH5xKxPXxQZxZxZxZ"
 * 
 * CODEIGNITER EQUIVALENT:
 * $this->session->set_userdata('user_id', $user_id)
 * But JWT is better because:
 * - Works across multiple servers
 * - Can be verified without database
 * - More secure for APIs
 */
export function generateToken(payload) {
  // payload = data to store in token (user id, email, etc.)
  // JWT_SECRET = secret key to encrypt token
  // expiresIn = how long token is valid (7 days)
  
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  )
}

/**
 * VERIFY JWT TOKEN
 * 
 * Check if token is valid and get user data from it
 * 
 * Example:
 * Input: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 * Output: { userId: '123', email: 'user@example.com' }
 * 
 * CODEIGNITER EQUIVALENT:
 * $this->session->userdata('user_id')
 */
export function verifyToken(token) {
  try {
    // Decrypt and verify token
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (error) {
    // Token is invalid or expired
    return null
  }
}

/**
 * HOW THESE WORK TOGETHER:
 * 
 * REGISTRATION:
 * 1. User submits password: "mypassword"
 * 2. We hash it: hashPassword("mypassword") → "$2a$10$..."
 * 3. Save hashed version to database
 * 
 * LOGIN:
 * 1. User submits password: "mypassword"
 * 2. Get hashed password from database: "$2a$10$..."
 * 3. Compare: comparePassword("mypassword", "$2a$10$...") → true
 * 4. If match, generate token: generateToken({ userId: 123 })
 * 5. Send token to frontend
 * 
 * ACCESSING PROTECTED PAGES:
 * 1. Frontend sends token with each request
 * 2. Backend verifies: verifyToken(token) → { userId: 123 }
 * 3. If valid, allow access
 * 4. If invalid, redirect to login
 */
