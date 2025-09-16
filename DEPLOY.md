# 🚀 Деплой Golf Stats на сервер

## Подготовка сервера

### 1. Установка Node.js и npm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Установка Git
```bash
# Ubuntu/Debian
sudo apt-get install -y git

# CentOS/RHEL
sudo yum install -y git
```

### 3. Клонирование репозитория
```bash
git clone https://github.com/yourusername/glf-stat-sv.git
cd glf-stat-sv
```

## Настройка GitHub Webhook (опционально)

### 1. Создание веб-хука в GitHub
1. Перейдите в Settings → Webhooks
2. Добавьте новый webhook:
   - **Payload URL**: `http://your-server-ip:9000/webhook`
   - **Content type**: `application/json`
   - **Events**: `Just the push event`

### 2. Запуск webhook сервера (опционально)
```bash
# Установить webhook
npm install -g webhook

# Запустить webhook сервер
webhook -hooks webhooks.json -verbose
```

## Ручной деплой

### Запуск скрипта деплоя
```bash
./deploy_remote.sh
```

### Что делает скрипт:
1. **Pull из Git** - получает последние изменения
2. **Установка зависимостей** - устанавливает все npm пакеты
3. **Установка глобальных пакетов** - serve и PM2 если нужно
4. **Настройка базы данных** - создает .env и настраивает Prisma
5. **Сборка фронтенда** - собирает Svelte приложение
6. **Запуск через PM2** - запускает backend и frontend

## Управление приложением

### PM2 команды
```bash
# Статус приложений
pm2 status

# Логи
pm2 logs golf-stats-backend
pm2 logs golf-stats-frontend

# Перезапуск
pm2 restart golf-stats-backend
pm2 restart golf-stats-frontend

# Остановка
pm2 stop golf-stats-backend
pm2 stop golf-stats-frontend

# Удаление
pm2 delete golf-stats-backend
pm2 delete golf-stats-frontend
```

### Автозапуск PM2
```bash
# Сохранить текущие процессы
pm2 save

# Настроить автозапуск при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет PM2
```

## Настройка Nginx (опционально)

### 1. Установка Nginx
```bash
sudo apt-get install -y nginx
```

### 2. Конфигурация
```bash
sudo nano /etc/nginx/sites-available/golf-stats
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Активация
```bash
sudo ln -s /etc/nginx/sites-available/golf-stats /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL сертификат (опционально)

### Let's Encrypt
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Мониторинг

### Логи приложения
```bash
# Логи в реальном времени
pm2 logs --lines 100

# Логи только ошибок
pm2 logs --err --lines 100
```

### Мониторинг ресурсов
```bash
# Статистика PM2
pm2 monit

# Системные ресурсы
htop
```

## Troubleshooting

### Проблемы с портами
```bash
# Проверить какие порты заняты
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Убить процесс по PID
sudo kill -9 PID
```

### Проблемы с базой данных
```bash
# Пересоздать базу данных
cd backend
rm prisma/dev.db
npx prisma db push
```

### Проблемы с зависимостями
```bash
# Очистить и переустановить
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
npm run install:all
```

## Бэкап

### Автоматический бэкап базы данных
```bash
# Создать скрипт бэкапа
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"
mkdir -p $BACKUP_DIR
cp backend/prisma/dev.db $BACKUP_DIR/golf-stats_$DATE.db
find $BACKUP_DIR -name "golf-stats_*.db" -type f -mtime +7 -delete
```

```bash
chmod +x backup.sh

# Добавить в crontab
crontab -e
# Добавить строку:
0 2 * * * /path/to/backup.sh
```

---

**Готово! Ваше приложение Golf Stats запущено на сервере! 🏌️‍♂️**
