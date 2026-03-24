'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      const result = await res.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const { overview, users, patients, appointments, revenue, recentSignups, dailyTrend, systemHealth } = data

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">Overview of all clinics and system metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/clinics"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Clinic
          </Link>
          <Link
            href="/admin/license/generate"
            className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            Generate License
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clinics */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Clinics</p>
              <p className="mt-2 text-3xl font-bold text-white">{overview.totalClinics}</p>
              <p className="mt-1 text-xs text-green-400">
                {overview.activeClinics} active
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="mt-2 text-3xl font-bold text-white">{users.total}</p>
              <p className="mt-1 text-xs text-blue-400">
                +{users.newThisWeek} this week
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Patients</p>
              <p className="mt-2 text-3xl font-bold text-white">{patients.total.toLocaleString()}</p>
              <p className="mt-1 text-xs text-purple-400">
                +{patients.newThisWeek} this week
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Monthly Revenue</p>
              <p className="mt-2 text-3xl font-bold text-white">
                ${revenue.thisMonth.toLocaleString()}
              </p>
              <p className={`mt-1 text-xs ${revenue.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {revenue.growthRate >= 0 ? '+' : ''}{revenue.growthRate}% vs last month
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Charts and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups Trend Chart */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Clinic Signups (Last 30 Days)</h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {dailyTrend.map((day, index) => {
              const maxCount = Math.max(...dailyTrend.map(d => d.count), 1)
              const height = (day.count / maxCount) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-indigo-600 rounded-t transition-all hover:bg-indigo-500"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.date}: ${day.count} signups`}
                  />
                  {index % 5 === 0 && (
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                      {new Date(day.date).getDate()}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* License Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">License Distribution</h3>
          <div className="space-y-4">
            {Object.entries(data.licenseBreakdown || {}).map(([type, count]) => (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{type}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      type === 'ENTERPRISE' ? 'bg-purple-500' : 
                      type === 'PROFESSIONAL' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${(count / overview.totalClinics) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-yellow-400">{overview.trialClinics}</p>
                <p className="text-xs text-gray-500">Trial</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{overview.expiredClinics}</p>
                <p className="text-xs text-gray-500">Expired</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row - Recent Activity and System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Clinic Signups</h3>
            <Link href="/admin/clinics" className="text-sm text-indigo-400 hover:text-indigo-300">
              View all
            </Link>
          </div>
          
          {recentSignups.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent signups</p>
          ) : (
            <div className="space-y-4">
              {recentSignups.slice(0, 5).map((clinic) => (
                <div key={clinic.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-semibold">
                      {clinic.name[0]}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">{clinic.name}</p>
                      <p className="text-xs text-gray-500">{clinic.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      clinic.licenseType === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                      clinic.licenseType === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {clinic.licenseType}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(clinic.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
          
          <div className="space-y-4">
            {/* Database Status */}
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  systemHealth.database?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-white">Database</p>
                  <p className="text-xs text-gray-500">
                    {systemHealth.database?.status === 'healthy' 
                      ? `Latency: ${systemHealth.database?.latency}ms`
                      : systemHealth.database?.message
                    }
                  </p>
                </div>
              </div>
              <span className={`text-xs font-medium ${
                systemHealth.database?.status === 'healthy' ? 'text-green-400' : 'text-red-400'
              }`}>
                {systemHealth.database?.status === 'healthy' ? 'Healthy' : 'Error'}
              </span>
            </div>

            {/* API Status */}
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  systemHealth.api?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-white">API Service</p>
                  <p className="text-xs text-gray-500">
                    Uptime: {Math.floor(systemHealth.api?.uptime / 3600)}h {Math.floor((systemHealth.api?.uptime % 3600) / 60)}m
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-green-400">Running</span>
            </div>

            {/* Memory Usage */}
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-3 bg-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">Memory</p>
                  <p className="text-xs text-gray-500">
                    {systemHealth.api?.memory?.used}MB / {systemHealth.api?.memory?.total}MB
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-blue-400">
                {Math.round((systemHealth.api?.memory?.used / systemHealth.api?.memory?.total) * 100)}%
              </span>
            </div>

            {/* Last Updated */}
            <p className="text-xs text-gray-500 text-center pt-2">
              Last checked: {new Date(systemHealth.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/clinics"
            className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-8 h-8 text-indigo-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm text-white">Add Clinic</span>
          </Link>
          
          <Link
            href="/admin/users"
            className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-sm text-white">Add User</span>
          </Link>
          
          <Link
            href="/admin/licenses"
            className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-8 h-8 text-yellow-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="text-sm text-white">Generate License</span>
          </Link>
          
          <Link
            href="/admin/settings"
            className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-white">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
