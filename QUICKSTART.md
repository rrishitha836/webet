# ✅ WeBet Social - Quick Start Checklist

Use this checklist to get your WeBet platform running quickly!

## 📋 Pre-Development Setup (Do Once)

### 1. Google Cloud Setup
- [ ] Create Google Cloud project at https://console.cloud.google.com/
- [ ] Enable **Google+ API** 
- [ ] Create **OAuth 2.0 Client ID**
  - Application type: Web application
  - Authorized redirect: `http://localhost:3001/api/auth/google/callback`
  - Copy Client ID and Client Secret
- [ ] Enable **Generative Language API**
- [ ] Create **API Key** for AI
  - Copy API Key

### 2. Local Environment Setup
- [ ] Install Node.js 18+ (https://nodejs.org/)
- [ ] Install pnpm: `npm install -g pnpm`
- [ ] Install Docker Desktop (optional but recommended)
- [ ] Install PostgreSQL 14+ OR use Docker

### 3. Project Setup
```bash
# Clone and install
cd WeBet
pnpm install

# Copy environment files
cp .env.example .env
cp packages/frontend/.env.example packages/frontend/.env.local
cp packages/database/.env.example packages/database/.env
cp packages/ai-agent/.env.example packages/ai-agent/.env
```

### 4. Configure Environment Variables

Edit `.env`:
```env
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db"
JWT_SECRET="generate-a-random-32-character-string-here"
GOOGLE_CLIENT_ID="paste-your-google-client-id"
GOOGLE_CLIENT_SECRET="paste-your-google-client-secret"
GOOGLE_AI_API_KEY="paste-your-google-ai-api-key"
WEBHOOK_SECRET="generate-another-random-string"
```

Edit `packages/frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=paste-your-google-client-id
```

### 5. Database Setup
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Set up schema
cd packages/database
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm db:seed

# Back to root
cd ../..
```

### 6. Build Project
```bash
pnpm build
```

You should see:
```
✓ Tasks: 4 successful, 4 total
```

## 🚀 Daily Development Workflow

### Quick Start (All Services)
```bash
# From root directory
pnpm dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- AI Agent: Python service

### Individual Services

**Frontend only:**
```bash
pnpm --filter @webet/frontend dev
```

**Backend only:**
```bash
pnpm --filter @webet/backend dev
```

**AI Agent only:**
```bash
cd packages/ai-agent
source venv/bin/activate  # Windows: venv\Scripts\activate
python -m webet_ai.main
```

## 🧪 Testing & Verification

### Test Backend
```bash
# Health check
curl http://localhost:3001/health

# Should return: {"status":"ok"}
```

### Test Frontend
```bash
# Open browser
open http://localhost:3000
```

### Test Database
```bash
cd packages/database
pnpm prisma studio
```

### Test Admin Login
- Email: `admin@webet.com` (or your ADMIN_EMAIL)
- Password: `admin123` (or your ADMIN_PASSWORD)

## 🛠️ Common Commands

### Database
```bash
# View database
cd packages/database && pnpm prisma studio

# Reset database (WARNING: Deletes all data)
cd packages/database && pnpm prisma migrate reset

# Create migration
cd packages/database && pnpm prisma migrate dev --name your_migration_name
```

### Building
```bash
# Build all
pnpm build

# Build specific package
pnpm --filter @webet/frontend build

# Clean build
pnpm clean && pnpm build
```

### Development
```bash
# Install new package to frontend
pnpm --filter @webet/frontend add package-name

# Install new package to backend
pnpm --filter @webet/backend add package-name

# Install dev dependency
pnpm --filter @webet/backend add -D package-name
```

## 🐛 Quick Troubleshooting

### Build fails
```bash
pnpm clean
pnpm install
pnpm build
```

### Database connection error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Port already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Prisma client not found
```bash
cd packages/database
pnpm prisma generate
```

### Google OAuth not working
- Check redirect URI matches EXACTLY: `http://localhost:3001/api/auth/google/callback`
- Verify Client ID in both `.env` and `packages/frontend/.env.local`
- Check Google Cloud Console → Credentials → OAuth 2.0 Client IDs

## 📝 Development Tips

1. **Use Prisma Studio** to view/edit database data
2. **Check terminal logs** for errors
3. **Use browser DevTools** Network tab for API calls
4. **Hot reload** is enabled for frontend and backend
5. **Database changes** require new migrations

## 🎯 First Feature to Implement

Start with the user flow:
1. ✅ Google OAuth login (already implemented)
2. 🔲 Dashboard showing available games
3. 🔲 Place bet UI
4. 🔲 View bet history
5. 🔲 Real-time updates

## 📚 Documentation Reference

- **SETUP.md** - Detailed setup guide
- **README.md** - Project overview and API docs
- **ARCHITECTURE.md** - Technical architecture
- **PROJECT_SUMMARY.md** - Complete project status

## 🎉 You're Ready!

Once you complete the checklist above, you'll have:
- ✅ Working development environment
- ✅ Database with admin user
- ✅ Frontend, backend, and AI services running
- ✅ All packages built successfully

**Happy coding! 🚀**
