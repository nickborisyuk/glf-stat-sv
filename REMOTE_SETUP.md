# 🌐 Настройка для удаленного сервера

## 📋 Обзор конфигурации

Приложение поддерживает несколько окружений:
- **Development** - локальная разработка
- **Staging** - тестовый сервер
- **Production** - продакшн сервер

## ⚙️ Настройка API endpoints

### 1. Конфигурационный файл: `frontend/src/config/api.js`

```javascript
const API_CONFIG = {
  development: {
    baseUrl: '/api',                    // Локальная разработка
    timeout: 10000,
    retries: 3
  },
  production: {
    baseUrl: 'http://your-server.com/api', // ← ИЗМЕНИТЕ НА ВАШ СЕРВЕР
    timeout: 15000,
    retries: 2
  },
  staging: {
    baseUrl: 'http://staging-server.com/api', // ← ИЗМЕНИТЕ НА ВАШ STAGING
    timeout: 12000,
    retries: 3
  }
};
```

### 2. Изменение URL сервера

**Для продакшн сервера:**
```javascript
// В frontend/src/config/api.js
production: {
  baseUrl: 'https://yourdomain.com/api',  // Ваш домен
  // или
  baseUrl: 'http://your-ip:3001/api',     // Ваш IP адрес
}
```

**Для staging сервера:**
```javascript
staging: {
  baseUrl: 'http://pleibx.com:3001/api', // Ваш staging сервер
  // или
  baseUrl: 'https://staging.yourdomain.com/api',
}
```

## 🚀 Сборка для разных окружений

### Development (локальная разработка)
```bash
npm run dev
# Использует /api с проксированием на localhost:3001
```

### Production сборка
```bash
cd frontend
npm run build:production
# Собирает с настройками для продакшн сервера
```

### Staging сборка
```bash
cd frontend
npm run build:staging
# Собирает с настройками для staging сервера (http://pleibx.com:3001/api)

# Или используйте специальный скрипт деплоя:
./deploy_staging.sh
```

## 🔧 Настройка удаленного сервера

### 1. Обновите конфигурацию API

Отредактируйте `frontend/src/config/api.js`:

```javascript
production: {
  baseUrl: 'https://yourdomain.com/api',  // Замените на ваш URL
  timeout: 15000,
  retries: 2
}
```

### 2. Запустите деплой

```bash
./deploy_remote.sh
```

### 3. Проверьте работу

```bash
# Проверить статус
pm2 status

# Проверить логи
pm2 logs golf-stats-frontend
pm2 logs golf-stats-backend

# Проверить API
curl https://yourdomain.com/api/health
```

## 🌐 Настройка домена

### 1. Настройка Nginx (рекомендуется)

```bash
sudo nano /etc/nginx/sites-available/golf-stats
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (статические файлы)
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

```bash
sudo ln -s /etc/nginx/sites-available/golf-stats /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. SSL сертификат

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🔄 Переключение между окружениями

### Локальная разработка
```bash
# В frontend/src/config/api.js
baseUrl: '/api'  # Использует проксирование
```

### Удаленный сервер
```bash
# В frontend/src/config/api.js
baseUrl: 'https://yourdomain.com/api'  # Прямое обращение к серверу
```

## 📊 Мониторинг

### Проверка конфигурации
```javascript
// В браузере (консоль разработчика)
console.log('API Config:', window.API_CONFIG);
```

### Логи API запросов
Все API запросы логируются в консоль браузера в development режиме.

## 🛠️ Troubleshooting

### Проблема: CORS ошибки
**Решение:** Настройте CORS на backend сервере:

```javascript
// В backend/src/index.js
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : process.env.NODE_ENV === 'staging'
    ? ['http://pleibx.com:3000', 'http://localhost:5173', 'http://localhost:4173']
    : ['http://localhost:5173', 'http://localhost:4173', 'http://pleibx.com:3000'],
  credentials: true
}));
```

**Для staging окружения** CORS уже настроен для:
- `http://pleibx.com:3000` (frontend)
- `http://localhost:5173` (локальная разработка)
- `http://localhost:4173` (preview)

### Проблема: API не отвечает
**Решение:** Проверьте:
1. Правильность URL в конфигурации
2. Работает ли backend сервер
3. Открыт ли порт 3001
4. Настроен ли Nginx прокси

### Проблема: Неправильная сборка
**Решение:** 
```bash
# Очистить и пересобрать
rm -rf frontend/dist
cd frontend
npm run build:production
```

## 📝 Примеры конфигурации

### Для DigitalOcean droplet
```javascript
production: {
  baseUrl: 'http://your-droplet-ip:3001/api',
}
```

### Для AWS EC2
```javascript
production: {
  baseUrl: 'http://your-ec2-ip:3001/api',
}
```

### Для VPS с доменом
```javascript
production: {
  baseUrl: 'https://golfstats.yourdomain.com/api',
}
```

---

**Готово! Ваше приложение настроено для работы с удаленным сервером! 🏌️‍♂️**
