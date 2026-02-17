# 🔧 Admin Login Error - Diagnosis & Fix

## Error Message
```
app-index.js:33 Admin login error: Error: Login failed
    at adminLogin (AuthContext.tsx:99:15)
    at async handleSubmit (page.tsx:40:7)
```

Backend logs show: `POST /api/auth/admin/login HTTP/1.1" 401`

---

## 🔍 Root Cause

**Issue:** Admin users exist in the database but **don't have passwords set**.

**Diagnostic Results:**
```
✅ Found 2 admin user(s):
   1. admin@webet.com (WeBet Admin)
      ❌ NO PASSWORD SET - login will fail!
   2. admin@example.com (Admin)
      ✅ Password hash present
```

**Why This Happens:**
- The admin users were created before we added the `password_hash` column
- The migration added the column but existing users have `password_hash = NULL`
- The backend code (using direct pg) checks for `password_hash` and rejects logins if it's NULL

**Backend Code Logic (in `/packages/backend/src/routes/auth.ts`):**
```typescript
// Verify password against password_hash (must be set for admin accounts)
if (!admin.password_hash) {
  // No password set on account
  return res.status(401).json({
    success: false,
    error: {
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'Invalid credentials',
    },
  });
}
```

---

## ✅ Solution

### Fix 1: Set Password for Existing Admin

```bash
cd /Users/rishitha/Desktop/WeBet/packages/backend

# Set password for admin@webet.com
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db" \
  pnpm run create-admin -- admin@webet.com "YourSecurePassword123!"

# Or for admin@example.com
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db" \
  pnpm run create-admin -- admin@example.com "AnotherPassword123!"
```

**Expected output:**
```
Admin created/updated: admin@webet.com
```

### Fix 2: Test Login

After setting the password, test it:

```bash
curl -v -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@webet.com","password":"YourSecurePassword123!"}' \
  -c /tmp/cookies.txt
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "admin": {
      "id": "...",
      "email": "admin@webet.com",
      "displayName": "WeBet Admin",
      "role": "ADMIN"
    }
  }
}
```

And you should see:
```
< Set-Cookie: jwt=eyJhbGc...
```

### Fix 3: Login in Browser

1. Open `http://localhost:3002/admin/login`
2. Enter:
   - Email: `admin@webet.com`
   - Password: `YourSecurePassword123!`
3. Click "Sign In"
4. Should redirect to `/admin/dashboard` ✅

---

## 🔍 Diagnostic Tool

Run this anytime to check admin users:

```bash
cd /Users/rishitha/Desktop/WeBet/packages/backend
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db" \
  node scripts/diagnose_admin.js
```

**Output shows:**
- All admin users in the database
- Which ones have passwords set
- Which ones need passwords

---

## 🎯 Quick Fix Commands

```bash
# Navigate to backend
cd /Users/rishitha/Desktop/WeBet/packages/backend

# Set password for admin@webet.com (the one you're trying to login with)
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db" \
  pnpm run create-admin -- admin@webet.com "SecurePass123!"

# Verify it worked
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db" \
  node scripts/diagnose_admin.js

# Test login
curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@webet.com","password":"SecurePass123!"}' \
  -c /tmp/cookies.txt
```

---

## 📝 Technical Details

### Frontend Flow (What's Failing)
1. User enters email/password in `/admin/login` page
2. `handleSubmit` calls `adminLogin(email, password)`
3. `adminLogin` POSTs to `http://localhost:3001/api/auth/admin/login`
4. Backend returns 401 (Unauthorized)
5. Frontend throws error: `"Login failed"`

### Backend Flow (Why 401)
1. Receives POST to `/api/auth/admin/login`
2. Queries database: `SELECT ... FROM users WHERE email = $1`
3. Finds user with `role = 'ADMIN'`
4. Checks `if (!admin.password_hash)` → **TRUE** (NULL)
5. Returns 401 with message "Invalid credentials"

### Why Direct SQL Matters
The migrated admin login route uses **direct Postgres (`pg`)** instead of Prisma:
```typescript
const { rows } = await sqlQuery(
  'SELECT id, email, display_name, avatar_url, role, is_suspended, password_hash FROM users WHERE email = $1',
  [email]
);
const admin = rows[0];

if (!admin.password_hash) {
  return res.status(401).json({ ... });
}
```

This is the PoC we built to move away from Prisma - it works great, but requires passwords to be set!

---

## ✅ After Fixing

Once you set the password:
- ✅ Admin login will work in browser
- ✅ JWT cookie will be set
- ✅ Redirect to `/admin/dashboard` will succeed
- ✅ All admin routes will be accessible

The error was simply: **admin user exists but has no password**. Setting a password via the `create-admin` script fixes it immediately!
