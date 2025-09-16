#!/bin/bash

# Golf Stats Staging Deployment Script
# This script deploys the application to staging server

set -e

echo "🏌️ Golf Stats Staging Deployment"
echo "================================="

# Set staging environment
export NODE_ENV=staging

echo "📥 Pull из Git..."
git pull origin main

echo "📦 Установка зависимостей..."
npm run install:all

# Установить serve глобально если не установлен
if ! command -v serve &> /dev/null; then
    echo "📦 Установка serve для статических файлов..."
    sudo npm install -g serve
fi

# Установить PM2 глобально если не установлен
if ! command -v pm2 &> /dev/null; then
    echo "📦 Установка PM2 для управления процессами..."
    sudo npm install -g pm2
fi

echo "🗄️ Настройка базы данных..."
cd backend

# Создать .env файл для staging
echo "📝 Создание .env файла для staging..."
cat > .env << EOF
NODE_ENV=staging
PORT=3001
DATABASE_URL="file:./prisma/dev.db"
EOF

npx prisma generate
npx prisma db push
cd ..

echo "🔨 Сборка фронтенда для staging..."
cd frontend
npm run build:staging
cd ..

echo "🚀 Запуск приложений через PM2..."

# Остановить существующие процессы если они запущены
echo "Stopping existing processes..."
pm2 delete "golf-stats-backend" 2>/dev/null || true
pm2 delete "golf-stats-frontend" 2>/dev/null || true
pm2 delete "golf-stats-backend-staging" 2>/dev/null || true
pm2 delete "golf-stats-frontend-staging" 2>/dev/null || true

# Запустить бэкенд для staging
echo "Starting backend for staging..."
pm2 start "cd backend && npm run start:staging" --name "golf-stats-backend-staging"

# Проверить что backend запустился в staging режиме
echo "Waiting for backend to start..."
sleep 5
echo "Checking backend environment..."
curl -s http://localhost:3001/api/health | jq . || echo "Backend not responding"

# Запустить фронтенд для staging (предварительно собранный)
echo "Starting frontend for staging..."
pm2 start "npx serve frontend/dist -l 3000" --name "golf-stats-frontend-staging"

# Сохранить конфигурацию PM2
pm2 save

echo "📊 Статус приложений:"
pm2 status

echo "🔍 Проверка переменных окружения:"
pm2 env golf-stats-backend-staging

echo "✅ Staging деплой завершен!"
echo ""
echo "🌐 Приложение доступно по адресам:"
echo "  Frontend: http://pleibx.com:3000"
echo "  Backend API: http://pleibx.com:3001"
echo "  Database: http://localhost:5555 (Prisma Studio)"
echo ""
echo "📋 Полезные команды:"
echo "  pm2 status                              - статус приложений"
echo "  pm2 logs golf-stats-backend-staging     - логи бэкенда"
echo "  pm2 logs golf-stats-frontend-staging    - логи фронтенда"
echo "  pm2 restart golf-stats-backend-staging  - перезапуск бэкенда"
echo "  pm2 restart golf-stats-frontend-staging - перезапуск фронтенда"
