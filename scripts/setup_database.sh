#!/bin/bash
# Database setup script for WeBet

echo "🗄️ Setting up WeBet database..."

# Try different PostgreSQL installation paths
PG_PATHS=(
  "/Library/PostgreSQL/15/bin/psql"
  "/usr/local/bin/psql"
  "/opt/homebrew/bin/psql"
  "/opt/homebrew/opt/postgresql@15/bin/psql"
)

PSQL_CMD=""
for path in "${PG_PATHS[@]}"; do
  if [ -f "$path" ]; then
    PSQL_CMD="$path"
    echo "✅ Found PostgreSQL at: $path"
    break
  fi
done

if [ -z "$PSQL_CMD" ]; then
  echo "❌ PostgreSQL client not found. Please install PostgreSQL."
  exit 1
fi

echo "📋 Creating database and user..."
echo "You may be prompted for the PostgreSQL 'postgres' user password."

# Create user and database
$PSQL_CMD -h localhost -p 5432 -U postgres -d postgres << EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'webet_user') THEN
    CREATE USER webet_user WITH PASSWORD 'webet_pass';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE webet_db OWNER webet_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'webet_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE webet_db TO webet_user;
GRANT ALL ON SCHEMA public TO webet_user;
ALTER USER webet_user CREATEDB;

\l
\du
EOF

echo "🧪 Testing connection..."
$PSQL_CMD -h localhost -p 5432 -U webet_user -d webet_db -c "SELECT 'Connection successful!' as status;"

if [ $? -eq 0 ]; then
  echo "✅ Database setup complete!"
  echo "   Database: webet_db"
  echo "   User: webet_user"
  echo "   Password: webet_pass"
  echo ""
  echo "🚀 You can now run: cd /Users/rishitha/Desktop/WeBet && pnpm dev"
else
  echo "❌ Database connection test failed."
fi