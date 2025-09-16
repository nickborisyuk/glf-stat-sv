#!/bin/bash

# Golf Stats Remote Deployment Script
# This script is executed on the server for GitHub deployment

set -e

APP_NAME="golf-stats"
BACKEND_APP_NAME="golf-stats-backend"
FRONTEND_APP_NAME="golf-stats-frontend"

echo "🏌️ Golf Stats Remote Deployment"
echo "================================"

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
    npm install -g pm2
fi

echo "🗄️ Настройка базы данных..."
cd backend

# Создать .env файл для продакшн если его нет
if [ ! -f .env ]; then
    echo "📝 Создание .env файла для продакшн..."
    cat > .env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL="file:./prisma/dev.db"
EOF
fi

# Обновить .env для staging если нужно
if [ "$NODE_ENV" = "staging" ]; then
    echo "📝 Обновление .env файла для staging..."
    sed -i 's/NODE_ENV=production/NODE_ENV=staging/' .env || true
fi

npx prisma generate
npx prisma db push
cd ..

echo "🔨 Сборка фронтенда для production..."
cd frontend
npm run build:production
cd ..

echo "🚀 Запуск приложений через PM2..."

# Остановить существующие процессы если они запущены
pm2 delete "$BACKEND_APP_NAME" 2>/dev/null || true
pm2 delete "$FRONTEND_APP_NAME" 2>/dev/null || true

# Запустить бэкенд
echo "Starting backend..."
pm2 start "cd backend && npm start" --name "$BACKEND_APP_NAME" --env production

# Запустить фронтенд (предварительно собранный)
echo "Starting frontend..."
pm2 start "npx serve frontend/dist -l 3000" --name "$FRONTEND_APP_NAME"

# Сохранить конфигурацию PM2
pm2 save

echo "📊 Статус приложений:"
pm2 status

echo "✅ Деплой завершен!"
echo ""
echo "🌐 Приложение доступно по адресам:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo ""
echo "📋 Полезные команды:"
echo "  pm2 status                    - статус приложений"
echo "  pm2 logs $BACKEND_APP_NAME    - логи бэкенда"
echo "  pm2 logs $FRONTEND_APP_NAME   - логи фронтенда"
echo "  pm2 restart $BACKEND_APP_NAME - перезапуск бэкенда"
echo "  pm2 restart $FRONTEND_APP_NAME - перезапуск фронтенда"