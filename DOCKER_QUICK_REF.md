# 🐳 Docker Quick Reference

## 🚀 Quick Start (Recommended)

```bash
# 1. Start databases only
docker-compose up -d postgres redis

# 2. Set up database
cd packages/database
pnpm prisma migrate dev --name init
pnpm db:seed

# 3. Start development
cd ../..
pnpm dev
```

## 📝 Essential Commands

### Start Services
```bash
# Databases only (recommended)
docker-compose up -d postgres redis

# All services
docker-compose up -d

# With logs
docker-compose up
```

### Stop Services
```bash
# Stop all
docker-compose down

# Stop and delete data (⚠️ WARNING)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
```

### Check Status
```bash
# View running containers
docker-compose ps

# View resource usage
docker stats
```

## 🗄️ Database Commands

```bash
# Access PostgreSQL
docker exec -it webet-postgres psql -U webet_user -d webet_db

# Run migrations
cd packages/database && pnpm prisma migrate dev

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm prisma studio
```

## 🔧 Troubleshooting

### Port in use?
```bash
# Find and kill process
lsof -i :5432 | grep LISTEN
kill -9 <PID>
```

### Service won't start?
```bash
# Check logs
docker-compose logs postgres

# Restart service
docker-compose restart postgres
```

### Clean restart?
```bash
docker-compose down -v
docker system prune -f
docker-compose up -d postgres redis
```

## 📊 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

## ✅ Daily Workflow

```bash
# Morning: Start databases
docker-compose up -d postgres redis

# Start development
pnpm dev

# Evening: Stop services (optional)
docker-compose down
```

## 🆘 Need Help?

Run the interactive setup script:
```bash
./docker-setup.sh
```

Or check the full guide:
- **DOCKER_SETUP.md** - Complete Docker documentation
- **QUICKSTART.md** - General quickstart guide
- **README.md** - Project overview
