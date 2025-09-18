#!/bin/bash

set -e
# Перейти в папку проекта
cd /home/nb/glfstat-sv

# Set staging environment
export NODE_ENV=staging

echo "📥 Pull из Git..."
git pull origin main

echo "📦 Установка зависимостей..."
#npm run install:all

# Backend
cd backend
npm install

# Остановить существующие процессы если они запущены
echo "Stopping existing processes..."
pm2 list --no-color | awk -v name="glfstat-backend-staging" '$4==name {print $2}' | xargs -r pm2 delete
pm2 list --no-color | awk -v name="glfstat-frontend-staging '$4==name {print $2}' | xargs -r pm2 delete

# pm2 delete "golf-stats-backend" 2>/dev/null || true
# pm2 delete "golf-stats-frontend" 2>/dev/null || true
# pm2 delete "golf-stats-backend-staging" 2>/dev/null || true
# pm2 delete "golf-stats-frontend-staging" 2>/dev/null || true


# Создать .env файл для staging
echo "📝 Создание .env файла для staging..."
cat > .env << EOF
NODE_ENV=staging
PORT=3001
DATABASE_URL="file:./prisma/dev.db"
EOF
chmod 600 .env

npx prisma generate
npx prisma db push

# Запуск backend на локальном порту 3001
pm2 start "npm run start -- --host 127.0.0.1 --port 3001" --name glfstat-backend-staging
sleep 5
echo "Backend started"
#cd ..

# Frontend
cd ../frontend
npm install
# Сборка фронтенда
npm run build:staging
# Запуск Vite preview на локальном порту 3000
pm2 start "npm run preview -- --host 127.0.0.1 --port 3000" --name glfstat-frontend-staging
echo "Frontend started"

echo "📊 Статус приложений:"
pm2 status