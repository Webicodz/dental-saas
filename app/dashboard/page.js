/**
 * DASHBOARD PAGE
 * 
 * This is what users see after logging in
 * 
 * IN CODEIGNITER:
 * Like: application/views/dashboard.php
 * But with built-in logic and state management
 * 
 * FEATURES:
 * - Protected route (must be logged in)
 * - Shows user info
 * - Stats cards (patients, appointments, revenue)
 * - Navigation menu
 * - Logout button
 * - Responsive design
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DashboardPage() {
  // STATE MANAGEMENT
  // useState creates reactive variables that update the UI
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    pendingTasks: 0
  })
  
  const router = useRouter()

  // LOAD USER DATA WHEN PAGE LOADS
  useEffect(() => {
    // Get user data from localStorage
    // (This was saved when user logged in)
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // In a real app, we'd fetch stats from API:
    // fetch('/api/dashboard/stats')
    //   .then(res => res.json())
    //   .then(data => setStats(data))
    
    // For now, we'll use dummy data
    setStats({
      totalPatients: 247,
      todayAppointments: 12,
      monthlyRevenue: 45680,
      pendingTasks: 8
    })
  }, [])

  // LOGOUT FUNCTION
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Redirect to login
    router.push('/login')
  }

  return (
    <ProtectedRoute>
      <div style={{
        minHeight: '100vh',
        background: '#f5f7fa'
      }}>
        {/* HEADER / NAVIGATION BAR */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {/* LOGO */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '2rem' }}>🦷</div>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#333',
                margin: 0
              }}>
                Dental Management
              </h1>
              <p style={{
                fontSize: '0.8rem',
                color: '#666',
                margin: 0
              }}>
                Practice Management System
              </p>
            </div>
          </div>

          {/* USER INFO & LOGOUT */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            {/* USER AVATAR & NAME */}
            {user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}>
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#666'
                  }}>
                    {user.role}
                  </div>
                </div>
              </div>
            )}

            {/* LOGOUT BUTTON */}
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#dc2626'}
              onMouseOut={(e) => e.target.style.background = '#ef4444'}
            >
              Logout
            </button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main style={{
          padding: '2rem',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* WELCOME MESSAGE */}
          <div style={{
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '0.5rem'
            }}>
              Welcome back, {user?.firstName}! 👋
            </h2>
            <p style={{
              color: '#666',
              fontSize: '1rem'
            }}>
              Here's what's happening with your practice today
            </p>
          </div>

          {/* STATS CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* TOTAL PATIENTS CARD */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginBottom: '0.5rem'
                  }}>
                    Total Patients
                  </p>
                  <p style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#333',
                    margin: 0
                  }}>
                    {stats.totalPatients}
                  </p>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  👥
                </div>
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#10b981'
              }}>
                ↑ 12% from last month
              </div>
            </div>

            {/* TODAY'S APPOINTMENTS CARD */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginBottom: '0.5rem'
                  }}>
                    Today's Appointments
                  </p>
                  <p style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#333',
                    margin: 0
                  }}>
                    {stats.todayAppointments}
                  </p>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  📅
                </div>
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#3b82f6'
              }}>
                3 appointments pending
              </div>
            </div>

            {/* MONTHLY REVENUE CARD */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginBottom: '0.5rem'
                  }}>
                    Monthly Revenue
                  </p>
                  <p style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#333',
                    margin: 0
                  }}>
                    ${stats.monthlyRevenue.toLocaleString()}
                  </p>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  💰
                </div>
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#10b981'
              }}>
                ↑ 8% from last month
              </div>
            </div>

            {/* PENDING TASKS CARD */}
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginBottom: '0.5rem'
                  }}>
                    Pending Tasks
                  </p>
                  <p style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#333',
                    margin: 0
                  }}>
                    {stats.pendingTasks}
                  </p>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  ✅
                </div>
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#f59e0b'
              }}>
                2 high priority
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '1.5rem'
            }}>
              Quick Actions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <QuickActionButton 
                icon="👤"
                label="Add Patient"
                onClick={() => alert('Patient management coming in Lesson 3!')}
              />
              <QuickActionButton 
                icon="📅"
                label="New Appointment"
                onClick={() => alert('Appointment system coming in Lesson 4!')}
              />
              <QuickActionButton 
                icon="💳"
                label="Create Invoice"
                onClick={() => alert('Billing system coming in Lesson 5!')}
              />
              <QuickActionButton 
                icon="📊"
                label="View Reports"
                onClick={() => alert('Reports coming in Lesson 6!')}
              />
            </div>
          </div>

          {/* COMING SOON MESSAGE */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h4 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              🚀 More Features Coming Soon!
            </h4>
            <p style={{
              fontSize: '0.95rem',
              opacity: 0.9
            }}>
              Lesson 3: Patient Management • Lesson 4: Appointments • Lesson 5: Billing • Lesson 6: AI Features
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

// QUICK ACTION BUTTON COMPONENT
// Reusable button for quick actions
function QuickActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '1.25rem',
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'center'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = '#667eea'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = '#e5e7eb'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        fontSize: '2rem',
        marginBottom: '0.5rem'
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#333'
      }}>
        {label}
      </div>
    </button>
  )
}

/**
 * WHAT THIS PAGE DOES:
 * 
 * 1. PROTECTED - Only logged-in users can see it
 * 2. SHOWS USER INFO - Name, role, avatar
 * 3. DISPLAYS STATS - Patients, appointments, revenue, tasks
 * 4. QUICK ACTIONS - Buttons for common tasks
 * 5. LOGOUT - Button to sign out
 * 
 * CODEIGNITER EQUIVALENT:
 * Like dashboard controller that checks session
 * and loads dashboard view with data
 * 
 * But here it's all in one file with:
 * - Built-in authentication check
 * - State management
 * - Beautiful UI
 * - Responsive design
 */
