# 🐳 Docker Setup Guide for WeBet Social

This guide will help you set up and run the entire WeBet platform using Docker.

## 📋 Prerequisites

1. **Install Docker Desktop**
   - **macOS**: Download from [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
   - **Windows**: Download from [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
   - **Linux**: Follow [Docker Engine installation](https://docs.docker.com/engine/install/)

2. **Verify Installation**
```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start with Docker

### Option 1: Database Only (Recommended for Development)

If you want to develop locally but use Docker for PostgreSQL and Redis:

```bash
# Start only database services
docker-compose up -d postgres redis

# Verify services are running
docker ps

# You should see:
# - webet-postgres (port 5432)
# - webet-redis (port 6379)
```

Then run your app locally:
```bash
# Set up database
cd packages/database
pnpm prisma migrate dev --name init
pnpm db:seed

# Start development servers
cd ../..
pnpm dev
```

### Option 2: Full Docker Setup (All Services)

Run everything in Docker containers:

```bash
# 1. Create .env file for Docker
cp .env.example .env.docker

# 2. Build and start all services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f
```

## 🔧 Configuration

### Environment Variables for Docker

Create `.env.docker` with your actual values:

```env
# Database
POSTGRES_USER=webet
POSTGRES_PASSWORD=webet123
POSTGRES_DB=webet_dev

# Backend
DATABASE_URL=postgresql://webet:webet123@postgres:5432/webet_dev
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id

# AI Agent
GOOGLE_AI_API_KEY=your-google-ai-api-key
WEBHOOK_SECRET=your-webhook-secret
```

## 📦 Docker Services

The `docker-compose.yml` defines these services:

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL 15 database |
| `redis` | 6379 | Redis cache |
| `backend` | 3001 | Express.js API server |
| `frontend` | 3000 | Next.js application |
| `ai-agent` | - | Python AI service |

## 🛠️ Common Docker Commands

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific service(s)
docker-compose up -d postgres redis

# Start with live logs
docker-compose up
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Stop specific service
docker-compose stop postgres
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 frontend
```

### Restarting Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuilding Containers

```bash
# Rebuild all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

## 🗄️ Database Setup with Docker

### Initial Setup

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Wait for database to be ready (5-10 seconds)
sleep 10

# 3. Run migrations from your local machine
cd packages/database
pnpm prisma migrate dev --name init

# 4. Seed the database
pnpm db:seed
```

### Access PostgreSQL

```bash
# Option 1: Using psql from host (if installed)
psql -h localhost -U webet -d webet_dev

# Option 2: Using Docker exec
docker exec -it webet-postgres psql -U webet -d webet_dev

# Option 3: Using Prisma Studio
cd packages/database
pnpm prisma studio
```

### Database Operations

```bash
# Create new migration
cd packages/database
pnpm prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# View database in browser
pnpm prisma studio
```

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :3000  # Frontend
lsof -i :3001  # Backend

# Stop the conflicting service or change port in docker-compose.yml
```

### Container Won't Start

```bash
# View detailed logs
docker-compose logs backend

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart backend
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Test connection
docker exec -it webet-postgres pg_isready -U webet
```

### Clean Start (Reset Everything)

```bash
# Stop and remove everything
docker-compose down -v

# Remove dangling images
docker system prune -f

# Start fresh
docker-compose up -d
```

## 📊 Monitoring Services

### Check Service Health

```bash
# View running containers
docker-compose ps

# View resource usage
docker stats

# View networks
docker network ls

# View volumes
docker volume ls
```

### Access Container Shell

```bash
# Backend container
docker exec -it webet-backend /bin/sh

# Frontend container
docker exec -it webet-frontend /bin/sh

# PostgreSQL container
docker exec -it webet-postgres bash
```

## 🔐 Security Best Practices

1. **Never commit real credentials** to git
2. **Use .env files** for sensitive data
3. **Change default passwords** in production
4. **Use secrets management** for production deployments
5. **Limit exposed ports** in production

## 🎯 Recommended Setup for Development

**Best practice: Use Docker only for databases, run app locally**

```bash
# Terminal 1: Start databases
docker-compose up -d postgres redis

# Terminal 2: Backend
pnpm --filter @webet/backend dev

# Terminal 3: Frontend
pnpm --filter @webet/frontend dev

# Terminal 4: AI Agent (optional)
cd packages/ai-agent
source venv/bin/activate
python -m webet_ai.main
```

**Why?**
- ✅ Faster hot reload
- ✅ Better debugging
- ✅ Direct access to logs
- ✅ Lower resource usage
- ✅ Easier to use breakpoints

## 📈 Production Deployment

For production, you'll need a different setup:

```bash
# Use production docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

Key differences in production:
- Environment variables from secrets
- Multi-stage builds for smaller images
- Health checks enabled
- Resource limits set
- Production-grade database
- SSL/TLS enabled
- Load balancing configured

## 🎓 Docker Compose File Explained

```yaml
services:
  postgres:              # Database service
    image: postgres:15   # Official PostgreSQL 15 image
    environment:         # Environment variables
    ports:              # Port mapping (host:container)
    volumes:            # Persistent data storage
    networks:           # Custom network for inter-service communication

  backend:
    build:              # Build from Dockerfile
      context: .        # Build context (root directory)
      dockerfile: ...   # Path to Dockerfile
    depends_on:         # Start after these services
    volumes:            # Mount code for hot reload
```

## ✅ Docker Setup Checklist

- [ ] Docker Desktop installed
- [ ] `docker-compose.yml` configured
- [ ] Environment variables set
- [ ] Start PostgreSQL and Redis: `docker-compose up -d postgres redis`
- [ ] Run database migrations: `cd packages/database && pnpm prisma migrate dev`
- [ ] Seed database: `pnpm db:seed`
- [ ] Verify services: `docker-compose ps`
- [ ] Check logs: `docker-compose logs`
- [ ] Start local development: `pnpm dev`

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify services are running: `docker-compose ps`
3. Test database connection: `docker exec -it webet-postgres pg_isready`
4. Review Docker Desktop dashboard
5. Consult the troubleshooting section above

---

**You're now ready to use Docker with WeBet Social! 🎉**

For daily development, just run:
```bash
docker-compose up -d postgres redis
pnpm dev
```
