# Customization Guide

Complete guide for customizing the Dental Practice Management System to match your clinic's branding and workflow.

---

## Table of Contents

1. [Quick Customizations](#quick-customizations)
2. [Branding & Theme](#branding--theme)
3. [Features Configuration](#features-configuration)
4. [Appointment Types](#appointment-types)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Email Templates](#email-templates)
7. [AI Chatbot Prompts](#ai-chatbot-prompts)
8. [Advanced Customizations](#advanced-customizations)

---

## Quick Customizations

### Change Clinic Name & Logo

**Via Admin Panel:**
1. Login as admin
2. Go to: Settings → Branding
3. Update:
   - Clinic Name
   - Upload Logo (PNG/SVG, 200x80px recommended)
   - Primary Color
   - Secondary Color
4. Click "Save Changes"

**Via Configuration File:**

Edit `.env`:
```bash
CLINIC_NAME=Dr. Smith's Dental Clinic
CLINIC_LOGO_URL=/uploads/logo.png
PRIMARY_COLOR=#2563eb
SECONDARY_COLOR=#7c3aed
```

Restart application:
```bash
pm2 restart all
```

---

## Branding & Theme

### Colors

The application uses a two-color system:

**Primary Color** - Used for:
- Buttons
- Links
- Headers
- Navigation highlights

**Secondary Color** - Used for:
- Accents
- Icons
- Hover states

**How to Change:**

1. **Admin Panel Method:**
   - Settings → Branding → Colors
   - Use color picker or enter hex code
   - Preview changes live
   - Save

2. **Code Method:**
   
   Edit `apps/web/tailwind.config.js`:
   ```javascript
   module.exports = {
     theme: {
       extend: {
         colors: {
           primary: {
             50: '#eff6ff',
             100: '#dbeafe',
             // ... your color shades
             500: '#2563eb', // Main primary color
             600: '#1d4ed8',
             // ...
           },
           secondary: {
             // ... your secondary color shades
           }
         }
       }
     }
   }
   ```

3. **CSS Variables Method:**

   Edit `apps/web/src/styles/globals.css`:
   ```css
   :root {
     --primary: #2563eb;
     --primary-hover: #1d4ed8;
     --secondary: #7c3aed;
     --secondary-hover: #6d28d9;
   }
   ```

### Logo

**Requirements:**
- Format: PNG or SVG
- Dimensions: 200x80px (recommended)
- Background: Transparent preferred
- File size: Under 500KB

**Upload via Admin:**
1. Settings → Branding
2. Click "Upload Logo"
3. Select file
4. Crop/adjust if needed
5. Save

**Upload via FTP/SSH:**
1. Upload to: `/opt/dental-app/uploads/branding/`
2. Update `.env`: `CLINIC_LOGO_URL=/uploads/branding/your-logo.png`
3. Restart app

### Fonts

**Change Primary Font:**

Edit `apps/web/src/app/layout.tsx`:
```typescript
import { Inter, Roboto, Open_Sans } from 'next/font/google'

const font = Inter({ 
  subsets: ['latin'],
  variable: '--font-primary'
})
```

**Available Google Fonts:**
- Inter (default, modern)
- Roboto (clean, professional)
- Open Sans (friendly, readable)
- Lato (corporate)
- Montserrat (bold, modern)

---

## Features Configuration

### Enable/Disable Features

**Via Admin Panel:**

Settings → Features
- ✅ AI Chatbot
- ✅ Voice Agent
- ✅ SMS Reminders
- ✅ Email Reminders
- ✅ Online Booking
- ✅ Patient Portal

**Via Configuration:**

Edit `config/features.js`:
```javascript
module.exports = {
  aiChatbot: true,
  voiceAgent: true,
  smsReminders: true,
  emailReminders: true,
  onlineBooking: true,
  patientPortal: true,
  multiLocation: false, // Enterprise only
  telemedicine: false,   // Coming soon
}
```

---

## Appointment Types

### Add Custom Appointment Types

**Via Admin Panel:**

1. Settings → Appointments → Types
2. Click "Add Type"
3. Fill in:
   - Name: "Teeth Whitening"
   - Duration: 45 minutes
   - Color: #10b981 (for calendar)
   - Default Price: $200
   - Description: "Professional teeth whitening procedure"
4. Save

**Via Database:**

```sql
INSERT INTO appointment_types (
  name, duration_minutes, color, price, description, clinic_id
) VALUES (
  'Teeth Whitening',
  45,
  '#10b981',
  200.00,
  'Professional teeth whitening',
  'your-clinic-id'
);
```

**Common Appointment Types:**

| Type | Duration | Typical Price |
|------|----------|---------------|
| Consultation | 30 min | $50-100 |
| Cleaning | 45 min | $100-150 |
| Filling | 60 min | $150-300 |
| Root Canal | 90 min | $800-1,500 |
| Crown | 90 min | $1,000-2,000 |
| Extraction | 30 min | $150-400 |
| Teeth Whitening | 60 min | $300-600 |

### Set Appointment Duration Defaults

Edit `.env`:
```bash
DEFAULT_APPOINTMENT_DURATION=30
CONSULTATION_DURATION=30
CLEANING_DURATION=45
TREATMENT_DURATION=60
```

---

## User Roles & Permissions

### Default Roles

**Admin:**
- Full system access
- User management
- Settings configuration
- Financial reports
- API configuration

**Doctor:**
- Patient management
- Appointment management
- Treatment planning
- Prescriptions
- Medical records

**Receptionist:**
- Appointment scheduling
- Patient check-in
- Basic patient info
- Invoice creation
- Call management

### Create Custom Role

**Via Admin Panel:**

1. Settings → Roles → Add Role
2. Name: "Office Manager"
3. Select permissions:
   - ✅ View appointments
   - ✅ Manage appointments
   - ✅ View patients
   - ✅ View invoices
   - ✅ Generate reports
   - ❌ Manage users
   - ❌ API settings
4. Save

**Via Code:**

Edit `apps/api/src/config/roles.ts`:
```typescript
export const ROLES = {
  ADMIN: {
    name: 'Admin',
    permissions: ['*'], // All permissions
  },
  OFFICE_MANAGER: {
    name: 'Office Manager',
    permissions: [
      'appointments:read',
      'appointments:write',
      'patients:read',
      'invoices:read',
      'reports:read',
    ],
  },
  // ... other roles
}
```

---

## Email Templates

### Customize Email Templates

**Location:** `apps/api/src/templates/emails/`

**Appointment Confirmation Email:**

Edit `appointment-confirmation.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: {{PRIMARY_COLOR}}; padding: 20px; }
    .logo { max-width: 200px; }
  </style>
</head>
<body>
  <div class="header">
    <img src="{{CLINIC_LOGO}}" class="logo" alt="{{CLINIC_NAME}}">
  </div>
  
  <div class="content">
    <h2>Appointment Confirmed</h2>
    
    <p>Dear {{PATIENT_NAME}},</p>
    
    <p>Your appointment has been confirmed:</p>
    
    <div class="details">
      <strong>Date:</strong> {{APPOINTMENT_DATE}}<br>
      <strong>Time:</strong> {{APPOINTMENT_TIME}}<br>
      <strong>Doctor:</strong> Dr. {{DOCTOR_NAME}}<br>
      <strong>Type:</strong> {{APPOINTMENT_TYPE}}
    </div>
    
    <p>If you need to reschedule, please call us at {{CLINIC_PHONE}}</p>
    
    <p>See you soon!<br>{{CLINIC_NAME}}</p>
  </div>
</body>
</html>
```

**Available Templates:**
- `appointment-confirmation.html`
- `appointment-reminder.html`
- `appointment-cancelled.html`
- `welcome-email.html`
- `password-reset.html`
- `invoice.html`

**Variables Available:**
- `{{CLINIC_NAME}}`
- `{{CLINIC_LOGO}}`
- `{{CLINIC_PHONE}}`
- `{{CLINIC_EMAIL}}`
- `{{PRIMARY_COLOR}}`
- `{{PATIENT_NAME}}`
- `{{DOCTOR_NAME}}`
- `{{APPOINTMENT_DATE}}`
- `{{APPOINTMENT_TIME}}`
- `{{APPOINTMENT_TYPE}}`

---

## AI Chatbot Prompts

### Customize Chatbot Personality

**Location:** `apps/ai-services/src/chatbot/prompts.ts`

**Edit System Prompt:**

```typescript
export const SYSTEM_PROMPT = `
You are a helpful dental receptionist assistant for {{CLINIC_NAME}}.

Your responsibilities:
- Answer questions about dental services
- Help book appointments
- Provide general dental health information
- Be friendly, professional, and concise

Clinic Information:
- Name: {{CLINIC_NAME}}
- Phone: {{CLINIC_PHONE}}
- Hours: {{BUSINESS_HOURS}}
- Location: {{CLINIC_ADDRESS}}

Available Services:
{{SERVICES_LIST}}

Guidelines:
- Keep responses under 3 sentences when possible
- Always offer to book an appointment
- For medical emergencies, direct to call 911
- For complex questions, offer to have staff call back
- Never provide specific medical advice

Tone: {{TONE}} (friendly/professional/casual)
`;
```

### Add Custom Responses

Edit `apps/ai-services/src/chatbot/responses.ts`:

```typescript
export const CUSTOM_RESPONSES = {
  greeting: [
    "Hi! I'm here to help with your dental needs. How can I assist you today?",
    "Hello! Welcome to {{CLINIC_NAME}}. What can I help you with?",
  ],
  
  pricing: "Our consultation fee starts at $75. Would you like to schedule an appointment to discuss your specific needs?",
  
  emergency: "For dental emergencies, please call us immediately at {{CLINIC_PHONE}} or visit the nearest emergency room if it's after hours.",
  
  // Add your custom responses
  covid_policy: "We follow strict COVID-19 safety protocols including..."
}
```

### Change Chatbot Name

Edit `.env`:
```bash
CHATBOT_NAME=Denti
CHATBOT_AVATAR=/images/chatbot-avatar.png
```

---

## Advanced Customizations

### Add Custom Pages

**Create new page:**

1. Create file: `apps/web/src/app/services/page.tsx`

```typescript
export default function ServicesPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-6">Our Services</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <ServiceCard 
          title="General Dentistry"
          description="Regular checkups and cleanings"
          icon="🦷"
        />
        {/* Add more services */}
      </div>
    </div>
  )
}
```

2. Add to navigation: `apps/web/src/components/navigation.tsx`

### Custom Dashboard Widgets

**Add widget to dashboard:**

Location: `apps/web/src/components/dashboard/`

Create `custom-widget.tsx`:
```typescript
export function CustomWidget() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Today's Special
      </h3>
      <p>Free consultation for new patients!</p>
    </div>
  )
}
```

Add to dashboard: `apps/web/src/app/dashboard/page.tsx`

### Modify Appointment Booking Flow

**Add extra questions:**

Edit `apps/web/src/components/booking/booking-form.tsx`:

```typescript
// Add field
<FormField name="insurance_provider">
  <label>Insurance Provider</label>
  <select>
    <option>Delta Dental</option>
    <option>BlueCross BlueShield</option>
    <option>Aetna</option>
    <option>No Insurance</option>
  </select>
</FormField>

<FormField name="reason">
  <label>Reason for Visit</label>
  <textarea placeholder="Describe your concern..." />
</FormField>
```

### Custom Reports

**Add custom report:**

Location: `apps/api/src/routes/reports/`

Create `custom-report.ts`:
```typescript
export async function getCustomReport(clinicId: string, params: any) {
  // Your custom query
  const data = await prisma.appointment.groupBy({
    by: ['type'],
    where: { clinicId },
    _count: true,
  })
  
  return formatReport(data)
}
```

---

## Testing Customizations

### Test in Development Mode

```bash
# Start dev server
npm run dev

# View at: http://localhost:3000
```

### Deploy Customizations

```bash
# Build
npm run build

# Restart production
pm2 restart all
```

### Rollback if Needed

```bash
# Restore from backup
git checkout previous-version

# Rebuild
npm run build
pm2 restart all
```

---

## Common Customization Examples

### 1. Add Clinic Locations (Multi-Location)

**Database:**
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  name VARCHAR(255),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255)
);
```

**Admin UI:**
Settings → Locations → Add Location

### 2. Change Default Language

Edit `.env`:
```bash
LOCALE=es-ES  # Spanish
LOCALE=fr-FR  # French
LOCALE=en-US  # English (default)
```

### 3. Add Treatment Templates

Settings → Treatments → Templates → Add Template

Example:
- Name: "Dental Cleaning Package"
- Procedures: Cleaning, Fluoride, X-Ray
- Duration: 60 minutes
- Price: $180

### 4. Custom Invoice Logo/Footer

Edit: `apps/api/src/templates/invoice.html`

Add footer:
```html
<div class="footer">
  <p>{{CLINIC_NAME}} - {{CLINIC_ADDRESS}}</p>
  <p>Tax ID: {{TAX_ID}}</p>
  <p>Thank you for choosing us!</p>
</div>
```

---

## Need Help?

**Documentation:**
- User Guide: `/documentation/USER-GUIDE.md`
- API Docs: `/documentation/API-DOCUMENTATION.md`

**Support:**
- Email: support@yourcompany.com
- Response: 24-48 hours
- Include: License key, what you're trying to customize

**Custom Development:**
- Rate: $150-250/hour
- Minimum: 4 hours
- Contact: custom@yourcompany.com

---

## Best Practices

1. **Always backup before customizing**
   ```bash
   npm run backup
   ```

2. **Test in development first**
   - Make changes in dev
   - Test thoroughly
   - Deploy to production

3. **Document your changes**
   - Keep notes of customizations
   - Makes updates easier

4. **Keep core files intact**
   - Extend, don't replace
   - Use configuration over code changes

5. **Update regularly**
   - Keep maintenance active
   - Apply security patches

---

**Happy customizing!** Make the system truly yours. 🎨
