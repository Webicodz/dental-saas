'use client';

import React, { useState, useEffect } from 'react';
import KPICard from '@/components/analytics/KPICard';
import LineChart from '@/components/analytics/LineChart';
import BarChart from '@/components/analytics/BarChart';
import PieChart from '@/components/analytics/PieChart';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import ExportButton from '@/components/analytics/ExportButton';

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    appointments: null,
    revenue: null,
    patients: null,
    treatments: null,
    doctors: null,
  });

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overviewRes, appointmentsRes, revenueRes, patientsRes, treatmentsRes, doctorsRes] = await Promise.all([
        fetch(`/api/analytics/overview?period=${period}`),
        fetch(`/api/analytics/appointments?period=${period}`),
        fetch(`/api/analytics/revenue?period=${period}`),
        fetch(`/api/analytics/patients?period=${period}`),
        fetch(`/api/analytics/treatments?period=${period}`),
        fetch(`/api/analytics/doctors?period=${period}`),
      ]);

      const [overview, appointments, revenue, patients, treatments, doctors] = await Promise.all([
        overviewRes.json(),
        appointmentsRes.json(),
        revenueRes.json(),
        patientsRes.json(),
        treatmentsRes.json(),
        doctorsRes.json(),
      ]);

      setData({ overview, appointments, revenue, patients, treatments, doctors });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    if (typeof newPeriod === 'string') {
      setPeriod(newPeriod);
    } else {
      setPeriod('custom');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { overview, appointments, revenue, patients, treatments, doctors } = data;
  const kpis = overview?.kpis || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Comprehensive insights for your dental practice
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DateRangePicker value={period} onChange={handlePeriodChange} />
              <ExportButton 
                data={data} 
                filename="analytics-report"
                label="Export Report"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title={kpis.totalPatients?.label || 'Total Patients'}
              value={kpis.totalPatients?.value || 0}
              trend={kpis.totalPatients?.trend}
              icon="users"
            />
            <KPICard
              title={kpis.newPatients?.label || 'New Patients'}
              value={kpis.newPatients?.value || 0}
              trend={kpis.newPatients?.trend}
              icon="user-plus"
            />
            <KPICard
              title={kpis.appointments?.label || 'Appointments'}
              value={kpis.appointments?.value || 0}
              trend={kpis.appointments?.trend}
              icon="calendar"
            />
            <KPICard
              title={kpis.revenue?.label || 'Revenue'}
              value={kpis.revenue?.value || 0}
              trend={kpis.revenue?.trend}
              icon="dollar"
              format="currency"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <KPICard
              title={kpis.collectionRate?.label || 'Collection Rate'}
              value={kpis.collectionRate?.value || 0}
              trend={kpis.collectionRate?.trend}
              icon="percentage"
              format="percentage"
            />
            <KPICard
              title={kpis.completedAppointments?.label || 'Completed'}
              value={kpis.completedAppointments?.value || 0}
              trend={kpis.completedAppointments?.trend}
              icon="check"
            />
            <KPICard
              title={kpis.cancelledAppointments?.label || 'Cancelled'}
              value={kpis.cancelledAppointments?.value || 0}
              trend={kpis.cancelledAppointments?.trend}
              icon="x"
            />
            <KPICard
              title={kpis.avgRevenuePerPatient?.label || 'Avg Revenue/Patient'}
              value={kpis.avgRevenuePerPatient?.value || 0}
              trend={kpis.avgRevenuePerPatient?.trend}
              icon="chart"
              format="currency"
            />
          </div>
        </section>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointment Trends */}
          <LineChart
            data={appointments?.trend}
            title="Appointment Volume Trends"
            height={320}
          />
          
          {/* Revenue Trends */}
          <LineChart
            data={revenue?.trend}
            title="Revenue Trends"
            height={320}
          />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Growth */}
          <LineChart
            data={patients?.growth}
            title="Patient Growth"
            height={300}
          />
          
          {/* Appointment Status */}
          <PieChart
            data={appointments?.statusBreakdown}
            title="Appointment Status"
            height={300}
            donut
          />
          
          {/* Revenue by Status */}
          <PieChart
            data={revenue?.statusBreakdown}
            title="Revenue by Status"
            height={300}
            donut
          />
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Treatments */}
          <BarChart
            data={treatments?.topTreatments}
            title="Top Treatments by Volume"
            height={300}
          />
          
          {/* Top Revenue Treatments */}
          <BarChart
            data={treatments?.topRevenue}
            title="Top Treatments by Revenue"
            height={300}
          />
        </div>

        {/* Charts Row 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Age Distribution */}
          <PieChart
            data={patients?.demographics?.ageDistribution}
            title="Patient Age Distribution"
            height={300}
          />
          
          {/* Gender Distribution */}
          <PieChart
            data={patients?.demographics?.genderDistribution}
            title="Patient Gender Distribution"
            height={300}
          />
          
          {/* Treatment Status */}
          <PieChart
            data={treatments?.statusBreakdown}
            title="Treatment Status"
            height={300}
          />
        </div>

        {/* Doctor Performance */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Doctor Performance</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointments
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique Patients
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {doctors?.doctors?.map((doctor, index) => (
                    <tr key={doctor.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                            <div className="text-sm text-gray-500">{doctor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {doctor.appointments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {doctor.completedAppointments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doctor.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                          doctor.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {doctor.completionRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(doctor.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {doctor.uniquePatients}
                      </td>
                    </tr>
                  ))}
                  {(!doctors?.doctors || doctors.doctors.length === 0) && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No doctor data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Summary Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-sm font-medium text-blue-100">Avg Daily Appointments</h3>
            <p className="text-3xl font-bold mt-2">
              {appointments?.stats?.average || 0}
            </p>
            <p className="text-sm text-blue-100 mt-1">
              Peak: {appointments?.stats?.peak || 0}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <h3 className="text-sm font-medium text-green-100">Monthly Projection</h3>
            <p className="text-3xl font-bold mt-2">
              {formatCurrency(revenue?.summary?.monthlyProjection || 0)}
            </p>
            <p className="text-sm text-green-100 mt-1">
              Growth: {revenue?.summary?.growthRate || 0}%
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-sm font-medium text-purple-100">Patient Retention</h3>
            <p className="text-3xl font-bold mt-2">
              {patients?.summary?.retentionRate || 0}%
            </p>
            <p className="text-sm text-purple-100 mt-1">
              Active: {patients?.summary?.activePatients || 0}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
            <h3 className="text-sm font-medium text-amber-100">Treatment Completion</h3>
            <p className="text-3xl font-bold mt-2">
              {treatments?.summary?.completionRate || 0}%
            </p>
            <p className="text-sm text-amber-100 mt-1">
              Total: {treatments?.summary?.totalTreatments || 0}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
