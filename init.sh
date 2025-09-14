#!/bin/bash

# Golf Stats Application Initialization Script
# This script sets up the development environment

set -e

echo "🏌️ Golf Stats Initialization"
echo "============================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. Please install Node.js (v16 or higher) first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_warning "Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_warning "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm $(npm -v) is installed"

# Install dependencies
print_status "Installing dependencies..."
npm run install:all

if [ $? -ne 0 ]; then
    print_warning "Failed to install some dependencies. This might be normal for development."
fi

# Setup backend environment
print_status "Setting up backend environment..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env 2>/dev/null || echo "DATABASE_URL=\"file:./prisma/dev.db\"
PORT=3001
NODE_ENV=development" > backend/.env
    print_success "Created backend/.env file"
else
    print_status "Backend .env file already exists"
fi

# Setup database
print_status "Setting up database..."
cd backend
npx prisma generate
npx prisma db push

if [ $? -eq 0 ]; then
    print_success "Database setup completed"
else
    print_warning "Database setup failed. You may need to run this manually."
fi

cd ..

# Create sample data (optional)
read -p "Do you want to create sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Creating sample data..."
    
    # This would require a seed script - for now just show message
    print_warning "Sample data creation not implemented yet. You can manually add players and rounds through the UI."
fi

print_success "Initialization completed!"
echo ""
echo "🎉 Golf Stats is ready for development!"
echo "======================================"
echo ""
echo "📋 Next steps:"
echo "  1. Start the development server: npm run dev"
echo "  2. Open http://localhost:5173 in your browser"
echo "  3. Add players and create your first round"
echo ""
echo "🔧 Development commands:"
echo "  • Start development: npm run dev"
echo "  • Backend only: npm run dev:backend"
echo "  • Frontend only: npm run dev:frontend"
echo "  • Build frontend: npm run build"
echo "  • Database operations: cd backend && npx prisma studio"
echo ""
echo "📚 Documentation:"
echo "  • Read README.md for detailed instructions"
echo "  • Check API endpoints in backend/src/routes/"
echo "  • View components in frontend/src/components/"
echo ""
print_success "Happy coding! 🚀"
