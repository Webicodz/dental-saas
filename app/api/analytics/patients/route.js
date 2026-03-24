import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const clinicId = session.user.clinicId;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get patients grouped by registration date
    const patientsByDate = await prisma.patient.groupBy({
      by: ['createdAt'],
      where: {
        clinicId,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Generate daily patient growth data
    const labels = [];
    const growthData = [];
    const cumulativeData = [];
    let cumulative = 0;
    const currentDate = new Date(startDate);

    // Get total patients before start date for cumulative count
    const previousPatients = await prisma.patient.count({
      where: {
        clinicId,
        createdAt: { lt: startDate },
      },
    });
    cumulative = previousPatients;

    while (currentDate <= now) {
      labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayPatients = patientsByDate.filter(p => 
        p.createdAt.toISOString().split('T')[0] === dateStr
      ).length;

      growthData.push(dayPatients);
      cumulative += dayPatients;
      cumulativeData.push(cumulative);
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Age distribution (assuming dob field exists)
    const allPatients = await prisma.patient.findMany({
      where: { clinicId },
      select: { dob: true, gender: true },
    });

    const ageGroups = {
      '0-17': 0,
      '18-34': 0,
      '35-49': 0,
      '50-64': 0,
      '65+': 0,
    };

    const genderDistribution = {
      male: 0,
      female: 0,
      other: 0,
    };

    allPatients.forEach(patient => {
      // Gender distribution
      if (patient.gender) {
        const gender = patient.gender.toLowerCase();
        if (gender === 'male' || gender === 'm') genderDistribution.male++;
        else if (gender === 'female' || gender === 'f') genderDistribution.female++;
        else genderDistribution.other++;
      }

      // Age distribution
      if (patient.dob) {
        const age = Math.floor((now - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) ageGroups['0-17']++;
        else if (age < 35) ageGroups['18-34']++;
        else if (age < 50) ageGroups['35-49']++;
        else if (age < 65) ageGroups['50-64']++;
        else ageGroups['65+']++;
      }
    });

    // Patient activity (last visit)
    const activePatients = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: {
        clinicId,
        date: { gte: startDate },
      },
    });

    // Retention rate
    const totalPatients = allPatients.length;
    const activePatientCount = activePatients.length;
    const retentionRate = totalPatients > 0 ? Math.round((activePatientCount / totalPatients) * 100) : 0;

    // New vs returning patients
    const newPatients = await prisma.patient.count({
      where: {
        clinicId,
        createdAt: { gte: startDate },
      },
    });

    const returningPatients = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: {
        clinicId,
        date: { gte: startDate },
      },
      having: {
        patientId: { _count: { gt: 1 } },
      },
    });

    // Top referring sources (if available)
    const patientReferralCounts = await prisma.patient.groupBy({
      by: ['referralSource'],
      where: {
        clinicId,
        referralSource: { not: null },
      },
      _count: true,
    });

    return NextResponse.json({
      growth: {
        labels,
        datasets: [
          {
            label: 'New Patients',
            data: growthData,
            color: '#3B82F6',
          },
          {
            label: 'Total Patients',
            data: cumulativeData,
            color: '#10B981',
          },
        ],
      },
      demographics: {
        ageDistribution: {
          labels: Object.keys(ageGroups),
          datasets: [{
            label: 'Age Groups',
            data: Object.values(ageGroups),
            color: '#8B5CF6',
          }],
        },
        genderDistribution: {
          labels: ['Male', 'Female', 'Other'],
          datasets: [{
            label: 'Gender',
            data: [genderDistribution.male, genderDistribution.female, genderDistribution.other],
            color: '#EC4899',
          }],
        },
      },
      referralSources: {
        labels: patientReferralCounts.map(r => r.referralSource || 'Unknown'),
        datasets: [{
          label: 'Referrals',
          data: patientReferralCounts.map(r => r._count),
          color: '#F59E0B',
        }],
      },
      summary: {
        totalPatients,
        newPatients,
        activePatients: activePatientCount,
        returningPatients: returningPatients.length,
        retentionRate,
        inactivePatients: totalPatients - activePatientCount,
      },
      period,
    });
  } catch (error) {
    console.error('Analytics patients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
