#!/bin/bash

# WeBet Docker Setup Script
# This script helps you quickly set up Docker for development

set -e

# Use modern docker compose command
DOCKER_COMPOSE="docker compose"

echo "🐳 WeBet Docker Setup"
echo "===================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker is installed"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Start PostgreSQL and Redis only (Recommended for development)"
echo "2) Start all services (Full Docker setup)"
echo "3) Stop all services"
echo "4) Reset database (WARNING: Deletes all data)"
echo "5) View logs"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting PostgreSQL and Redis..."
        $DOCKER_COMPOSE up -d postgres redis
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 5
        echo ""
        echo "✅ Services started!"
        echo ""
        echo "PostgreSQL: localhost:5432"
        echo "Redis: localhost:6379"
        echo ""
        echo "Next steps:"
        echo "1. Run migrations: cd packages/database && pnpm prisma migrate dev"
        echo "2. Seed database: pnpm db:seed"
        echo "3. Start dev servers: pnpm dev"
        ;;
    2)
        echo ""
        echo "🚀 Starting all services..."
        
        # Check if .env file exists
        if [ ! -f .env ]; then
            echo "⚠️  .env file not found!"
            read -p "Would you like to create one from .env.example? (y/n): " create_env
            if [ "$create_env" = "y" ]; then
                cp .env.example .env
                echo "✅ Created .env file"
                echo "⚠️  Please edit .env file with your actual credentials before continuing!"
                exit 0
            else
                echo "❌ Cannot continue without .env file"
                exit 1
            fi
        fi
        
        $DOCKER_COMPOSE up -d
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 10
        echo ""
        echo "✅ All services started!"
        echo ""
        echo "Frontend: http://localhost:3000"
        echo "Backend: http://localhost:3001"
        echo "PostgreSQL: localhost:5432"
        echo "Redis: localhost:6379"
        echo ""
        echo "View logs: docker compose logs -f"
        ;;
    3)
        echo ""
        echo "🛑 Stopping all services..."
        $DOCKER_COMPOSE down
        echo "✅ All services stopped"
        ;;
    4)
        echo ""
        echo "⚠️  WARNING: This will delete all data!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo "🗑️  Stopping services and removing volumes..."
            $DOCKER_COMPOSE down -v
            echo "✅ Database reset complete"
            echo ""
            echo "To start fresh:"
            echo "1. Start services: docker compose up -d postgres redis"
            echo "2. Run migrations: cd packages/database && pnpm prisma migrate dev"
            echo "3. Seed database: pnpm db:seed"
        else
            echo "❌ Reset cancelled"
        fi
        ;;
    5)
        echo ""
        echo "📋 Viewing logs (Press Ctrl+C to exit)..."
        echo ""
        $DOCKER_COMPOSE logs -f
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
