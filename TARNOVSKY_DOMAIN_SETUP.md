# Setting Up tarnovsky.ru Domain

## Current Situation

- **Your VPS IP**: `45.10.43.204` ✅ (Working)
- **tarnovsky.ru DNS**: Points to `77.232.131.121` ❌ (Wrong server)
- **forum.theholylabs.com**: Points to `45.10.43.204` ✅ (Correct)

## The Problem

When you visit `http://tarnovsky.ru`, you're reaching a **different server** (77.232.131.121), not your VPS. That's why you see the errors.

## Solution: Update DNS Records

### Step 1: Update DNS at Your DNS Provider (Timeweb)

You need to update the DNS records for `tarnovsky.ru` to point to your VPS:

1. **Log in to Timeweb** (or wherever you manage tarnovsky.ru DNS)
2. **Find DNS settings** for `tarnovsky.ru`
3. **Update these A records**:
   ```
   tarnovsky.ru        A    45.10.43.204
   www.tarnovsky.ru    A    45.10.43.204
   ```

4. **Save changes** and wait 5-10 minutes for DNS propagation

### Step 2: Verify DNS Update

After updating DNS, check if it's working:

```bash
# Check if tarnovsky.ru now points to your VPS
host tarnovsky.ru
# Should show: tarnovsky.ru has address 45.10.43.204
```

Or use online tools:
- https://dnschecker.org/#A/tarnovsky.ru

### Step 3: Test HTTP Access

Once DNS is updated, test HTTP access:

```bash
curl -I http://tarnovsky.ru
# Should return: HTTP/1.1 200 OK
```

### Step 4: Get SSL Certificate for HTTPS

After DNS is working, run this script to get SSL certificate:

```bash
cd /Users/romanpochtman/Developer/forumnextjs/iron-blog
./setup-tarnovsky-domain.sh
```

Or manually on the server:

```bash
ssh root@45.10.43.204
cd /root/iron-blog

# Get SSL certificate for tarnovsky.ru
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@tarnovsky.ru \
    --agree-tos \
    --no-eff-email \
    -d tarnovsky.ru \
    -d www.tarnovsky.ru

# Update nginx to use the new certificate
# Edit nginx.conf and change the ssl_certificate lines to:
# ssl_certificate /etc/letsencrypt/live/tarnovsky.ru/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/tarnovsky.ru/privkey.pem;

# Restart nginx
docker-compose restart nginx
```

## Current Status (After nginx update)

✅ **nginx configuration updated** to accept `tarnovsky.ru`, `www.tarnovsky.ru`, and `forum.theholylabs.com`

⏳ **Waiting for DNS update** - You need to update DNS records

❌ **SSL not configured yet** - Will work after DNS is updated

## What's Working Right Now

- ✅ `http://forum.theholylabs.com` → 200 OK
- ✅ `https://forum.theholylabs.com` → 200 OK
- ✅ `http://45.10.43.204` → 200 OK (direct IP)
- ❌ `http://tarnovsky.ru` → Goes to wrong server (77.232.131.121)
- ❌ `https://tarnovsky.ru` → Goes to wrong server (77.232.131.121)

## After DNS Update

Once you update DNS, everything will work:

- ✅ `http://tarnovsky.ru` → Will redirect to your VPS
- ✅ `https://tarnovsky.ru` → Will work after getting SSL certificate
- ✅ `http://www.tarnovsky.ru` → Will work
- ✅ `https://www.tarnovsky.ru` → Will work after getting SSL certificate

## Quick Commands Reference

```bash
# Check current DNS
host tarnovsky.ru

# Test HTTP (after DNS update)
curl -I http://tarnovsky.ru

# Test HTTPS (after SSL setup)
curl -I https://tarnovsky.ru

# Check server status
ssh root@45.10.43.204 'docker-compose ps'

# View nginx logs
ssh root@45.10.43.204 'docker logs nginx --tail 50'
```

## Need Help?

If you need help updating DNS at Timeweb:
1. Go to https://timeweb.com/
2. Log in to your account
3. Find "DNS Management" or "Domain Management"
4. Select tarnovsky.ru
5. Update A records as shown above

