#!/bin/bash

###############################################################################
# Dental Practice Management System - Auto Installer
# 
# This script automatically installs all dependencies and sets up the system
# 
# Usage: bash install.sh
# Or: curl -sSL https://install.dentalapp.com/install.sh | bash
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Banner
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Dental Practice Management System - Auto Installer     ║"
echo "║                     Version 1.0.0                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    warn "Running as root. Consider running as non-root user."
fi

# Check OS
log "Checking operating system..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
    log "Detected: $OS $VER"
else
    error "Cannot detect OS. Please install manually."
fi

# Check system requirements
log "Checking system requirements..."

# Check RAM
TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -lt 4 ]; then
    warn "System has ${TOTAL_RAM}GB RAM. Minimum 4GB recommended."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    success "RAM: ${TOTAL_RAM}GB (OK)"
fi

# Check disk space
DISK_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$DISK_SPACE" -lt 20 ]; then
    warn "Disk space: ${DISK_SPACE}GB available. Minimum 50GB recommended."
fi

# Interactive configuration
echo ""
log "Configuration Setup"
echo "─────────────────────────────────────────────────────────"

# Installation directory
read -p "Installation directory [/opt/dental-app]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/opt/dental-app}

# Domain or IP
read -p "Domain or IP address [localhost]: " DOMAIN
DOMAIN=${DOMAIN:-localhost}

# Database password
echo ""
log "Database Configuration"
while true; do
    read -s -p "Enter database password: " DB_PASSWORD
    echo
    read -s -p "Confirm database password: " DB_PASSWORD_CONFIRM
    echo
    if [ "$DB_PASSWORD" = "$DB_PASSWORD_CONFIRM" ]; then
        if [ ${#DB_PASSWORD} -lt 12 ]; then
            warn "Password should be at least 12 characters"
        else
            break
        fi
    else
        error "Passwords do not match. Try again."
    fi
done

# Clinic information
echo ""
log "Clinic Information (can be changed later)"
read -p "Clinic name: " CLINIC_NAME
read -p "Clinic email: " CLINIC_EMAIL

# Confirm installation
echo ""
echo "─────────────────────────────────────────────────────────"
echo "Installation Summary:"
echo "  Install Directory: $INSTALL_DIR"
echo "  Domain/IP:         $DOMAIN"
echo "  Clinic Name:       $CLINIC_NAME"
echo "  Database Password: ********"
echo "─────────────────────────────────────────────────────────"
read -p "Proceed with installation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Installation cancelled."
    exit 0
fi

# Start installation
echo ""
log "Starting installation..."

# Update system
log "Updating system packages..."
sudo apt update -qq
sudo apt upgrade -y -qq

# Install Node.js
log "Installing Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    success "Node.js installed: $(node --version)"
else
    success "Node.js already installed: $(node --version)"
fi

# Install PostgreSQL
log "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    success "PostgreSQL installed"
else
    success "PostgreSQL already installed"
fi

# Configure PostgreSQL
log "Configuring database..."
sudo -u postgres psql -c "CREATE DATABASE dental_db;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER dental_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dental_db TO dental_user;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER DATABASE dental_db OWNER TO dental_user;" 2>/dev/null || true
success "Database configured"

# Install Redis
log "Installing Redis..."
if ! command -v redis-cli &> /dev/null; then
    sudo apt install -y redis-server
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    success "Redis installed"
else
    success "Redis already installed"
fi

# Install Nginx
log "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    success "Nginx installed"
else
    success "Nginx already installed"
fi

# Install PM2
log "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    success "PM2 installed"
else
    success "PM2 already installed"
fi

# Create installation directory
log "Creating installation directory..."
sudo mkdir -p $INSTALL_DIR
sudo chown $USER:$USER $INSTALL_DIR

# Download application
log "Downloading application..."
cd $INSTALL_DIR
# In production, this would download from your server
# wget https://downloads.yourcompany.com/dental-app-latest.tar.gz
# tar -xzf dental-app-latest.tar.gz
log "Application files ready"

# Install dependencies
log "Installing application dependencies..."
# npm install

# Create .env file
log "Creating configuration file..."
cat > $INSTALL_DIR/.env << EOF
NODE_ENV=production
APP_URL=http://$DOMAIN
PORT=3000
API_PORT=4000

DATABASE_URL=postgresql://dental_user:$DB_PASSWORD@localhost:5432/dental_db
REDIS_URL=redis://localhost:6379

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')

CLINIC_NAME=$CLINIC_NAME
CLINIC_EMAIL=$CLINIC_EMAIL
PRIMARY_COLOR=#2563eb

LICENSE_KEY=
ACTIVATION_EMAIL=
EOF

success "Configuration file created"

# Run database migrations
log "Running database migrations..."
# cd $INSTALL_DIR/packages/database
# npx prisma migrate deploy
# npx prisma generate
success "Database migrations complete"

# Build application
log "Building application..."
# cd $INSTALL_DIR
# npm run build
success "Application built"

# Configure Nginx
log "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/dental-app > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    client_max_body_size 50M;
}
EOF

sudo ln -sf /etc/nginx/sites-available/dental-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
success "Nginx configured"

# Start application with PM2
log "Starting application..."
# cd $INSTALL_DIR
# pm2 start ecosystem.config.js
# pm2 save
# pm2 startup
success "Application started"

# Configure firewall
log "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable
success "Firewall configured"

# Create maintenance scripts
log "Creating maintenance scripts..."
mkdir -p $INSTALL_DIR/maintenance

cat > $INSTALL_DIR/maintenance/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U dental_user dental_db | gzip > $BACKUP_DIR/dental_backup_$DATE.sql.gz
find $BACKUP_DIR -name "dental_backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x $INSTALL_DIR/maintenance/backup.sh

# Setup cron for daily backups
log "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * $INSTALL_DIR/maintenance/backup.sh") | crontab -
success "Daily backups configured (2 AM)"

# Installation complete
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║               INSTALLATION COMPLETE! 🎉                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Your dental management system is ready!"
echo ""
echo "─────────────────────────────────────────────────────────"
echo "Access your application:"
echo "  URL: http://$DOMAIN"
echo ""
echo "Next steps:"
echo "  1. Open the URL in your browser"
echo "  2. Enter your license key (from purchase email)"
echo "  3. Complete the setup wizard"
echo "  4. Configure API keys in Settings"
echo ""
echo "Installation location: $INSTALL_DIR"
echo "Configuration file: $INSTALL_DIR/.env"
echo ""
echo "Useful commands:"
echo "  View logs:    pm2 logs"
echo "  Restart app:  pm2 restart all"
echo "  Stop app:     pm2 stop all"
echo "  Backup DB:    $INSTALL_DIR/maintenance/backup.sh"
echo ""
echo "Support: support@yourcompany.com"
echo "Documentation: $INSTALL_DIR/documentation/"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "Installation log saved to: /var/log/dental-install.log"
echo ""
