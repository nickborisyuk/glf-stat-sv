#!/bin/bash

# Quick Database Clear Script
# Simple script to quickly clear the database

set -e

echo "🗑️  Clearing database..."

cd backend

# Create and run cleanup script
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    await prisma.shot.deleteMany();
    await prisma.roundPlayer.deleteMany();
    await prisma.round.deleteMany();
    await prisma.player.deleteMany();
    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

clearDatabase();
"

cd ..

echo "🎉 Done!"
