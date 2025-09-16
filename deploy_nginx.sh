#!/bin/bash

set -e
# Перейти в папку проекта
cd /home/nb/glfstat

# Set staging environment
export NODE_ENV=staging

echo "📥 Pull из Git..."
git pull origin main

echo "📦 Установка зависимостей..."
npm run install:all

# Backend
cd backend
#npm install


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
pm2 start "npm run start -- --port 3001" --name glfstat-backend-staging
sleep 5
echo "Backend started"
#cd ..

# Frontend
cd ../frontend
#npm install
# Сборка фронтенда
npm run build:staging
# Запуск Vite preview на локальном порту 3000
pm2 start "npm run preview -- --host 127.0.0.1 --port 3000" --name glfstat-frontend-staging
echo "Frontend started"

echo "📊 Статус приложений:"
pm2 status