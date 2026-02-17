# 🔧 PostgreSQL Setup Instructions

You have PostgreSQL 15 installed locally and running. Here's how to set it up:

## Option 1: Use Local PostgreSQL (Easiest)

### Step 1: Find Your PostgreSQL Credentials

Check what username PostgreSQL was installed with. Common options:
- `postgres` (default)
- Your Mac username
- `root`

### Step 2: Create Database and User

Open a new terminal and run:

```bash
# Try connecting with postgres user
/Library/PostgreSQL/15/bin/psql -U postgres

# If that works, run these commands inside psql:
CREATE USER webet_user WITH PASSWORD 'webet_pass';
CREATE DATABASE webet_db OWNER webet_user;
GRANT ALL PRIVILEGES ON DATABASE webet_db TO webet_user;
\q
```

If you get a password prompt and don't know the password, try:
```bash
# Try with your Mac username
/Library/PostgreSQL/15/bin/psql -U $(whoami) -d postgres
```

### Step 3: Update .env File

Once you know your credentials, update:
`/Users/rishitha/Desktop/WeBet/packages/database/.env`

```env
# If you created webet_user:
DATABASE_URL="postgresql://webet_user:webet_pass@localhost:5432/webet_db"

# OR if using postgres user:
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/webet_db"

# OR if using your Mac user:
DATABASE_URL="postgresql://$(whoami):@localhost:5432/webet_db"
```

### Step 4: Run Migrations

```bash
cd /Users/rishitha/Desktop/WeBet/packages/database
pnpm prisma migrate dev --name init
pnpm db:seed
```

## Option 2: Use Docker PostgreSQL (Alternative)

If you want to use Docker instead:

### Step 1: Stop Local PostgreSQL

```bash
# Stop PostgreSQL service
sudo /Library/PostgreSQL/15/bin/pg_ctl stop -D /Library/PostgreSQL/15/data
```

### Step 2: Start Docker PostgreSQL

```bash
cd /Users/rishitha/Desktop/WeBet
docker compose up -d postgres redis
```

### Step 3: Run Migrations

```bash
cd packages/database
pnpm prisma migrate dev --name init
pnpm db:seed
```

## Quick Test

Test your database connection:

```bash
cd /Users/rishitha/Desktop/WeBet/packages/database

# This will show if connection works
pnpm prisma db pull
```

## Need Help?

Try these diagnostic commands:

```bash
# Check if PostgreSQL is running
ps aux | grep postgres | grep -v grep

# Check what's on port 5432
lsof -i :5432

# List databases (replace USERNAME with your user)
/Library/PostgreSQL/15/bin/psql -U USERNAME -l
```

---

**Recommended:** Use Option 1 (local PostgreSQL) since it's already running!
