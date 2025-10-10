#!/bin/bash

# 📧 VK Cloud Email Server Setup Script for Iron Blog
# Run this script on your VK Cloud server (95.163.180.91)

set -e

echo "🚀 Starting Iron Blog Email Server Setup on VK Cloud..."

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
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Get domain name from user
read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN
read -p "Enter your server hostname (e.g., mail.yourdomain.com): " HOSTNAME

print_status "Setting up email server for domain: $DOMAIN"
print_status "Server hostname: $HOSTNAME"

# Step 1: Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Step 2: Set hostname
print_status "Setting hostname to $HOSTNAME..."
hostnamectl set-hostname $HOSTNAME
echo "127.0.0.1 $HOSTNAME" >> /etc/hosts

# Step 3: Install required packages
print_status "Installing Postfix and Dovecot..."
DEBIAN_FRONTEND=noninteractive apt install -y \
    postfix \
    dovecot-core \
    dovecot-imapd \
    dovecot-pop3d \
    mailutils \
    ufw \
    certbot

# Step 4: Configure Postfix
print_status "Configuring Postfix..."
cat > /etc/postfix/main.cf << EOF
# Basic settings
myhostname = $HOSTNAME
mydomain = $DOMAIN
myorigin = \$mydomain
inet_interfaces = all
inet_protocols = ipv4
mydestination = \$myhostname, localhost.\$mydomain, localhost, \$mydomain

# Network settings
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128

# Mailbox settings
home_mailbox = Maildir/

# SMTP Authentication
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = \$myhostname

# TLS/SSL settings (will be updated after Let's Encrypt)
smtpd_tls_security_level = may
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_tls_session_cache_database = btree:\${data_directory}/smtpd_scache
smtp_tls_session_cache_database = btree:\${data_directory}/smtp_scache

# Restrictions
smtpd_recipient_restrictions = 
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_unauth_destination

# Message size limit (25MB)
message_size_limit = 26214400
EOF

# Step 5: Configure Dovecot
print_status "Configuring Dovecot..."

# Main config
echo "protocols = imap pop3" > /etc/dovecot/dovecot.conf
echo "listen = *" >> /etc/dovecot/dovecot.conf

# Mail location
sed -i 's/#mail_location = .*/mail_location = maildir:~\/Maildir/' /etc/dovecot/conf.d/10-mail.conf

# Authentication
sed -i 's/#disable_plaintext_auth = yes/disable_plaintext_auth = no/' /etc/dovecot/conf.d/10-auth.conf
sed -i 's/auth_mechanisms = plain/auth_mechanisms = plain login/' /etc/dovecot/conf.d/10-auth.conf

# Postfix integration
cat >> /etc/dovecot/conf.d/10-master.conf << EOF

service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user = postfix
    group = postfix
  }
}
EOF

# Step 6: Create email user
print_status "Creating noreply user..."
useradd -m -s /bin/bash noreply || true
echo "Please set a password for the noreply user:"
passwd noreply

# Create Maildir
su - noreply -c "mkdir -p ~/Maildir/{cur,new,tmp}"

# Step 7: Configure firewall
print_status "Configuring firewall..."
ufw allow 25/tcp    # SMTP
ufw allow 587/tcp   # SMTP Submission
ufw allow 993/tcp   # IMAPS
ufw allow 995/tcp   # POP3S
ufw allow 143/tcp   # IMAP
ufw allow 110/tcp   # POP3
ufw allow 80/tcp    # HTTP (for Let's Encrypt)
ufw allow 443/tcp   # HTTPS
ufw --force enable

# Step 8: Get SSL certificate
print_status "Getting SSL certificate from Let's Encrypt..."
certbot certonly --standalone -d $HOSTNAME --non-interactive --agree-tos --email admin@$DOMAIN

# Update Postfix SSL config
if [ -f "/etc/letsencrypt/live/$HOSTNAME/fullchain.pem" ]; then
    print_success "SSL certificate obtained successfully!"
    
    # Update Postfix SSL configuration
    sed -i "s|smtpd_tls_cert_file = .*|smtpd_tls_cert_file = /etc/letsencrypt/live/$HOSTNAME/fullchain.pem|" /etc/postfix/main.cf
    sed -i "s|smtpd_tls_key_file = .*|smtpd_tls_key_file = /etc/letsencrypt/live/$HOSTNAME/privkey.pem|" /etc/postfix/main.cf
else
    print_warning "SSL certificate not obtained. Using self-signed certificate."
fi

# Step 9: Start services
print_status "Starting email services..."
systemctl restart postfix
systemctl restart dovecot
systemctl enable postfix
systemctl enable dovecot

# Step 10: Test configuration
print_status "Testing email server configuration..."

# Check if services are running
if systemctl is-active --quiet postfix; then
    print_success "Postfix is running"
else
    print_error "Postfix is not running"
fi

if systemctl is-active --quiet dovecot; then
    print_success "Dovecot is running"
else
    print_error "Dovecot is not running"
fi

# Step 11: Display configuration summary
print_success "Email server setup completed!"
echo ""
echo "📧 Email Server Configuration Summary:"
echo "======================================"
echo "Domain: $DOMAIN"
echo "Hostname: $HOSTNAME"
echo "Server IP: 95.163.180.91"
echo ""
echo "SMTP Settings for Iron Blog:"
echo "SMTP_HOST=95.163.180.91"
echo "SMTP_PORT=587"
echo "SMTP_USER=noreply@$DOMAIN"
echo "SMTP_PASS=[password you set for noreply user]"
echo "FROM_EMAIL=noreply@$DOMAIN"
echo ""
echo "📋 Required DNS Records:"
echo "========================"
echo "MX Record:  @ -> $HOSTNAME (Priority: 10)"
echo "A Record:   mail -> 95.163.180.91"
echo "TXT Record: @ -> \"v=spf1 mx a ip4:95.163.180.91 ~all\""
echo "TXT Record: _dmarc -> \"v=DMARC1; p=quarantine; rua=mailto:dmarc@$DOMAIN\""
echo ""
echo "🔧 Next Steps:"
echo "=============="
echo "1. Add the DNS records above to your domain"
echo "2. Update your Iron Blog .env.local with the SMTP settings"
echo "3. Test email sending from your application"
echo "4. Monitor /var/log/mail.log for any issues"
echo ""
echo "📊 Useful Commands:"
echo "=================="
echo "Check mail queue: postqueue -p"
echo "View mail logs: tail -f /var/log/mail.log"
echo "Test SMTP: echo 'Test' | mail -s 'Test Subject' test@$DOMAIN"
echo ""
print_success "Setup complete! Your email server is ready to use."
