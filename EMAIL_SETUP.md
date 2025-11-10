# 📧 Email Setup & Troubleshooting Guide

## Current Email Configuration

Your application sends emails for:
- ✅ **Email Verification** (on registration)
- ✅ **Welcome Email** (after verification)
- ✅ **Password Reset** (forgot password)
- ✅ **Email Change Confirmation** (when changing email)

---

## SMTP Configuration

### Current Settings:
```env
SMTP_HOST=95.163.180.91
SMTP_PORT=25
SMTP_USER=          # Empty (anonymous)
SMTP_PASS=          # Empty (anonymous)
FROM_EMAIL=admin@tarnovsky.ru
```

---

## Troubleshooting 504 Gateway Timeout

### Common Causes:

1. **SMTP Server Not Responding**
   - Server is down or unreachable
   - Firewall blocking connection
   - Wrong IP/port

2. **Authentication Issues**
   - SMTP server requires authentication
   - Credentials not set

3. **Network/DNS Issues**
   - Can't resolve hostname
   - Network timeout

---

## Testing SMTP Connection

### 1. Test from Server Terminal

```bash
# Test if SMTP server is reachable
telnet 95.163.180.91 25

# Should see something like:
# 220 mail.tarnovsky.ru ESMTP Postfix
# If connection refused or timeout, SMTP server is not accessible
```

### 2. Test with swaks (SMTP testing tool)

```bash
# Install swaks
sudo apt-get install swaks

# Test sending email
swaks --to test@example.com \
  --from admin@tarnovsky.ru \
  --server 95.163.180.91:25 \
  --body "Test email"

# This will show exactly what's happening with SMTP
```

### 3. Check Application Logs

```bash
# View detailed email logs
pm2 logs iron-blog | grep EMAIL

# You should see:
# [EMAIL] 📧 Preparing to send email
# [EMAIL] 🔍 Verifying SMTP connection...
# [EMAIL] ✅ SMTP connection verified
# [EMAIL] 📤 Sending email...
# [EMAIL] ✅ Email sent successfully!
```

---

## Common Solutions

### Solution 1: SMTP Server Requires Authentication

If your SMTP server requires authentication, update `.env.production`:

```env
SMTP_USER=admin@tarnovsky.ru
SMTP_PASS=your_smtp_password
```

### Solution 2: Use Different SMTP Port

Try port 587 (STARTTLS):

```env
SMTP_PORT=587
```

Or port 465 (SSL):

```env
SMTP_PORT=465
```

### Solution 3: Configure Postfix (if running your own SMTP)

```bash
# Edit Postfix config
sudo nano /etc/postfix/main.cf
```

Add/update:
```
myhostname = tarnovsky.ru
mydomain = tarnovsky.ru
myorigin = $mydomain
inet_interfaces = all
mydestination = $myhostname, localhost.$mydomain, localhost, $mydomain
mynetworks = 127.0.0.0/8, YOUR_APP_SERVER_IP/32
```

Restart Postfix:
```bash
sudo systemctl restart postfix
sudo systemctl status postfix
```

### Solution 4: Check Firewall

```bash
# Check if port 25 is open
sudo ufw status

# Allow port 25 if needed
sudo ufw allow 25/tcp

# Or allow from specific IP
sudo ufw allow from YOUR_APP_SERVER_IP to any port 25
```

### Solution 5: Use External Email Service (Recommended for Production)

Instead of running your own SMTP server, use a reliable service:

#### Option A: Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Generate at https://myaccount.google.com/apppasswords
FROM_EMAIL=admin@tarnovsky.ru
```

#### Option B: SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
FROM_EMAIL=admin@tarnovsky.ru
```

#### Option C: Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your_mailgun_password
FROM_EMAIL=admin@tarnovsky.ru
```

---

## Testing Email Functionality

### Test Registration Email

```bash
# Register a new user via API
curl -X POST https://tarnovsky.ru/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "displayName": "Test User"
  }'

# Check logs
pm2 logs iron-blog --lines 50 | grep EMAIL
```

### Test Password Reset Email

```bash
# Request password reset
curl -X POST https://tarnovsky.ru/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Check logs
pm2 logs iron-blog --lines 50 | grep EMAIL
```

---

## DNS Configuration for Email Delivery

To prevent emails from going to spam, configure these DNS records:

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 ip4:95.163.180.91 ~all
```

### DKIM Record (if using Postfix)
```bash
# Install opendkim
sudo apt-get install opendkim opendkim-tools

# Generate keys
sudo opendkim-genkey -t -s mail -d tarnovsky.ru

# Add to DNS
cat /etc/opendkim/keys/tarnovsky.ru/mail.txt
```

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@tarnovsky.ru
```

### MX Record (if receiving emails)
```
Type: MX
Name: @
Priority: 10
Value: mail.tarnovsky.ru
```

---

## Monitoring Email Delivery

### Check Email Queue (Postfix)

```bash
# View mail queue
mailq

# or
postqueue -p

# Flush queue (retry sending)
postqueue -f

# View mail logs
sudo tail -f /var/log/mail.log
```

### Application Email Logs

```bash
# Real-time email logs
pm2 logs iron-blog | grep EMAIL

# Last 100 email-related logs
pm2 logs iron-blog --lines 100 | grep EMAIL
```

---

## Quick Diagnostic Script

Save as `test-email.sh`:

```bash
#!/bin/bash

echo "=== Email System Diagnostic ==="
echo ""

echo "1. Testing SMTP Connection..."
timeout 5 telnet 95.163.180.91 25 2>&1 | head -n 1

echo ""
echo "2. Checking Postfix Status..."
systemctl is-active postfix

echo ""
echo "3. Checking Mail Queue..."
mailq | head -n 5

echo ""
echo "4. Recent Email Logs..."
tail -n 20 /var/log/mail.log 2>/dev/null || echo "No mail.log found"

echo ""
echo "5. Application Email Logs..."
pm2 logs iron-blog --lines 20 --nostream | grep EMAIL || echo "No PM2 logs found"

echo ""
echo "=== Diagnostic Complete ==="
```

Run it:
```bash
chmod +x test-email.sh
./test-email.sh
```

---

## Emergency: Disable Email Temporarily

If emails are causing issues, you can temporarily disable them:

1. Update `.env.production`:
```env
# Comment out SMTP_HOST to disable emails
# SMTP_HOST=95.163.180.91
```

2. Restart application:
```bash
pm2 restart iron-blog
```

**Note:** Users won't receive verification emails, but can still register.

---

## Best Practices

1. ✅ **Use External SMTP Service** for production (SendGrid, Mailgun, etc.)
2. ✅ **Monitor Email Logs** regularly
3. ✅ **Set up DNS Records** (SPF, DKIM, DMARC)
4. ✅ **Test Email Delivery** after deployment
5. ✅ **Have Backup SMTP** server configured
6. ✅ **Monitor Bounce Rates** and spam complaints

---

## Getting Help

If emails still don't work:

1. **Check Application Logs**: `pm2 logs iron-blog | grep EMAIL`
2. **Check SMTP Server Logs**: `sudo tail -f /var/log/mail.log`
3. **Test SMTP Connection**: `telnet 95.163.180.91 25`
4. **Verify DNS Records**: `dig tarnovsky.ru TXT`
5. **Check Firewall**: `sudo ufw status`

**Still stuck?** Share the output of:
```bash
pm2 logs iron-blog --lines 50 | grep EMAIL
```

---

## Quick Reference

| Issue | Solution |
|-------|----------|
| 504 Timeout | Check SMTP server is running and accessible |
| Connection Refused | Check firewall, verify SMTP port |
| Authentication Failed | Set SMTP_USER and SMTP_PASS |
| Emails go to Spam | Configure SPF, DKIM, DMARC DNS records |
| Slow Email Sending | Use external SMTP service (SendGrid, etc.) |

---

**Updated:** With enhanced logging and timeout handling
**Status:** Ready for testing

