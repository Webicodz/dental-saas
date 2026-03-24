/**
 * APPOINTMENTS CALENDAR PAGE
 * 
 * This page displays appointments in a calendar view with
 * month, week, and day views.
 * 
 * FEATURES:
 * - Month, Week, and Day views
 * - Doctor filtering
 * - Color coding by type or doctor
 * - Click to view appointment details
 * - Quick navigation between dates
 * 
 * IN CODEIGNITER:
 * Like: application/views/appointments/calendar.php
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

// Appointment type colors
const TYPE_COLORS = {
  CONSULTATION: { bg: '#e0e7ff', text: '#4338ca' },
  CLEANING: { bg: '#d1fae5', text: '#047857' },
  FILLING: { bg: '#fef3c7', text: '#b45309' },
  ROOT_CANAL: { bg: '#fee2e2', text: '#b91c1c' },
  CROWN: { bg: '#fce7f3', text: '#be185d' },
  BRIDGE: { bg: '#f3e8ff', text: '#7c3aed' },
  EXTRACTION: { bg: '#ffedd5', text: '#c2410c' },
  CHECKUP: { bg: '#e0f2fe', text: '#0369a1' },
  EMERGENCY: { bg: '#fef9c3', text: '#a16207' },
  FOLLOW_UP: { bg: '#f1f5f9', text: '#475569' }
}

// Status colors
const STATUS_COLORS = {
  SCHEDULED: '#3b82f6',
  CONFIRMED: '#10b981',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#6b7280',
  CANCELLED: '#ef4444',
  NO_SHOW: '#ec4899'
}

// View types
const VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day'
}

export default function CalendarPage() {
  const router = useRouter()
  
  // STATE
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState(VIEWS.MONTH)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [colorBy, setColorBy] = useState('type')
  const [showModal, setShowModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  // FETCH DOCTORS
  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDoctors(data.doctors || [])
      }
    } catch (err) {
      console.error('Error fetching doctors:', err)
    }
  }

  // FETCH CALENDAR DATA
  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Calculate date range based on view
      const { startDate, endDate } = getDateRange(currentDate, view)
      
      // Build query params
      const params = new URLSearchParams({
        startDate,
        endDate,
        colorBy
      })
      if (selectedDoctor) {
        params.append('doctorId', selectedDoctor)
      }
      
      const response = await fetch(`/api/calendar?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.events || [])
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err)
    } finally {
      setLoading(false)
    }
  }

  // GET DATE RANGE FOR VIEW
  const getDateRange = (date, viewType) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    if (viewType === VIEWS.MONTH) {
      // Get first and last day of month
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      return {
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay)
      }
    } else if (viewType === VIEWS.WEEK) {
      // Get start (Sunday) and end (Saturday) of current week
      const dayOfWeek = date.getDay()
      const startOfWeek = new Date(date)
      startOfWeek.setDate(date.getDate() - dayOfWeek)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return {
        startDate: formatDate(startOfWeek),
        endDate: formatDate(endOfWeek)
      }
    } else {
      // Day view
      return {
        startDate: formatDate(date),
        endDate: formatDate(date)
      }
    }
  }

  // FORMAT DATE TO YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  // NAVIGATION
  const navigate = (direction) => {
    const newDate = new Date(currentDate)
    if (view === VIEWS.MONTH) {
      newDate.setMonth(newDate.getMonth() + direction)
    } else if (view === VIEWS.WEEK) {
      newDate.setDate(newDate.getDate() + (direction * 7))
    } else {
      newDate.setDate(newDate.getDate() + direction)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // GET CALENDAR DAYS
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    
    // Add days from previous month
    const startDayOfWeek = firstDay.getDay()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true })
    }
    
    // Add days from next month
    const endDayOfWeek = lastDay.getDay()
    for (let i = 1; i < 7 - endDayOfWeek; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }
    
    return days
  }

  // GET WEEK DAYS
  const getWeekDays = () => {
    const dayOfWeek = currentDate.getDay()
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek)
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }
    return days
  }

  // GET HOURS FOR DAY VIEW
  const getHours = () => {
    const hours = []
    for (let i = 6; i <= 22; i++) {
      hours.push(i)
    }
    return hours
  }

  // FORMAT TIME
  const formatTime = (hour) => {
    const h = hour % 12 || 12
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${h} ${ampm}`
  }

  // GET APPOINTMENTS FOR A DAY
  const getAppointmentsForDay = (date) => {
    const dateStr = formatDate(date)
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start).toISOString().split('T')[0]
      return aptDate === dateStr
    })
  }

  // GET APPOINTMENTS FOR HOUR
  const getAppointmentsForHour = (date, hour) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start)
      return formatDate(aptDate) === formatDate(date) && aptDate.getHours() === hour
    })
  }

  // GET EVENT STYLE
  const getEventStyle = (event) => {
    const colors = TYPE_COLORS[event.extendedProps.appointmentType] || TYPE_COLORS.CHECKUP
    return {
      backgroundColor: event.backgroundColor || colors.bg,
      color: event.textColor || colors.text,
      borderLeft: `3px solid ${STATUS_COLORS[event.extendedProps.status] || '#3b82f6'}`
    }
  }

  // VIEW TITLE
  const getViewTitle = () => {
    if (view === VIEWS.MONTH) {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else if (view === VIEWS.WEEK) {
      const weekDays = getWeekDays()
      const start = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const end = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${start} - ${end}`
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
  }

  // IS TODAY
  const isToday = (date) => {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

  // EFFECT TO FETCH DATA
  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    fetchCalendarData()
  }, [currentDate, view, selectedDoctor, colorBy])

  // HANDLE EVENT CLICK
  const handleEventClick = (event) => {
    setSelectedAppointment(event)
    setShowModal(true)
  }

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
        {/* HEADER */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/appointments')}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem'
              }}
            >
              ←
            </button>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                Calendar
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                View appointments in calendar format
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Doctor Filter */}
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="">All Doctors</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.fullName}</option>
              ))}
            </select>

            {/* Color By */}
            <select
              value={colorBy}
              onChange={(e) => setColorBy(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="type">Color by Type</option>
              <option value="doctor">Color by Doctor</option>
            </select>

            <button
              onClick={() => router.push('/appointments')}
              style={{
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>📋</span>
              <span>List View</span>
            </button>
          </div>
        </header>

        {/* CALENDAR TOOLBAR */}
        <div style={{
          background: 'white',
          padding: '1rem 2rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ← Prev
            </button>
            <button
              onClick={goToToday}
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Next →
            </button>
            
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
              {getViewTitle()}
            </h2>
          </div>

          {/* View Switcher */}
          <div style={{
            display: 'flex',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {Object.values(VIEWS).map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                style={{
                  padding: '0.5rem 1rem',
                  background: view === viewType ? '#3b82f6' : 'white',
                  color: view === viewType ? 'white' : '#374151',
                  border: 'none',
                  borderRight: viewType !== 'day' ? '1px solid #d1d5db' : 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: view === viewType ? '600' : '400'
                }}
              >
                {viewType}
              </button>
            ))}
          </div>
        </div>

        {/* CALENDAR CONTENT */}
        <main style={{ padding: '1rem 2rem' }}>
          {loading ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'white',
              borderRadius: '12px'
            }}>
              Loading calendar...
            </div>
          ) : (
            <>
              {/* MONTH VIEW */}
              {view === VIEWS.MONTH && (
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden'
                }}>
                  {/* Day Headers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    background: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div
                        key={day}
                        style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#666',
                          fontSize: '0.875rem'
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)'
                  }}>
                    {getCalendarDays().map(({ date, isCurrentMonth }, index) => {
                      const dayAppointments = getAppointmentsForDay(date)
                      return (
                        <div
                          key={index}
                          style={{
                            minHeight: '120px',
                            borderRight: (index + 1) % 7 !== 0 ? '1px solid #e5e7eb' : 'none',
                            borderBottom: '1px solid #e5e7eb',
                            padding: '0.5rem',
                            background: isCurrentMonth ? 'white' : '#f9fafb',
                            opacity: isCurrentMonth ? 1 : 0.5
                          }}
                        >
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: isToday(date) ? 'bold' : 'normal',
                            color: isToday(date) ? '#3b82f6' : '#333',
                            marginBottom: '0.25rem',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isToday(date) ? '#dbeafe' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {date.getDate()}
                          </div>
                          
                          {/* Appointments */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {dayAppointments.slice(0, 3).map((apt) => {
                              const colors = TYPE_COLORS[apt.extendedProps.appointmentType] || TYPE_COLORS.CHECKUP
                              return (
                                <div
                                  key={apt.id}
                                  onClick={() => handleEventClick(apt)}
                                  style={{
                                    padding: '2px 4px',
                                    fontSize: '0.625rem',
                                    background: apt.backgroundColor || colors.bg,
                                    color: apt.textColor || colors.text,
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    borderLeft: `2px solid ${STATUS_COLORS[apt.extendedProps.status] || '#3b82f6'}`
                                  }}
                                >
                                  {new Date(apt.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} {apt.title}
                                </div>
                              )
                            })}
                            {dayAppointments.length > 3 && (
                              <div style={{
                                fontSize: '0.625rem',
                                color: '#666',
                                padding: '2px 4px'
                              }}>
                                +{dayAppointments.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* WEEK VIEW */}
              {view === VIEWS.WEEK && (
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden'
                }}>
                  {/* Day Headers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '60px repeat(7, 1fr)',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ background: '#f9fafb' }} />
                    {getWeekDays().map((date, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          background: isToday(date) ? '#dbeafe' : '#f9fafb',
                          borderLeft: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div style={{
                          fontSize: '1.25rem',
                          fontWeight: isToday(date) ? 'bold' : 'normal',
                          color: isToday(date) ? '#3b82f6' : '#333'
                        }}>
                          {date.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time Grid */}
                  <div style={{ display: 'flex' }}>
                    {/* Time Column */}
                    <div style={{ width: '60px' }}>
                      {getHours().map(hour => (
                        <div
                          key={hour}
                          style={{
                            height: '60px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-end',
                            paddingRight: '8px',
                            fontSize: '0.75rem',
                            color: '#666',
                            borderBottom: '1px solid #e5e7eb'
                          }}
                        >
                          {formatTime(hour)}
                        </div>
                      ))}
                    </div>

                    {/* Day Columns */}
                    {getWeekDays().map((date, dayIndex) => (
                      <div
                        key={dayIndex}
                        style={{
                          flex: 1,
                          borderLeft: '1px solid #e5e7eb'
                        }}
                      >
                        {getHours().map(hour => {
                          const hourAppointments = getAppointmentsForHour(date, hour)
                          return (
                            <div
                              key={hour}
                              style={{
                                height: '60px',
                                borderBottom: '1px solid #e5e7eb',
                                position: 'relative'
                              }}
                            >
                              {hourAppointments.map((apt) => {
                                const colors = TYPE_COLORS[apt.extendedProps.appointmentType] || TYPE_COLORS.CHECKUP
                                const startMinutes = new Date(apt.start).getMinutes()
                                const topOffset = (startMinutes / 60) * 60
                                const heightPercent = (apt.extendedProps.duration / 60) * 60
                                return (
                                  <div
                                    key={apt.id}
                                    onClick={() => handleEventClick(apt)}
                                    style={{
                                      position: 'absolute',
                                      top: `${topOffset}px`,
                                      left: '2px',
                                      right: '2px',
                                      height: `${Math.max(heightPercent, 20)}px`,
                                      background: apt.backgroundColor || colors.bg,
                                      color: apt.textColor || colors.text,
                                      borderRadius: '4px',
                                      padding: '2px 4px',
                                      fontSize: '0.625rem',
                                      cursor: 'pointer',
                                      overflow: 'hidden',
                                      borderLeft: `3px solid ${STATUS_COLORS[apt.extendedProps.status] || '#3b82f6'}`,
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }}
                                  >
                                    <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {apt.title}
                                    </div>
                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {apt.extendedProps.doctorName}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DAY VIEW */}
              {view === VIEWS.DAY && (
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden'
                }}>
                  {/* Time Grid */}
                  <div style={{ display: 'flex' }}>
                    {/* Time Column */}
                    <div style={{ width: '80px', borderRight: '1px solid #e5e7eb' }}>
                      {getHours().map(hour => (
                        <div
                          key={hour}
                          style={{
                            height: '80px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-end',
                            paddingRight: '12px',
                            paddingTop: '4px',
                            fontSize: '0.875rem',
                            color: '#666',
                            borderBottom: '1px solid #e5e7eb'
                          }}
                        >
                          {formatTime(hour)}
                        </div>
                      ))}
                    </div>

                    {/* Appointments Column */}
                    <div style={{ flex: 1 }}>
                      {getHours().map(hour => {
                        const hourAppointments = getAppointmentsForHour(currentDate, hour)
                        return (
                          <div
                            key={hour}
                            style={{
                              height: '80px',
                              borderBottom: '1px solid #e5e7eb',
                              position: 'relative'
                            }}
                          >
                            {hourAppointments.map((apt) => {
                              const colors = TYPE_COLORS[apt.extendedProps.appointmentType] || TYPE_COLORS.CHECKUP
                              const startMinutes = new Date(apt.start).getMinutes()
                              const topOffset = (startMinutes / 60) * 80
                              const heightPercent = (apt.extendedProps.duration / 60) * 80
                              return (
                                <div
                                  key={apt.id}
                                  onClick={() => handleEventClick(apt)}
                                  style={{
                                    position: 'absolute',
                                    top: `${topOffset}px`,
                                    left: '8px',
                                    right: '8px',
                                    height: `${Math.max(heightPercent, 30)}px`,
                                    background: apt.backgroundColor || colors.bg,
                                    color: apt.textColor || colors.text,
                                    borderRadius: '6px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    borderLeft: `4px solid ${STATUS_COLORS[apt.extendedProps.status] || '#3b82f6'}`,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  <div style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '4px' }}>
                                    {apt.title}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                    {apt.extendedProps.doctorName}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                    {apt.extendedProps.appointmentType.replace('_', ' ')} • {apt.extendedProps.duration} min
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* LEGEND */}
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Legend
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {Object.entries(TYPE_COLORS).slice(0, 5).map(([type, colors]) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: colors.bg,
                        borderRadius: '4px',
                        border: `1px solid ${colors.text}`
                      }} />
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        {type.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        {/* APPOINTMENT DETAIL MODAL */}
        {showModal && selectedAppointment && (
          <AppointmentDetailModal
            appointment={selectedAppointment}
            onClose={() => {
              setShowModal(false)
              setSelectedAppointment(null)
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

// APPOINTMENT DETAIL MODAL
function AppointmentDetailModal({ appointment, onClose }) {
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Cancelled from calendar view' })
      })

      if (response.ok) {
        alert('Appointment cancelled successfully')
        onClose()
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to cancel appointment')
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      alert('Failed to cancel appointment')
    }
  }

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusColor = STATUS_COLORS[appointment.extendedProps.status] || '#3b82f6'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '450px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
              {appointment.title}
            </h2>
            <span style={{
              padding: '0.25rem 0.5rem',
              background: `${statusColor}20`,
              color: statusColor,
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              {appointment.extendedProps.status.replace('_', ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <DetailRow icon="📅" label="Date & Time" value={formatDateTime(appointment.start)} />
          <DetailRow icon="⏱️" label="Duration" value={`${appointment.extendedProps.duration} minutes`} />
          <DetailRow icon="👨‍⚕️" label="Doctor" value={appointment.extendedProps.doctorName} />
          <DetailRow icon="🏥" label="Type" value={appointment.extendedProps.appointmentType.replace('_', ' ')} />
          <DetailRow icon="📱" label="Phone" value={appointment.extendedProps.patientPhone} />
          {appointment.extendedProps.reason && (
            <DetailRow icon="📝" label="Reason" value={appointment.extendedProps.reason} />
          )}
          {appointment.extendedProps.notes && (
            <DetailRow icon="📋" label="Notes" value={appointment.extendedProps.notes} />
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          {!['CANCELLED', 'COMPLETED'].includes(appointment.extendedProps.status) && (
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#fee2e2',
                color: '#b91c1c',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel Appointment
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Detail Row Component
function DetailRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#666' }}>{label}</div>
        <div style={{ fontSize: '0.875rem', color: '#333' }}>{value}</div>
      </div>
    </div>
  )
}
