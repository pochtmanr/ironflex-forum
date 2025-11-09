# 🚨 Fix DNS Issue for tarnovsky.ru

## The Problem

Your domain **tarnovsky.ru** currently points to **TWO servers**:

```
tarnovsky.ru → 77.232.131.121 (OLD SERVER ❌)
tarnovsky.ru → 45.10.43.204 (YOUR VPS ✅)
```

This is why:
- ✅ HTTP works sometimes (when it hits your server)
- ❌ HTTPS shows certificate error (wrong certificate)
- ❌ SSL certificate cannot be obtained (Let's Encrypt hits old server)

## The Solution

**Delete the old DNS record** in Timeweb!

---

## Step-by-Step Fix

### 1. Go to Timeweb DNS Settings

Log in to Timeweb and find DNS management for `tarnovsky.ru`

### 2. Find and DELETE This Record

Look for this A record and **DELETE IT**:

```
┌─────────────────────────────────────────┐
│ ❌ DELETE THIS RECORD                   │
├─────────────────────────────────────────┤
│ Тип:      A                             │
│ Домен:    @                             │
│ IP:       77.232.131.121  ← OLD SERVER  │
│                                         │
│ [DELETE] [УДАЛИТЬ]                      │
└─────────────────────────────────────────┘
```

### 3. Keep This Record

Make sure you have this A record and **KEEP IT**:

```
┌─────────────────────────────────────────┐
│ ✅ KEEP THIS RECORD                     │
├─────────────────────────────────────────┤
│ Тип:      A                             │
│ Домен:    @                             │
│ IP:       45.10.43.204  ← YOUR VPS      │
│                                         │
│ [KEEP] [СОХРАНИТЬ]                      │
└─────────────────────────────────────────┘
```

### 4. Also Check WWW Record

Make sure www subdomain points to your VPS:

```
┌─────────────────────────────────────────┐
│ ✅ WWW Record                           │
├─────────────────────────────────────────┤
│ Тип:      A                             │
│ Домен:    www                           │
│ IP:       45.10.43.204  ← YOUR VPS      │
└─────────────────────────────────────────┘
```

---

## After Deleting Old Record

### Wait 5-10 Minutes

DNS needs time to propagate.

### Verify DNS is Fixed

Run this command:

```bash
dig +short tarnovsky.ru
```

**Should show ONLY:**
```
45.10.43.204
```

**Should NOT show:**
```
77.232.131.121  ← If you see this, wait longer
```

### Get SSL Certificate

Once DNS shows only your IP, run:

```bash
cd /Users/romanpochtman/Developer/forumnextjs/iron-blog
./get-ssl-manual.sh
```

---

## Visual Summary

### Current State (WRONG)

```
                    ┌──────────────────┐
                    │   tarnovsky.ru   │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        77.232.131.121            45.10.43.204
        (Old Server ❌)           (Your VPS ✅)
        - Wrong content           - Your site
        - No SSL                  - Ready for SSL
```

### Target State (CORRECT)

```
                    ┌──────────────────┐
                    │   tarnovsky.ru   │
                    └────────┬─────────┘
                             │
                             ▼
                      45.10.43.204
                      (Your VPS ✅)
                      - Your site
                      - SSL ready
```

---

## Quick Checklist

- [ ] Log in to Timeweb
- [ ] Go to DNS settings for tarnovsky.ru
- [ ] Delete A record pointing to 77.232.131.121
- [ ] Keep A record pointing to 45.10.43.204
- [ ] Ensure www record points to 45.10.43.204
- [ ] Wait 5-10 minutes
- [ ] Verify with: `dig +short tarnovsky.ru`
- [ ] Run: `./get-ssl-manual.sh`

---

## Need Help Finding the Old Record?

In Timeweb, look for:
- **Section**: "DNS записи" or "DNS records"
- **Type**: A
- **Value/IP**: 77.232.131.121
- **Action**: Delete/Удалить button

The old record might be labeled as:
- "Основной IP" (Main IP)
- "Старый IP" (Old IP)
- Or just listed in the DNS records table

**Just delete any A record that points to 77.232.131.121**

