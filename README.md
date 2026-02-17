# WeBet Social - Play-Money Betting Platform# WeBet Social - Play-Money Social Betting Platform



A scalable, production-ready social betting platform with AI-powered suggestions, real-time updates, and comprehensive admin controls.## Architecture Overview



## 🏗️ ArchitectureWeBet Social is a modern, scalable play-money social betting platform built with:



**Monorepo** built with:- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL

- **Backend**: Express.js, Prisma ORM, Socket.io, Passport.js- **AI Agent**: Python with Google ADK

- **AI Agent**: Python with Google Generative AI- **Real-time**: WebSocket for live updates

- **Database**: PostgreSQL with Prisma- **Authentication**: Google OAuth (users) + JWT (admins)

- **Package Manager**: pnpm with workspaces

- **Build Tool**: Turborepo## Monorepo Structure



## 📦 Package Structure```

WeBet/

```├── packages/

packages/│   ├── frontend/          # Next.js 14 application

├── frontend/          # Next.js 14 frontend application│   ├── backend/           # Node.js Express API server

├── backend/           # Express.js REST API & WebSocket server│   ├── ai-agent/          # Python AI betting suggestions

├── ai-agent/          # Python AI service for betting suggestions│   ├── shared/            # Shared types and utilities

├── database/          # Prisma schema & database client│   └── database/          # Prisma schema and migrations

└── shared/            # Shared TypeScript types & utilities├── docker-compose.yml     # Development environment

```├── turbo.json            # Turborepo configuration

└── package.json          # Root package.json for monorepo

## ✨ Features```



### User Features## Quick Start

- 🔐 **Google OAuth Authentication** - Secure login

- 💰 **Play Money Betting** - 10,000 virtual starting balance1. Clone the repository

- ⚡ **Real-time Updates** - WebSocket for live odds & scores2. Run `npm install` to install dependencies

- 🤖 **AI Suggestions** - ML-powered betting recommendations3. Set up environment variables (see each package's README)

- 📊 **Transaction History** - Complete betting history4. Run `docker-compose up -d` to start PostgreSQL

- 🎯 **Multiple Sports** - Football, Basketball, Baseball, Tennis, Cricket, Soccer5. Run `npm run dev` to start all services



### Admin Features## Development

- 📧 **Email/Password Auth** - Secure admin login with JWT

- 👥 **User Management** - View, suspend, and manage usersEach package has its own README with specific setup instructions.

- 🎮 **Game Management** - Create, update, and manage games

- 📈 **Dashboard Analytics** - Real-time statistics## Production Deployment

- 🔧 **System Settings** - Configure platform parameters

- 📝 **Audit Logs** - Track all admin actions- Frontend: Vercel/Netlify

- Backend: AWS ECS/Railway/Render

## 🚀 Quick Start- Database: AWS RDS/Supabase

- AI Agent: AWS Lambda/Google Cloud Functions
### Prerequisites
- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+
- Python 3.9+
- Docker (optional)

### Installation

```bash
# 1. Clone and install
git clone <repository-url>
cd WeBet
pnpm install

# 2. Set up environment variables
cp .env.example .env
cp packages/frontend/.env.example packages/frontend/.env.local
cp packages/database/.env.example packages/database/.env
cp packages/ai-agent/.env.example packages/ai-agent/.env

# 3. Start PostgreSQL
docker-compose up -d postgres

# 4. Set up database
cd packages/database
pnpm prisma migrate dev --name init

# 5. Build all packages
pnpm build

# 6. Start dev servers
pnpm dev
```

**Servers:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:3001

## 🛠️ Development

```bash
pnpm install      # Install dependencies
pnpm build        # Build all packages ✅
pnpm dev          # Start dev servers
pnpm test         # Run tests
pnpm lint         # Lint code
```

## 📚 API Endpoints

### Authentication
```
POST /api/auth/google              # Google OAuth
GET  /api/auth/google/callback     # OAuth callback
POST /api/auth/admin/login         # Admin login
```

### Users
```
GET  /api/users/profile            # Get profile
PUT  /api/users/profile            # Update profile
GET  /api/users/bets               # User's bets
GET  /api/users/transactions       # Transactions
```

### Games
```
GET  /api/games                    # List games
GET  /api/games/:id                # Game details
GET  /api/games/live               # Live games
```

### Bets
```
POST /api/bets                     # Place bet
GET  /api/bets/:id                 # Bet details
```

### Admin
```
GET  /api/admin/dashboard          # Stats
GET  /api/admin/users              # List users
POST /api/admin/games              # Create game
PUT  /api/admin/games/:id          # Update game
POST /api/admin/games/:id/settle   # Settle results
```

## 🔌 WebSocket Events

```javascript
// Server → Client
{ type: 'BET_PLACED', payload: { bet, game } }
{ type: 'BET_WON', payload: { bet, winAmount } }
{ type: 'ODDS_UPDATED', payload: { gameId, newOdds } }
{ type: 'SCORE_UPDATED', payload: { gameId, homeScore, awayScore } }
{ type: 'AI_SUGGESTION', payload: { suggestion } }
```

## 🗄️ Database Models

- **User** - Platform users (Google OAuth)
- **Admin** - Admin users (email/password)
- **Game** - Betting games/matches
- **Bet** - User bets on games
- **Transaction** - Financial transactions
- **AISuggestion** - AI betting suggestions
- **UserSession** - Authentication sessions
- **AdminSession** - JWT sessions
- **SystemSetting** - Configuration
- **AuditLog** - Admin actions

## 🤖 AI Agent

Python service that:
- Analyzes games using Google Generative AI
- Generates betting suggestions
- Runs every 15 minutes
- Sends webhooks to backend

## 🐳 Docker

```bash
docker-compose up -d              # Development
docker-compose -f docker-compose.prod.yml up -d  # Production
```

## 🔒 Security

- ✅ Google OAuth 2.0
- ✅ JWT with secure sessions
- ✅ Bcrypt password hashing
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ SQL injection prevention (Prisma)

## 📝 Build Status

✅ **All packages successfully compiled:**
- `@webet/shared` - Types & utilities
- `@webet/database` - Prisma client
- `@webet/backend` - Express server
- `@webet/frontend` - Next.js app

## 📁 Project Files

```
WeBet/
├── packages/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router
│   │   │   ├── components/       # React components
│   │   │   └── lib/              # Utilities
│   │   ├── package.json
│   │   └── next.config.js
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/           # API routes
│   │   │   ├── config/           # Configuration
│   │   │   ├── middleware/       # Express middleware
│   │   │   └── index.ts          # Entry point
│   │   └── package.json
│   ├── database/
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Database schema
│   │   └── src/index.ts          # Prisma client
│   ├── ai-agent/
│   │   ├── webet_ai/
│   │   │   ├── services/         # AI services
│   │   │   ├── models/           # Data models
│   │   │   └── main.py           # Entry point
│   │   └── requirements.txt
│   └── shared/
│       └── src/
│           ├── types.ts          # TypeScript types
│           └── utils.ts          # Shared utilities
├── .env.example
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 🎯 Next Steps

1. **Configure environment variables** in `.env` files
2. **Set up PostgreSQL** and run migrations
3. **Get Google OAuth credentials** from Google Cloud Console
4. **Get Google AI API key** for AI agent
5. **Start development** with `pnpm dev`

## 📧 Support

Open an issue in the repository for support.

---

Built with ❤️ using Next.js, Express, Prisma, and Google AI
