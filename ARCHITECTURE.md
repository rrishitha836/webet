# WeBet Social - Complete Architecture Documentation

## 🏗️ Architecture Overview

WeBet Social is a modern, scalable play-money social betting platform built with a microservices architecture:

### Technology Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL + Redis
- **AI**: Python + Google Generative AI
- **Real-time**: Socket.io
- **Authentication**: Google OAuth + JWT
- **Deployment**: Docker + Docker Compose

## 📁 Project Structure

```
WeBet/
├── packages/
│   ├── frontend/          # Next.js 14 app
│   ├── backend/           # Express API server
│   ├── ai-agent/          # Python AI service
│   ├── shared/            # Shared types & utilities
│   └── database/          # Prisma schema & client
├── docker-compose.yml     # Development environment
├── turbo.json            # Monorepo configuration
└── package.json          # Root workspace config
```

## 🔐 Authentication Architecture

### User Authentication (Google OAuth)
- OAuth 2.0 flow with Google
- JWT tokens for API authentication
- Automatic account creation on first login
- Session management with database storage

### Admin Authentication (Email/Password)
- Email/password login with bcrypt hashing
- JWT tokens with role-based claims
- Session tracking and token revocation
- Super admin and regular admin roles

## 🗄️ Database Schema

### Core Entities
- **Users**: Google OAuth users with balances and stats
- **Admins**: Email/password admin accounts
- **Games**: Sports events with odds and metadata
- **Bets**: User betting records with status tracking
- **Transactions**: Financial transaction history
- **AI Suggestions**: ML-generated betting recommendations

### Key Features
- ACID transactions for bet placement
- Audit logging for admin actions
- Optimized indexes for performance
- Flexible JSON fields for extensibility

## 🔌 API Architecture

### REST Endpoints

#### Public Endpoints
```
GET  /api/games           # List games
GET  /api/games/:id       # Game details
GET  /api/games/live      # Live games
```

#### User Endpoints (JWT Required)
```
GET  /api/users/profile   # User profile
PUT  /api/users/profile   # Update profile
GET  /api/users/bets      # Betting history
GET  /api/users/stats     # User statistics
POST /api/bets            # Place bet
```

#### Admin Endpoints (Admin JWT Required)
```
GET  /api/admin/dashboard # Admin dashboard
GET  /api/admin/users     # User management
POST /api/admin/games     # Create games
PUT  /api/admin/games/:id # Update games
```

#### Webhooks
```
POST /api/webhooks/ai-suggestions  # AI suggestions
POST /api/webhooks/game-results    # Game results
POST /api/webhooks/odds-update     # Odds updates
```

### WebSocket Events
- `BET_PLACED`: Real-time bet notifications
- `BET_SETTLED`: Bet result notifications
- `GAME_UPDATE`: Live game score updates
- `ODDS_UPDATE`: Real-time odds changes
- `AI_SUGGESTION`: New AI recommendations
- `USER_BALANCE_UPDATE`: Balance changes

## 🤖 AI Agent Architecture

### Core Components
- **Data Service**: Fetches game data and statistics
- **AI Service**: Google Generative AI integration
- **Webhook Service**: Sends suggestions to backend
- **Scheduler**: Automated analysis runs

### AI Analysis Process
1. Fetch upcoming games from backend
2. Gather team statistics and historical data
3. Generate betting suggestions using Google AI
4. Filter by confidence threshold
5. Send high-quality suggestions via webhook

### Scheduling
- Periodic analysis every 30 minutes
- Daily maintenance tasks at 2 AM
- On-demand analysis via API trigger

## 🚀 Deployment Strategy

### Development Environment
```bash
# Clone repository
git clone <repository-url>
cd WeBet

# Install dependencies
npm install

# Start services
docker-compose up -d
npm run dev
```

### Production Deployment

#### Frontend (Vercel)
- Automatic deployments from main branch
- Environment variables via Vercel dashboard
- CDN distribution for global performance

#### Backend (Railway/AWS ECS)
- Docker container deployment
- Auto-scaling based on CPU/memory
- Load balancer for high availability

#### Database (AWS RDS/Supabase)
- PostgreSQL with connection pooling
- Automated backups and point-in-time recovery
- Read replicas for analytics queries

#### AI Agent (AWS Lambda/Google Cloud Functions)
- Serverless deployment for cost efficiency
- Scheduled triggers via CloudWatch Events
- Auto-scaling based on workload

## 📊 Monitoring & Observability

### Logging
- Structured JSON logging with Winston
- Log aggregation with ELK stack
- Error tracking with Sentry

### Metrics
- API performance monitoring
- Database query analysis
- User behavior analytics

### Health Checks
- Backend health endpoint
- Database connection monitoring
- AI agent health reporting

## 🔒 Security Considerations

### Authentication Security
- JWT token expiration (24h admin, 7d user)
- Secure HTTP-only cookies for sessions
- Token refresh mechanism

### API Security
- Rate limiting per IP and user
- Request validation with Zod schemas
- SQL injection prevention with Prisma

### Data Protection
- Encrypted passwords with bcrypt
- HTTPS in production
- CORS configuration for frontend

## 📈 Scalability Features

### Database Scaling
- Connection pooling with Prisma
- Database indexes for common queries
- Read replicas for analytics

### API Scaling
- Stateless design for horizontal scaling
- Redis caching for frequently accessed data
- WebSocket scaling with Redis adapter

### Performance Optimization
- Next.js static generation for public pages
- API response caching
- Image optimization with Next.js

## 🧪 Testing Strategy

### Backend Testing
- Unit tests with Jest
- Integration tests for API endpoints
- Database transaction testing

### Frontend Testing
- Component testing with React Testing Library
- End-to-end tests with Playwright
- Visual regression testing

### AI Agent Testing
- Mock external API responses
- Confidence threshold validation
- Webhook delivery testing

## 📋 Getting Started

1. **Clone the repository**
2. **Set up environment variables** (see .env.example files)
3. **Start development environment**: `docker-compose up -d`
4. **Install dependencies**: `npm install`
5. **Run database migrations**: `npm run db:migrate`
6. **Start development servers**: `npm run dev`
7. **Access the application**: http://localhost:3000

For detailed setup instructions, see the README files in each package directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.