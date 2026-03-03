# 📦 Installation Guide

Complete step-by-step guide for installing the Dental Practice Management System.

---

## Table of Contents

1. [Before You Begin](#before-you-begin)
2. [Installation Methods](#installation-methods)
3. [Method 1: Docker Installation](#method-1-docker-installation-recommended)
4. [Method 2: Manual Installation](#method-2-manual-installation)
5. [Method 3: Auto-Install Script](#method-3-auto-install-script)
6. [Initial Setup Wizard](#initial-setup-wizard)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Troubleshooting](#troubleshooting)

---

## Before You Begin

### What You'll Need

1. **Server/VPS** with specifications:
   - Ubuntu 22.04 LTS (or similar)
   - 4GB RAM minimum (8GB recommended)
   - 50GB storage
   - Root or sudo access

2. **Domain Name** (optional but recommended)
   - Example: dental.yourclinic.com
   - Point A record to your server IP

3. **License Key**
   - Format: `DXK-2024-PRO-XXXXXX`
   - Received after purchase

4. **Email for notifications**
   - Used for system alerts and license activation

### Recommended Providers

**VPS Hosting ($20-40/month):**
- DigitalOcean (Droplet)
- Linode
- Vultr
- AWS Lightsail
- Hetzner

**Domain Registration:**
- Namecheap
- GoDaddy
- Google Domains

---

## Installation Methods

Choose one of three methods:

| Method | Time | Difficulty | Best For |
|--------|------|-----------|----------|
| Docker | 5 min | Easy | Most users (recommended) |
| Auto-Install | 10 min | Easy | Linux admins |
| Manual | 30 min | Medium | Full control |

---

## Method 1: Docker Installation (Recommended)

### Step 1: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Download Application

```bash
# Create directory
mkdir -p /opt/dental-app
cd /opt/dental-app

# Download package (replace with your download link)
wget https://downloads.yourcompany.com/dental-app-v1.0.0.tar.gz
tar -xzf dental-app-v1.0.0.tar.gz
cd dental-app
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Required .env Configuration:**
```bash
# Application
NODE_ENV=production
APP_URL=http://your-server-ip:3000
PORT=3000

# Database (Docker will create automatically)
DATABASE_URL=postgresql://dental_user:your_secure_password@postgres:5432/dental_db

# Security
JWT_SECRET=your_random_64_character_secret_key_here
SESSION_SECRET=another_random_secret_key_here

# License (enter after first run)
LICENSE_KEY=
ACTIVATION_EMAIL=

# Clinic Information (customize)
CLINIC_NAME="Your Dental Clinic"
CLINIC_LOGO_URL=/uploads/logo.png
PRIMARY_COLOR=#2563eb
```

**Generate secure secrets:**
```bash
# Generate JWT secret
openssl rand -base64 64

# Generate session secret
openssl rand -base64 64
```

### Step 4: Start Application

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 5: Access Application

Open browser: `http://your-server-ip:3000`

You should see the **License Activation** screen.

### Step 6: Activate License

1. Enter your license key: `DXK-2024-PRO-XXXXXX`
2. Enter activation email
3. Click "Activate"
4. Complete setup wizard (see [Initial Setup Wizard](#initial-setup-wizard))

---

## Method 2: Manual Installation

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Verify installations
node --version  # Should show v18.x
npm --version
psql --version  # Should show 14.x
redis-cli --version
```

### Step 2: Setup Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE dental_db;
CREATE USER dental_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dental_db TO dental_user;
\q
```

### Step 3: Configure Redis

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Find and update:
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### Step 4: Download and Setup Application

```bash
# Create app directory
sudo mkdir -p /opt/dental-app
sudo chown $USER:$USER /opt/dental-app
cd /opt/dental-app

# Download and extract
wget https://downloads.yourcompany.com/dental-app-v1.0.0.tar.gz
tar -xzf dental-app-v1.0.0.tar.gz
cd dental-app

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env
```

**Configure .env:**
```bash
NODE_ENV=production
APP_URL=http://your-domain.com
PORT=3000

DATABASE_URL=postgresql://dental_user:your_secure_password@localhost:5432/dental_db
REDIS_URL=redis://localhost:6379

JWT_SECRET=your_random_64_character_secret
SESSION_SECRET=another_random_secret

CLINIC_NAME="Your Dental Clinic"
```

### Step 5: Build and Migrate

```bash
# Build frontend
cd apps/web
npm run build

# Run database migrations
cd ../../packages/database
npx prisma migrate deploy
npx prisma generate

# Go back to root
cd ../..
```

### Step 6: Start with PM2

```bash
# Start API
cd apps/api
pm2 start npm --name "dental-api" -- start

# Start web
cd ../web
pm2 start npm --name "dental-web" -- start

# Save PM2 config
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs
```

### Step 7: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/dental-app
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads (increase size)
    client_max_body_size 50M;
}
```

**Enable site:**
```bash
# Enable configuration
sudo ln -s /etc/nginx/sites-available/dental-app /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 8: Access Application

Open browser: `http://your-domain.com`

Complete license activation and setup wizard.

---

## Method 3: Auto-Install Script

```bash
# Download and run installer
curl -sSL https://install.dentalapp.com/install.sh | bash

# Or download first, then run:
wget https://install.dentalapp.com/install.sh
chmod +x install.sh
sudo ./install.sh
```

**The script will:**
1. Check system requirements
2. Install all dependencies
3. Setup database
4. Configure services
5. Start application
6. Display access URL

**Follow interactive prompts:**
- Enter domain name or IP
- Set database password
- Choose installation directory
- Configure timezone

---

## Initial Setup Wizard

After installation, complete the setup wizard:

### Step 1: License Activation
- Enter license key
- Enter activation email
- System validates with license server

### Step 2: Admin Account
- Admin name: `Dr. John Smith`
- Email: `admin@yourclinic.com`
- Password: (strong password)
- Confirm password

### Step 3: Clinic Information
- Clinic name: `Smile Dental Clinic`
- Address: `123 Main St, City, State 12345`
- Phone: `+1-555-123-4567`
- Email: `info@smileclinic.com`
- Timezone: `America/New_York`
- Currency: `USD`

### Step 4: Business Hours
- Monday-Friday: 9:00 AM - 6:00 PM
- Saturday: 9:00 AM - 2:00 PM
- Sunday: Closed

### Step 5: Features Configuration
- ✅ Enable AI Chatbot
- ✅ Enable Voice Agent
- ✅ Enable SMS Reminders
- ✅ Enable Email Reminders
- ✅ Enable Online Booking

### Step 6: API Configuration (Optional - Can do later)
- Skip for now, configure in Settings later
- Or enter API keys now if you have them

### Step 7: Complete
- Review settings
- Click "Finish Setup"
- Redirected to dashboard

---

## SSL Certificate Setup

### Free SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Enter email for renewal notifications
# Agree to terms
# Choose to redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

**Nginx will automatically update with SSL configuration.**

Access: `https://your-domain.com`

---

## Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Post-Installation Tasks

### 1. Setup Automatic Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/dental-app/scripts/backup.sh
```

### 2. Configure API Keys

Go to: **Settings → API Configuration**

**OpenAI:**
1. Sign up: https://platform.openai.com
2. Create API key
3. Enter key in application
4. Test connection

**Twilio:**
1. Sign up: https://www.twilio.com
2. Get: Account SID, Auth Token, Phone Number
3. Enter in application
4. Send test SMS

**SendGrid:**
1. Sign up: https://sendgrid.com
2. Create API key
3. Enter in application
4. Send test email

### 3. Upload Logo

**Settings → Branding → Upload Logo**
- Format: PNG or SVG
- Size: 200x80px recommended
- Background: Transparent

### 4. Add Users

**Users → Add New User**
- Create accounts for doctors, receptionists
- Assign appropriate roles
- Send invitation emails

### 5. Configure Appointment Types

**Settings → Appointments → Types**
- Consultation (30 min)
- Cleaning (45 min)
- Filling (60 min)
- Root Canal (90 min)
- Extraction (45 min)

---

## Verification Checklist

After installation, verify:

- [ ] Application accessible at domain/IP
- [ ] License activated successfully
- [ ] Admin account created
- [ ] Login works
- [ ] Dashboard loads
- [ ] Can create patient
- [ ] Can create appointment
- [ ] Database connected
- [ ] Redis connected
- [ ] Email sending works
- [ ] SMS sending works (if configured)
- [ ] AI chatbot responds (if configured)
- [ ] Backup script works
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured

---

## Troubleshooting

### Issue: Port 3000 already in use

```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Issue: Database connection fails

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check credentials in .env match database
# Test connection
psql -U dental_user -d dental_db -h localhost
```

### Issue: Redis connection fails

```bash
# Check Redis is running
sudo systemctl status redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### Issue: License validation fails

1. Check internet connection
2. Verify license key is correct (no spaces)
3. Check firewall allows outbound HTTPS
4. Contact support: support@yourcompany.com

### Issue: Build fails

```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install

# Try building again
npm run build
```

### Issue: PM2 not starting on reboot

```bash
# Regenerate startup script
pm2 unstartup
pm2 startup
pm2 save
```

---

## Getting Help

### Documentation
- User Guide: `/documentation/USER-GUIDE.md`
- Admin Guide: `/documentation/ADMIN-GUIDE.md`
- Troubleshooting: `/documentation/TROUBLESHOOTING.md`

### Support
- Email: support@yourcompany.com
- Response time: 48 hours
- Include: License key, error logs, server details

### Logs
```bash
# Docker logs
docker-compose logs -f

# PM2 logs
pm2 logs

# System logs
sudo journalctl -u dental-app -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Next Steps

1. **Complete API Configuration** - Settings → API Configuration
2. **Add Users** - Create accounts for staff
3. **Import Patients** - If migrating from another system
4. **Configure Branding** - Upload logo, set colors
5. **Test Features** - Book test appointment, send test SMS
6. **Train Staff** - Review User Guide with team
7. **Go Live** - Start taking appointments!

---

**Installation complete!** 🎉

Access your dental management system and start managing your practice efficiently.
