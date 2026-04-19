# 🦷 Dental Practice Management System with AI

## Professional Self-Hosted Dental Management Software

A complete, modern dental practice management system with integrated AI features for appointment booking, patient communication, and clinic automation.

---

## 🌟 Features

### Core Management
- **Patient Management** - Complete patient records, medical history, treatment plans
- **Appointment Scheduling** - Calendar management, booking, rescheduling
- **Doctor Management** - Multiple doctors, schedules, specializations
- **Billing & Invoicing** - Treatment costs, payment tracking, insurance
- **Treatment Plans** - Create and track multi-visit treatment plans
- **Document Management** - Upload X-rays, reports, prescriptions

### AI-Powered Features
- **AI Chatbot** - 24/7 appointment booking, FAQs, patient queries
- **AI Voice Agent** - Automated phone call handling
- **Smart Reminders** - SMS/Email appointment reminders
- **Analytics Dashboard** - AI-driven insights and predictions

### Admin Features
- **Multi-User Support** - Role-based access (Admin, Doctor, Receptionist)
- **Analytics & Reports** - Revenue, appointments, patient statistics
- **API Cost Tracking** - Monitor AI usage and costs in real-time
- **Backup & Restore** - Automated database backups
- **White-Label Ready** - Customize branding, colors, logo

---

## 📋 System Requirements

### Minimum Server Specifications
- **CPU:** 2 cores
- **RAM:** 4GB (8GB recommended)
- **Storage:** 50GB SSD
- **OS:** Ubuntu 22.04 LTS or similar
- **Network:** Static IP or domain name

### Software Requirements
- **Node.js:** v18.x or higher
- **PostgreSQL:** v14 or higher
- **Redis:** v7.x (for caching)
- **Docker:** v24.x (recommended for easy installation)

### Client Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Mobile responsive (iOS/Android)

---

## 🚀 Quick Start Installation

### 1. Database Requirements
* **PostgreSQL** must be installed and running.
* Add your connection string as `DATABASE_URL` in the `.env` file.

### 2. Project Setup Steps

Clone the repository and run the following commands:

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

### 3. Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
**Note:** Do NOT upload your real `.env` file to any public repositories. An `.env.example` file is included in this repository.

---

## 🔑 License Activation

After installation, you'll need to activate your license:

1. Open the application: `http://your-server-ip:3000`
2. Enter your license key (provided after purchase)
3. Enter activation email
4. Complete the setup wizard

**License Key Format:** `DXK-2024-PRO-XXXXXX`

---

## 🔧 Configuration

### Required API Keys (Clients Provide Their Own)

The system integrates with third-party AI services. Clients need to:

1. **OpenAI Account** - For AI chatbot
   - Sign up: https://platform.openai.com
   - Create API key
   - Enter in: Settings → API Configuration → OpenAI

2. **Twilio Account** - For SMS & Voice
   - Sign up: https://www.twilio.com
   - Get Account SID, Auth Token, Phone Number
   - Enter in: Settings → API Configuration → Twilio

3. **SendGrid Account** - For Email notifications
   - Sign up: https://sendgrid.com
   - Create API key
   - Enter in: Settings → API Configuration → SendGrid

### Monthly API Costs (Estimated)

| Feature | Provider | Small Clinic | Medium Clinic | Large Clinic |
|---------|----------|--------------|---------------|--------------|
| AI Chatbot | OpenAI | $15-25 | $40-60 | $80-120 |
| Voice Agent | Twilio + Deepgram | $15-30 | $25-50 | $50-100 |
| SMS Reminders | Twilio | $5-15 | $15-30 | $30-60 |
| Email | SendGrid | Free-$10 | $10-20 | $20-40 |
| **Total** | | **$35-80** | **$90-160** | **$180-320** |

*Costs scale with actual usage. Built-in dashboard shows real-time API consumption.*

---

## 📁 Project Structure

```
dental-saas/
├── apps/
│   ├── web/              # Frontend (Next.js)
│   ├── api/              # Backend API (Node.js/Express)
│   └── ai-services/      # AI integration services
├── packages/
│   ├── database/         # Database schema (Prisma)
│   ├── ui/               # Shared UI components
│   └── config/           # Shared configurations
├── documentation/        # Full documentation
├── installation/         # Installation scripts
└── scripts/             # Maintenance scripts
```

---

## 🎨 Customization

### Change Branding

Edit `.env` file:
```bash
CLINIC_NAME="Dr. Smith Dental Clinic"
CLINIC_LOGO_URL="/uploads/logo.png"
PRIMARY_COLOR="#2563eb"
SECONDARY_COLOR="#7c3aed"
```

### Modify Features

Edit `config/features.js`:
```javascript
module.exports = {
  aiChatbot: true,
  voiceAgent: true,
  smsReminders: true,
  emailReminders: true,
  onlineBooking: true,
  patientPortal: true
}
```

See [CUSTOMIZATION.md](./documentation/CUSTOMIZATION.md) for detailed guide.

---

## 👥 User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Admin** | Full system access, settings, user management, reports |
| **Doctor** | View/manage patients, appointments, treatments, prescriptions |
| **Receptionist** | Manage appointments, patient check-in, basic patient info |
| **Patient** | View own appointments, medical records, messages (portal) |

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password encryption (bcrypt)
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Rate limiting
- ✅ Audit logs
- ✅ HIPAA-compliant data storage

---

## 📊 Analytics Dashboard

Track key metrics:
- Daily/Weekly/Monthly appointments
- Revenue trends
- Patient demographics
- Treatment statistics
- Doctor performance
- API usage & costs
- System health

---

## 🔄 Backup & Updates

### Automatic Backups
```bash
# Daily automatic backups stored in /backups
# Retention: 30 days

# Manual backup
npm run backup

# Restore from backup
npm run restore --date=2024-02-20
```

### Software Updates
```bash
# Check for updates
npm run check-updates

# Apply updates (requires valid support license)
npm run update
```

---

## 📞 Support

### Included Support (First Year)
- Email support: support@yourcompany.com
- Response time: 48 hours
- Bug fixes and security patches
- Software updates

### Annual Maintenance Renewal
- 20% of license cost per year
- Continued updates and support
- Priority bug fixes

### Premium Support (Optional)
- 24/7 phone support: +1-XXX-XXX-XXXX
- 4-hour response time
- Remote assistance
- Cost: $500/month

---

## 🛠️ Troubleshooting

### Common Issues

**Issue: Cannot connect to database**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string in .env
DATABASE_URL="postgresql://user:password@localhost:5432/dental_db"
```

**Issue: API keys not working**
- Verify keys are correct in Settings → API Configuration
- Check API provider account has funds/credits
- View error logs: `npm run logs`

**Issue: License validation fails**
- Check internet connection
- Verify license key is correct
- Contact support if issue persists

See [TROUBLESHOOTING.md](./documentation/TROUBLESHOOTING.md) for more solutions.

---

## 📖 Documentation

- [Installation Guide](./INSTALLATION.md) - Complete installation instructions
- [User Guide](./documentation/USER-GUIDE.md) - For clinic staff
- [Admin Guide](./documentation/ADMIN-GUIDE.md) - For system administrators
- [API Documentation](./documentation/API-DOCUMENTATION.md) - API reference
- [Customization Guide](./documentation/CUSTOMIZATION.md) - How to customize
- [Deployment Guide](./documentation/DEPLOYMENT.md) - Production deployment

---

## 🔐 License

This software is licensed under a proprietary commercial license.

**License Terms:**
- Single installation per license
- Source code access for customization
- No redistribution or resale
- No derivative product creation
- Support and updates (first year included)

See [LICENSE.txt](./LICENSE.txt) for complete terms.

---

## 📈 Version

**Current Version:** 1.0.0  
**Release Date:** February 2024  
**Node.js:** v18.x+  
**Next.js:** v14.x  
**PostgreSQL:** v14+

See [CHANGELOG.md](./documentation/CHANGELOG.md) for version history.

---

## 🤝 About

Developed by [Your Company Name]  
Website: https://yourcompany.com  
Email: info@yourcompany.com  
Phone: +1-XXX-XXX-XXXX

---

## ⚠️ Important Notes

1. **Data Privacy:** This software handles sensitive patient data. Ensure HIPAA compliance by:
   - Using SSL/TLS certificates
   - Regular security updates
   - Proper access controls
   - Regular backups

2. **API Costs:** Monitor API usage dashboard regularly to avoid unexpected costs.

3. **Backups:** Always maintain regular backups of your database.

4. **Support:** Keep your annual maintenance active to receive security updates.

---

**Ready to get started?** Follow the [Installation Guide](./INSTALLATION.md) or run the quick install command above!
