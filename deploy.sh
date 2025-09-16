#!/bin/bash

# Golf Stats Local Development Setup Script
# This script sets up the application for local development

set -e

echo "🏌️ Golf Stats Local Development Setup"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    print_error "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "Node.js and npm are installed"

print_status "Starting local development setup..."

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm run install:all

# Step 2: Setup database
print_status "Setting up database..."
cd backend
npx prisma generate
npx prisma db push
cd ..

# Step 3: Build frontend
print_status "Building frontend..."
cd frontend
npm run build
cd ..

print_success "Local development setup completed successfully!"

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
print_success "Happy coding! 🏌️‍♂️"