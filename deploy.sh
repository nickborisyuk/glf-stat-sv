#!/bin/bash

# Golf Stats Local Development Setup Script
# This script sets up the application for local development

set -e

echo "🏌️ Golf Stats Local Development Setup"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"
echo ""
echo "Starting local development setup..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Step 2: Setup database
echo "🗄️ Setting up database..."
cd backend
npx prisma generate
npx prisma db push
cd ..

# Step 3: Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

echo "✅ Local development setup completed successfully!"

echo ""
echo "🎉 Golf Stats is ready for local development!"
echo "============================================="
echo ""
echo "📋 Available commands:"
echo "  • Start backend:    cd backend && npm run dev"
echo "  • Start frontend:   cd frontend && npm run dev"
echo "  • Start both:       npm run dev"
echo "  • Build frontend:   cd frontend && npm run build"
echo "  • Database studio:  cd backend && npx prisma studio"
echo ""
echo "🌐 Application URLs:"
echo "  • Frontend: http://localhost:5173"
echo "  • Backend:  http://localhost:3001"
echo "  • Database: http://localhost:5555 (Prisma Studio)"
echo ""
echo "📁 Project structure:"
echo "  • backend/     - Node.js API server"
echo "  • frontend/    - Svelte web application"
echo "  • prisma/      - Database schema and migrations"
echo ""
echo "Happy coding! 🏌️‍♂️"