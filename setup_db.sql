-- WeBet Database Setup Script
-- Run this with: /Library/PostgreSQL/15/bin/psql -U postgres -f setup_db.sql

-- Create user
CREATE USER webet_user WITH PASSWORD 'webet_pass';

-- Create database
CREATE DATABASE webet_db OWNER webet_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE webet_db TO webet_user;

-- Connect to the new database and grant schema privileges
\c webet_db
GRANT ALL ON SCHEMA public TO webet_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO webet_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO webet_user;

-- Confirm setup
\du webet_user
\l webet_db
