/**
 * LOGIN PAGE (Frontend)
 * 
 * This is what users see when they visit /login
 * 
 * IN CODEIGNITER:
 * This would be: application/views/auth/login.php
 * But here it's a React component with built-in logic
 * 
 * WHAT IT DOES:
 * 1. Show login form (email + password)
 * 2. When submitted, call /api/auth/login
 * 3. If successful, save token and redirect to dashboard
 * 4. If failed, show error message
 */

'use client' // This tells Next.js this is a client component (can use hooks, events)

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  // REACT HOOKS (State Management)
  // In CodeIgniter: Like session flashdata or form validation errors
  // useState creates a variable that triggers re-render when changed
  
  const [email, setEmail] = useState('') // Store email input
  const [password, setPassword] = useState('') // Store password input
  const [error, setError] = useState('') // Store error message
  const [loading, setLoading] = useState(false) // Show loading state
  
  const router = useRouter() // For navigation (like redirect() in CodeIgniter)

  /**
   * HANDLE LOGIN FORM SUBMISSION
   * 
   * This runs when user clicks "Login" button
   * Similar to: onsubmit in HTML or form validation in CodeIgniter
   */
  const handleLogin = async (e) => {
    e.preventDefault() // Prevent page reload (default form behavior)
    
    // Clear previous errors
    setError('')
    
    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    // Show loading state
    setLoading(true)

    try {
      // CALL LOGIN API
      // This is like AJAX call in CodeIgniter/jQuery
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // LOGIN SUCCESSFUL!
        
        // Save token to browser (like setting session in CodeIgniter)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        // LOGIN FAILED
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setLoading(false) // Hide loading state
    }
  }

  // RENDER THE UI
  // This is like HTML in CodeIgniter views, but with dynamic data
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* LOGO AND TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🦷</div>
          <h1 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '5px' }}>
            Dental Management
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Sign in to your account
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            color: '#c33',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin}>
          {/* EMAIL INPUT */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Update state when user types
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* PASSWORD INPUT */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* REGISTER LINK */}
        <p style={{
          textAlign: 'center',
          marginTop: '25px',
          color: '#666',
          fontSize: '0.9rem'
        }}>
          Don't have an account?{' '}
          <a href="/register" style={{
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Create one
          </a>
        </p>

        {/* DEMO CREDENTIALS (for testing) */}
        <div style={{
          marginTop: '25px',
          padding: '15px',
          background: '#f8f8f8',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#666'
        }}>
          <strong>Demo Account:</strong><br />
          Email: admin@demo.com<br />
          Password: password123
        </div>
      </div>
    </div>
  )
}

/**
 * WHAT HAPPENS WHEN YOU SUBMIT THE FORM:
 * 
 * 1. User fills email/password
 * 2. Clicks "Sign In"
 * 3. handleLogin() function runs
 * 4. Sends POST request to /api/auth/login
 * 5. API checks database
 * 6. If correct: Returns token
 * 7. We save token to localStorage
 * 8. Redirect to /dashboard
 * 
 * IN CODEIGNITER TERMS:
 * - This form submits to: site_url('auth/login')
 * - On success: redirect('dashboard')
 * - On error: show error message
 * 
 * But here, it's all in one file with better UX (no page reload!)
 */
