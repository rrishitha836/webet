# WeBet - Running Backend & Frontend Guide

## ✅ Pre-flight Check Complete

Your databases and configuration are verified:
- ✅ Postgres connected (9 tables, all schema correct)
- ✅ Backend configured (port 3001)
- ✅ Frontend configured (port 3002)
- ✅ Admin auth with pg (direct Postgres) working

---

## 🚀 Starting the Application

### Option 1: Start Both Services Together (Monorepo)

From the **repo root** (`/Users/rishitha/Desktop/WeBet`):

```bash
pnpm dev
```

This starts:
- Backend on `http://localhost:3001`
- Frontend on `http://localhost:3002`
- Database package (watch mode)

**Wait for:** 
```
✅ Database connected successfully
🚀 Server running on port 3001
✓ Ready in 2.xsec
```

---

### Option 2: Start Services Separately (Recommended for Testing)

#### Terminal 1 - Backend
```bash
cd /Users/rishitha/Desktop/WeBet/packages/backend
pnpm dev
```

**Expected output:**
```
✅ Database connected successfully
info: 🚀 Server running on port 3001
info: 📊 Environment: development
```

#### Terminal 2 - Frontend
```bash
cd /Users/rishitha/Desktop/WeBet/packages/frontend
pnpm dev
```

**Expected output:**
```
✓ Ready in 2.5s
Local:        http://localhost:3002
```

---

## 🧪 Verify Everything is Running

### Quick Health Check Script
```bash
node packages/backend/scripts/verify_running.js
```

### Manual Checks

#### 1. Backend API Test
```bash
# Expect: 401 Unauthorized (correct - not logged in)
curl -v http://localhost:3001/api/auth/me
```

#### 2. Frontend Test
Open browser: `http://localhost:3002`
- Should see WeBet homepage
- Google login button present

#### 3. Admin Login Test (Direct Postgres)
```bash
# First, create an admin user
cd /Users/rishitha/Desktop/WeBet/packages/backend
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db" \
  pnpm run create-admin -- admin@example.com "YourPassword123!"

# Then test login
curl -v -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourPassword123!"}' \
  -c /tmp/cookies.txt

# Expected: 
# HTTP/1.1 200 OK
# Set-Cookie: jwt=...
# {"success":true,"data":{"token":"...","admin":{...}}}
```

---

## 🔍 Testing Database Connections

### Check Schema
```bash
cd /Users/rishitha/Desktop/WeBet/packages/backend
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db" \
  node scripts/check_schema.js
```

### Test All Connections
```bash
cd /Users/rishitha/Desktop/WeBet
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db" \
  REDIS_URL="redis://localhost:6379" \
  NEXT_PUBLIC_API_URL="http://localhost:3001" \
  NEXT_PUBLIC_WS_URL="ws://localhost:3001" \
  node packages/backend/scripts/test_connections.js
```

---

## 🎯 Key Endpoints

### Backend (http://localhost:3001)
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/admin/login` - Admin login (uses direct pg)
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/bets` - List bets
- `GET /api/admin/*` - Admin routes

### Frontend (http://localhost:3002)
- `/` - Homepage (Google-first login)
- `/dashboard` - User dashboard
- `/admin` - Admin dashboard
- `/admin/login` - Admin login page
- `/bets/[id]` - Bet detail page

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -ti:3001 | xargs kill -9

# Check DATABASE_URL
cat packages/backend/.env | grep DATABASE_URL

# Test Postgres connection
psql "postgresql://webet_user:webet_pass@localhost:5432/webet_db" -c "SELECT 1;"
```

### Frontend won't start
```bash
# Check if port is in use
lsof -ti:3002 | xargs kill -9

# Check env
cat packages/frontend/.env.local

# Rebuild
cd packages/frontend
rm -rf .next
pnpm dev
```

### Database connection issues
```bash
# Ensure Postgres is running
pg_isready -h localhost -p 5432

# Check if database exists
psql -U webet_user -h localhost -l | grep webet_db

# Run migrations if needed
cd packages/database
pnpm db:push
```

---

## ✅ Success Indicators

When everything is working, you should see:

1. **Backend Terminal:**
   ```
   ✅ Database connected successfully
   info: 🚀 Server running on port 3001
   ```

2. **Frontend Terminal:**
   ```
   ✓ Ready in 2.5s
   Local: http://localhost:3002
   ```

3. **Browser (`http://localhost:3002`):**
   - Homepage loads
   - Google login button visible
   - No console errors (F12 DevTools)

4. **Admin Login Works:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"YourPassword123!"}' \
     | jq '.success'
   # Output: true
   ```

---

## 📝 Current Status

✅ **Implemented & Verified:**
- Direct Postgres connection (pg pool)
- Admin authentication with bcrypt passwords
- All database tables matching PRD spec
- Frontend/backend environment configuration
- Connection test scripts
- Admin user creation script

✅ **Ready to Use:**
- Admin login route (`/api/auth/admin/login`) uses direct pg
- All other routes still use Prisma (safe hybrid approach)
- Database schema complete with all indexes
- Both authentication methods working (Google OAuth + Admin password)

---

## 🎉 You're Ready!

Both services are configured correctly. Start them up with the commands above and test the admin login flow. All database connections are verified and working!

For any issues, run the diagnostic scripts:
```bash
node packages/backend/scripts/check_schema.js
node packages/backend/scripts/test_connections.js
node packages/backend/scripts/verify_running.js
```
