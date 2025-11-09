# DNS Setup Guide for tarnovsky.ru

## ✅ What's Already Done

- ✅ nginx configuration updated on server
- ✅ Server accepts requests for tarnovsky.ru
- ✅ All services running properly
- ✅ Changes committed to GitHub

## 🔧 What You Need to Do: Update DNS

### Step-by-Step DNS Configuration

In your Timeweb DNS panel, you need to create **TWO** A records:

---

#### Record 1: Root Domain (tarnovsky.ru)

```
Тип:    A
Домен:  @                    (or leave empty - this means root domain)
IP:     45.10.43.204
TTL:    3600                 (or leave default)
```

**Visual:**
```
┌─────────────────────────────────────────┐
│ Тип:   [A]                              │
│                                         │
│ Домен: [@] or [пусто]                   │
│        ↑ This represents tarnovsky.ru   │
│                                         │
│ IP-адрес: [45.10.43.204]                │
│                                         │
│ TTL:   [3600]                           │
└─────────────────────────────────────────┘
```

---

#### Record 2: WWW Subdomain (www.tarnovsky.ru)

```
Тип:    A
Домен:  www
IP:     45.10.43.204
TTL:    3600                 (or leave default)
```

**Visual:**
```
┌─────────────────────────────────────────┐
│ Тип:   [A]                              │
│                                         │
│ Домен: [www]                            │
│        ↑ This represents www.tarnovsky.ru│
│                                         │
│ IP-адрес: [45.10.43.204]                │
│                                         │
│ TTL:   [3600]                           │
└─────────────────────────────────────────┘
```

---

## 📝 Summary Table

| Record | Тип | Домен | IP-адрес      | TTL  |
|--------|-----|-------|---------------|------|
| 1      | A   | @     | 45.10.43.204  | 3600 |
| 2      | A   | www   | 45.10.43.204  | 3600 |

## ⏱️ After Saving

1. **Save both records** in Timeweb
2. **Wait 5-10 minutes** for DNS propagation
3. **Test the connection**:

```bash
# Check if DNS is updated
host tarnovsky.ru
# Should show: tarnovsky.ru has address 45.10.43.204

# Test HTTP access
curl -I http://tarnovsky.ru
# Should show: HTTP/1.1 200 OK
```

## 🔒 Getting SSL Certificate (After DNS is Working)

Once DNS is updated and working, run this on your local machine:

```bash
cd /Users/romanpochtman/Developer/forumnextjs/iron-blog
./setup-tarnovsky-domain.sh
```

Or manually on the server:

```bash
ssh root@45.10.43.204
cd /root/iron-blog

# Get SSL certificate
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@tarnovsky.ru \
    --agree-tos \
    --no-eff-email \
    -d tarnovsky.ru \
    -d www.tarnovsky.ru

# Restart nginx to use the new certificate
docker-compose restart nginx
```

## 🎯 Final Result

After DNS update and SSL setup, all these URLs will work:

- ✅ http://tarnovsky.ru
- ✅ https://tarnovsky.ru
- ✅ http://www.tarnovsky.ru
- ✅ https://www.tarnovsky.ru
- ✅ http://forum.theholylabs.com
- ✅ https://forum.theholylabs.com

## 🆘 Troubleshooting

### DNS not updating?

Check online:
- https://dnschecker.org/#A/tarnovsky.ru

### Still seeing old server?

Clear your DNS cache:
```bash
# Mac
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches
```

### SSL certificate fails?

Make sure:
1. DNS is pointing to 45.10.43.204 (verify with `host tarnovsky.ru`)
2. Port 80 is accessible (test with `curl http://tarnovsky.ru`)
3. nginx is running (`docker-compose ps nginx`)

