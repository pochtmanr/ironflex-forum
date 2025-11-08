# Admin Panel Troubleshooting Guide

## Problem
The admin panel (`/admin`) is not recognizing that you are an admin, even though the profile page works correctly.

## What Was Fixed

### 1. Fixed Admin Check Logic
**File:** `src/app/admin/page.tsx` (Line 38)

**Before:**
```typescript
if (currentUser && !(currentUser as any).isAdmin) {
```

**After:**
```typescript
if (!currentUser.isAdmin) {
```

**Why:** Removed unnecessary type assertion and simplified the check. The original code was casting to `any` which bypassed TypeScript's type checking.

### 2. Added Extensive Logging
Added console logging to both:
- `src/app/admin/page.tsx` - Track admin panel authentication flow
- `src/contexts/AuthContext.tsx` - Track when user data is loaded and isAdmin status

### 3. Created Debug Tools

#### A. Debug Auth Page
**URL:** `http://localhost:3000/debug-auth`

This page shows:
- Current user from AuthContext
- Token information
- Decoded JWT payload
- LocalStorage data
- Admin status in all locations

#### B. Check Admin Status Script
```bash
node check-admin-status.js your@email.com
```

Shows your current admin status in the database.

#### C. Make Admin Script (already existed)
```bash
node make-admin.js your@email.com
```

Promotes a user to admin in the database.

## How to Diagnose the Issue

### Step 1: Check Browser Console
1. Open browser console (F12 → Console tab)
2. Navigate to `/admin`
3. Look for logs starting with "Admin page:" and "AuthContext:"
4. Check what `currentUser.isAdmin` shows

### Step 2: Use Debug Page
1. Navigate to `http://localhost:3000/debug-auth`
2. Check if "Is Admin" is YES in all sections:
   - Current User (from AuthContext)
   - Decoded Token Payload
   - LocalStorage Data

### Step 3: Check Database
```bash
# Check if your user is admin in the database
node check-admin-status.js your@email.com
```

## Common Issues & Solutions

### Issue 1: User is not admin in database
**Solution:**
```bash
# Make the user admin
node make-admin.js your@email.com

# Then LOG OUT and LOG BACK IN to get new tokens
```

⚠️ **Important:** You MUST log out and log back in after changing admin status in the database. Old tokens won't have the updated admin status.

### Issue 2: Admin status in DB but not in token
**Cause:** You're using old tokens from before you became admin.

**Solution:**
1. Log out completely
2. Clear localStorage (optional but recommended):
   ```javascript
   localStorage.clear()
   ```
3. Log back in
4. Check `/debug-auth` to verify new tokens have `isAdmin: true`

### Issue 3: Token has admin but page doesn't recognize it
**Cause:** The admin check logic was broken (now fixed).

**Solution:** The code has been fixed. Just refresh the page.

### Issue 4: LocalStorage doesn't persist admin status
**Cause:** The login/refresh endpoints weren't returning `isAdmin`.

**Status:** Already verified that all endpoints return `isAdmin`:
- `/api/auth/login` ✅
- `/api/auth/refresh` ✅
- `/api/auth/me` ✅

## Verification Checklist

After making changes, verify everything works:

- [ ] Run `node check-admin-status.js your@email.com` - Shows admin: YES
- [ ] Log out completely
- [ ] Log back in
- [ ] Check browser console - No errors, logs show `isAdmin: true`
- [ ] Visit `/debug-auth` - All sections show "Is Admin: YES"
- [ ] Visit `/admin` - Loads successfully, no redirect
- [ ] Visit `/profile` - Still works correctly

## Technical Details

### Where isAdmin is Stored/Checked

1. **Database** (MongoDB)
   - Collection: `users`
   - Field: `isAdmin` (Boolean, default: false)

2. **JWT Token Payload**
   ```json
   {
     "id": "user_id",
     "email": "user@example.com",
     "username": "username",
     "isAdmin": true
   }
   ```

3. **LocalStorage**
   - Key: `user`
   - Contains full user object with `isAdmin` field

4. **AuthContext State**
   - `currentUser` object has `isAdmin` property
   - Type: `User` interface in `AuthContext.tsx`

### Authentication Flow

1. User logs in → `/api/auth/login`
2. Server generates JWT with `isAdmin` in payload
3. Server returns user object with `isAdmin`
4. Client stores token and user in localStorage
5. AuthContext loads user from localStorage
6. Admin page checks `currentUser.isAdmin`

### Why the Profile Page Worked

The profile page doesn't check admin status - it just loads user data. The admin page has a specific check that was incorrectly implemented.

## Files Modified

1. `src/app/admin/page.tsx` - Fixed admin check, added logging
2. `src/contexts/AuthContext.tsx` - Added isAdmin logging
3. `src/app/debug-auth/page.tsx` - New debug page (created)
4. `check-admin-status.js` - New script (created)
5. `ADMIN_TROUBLESHOOTING.md` - This file (created)

## Need More Help?

If the issue persists after following this guide:

1. Share the console logs from the admin page
2. Share the output from `/debug-auth`
3. Share the output from `node check-admin-status.js`
4. Check if there are any network errors in the Network tab

## Clean Slate Procedure

If nothing works, start fresh:

```bash
# 1. Clear all auth data
# In browser console:
localStorage.clear()

# 2. Verify database
node check-admin-status.js your@email.com

# 3. If not admin, make admin
node make-admin.js your@email.com

# 4. Log in fresh
# Go to /login and sign in

# 5. Verify everything
# Go to /debug-auth and check all sections

# 6. Test admin panel
# Go to /admin
```

This should resolve any authentication state issues.



