#!/bin/bash

# Golf Stats Application Deployment Script
# This script builds and deploys the application to a production server

set -e

echo "🏌️ Golf Stats Deployment Script"
echo "================================"

# Configuration
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-4173}
DOMAIN=${DOMAIN:-yourdomain.com}
APP_DIR=${APP_DIR:-/var/www/golf-stats}
NGINX_CONFIG=${NGINX_CONFIG:-/etc/nginx/sites-available/golf-stats}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm run install:all

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Step 2: Build frontend
print_status "Building frontend..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi

print_success "Frontend built successfully"
cd ..

# Step 3: Setup database
print_status "Setting up database..."
cd backend
npx prisma generate
npx prisma db push

if [ $? -ne 0 ]; then
    print_error "Database setup failed"
    exit 1
fi

print_success "Database setup completed"
cd ..

# Step 4: Create deployment directory structure
print_status "Creating deployment directory structure..."
sudo mkdir -p $APP_DIR/{backend,frontend,logs}
sudo chown -R $USER:$USER $APP_DIR

# Step 5: Copy application files
print_status "Copying application files..."

# Copy backend
cp -r backend/* $APP_DIR/backend/
cp backend/.env.example $APP_DIR/backend/.env 2>/dev/null || true

# Copy frontend build
cp -r frontend/dist/* $APP_DIR/frontend/

# Copy package.json files
cp package.json $APP_DIR/
cp backend/package.json $APP_DIR/backend/
cp frontend/package.json $APP_DIR/frontend/

print_success "Application files copied"

# Step 6: Install production dependencies
print_status "Installing production dependencies..."
cd $APP_DIR/backend
npm install --production

if [ $? -ne 0 ]; then
    print_error "Failed to install backend production dependencies"
    exit 1
fi

print_success "Production dependencies installed"

# Step 7: Create systemd service file
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/golf-stats.service > /dev/null <<EOF
[Unit]
Description=Golf Stats Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$BACKEND_PORT

[Install]
WantedBy=multi-user.target
EOF

# Step 8: Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Configuration (you'll need to replace these with your actual SSL certificates)
    ssl_certificate /etc/ssl/certs/$DOMAIN.crt;
    ssl_certificate_key /etc/ssl/private/$DOMAIN.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Frontend (Svelte app)
    location / {
        root $APP_DIR/frontend;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:$BACKEND_PORT/api/health;
        access_log off;
    }
}
EOF

# Step 9: Enable and start services
print_status "Enabling and starting services..."

# Enable and start the backend service
sudo systemctl daemon-reload
sudo systemctl enable golf-stats
sudo systemctl start golf-stats

# Enable and configure Nginx
sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
sudo nginx -t

if [ $? -ne 0 ]; then
    print_error "Nginx configuration test failed"
    exit 1
fi

sudo systemctl reload nginx

print_success "Services started successfully"

# Step 10: Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/golf-stats > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload golf-stats > /dev/null 2>&1 || true
    endscript
}
EOF

# Step 11: Create backup script
print_status "Creating backup script..."
sudo tee /usr/local/bin/golf-stats-backup > /dev/null <<EOF
#!/bin/bash
BACKUP_DIR="/var/backups/golf-stats"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Backup database
cp $APP_DIR/backend/prisma/dev.db \$BACKUP_DIR/golf-stats_\$DATE.db

# Keep only last 7 backups
find \$BACKUP_DIR -name "golf-stats_*.db" -type f -mtime +7 -delete

echo "Backup completed: golf-stats_\$DATE.db"
EOF

sudo chmod +x /usr/local/bin/golf-stats-backup

# Step 12: Setup cron job for backups
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/golf-stats-backup") | crontab -

# Step 13: Final checks
print_status "Performing final checks..."

# Check if backend is running
if systemctl is-active --quiet golf-stats; then
    print_success "Backend service is running"
else
    print_error "Backend service is not running"
    exit 1
fi

# Check if Nginx is running
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
    exit 1
fi

# Check if backend is responding
sleep 5
if curl -f http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    print_success "Backend API is responding"
else
    print_error "Backend API is not responding"
    exit 1
fi

print_success "Deployment completed successfully!"
echo ""
echo "🎉 Golf Stats Application is now deployed!"
echo "=========================================="
echo ""
echo "📍 Application URL: https://$DOMAIN"
echo "🔧 Backend API: http://localhost:$BACKEND_PORT"
echo "📊 Application Directory: $APP_DIR"
echo ""
echo "📋 Useful Commands:"
echo "  • Check backend status: sudo systemctl status golf-stats"
echo "  • View backend logs: sudo journalctl -u golf-stats -f"
echo "  • Restart backend: sudo systemctl restart golf-stats"
echo "  • Check Nginx status: sudo systemctl status nginx"
echo "  • Test Nginx config: sudo nginx -t"
echo "  • Create backup: /usr/local/bin/golf-stats-backup"
echo ""
echo "⚠️  Important Notes:"
echo "  • Make sure to configure SSL certificates for HTTPS"
echo "  • Update the .env file in $APP_DIR/backend/ with production settings"
echo "  • Consider setting up a firewall (ufw) for additional security"
echo "  • Monitor logs regularly: tail -f $APP_DIR/logs/*.log"
echo ""
echo "🔒 Security Recommendations:"
echo "  • Enable UFW firewall: sudo ufw enable"
echo "  • Configure fail2ban for additional protection"
echo "  • Regularly update the system: sudo apt update && sudo apt upgrade"
echo "  • Set up monitoring and alerting"
echo ""
print_success "Happy golfing! 🏌️‍♂️"
