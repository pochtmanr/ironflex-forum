# 📧 Email System Setup Guide

## ✅ Implementation Complete!

Your forum now has a complete email system using **Timeweb SMTP** with Nodemailer.

---

## 🔧 Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration (Timeweb SMTP)
SMTP_HOST=mail.timeweb.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@tarnovsky.ru
SMTP_PASS=VWJetta2014Asd))!
FROM_EMAIL=support@tarnovsky.ru
FROM_NAME=Клинический Протокол Тарновского

# Site URL (important for email links)
NEXT_PUBLIC_SITE_URL=https://tarnovsky.ru
```

### Production Environment Variables

On your VPS, set these environment variables:

```bash
export SMTP_HOST=mail.timeweb.com
export SMTP_PORT=465
export SMTP_SECURE=true
export SMTP_USER=support@tarnovsky.ru
export SMTP_PASS=VWJetta2014Asd))!
export FROM_EMAIL=support@tarnovsky.ru
export FROM_NAME="Клинический Протокол Тарновского"
export NEXT_PUBLIC_SITE_URL=https://tarnovsky.ru
```

---

## 📬 Features Implemented

### 1. **Email Verification**
- ✅ Sent automatically on user registration
- ✅ 24-hour expiration
- ✅ Beautiful HTML template with gradients
- ✅ Verification page at `/auth/verify-email`
- ✅ Welcome email sent after verification

### 2. **Password Reset**
- ✅ Forgot password page at `/forgot-password`
- ✅ Reset password page at `/auth/reset-password`
- ✅ 1-hour expiration for security
- ✅ Professional HTML email template
- ✅ Password strength validation

### 3. **Email Templates**
All emails feature:
- 🎨 Modern gradient design (purple/blue)
- 📱 Mobile-responsive
- 🔒 Security warnings
- ⏰ Expiration indicators
- 💡 Helpful tips and instructions

---

## 🚀 How It Works

### User Registration Flow

1. User registers with email and password
2. System creates unverified account
3. **Email verification sent automatically** to user's email
4. User clicks link in email → redirected to `/auth/verify-email?token=...`
5. System verifies token and marks account as verified
6. **Welcome email sent automatically**
7. User can now use all features

### Password Reset Flow

1. User clicks "Forgot Password" on login page
2. User enters email at `/forgot-password`
3. **Password reset email sent** (if account exists)
4. User clicks link in email → redirected to `/auth/reset-password?token=...`
5. User enters new password
6. Password updated, user can log in

---

## 📁 File Structure

```
src/
├── lib/
│   └── email.ts                          # Email library with Nodemailer
├── models/
│   └── ResetToken.ts                     # Token model for verification/reset
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── register/route.ts         # Updated with email verification
│   │       ├── verify-email/route.ts     # Email verification API
│   │       ├── forgot-password/route.ts  # Forgot password API
│   │       └── reset-password/route.ts   # Reset password API
│   ├── auth/
│   │   ├── verify-email/page.tsx         # Email verification page
│   │   └── reset-password/page.tsx       # Reset password page
│   └── forgot-password/page.tsx          # Forgot password page
```

---

## 🧪 Testing

### Test Email Verification

1. **Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "displayName": "Test User"
  }'
```

2. **Check your email** for verification link
3. **Click the link** or copy token and visit:
   ```
   http://localhost:3000/auth/verify-email?token=YOUR_TOKEN
   ```

### Test Password Reset

1. **Request password reset:**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

2. **Check your email** for reset link
3. **Click the link** and create new password

---

## 🔍 Monitoring & Debugging

### Check Email Logs

The email system includes comprehensive logging:

```bash
# In development
npm run dev

# Look for these log messages:
# [EMAIL] 📧 Preparing to send email with Nodemailer
# [EMAIL] 🔍 Verifying SMTP connection...
# [EMAIL] ✅ SMTP connection verified
# [EMAIL] 📤 Sending email...
# [EMAIL] ✅ Email sent successfully!
```

### Common Issues

#### 1. **Emails not sending**
- Check SMTP credentials in `.env.local`
- Verify SMTP_PASS is correct
- Check firewall allows port 465
- Look for errors in console logs

#### 2. **Emails go to spam**
- Configure SPF record for your domain
- Set up DKIM signing (ask Timeweb)
- Add DMARC policy

#### 3. **Connection timeout**
- Verify `SMTP_HOST=mail.timeweb.com`
- Check `SMTP_PORT=465`
- Ensure `SMTP_SECURE=true`

---

## 🎨 Email Templates

### Email Verification Template
- Purple gradient header
- Clear call-to-action button
- Alternative link if button doesn't work
- 24-hour expiration notice
- Benefits of verification listed

### Password Reset Template
- Security-focused design
- 1-hour expiration warning
- Large reset button
- Security tips included
- Alternative link provided

### Welcome Email Template
- Celebration theme
- Platform features highlighted
- Quick start tips
- Links to get started

---

## 🔐 Security Features

- ✅ Tokens expire automatically (MongoDB TTL index)
- ✅ One-time use tokens (marked as `used` after verification)
- ✅ Secure random token generation (32 bytes)
- ✅ Password strength validation
- ✅ Email enumeration protection (same message for existing/non-existing users)
- ✅ TLS/SSL encryption for SMTP

---

## 📊 Database

### ResetToken Collection

```javascript
{
  userId: String,           // Reference to user
  token: String,            // Unique token (indexed)
  type: String,             // 'email_verification' or 'password_reset'
  expiresAt: Date,          // Automatic expiration
  used: Boolean,            // One-time use flag
  createdAt: Date,          // Timestamp
}
```

Indexes:
- `token` (unique)
- `userId`
- `expiresAt` (TTL index for auto-deletion)

---

## 🚀 Deployment Checklist

### Before Deploying:

1. ✅ Set production environment variables
2. ✅ Update `NEXT_PUBLIC_SITE_URL` to production URL
3. ✅ Verify SMTP credentials work
4. ✅ Test email sending in production
5. ✅ Configure DNS records (SPF, DKIM, DMARC)
6. ✅ Check firewall allows SMTP port 465

### After Deploying:

1. ✅ Test user registration
2. ✅ Verify email arrives
3. ✅ Test email verification link
4. ✅ Test password reset flow
5. ✅ Check email logs for errors

---

## 📝 API Endpoints

### Email Verification

**Send Verification Email** (requires auth)
```
POST /api/auth/verify-email
Authorization: Bearer {token}
```

**Verify Email**
```
GET /api/auth/verify-email?token={token}
```

### Password Reset

**Request Reset**
```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
```

**Verify Reset Token**
```
GET /api/auth/reset-password?token={token}
```

**Reset Password**
```
POST /api/auth/reset-password
Body: { "token": "...", "newPassword": "..." }
```

---

## 💡 Tips

1. **Test locally first** before deploying
2. **Monitor email logs** for the first few days
3. **Keep SMTP credentials secure** (never commit to git)
4. **Consider email rate limiting** for production
5. **Set up email monitoring** to track delivery rates

---

## 🎉 Success!

Your email system is now fully functional with:
- ✅ Professional email templates
- ✅ Secure token management
- ✅ User-friendly UI pages
- ✅ Comprehensive error handling
- ✅ Production-ready code

**Next Steps:**
1. Add SMTP credentials to `.env.local`
2. Test registration and email verification
3. Deploy to production
4. Monitor email delivery

---

## 📞 Support

If you encounter any issues:
1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Test SMTP connection manually
4. Contact Timeweb support if SMTP issues persist

**Email Configuration:**
- Provider: Timeweb
- Email: support@tarnovsky.ru
- SMTP: mail.timeweb.com:465 (SSL)

