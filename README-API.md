# Dental SaaS Platform - API Documentation

## Overview

The Dental SaaS Platform provides a comprehensive REST API for managing dental practice operations. This document covers all available endpoints, authentication, and usage examples.

## Base URL

```
Production: https://api.your-domain.com
Development: http://localhost:3000
```

## Authentication

### JWT Authentication

All API endpoints (except auth routes) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Structure

The JWT token contains:
- `userId`: User's unique identifier
- `clinicId`: Clinic's unique identifier (for multi-tenant)
- `role`: User's role (ADMIN, DOCTOR, RECEPTIONIST, etc.)
- `exp`: Expiration timestamp

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Authentication API

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "ADMIN",
    "clinicId": "clinic_456"
  }
}
```

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "role": "RECEPTIONIST",
  "clinicId": "clinic_456"
}
```

### GET /api/auth/me

Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "ADMIN",
    "clinicId": "clinic_456",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/auth/logout

Logout current user (invalidate token).

---

## Dashboard API

### GET /api/dashboard/stats

Get dashboard statistics for the authenticated user's clinic.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "todayAppointments": 12,
    "pendingInvoices": 45,
    "totalPatients": 234,
    "monthlyRevenue": 15680.00,
    "upcomingAppointments": [
      {
        "id": "apt_123",
        "patient": {
          "id": "pat_456",
          "name": "Jane Smith"
        },
        "doctor": {
          "id": "doc_789",
          "name": "Dr. Johnson"
        },
        "dateTime": "2024-01-15T10:00:00Z",
        "status": "CONFIRMED"
      }
    ],
    "recentPatients": [
      {
        "id": "pat_456",
        "name": "Jane Smith",
        "lastVisit": "2024-01-10T00:00:00Z"
      }
    ]
  }
}
```

---

## Patients API

### GET /api/patients

List all patients for the clinic.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |
| search | string | Search by name, email, phone |
| status | string | Filter by status (ACTIVE, INACTIVE) |

**Response:**
```json
{
  "success": true,
  "patients": [...],
  "pagination": {
    "total": 234,
    "page": 1,
    "limit": 20,
    "pages": 12
  }
}
```

### GET /api/patients/:id

Get patient details.

### POST /api/patients

Create a new patient.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "emergencyContact": {
    "name": "John Smith",
    "phone": "+1234567891",
    "relationship": "Spouse"
  },
  "insuranceInfo": {
    "provider": "Delta Dental",
    "policyNumber": "DD123456",
    "groupNumber": "GRP789"
  },
  "medicalHistory": {
    "allergies": ["Penicillin"],
    "medications": ["Aspirin"],
    "conditions": ["Diabetes"]
  }
}
```

### PUT /api/patients/:id

Update patient information.

### DELETE /api/patients/:id

Delete a patient (soft delete).

### GET /api/patients/:id/appointments

Get patient's appointment history.

### GET /api/patients/:id/documents

Get patient's documents.

### GET /api/patients/:id/history

Get patient's treatment history.

### GET /api/patients/:id/invoices

Get patient's invoices.

### GET /api/patients/:id/treatments

Get patient's treatments.

---

## Appointments API

### GET /api/appointments

List appointments.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| date | string | Filter by date (YYYY-MM-DD) |
| startDate | string | Start date for range |
| endDate | string | End date for range |
| status | string | Filter by status |
| doctorId | string | Filter by doctor |
| patientId | string | Filter by patient |

### POST /api/appointments

Create a new appointment.

**Request Body:**
```json
{
  "patientId": "pat_123",
  "doctorId": "doc_456",
  "dateTime": "2024-01-15T10:00:00Z",
  "duration": 30,
  "type": "CHECKUP",
  "notes": "Regular checkup",
  "status": "SCHEDULED"
}
```

### GET /api/appointments/:id

Get appointment details.

### PUT /api/appointments/:id

Update appointment.

### DELETE /api/appointments/:id

Cancel/delete appointment.

### GET /api/appointments/available-slots

Get available time slots for a doctor on a date.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| doctorId | string | Doctor ID (required) |
| date | string | Date (YYYY-MM-DD, required) |
| duration | number | Appointment duration in minutes |

---

## Calendar API

### GET /api/calendar

Get calendar events for date range.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| start | string | Start date (required) |
| end | string | End date (required) |
| doctorId | string | Filter by doctor |

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "apt_123",
      "title": "Jane Smith - Checkup",
      "start": "2024-01-15T10:00:00Z",
      "end": "2024-01-15T10:30:00Z",
      "status": "CONFIRMED",
      "patient": {...},
      "doctor": {...},
      "type": "CHECKUP"
    }
  ]
}
```

---

## Doctors API

### GET /api/doctors

List all doctors.

### GET /api/doctors/:id

Get doctor details including schedule.

### POST /api/doctors

Create a new doctor.

### PUT /api/doctors/:id

Update doctor information.

### DELETE /api/doctors/:id

Delete a doctor.

---

## Billing API

### GET /api/invoices

List all invoices.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (PENDING, PAID, OVERDUE) |
| patientId | string | Filter by patient |
| startDate | string | Start date |
| endDate | string | End date |

### GET /api/invoices/:id

Get invoice details.

### POST /api/invoices

Create a new invoice.

**Request Body:**
```json
{
  "patientId": "pat_123",
  "items": [
    {
      "description": "Teeth Cleaning",
      "quantity": 1,
      "unitPrice": 150.00,
      "treatmentId": "treat_456"
    }
  ],
  "notes": "Payment due in 30 days",
  "dueDate": "2024-02-15"
}
```

### PUT /api/invoices/:id

Update invoice.

### POST /api/invoices/:id/payment

Record a payment.

**Request Body:**
```json
{
  "amount": 150.00,
  "method": "CARD",
  "reference": "PAY-123456",
  "notes": "Full payment received"
}
```

### GET /api/invoices/stats

Get billing statistics.

---

## Analytics API

### GET /api/analytics/overview

Get overall analytics overview.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date |
| endDate | string | End date |

### GET /api/analytics/appointments

Get appointment analytics.

### GET /api/analytics/patients

Get patient analytics.

### GET /api/analytics/revenue

Get revenue analytics.

### GET /api/analytics/doctors

Get doctor performance analytics.

### GET /api/analytics/treatments

Get treatment analytics.

---

## Clinic API

### GET /api/clinic/settings

Get clinic settings.

### PUT /api/clinic/settings

Update clinic settings.

**Request Body:**
```json
{
  "name": "Smile Dental Clinic",
  "address": "456 Health Ave",
  "phone": "+1234567890",
  "email": "info@smiledental.com",
  "hours": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "09:00", "close": "18:00" }
  },
  "appointmentDuration": 30,
  "reminderHours": 24
}
```

### GET /api/clinic/users

List clinic users.

### POST /api/clinic/users

Create a new user.

### PUT /api/clinic/users/:id

Update user.

### DELETE /api/clinic/users/:id

Delete user.

### GET /api/clinic/stats

Get clinic statistics.

---

## Admin API

### GET /api/admin/clinics

List all clinics (super admin only).

### GET /api/admin/clinics/:id

Get clinic details.

### POST /api/admin/clinics

Create a new clinic.

### PUT /api/admin/clinics/:id

Update clinic.

### DELETE /api/admin/clinics/:id

Delete clinic.

### GET /api/admin/users

List all users across clinics.

### POST /api/admin/users

Create a new user.

### PUT /api/admin/users/:id

Update user.

### DELETE /api/admin/users/:id

Delete user.

### POST /api/admin/license/generate

Generate a license key.

**Request Body:**
```json
{
  "clinicId": "clinic_123",
  "plan": "PREMIUM",
  "duration": 365
}
```

### GET /api/admin/dashboard

Get admin dashboard data.

---

## Notifications API

### GET /api/notifications

List notifications.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| read | boolean | Filter by read status |
| limit | number | Number of items |

### PUT /api/notifications/:id

Mark notification as read.

### POST /api/notifications/mark-all-read

Mark all notifications as read.

### GET /api/notifications/unread-count

Get unread notification count.

### GET /api/notifications/settings

Get notification settings.

### PUT /api/notifications/settings

Update notification settings.

---

## Documents API

### GET /api/documents

List documents.

### GET /api/documents/:id

Get document details.

### POST /api/documents

Upload a document.

**Request:** `multipart/form-data`
```
file: <file>
patientId: pat_123
type: XRAY
description: Panoramic X-Ray
```

### DELETE /api/documents/:id

Delete a document.

---

## Treatments API

### GET /api/treatments

List treatments.

### GET /api/treatments/:id

Get treatment details.

### POST /api/treatments

Create a new treatment.

### PUT /api/treatments/:id

Update treatment.

### DELETE /api/treatments/:id

Delete treatment.

---

## Reminders API

### POST /api/reminders/appointments

Send appointment reminders.

**Request Body:**
```json
{
  "appointmentIds": ["apt_123", "apt_456"],
  "method": "EMAIL"
}
```

---

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| ADMIN | Full access to all features |
| DOCTOR | Manage own appointments, view patients |
| RECEPTIONIST | Manage appointments, patients, billing |
| BILLING | Manage billing and invoices |
| VIEWER | Read-only access |

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Input validation failed |
| AUTHENTICATION_ERROR | Invalid or expired token |
| AUTHORIZATION_ERROR | Insufficient permissions |
| NOT_FOUND | Resource not found |
| DUPLICATE_ERROR | Resource already exists |
| SERVER_ERROR | Internal server error |

---

## Rate Limiting

API requests are rate limited:
- **Standard:** 100 requests per minute
- **Premium:** 1000 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Webhooks

Configure webhooks for real-time notifications:

**Events:**
- `appointment.created`
- `appointment.updated`
- `appointment.cancelled`
- `invoice.created`
- `invoice.paid`
- `patient.created`

**Payload Example:**
```json
{
  "event": "appointment.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "id": "apt_123",
    "patientId": "pat_456",
    "doctorId": "doc_789"
  }
}
```

---

## API Client Usage

```javascript
import { api } from '@/lib/api-client';

// Login
const { token, user } = await api.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// Get patients
const patients = await api.patients.list({ page: 1, limit: 20 });

// Create appointment
const appointment = await api.appointments.create({
  patientId: 'pat_123',
  doctorId: 'doc_456',
  dateTime: '2024-01-15T10:00:00Z',
  type: 'CHECKUP'
});

// Upload document
const document = await api.documents.upload(file, {
  patientId: 'pat_123',
  type: 'XRAY'
});
```

---

## Support

For API support, contact:
- Email: api-support@dentalcare.com
- Documentation: https://docs.your-domain.com
