/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * This protects routes - only logged-in users can access them
 * 
 * IN CODEIGNITER:
 * Like checking session in __construct():
 * if (!$this->session->userdata('user_id')) {
 *   redirect('login');
 * }
 * 
 * HOW IT WORKS:
 * 1. Check if user has token in localStorage
 * 2. If no token → redirect to login
 * 3. If has token → verify it's valid
 * 4. If valid → allow access
 * 5. If invalid → redirect to login
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // CHECK AUTHENTICATION
    const checkAuth = () => {
      // Get token from localStorage
      // (This was saved when user logged in)
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')

      if (!token || !user) {
        // NO TOKEN = Not logged in
        // Redirect to login page
        router.push('/login')
        return
      }

      // TOKEN EXISTS
      // In a real app, you'd verify token with API
      // For now, we trust localStorage
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  // SHOW LOADING WHILE CHECKING
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>🦷</div>
          <div style={{
            fontSize: '1.2rem',
            color: '#666'
          }}>Loading...</div>
        </div>
      </div>
    )
  }

  // IF AUTHENTICATED, SHOW THE PAGE
  if (isAuthenticated) {
    return <>{children}</>
  }

  // OTHERWISE, SHOW NOTHING (redirecting to login)
  return null
}

/**
 * HOW TO USE THIS:
 * 
 * Wrap any page that needs authentication:
 * 
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedRoute>
 *       <div>Protected content here</div>
 *     </ProtectedRoute>
 *   )
 * }
 * 
 * If user is not logged in → Redirects to /login
 * If user is logged in → Shows the page
 * 
 * CODEIGNITER EQUIVALENT:
 * class Dashboard extends CI_Controller {
 *   public function __construct() {
 *     parent::__construct();
 *     if (!$this->session->userdata('user_id')) {
 *       redirect('login');
 *     }
 *   }
 * }
 */
