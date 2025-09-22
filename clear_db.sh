#!/bin/bash

# Golf Stats Database Clear Script
# This script clears all data from the database to start fresh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to ask for confirmation
ask_confirmation() {
    echo -e "${YELLOW}This will DELETE ALL DATA from the database.${NC}"
    echo -e "${YELLOW}This action cannot be undone!${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [[ $confirm != "yes" ]]; then
        print_warning "Operation cancelled by user"
        exit 0
    fi
}

# Main function
main() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    Golf Stats Database Clear                ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Check if we're in the right directory
    if [[ ! -f "backend/package.json" ]]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check if backend directory exists
    if [[ ! -d "backend" ]]; then
        print_error "Backend directory not found"
        exit 1
    fi
    
    # Check if Prisma is installed
    if [[ ! -f "backend/node_modules/.bin/prisma" ]]; then
        print_error "Prisma not found. Please run 'npm install' in the backend directory first"
        exit 1
    fi
    
    # Ask for confirmation
    ask_confirmation
    
    print_status "Starting database cleanup..."
    
    # Change to backend directory
    cd backend
    
    # Clear the database using Prisma
    print_status "Clearing database using Prisma..."
    
    # Create a temporary script to clear the database
    cat > clear_db_temp.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  Clearing database...');
  
  try {
    // Delete in correct order to avoid foreign key constraints
    await prisma.shot.deleteMany();
    console.log('✅ Shots cleared');
    
    await prisma.roundPlayer.deleteMany();
    console.log('✅ RoundPlayers cleared');
    
    await prisma.round.deleteMany();
    console.log('✅ Rounds cleared');
    
    await prisma.player.deleteMany();
    console.log('✅ Players cleared');
    
    console.log('🎉 Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
EOF
    
    # Run the cleanup script
    if node clear_db_temp.js; then
        print_success "Database cleared successfully!"
    else
        print_error "Failed to clear database"
        rm -f clear_db_temp.js
        exit 1
    fi
    
    # Clean up temporary script
    rm -f clear_db_temp.js
    
    # Reset Prisma database (optional - recreates the database)
    print_status "Resetting Prisma database..."
    if npx prisma db push --force-reset; then
        print_success "Prisma database reset successfully!"
    else
        print_warning "Prisma database reset failed, but data was cleared"
    fi
    
    # Go back to project root
    cd ..
    
    print_success "Database cleanup completed!"
    echo ""
    print_status "You can now start fresh with:"
    echo -e "  ${BLUE}cd backend && npm start${NC}"
    echo -e "  ${BLUE}cd frontend && npm run dev${NC}"
    echo ""
    print_status "Or use the main deploy script:"
    echo -e "  ${BLUE}./deploy.sh${NC}"
}

# Run main function
main "$@"
