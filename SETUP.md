# 🚀 WeBet Social - Setup Guide

This guide will help you get WeBet Social up and running on your local machine.

## ✅ Prerequisites Checklist

Before you begin, make sure you have:

- [ ] **Node.js 18+** installed ([Download](https://nodejs.org/))
- [ ] **pnpm 8+** installed (`npm install -g pnpm`)
- [ ] **PostgreSQL 14+** installed OR Docker
- [ ] **Python 3.9+** installed (for AI agent)
- [ ] **Google Cloud account** (for OAuth and AI API)

## 📋 Step-by-Step Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd WeBet

# Install all dependencies
pnpm install
```

### Step 2: Set Up Google Cloud Services

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (development)
   - `https://your-domain.com/api/auth/google/callback` (production)
7. Copy **Client ID** and **Client Secret**

#### Google AI API Setup
1. In the same Google Cloud Console
2. Enable **Generative Language API**
3. Go to **Credentials** → **Create Credentials** → **API Key**
4. Copy the **API Key**

### Step 3: Configure Environment Variables

#### Root `.env` file
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db"

# JWT & Auth
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
GOOGLE_CLIENT_ID="your-google-client-id-from-step-2"
GOOGLE_CLIENT_SECRET="your-google-client-secret-from-step-2"

# Server
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# AI Agent
GOOGLE_AI_API_KEY="your-google-ai-api-key-from-step-2"
BACKEND_API_URL="http://localhost:3001"
WEBHOOK_SECRET="your-webhook-secret-key"

# Admin Default (for seeding)
ADMIN_EMAIL="admin@webet.com"
ADMIN_PASSWORD="SecurePassword123!"
ADMIN_NAME="Super Admin"
```

#### Frontend `.env.local`
```bash
cp packages/frontend/.env.example packages/frontend/.env.local
```

Edit `packages/frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-from-step-2
```

#### Database `.env`
```bash
cp packages/database/.env.example packages/database/.env
```

Edit `packages/database/.env`:
```env
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db"
```

#### AI Agent `.env`
```bash
cp packages/ai-agent/.env.example packages/ai-agent/.env
```

Edit `packages/ai-agent/.env`:
```env
GOOGLE_AI_API_KEY=your-google-ai-api-key-from-step-2
BACKEND_API_URL=http://localhost:3001
WEBHOOK_SECRET=your-webhook-secret-key
LOG_LEVEL=INFO
```

### Step 4: Start PostgreSQL

**Option A: Using Docker (Recommended)**
```bash
docker-compose up -d postgres
```

**Option B: Using local PostgreSQL**
```bash
# Create database
createdb webet_db

# Or using psql
psql -U postgres
CREATE DATABASE webet_db;
\q
```

Verify PostgreSQL is running:
```bash
# If using Docker
docker ps | grep postgres

# If using local PostgreSQL
pg_isready
```

### Step 5: Set Up Database Schema

```bash
cd packages/database

# Generate Prisma client
pnpm prisma generate

# Run migrations to create tables
pnpm prisma migrate dev --name init

# Seed database with admin user and settings
pnpm db:seed

# (Optional) Open Prisma Studio to view data
pnpm prisma studio
```

### Step 6: Build All Packages

```bash
cd ../..  # Back to root
pnpm build
```

You should see:
```
✓ Tasks: 4 successful, 4 total
  - @webet/shared
  - @webet/database
  - @webet/backend
  - @webet/frontend
```

### Step 7: Set Up Python AI Agent

```bash
cd packages/ai-agent

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 8: Start Development Servers

**Option A: Start all services at once**
```bash
# From root directory
pnpm dev
```

**Option B: Start services individually**

Terminal 1 - Frontend:
```bash
pnpm --filter @webet/frontend dev
```

Terminal 2 - Backend:
```bash
pnpm --filter @webet/backend dev
```

Terminal 3 - AI Agent:
```bash
cd packages/ai-agent
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m webet_ai.main
```

### Step 9: Verify Installation

Open your browser and check:

1. **Frontend**: http://localhost:3000
   - Should see the WeBet homepage
   
2. **Backend API**: http://localhost:3001/health
   - Should see: `{"status":"ok"}`

3. **Check logs** for any errors in the terminals

## 🎉 Success!

Your WeBet Social platform is now running!

### Default Admin Login
- **Email**: admin@webet.com (or what you set in .env)
- **Password**: SecurePassword123! (or what you set in .env)

### Test User Login
- Use the "Sign in with Google" button
- Any Google account will work in development

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps  # if using Docker
pg_isready  # if using local PostgreSQL

# Reset database
cd packages/database
pnpm prisma migrate reset
pnpm db:seed
```

### Build Errors
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Port Already in Use
```bash
# Find and kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Find and kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Issues
```bash
cd packages/database
pnpm prisma generate
```

### Google OAuth Not Working
- Verify redirect URIs in Google Cloud Console match exactly
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in .env
- Make sure frontend has `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### AI Agent Not Starting
```bash
# Activate virtual environment
cd packages/ai-agent
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt

# Check API key
echo $GOOGLE_AI_API_KEY
```

## 📚 Next Steps

1. **Read the API Documentation** in README.md
2. **Explore Prisma Studio**: `cd packages/database && pnpm prisma studio`
3. **Create some test games** using admin panel
4. **Test betting flow** with a Google account
5. **Monitor AI suggestions** in the logs

## 🔧 Useful Commands

```bash
# View database in browser
cd packages/database && pnpm prisma studio

# Reset database (WARNING: deletes all data)
cd packages/database && pnpm prisma migrate reset

# View logs
docker-compose logs -f  # if using Docker

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## 📞 Need Help?

- Check the main README.md for more details
- Open an issue on GitHub
- Review the error logs in your terminal

---

Happy betting! 🎲
