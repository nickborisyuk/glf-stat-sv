Создай приложение для отслеживания статистики игры в гольф с современным веб-интерфейсом (ios style).

## Технический стек:
- **Backend**: Node.js + Express
- **Frontend**: Svelte + Vite + Tailwind CSS
- **База данных**: SQLite с Prisma ORM
- **Графики**: Chart.js или D3.js
- **PWA**: Progressive Web App с поддержкой установки на мобильные устройства

## Функциональность:

### Основные возможности:
1. **Управление игроками**:
   - Создание игроков с именем и цветом (выбор из 6 цветов. закрепленные за игроками цвета убираютсяч из выбора)
   - Удаление игроков
   - Список всех игроков

2. **Управление раундами**:
   - Создание раундов (18 или 9 лунок)
   - Выбор игроков для раунда
   - Указание даты, названия поля, типа поля
   - название райнда формируется из даты и времени создания
   - сортировка раундов в списке - вверху самый новый

3. **Двухэтапное создание ударов**:
   - **Этап 1**: Форма с выбором игрока, клюшки и места удара ("откуда бью")
   - **Этап 2**: Плавающая кнопка с GPS измерением дистанции, открывающая модальное окно для завершения удара
   - В модальном окне: результат (успех/неудача), что пошло не так, куда попал мяч, дистанция (берется по gps, но в форме можно менять)
   - в списке ударов сортировка от последнего созданного. Удары разных игроков показаын с уыетом игрока и своим порядковым номером
   - возможность добавлять Штрафной удар игроку

4. **GPS интеграция**:
   - Автоматическое измерение дистанции с помощью GPS
   - Каждый незавершенный удар имеет свою стартовую позицию
   - Независимые счетчики дистанции для каждого удара

5. **Статистика и аналитика**:
   - Общая статистика по раунду
   - Статистика по клюшкам
   - Статистика по местам ударов
   - Графики и диаграммы

6. **PWA функции**:
   - Установка как приложение на мобильные устройства
   - Standalone режим (без интерфейса браузера)
   - Кэширование для офлайн работы

## Структура базы данных (SQLite):

### Таблица players:
```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Таблица rounds:
```sql
CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  course TEXT NOT NULL,
  course_type TEXT NOT NULL, -- 'championship' или 'academic'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Таблица round_players:
```sql
CREATE TABLE round_players (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  FOREIGN KEY (round_id) REFERENCES rounds(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);
```

### Таблица shots:
```sql
CREATE TABLE shots (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  hole_number INTEGER NOT NULL,
  shot_number INTEGER NOT NULL,
  club TEXT NOT NULL,
  distance INTEGER DEFAULT 0,
  location TEXT NOT NULL, -- 'tee', 'fairway', 'rough', etc.
  target_location TEXT NOT NULL,
  result TEXT NOT NULL, -- 'success' или 'fail'
  error TEXT, -- только для неудачных ударов
  is_penalty BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES rounds(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);
```

## API Endpoints:

### Players:
- `GET /api/players` - Список игроков
- `POST /api/players` - Создать игрока
- `DELETE /api/players/:id` - Удалить игрока

### Rounds:
- `GET /api/rounds` - Список раундов
- `POST /api/rounds` - Создать раунд
- `GET /api/rounds/:id` - Получить раунд
- `DELETE /api/rounds/:id` - Удалить раунд

### Shots:
- `GET /api/rounds/:id/holes/:holeId/shots` - Получить удары по лунке
- `POST /api/rounds/:id/holes/:holeId/shots` - Добавить удар
- `PUT /api/rounds/:id/holes/:holeId/shots/:shotId` - Обновить удар
- `DELETE /api/rounds/:id/holes/:holeId/shots/:shotNumber` - Удалить удар

### Statistics:
- `GET /api/rounds/:id/stats` - Общая статистика раунда
- `GET /api/rounds/:id/stats/clubs` - Статистика по клюшкам
- `GET /api/rounds/:id/stats/locations` - Статистика по местам

## UI/UX требования:

### Дизайн:
- **iOS-стиль** интерфейс
- **Адаптивный дизайн** для мобильных устройств
- **Цветовая схема** с поддержкой safe-area для iPhone
- **Интуитивно понятный** интерфейс

### Компоненты:
1. **Страница игроков** - управление игроками
2. **Страница раундов** - создание и выбор раундов
3. **Страница лунок** - выбор лунки (1-18 или 1-9)
4. **Страница лунки** - детальная страница с ударами
5. **Страница статистики** - аналитика и графики

### Особенности интерфейса:
- **Плавающие кнопки** для незавершенных ударов с цветом игрока
- **Модальные окна** для завершения ударов
- **GPS индикатор** с текущей дистанцией
- **Кнопки удаления** только на последних ударах игроков
- **Цветовая индикация** игроков во всех элементах

## Технические требования:

### Backend:
- Express.js сервер
- Prisma ORM для работы с SQLite
- CORS настройки
- Валидация данных
- Обработка ошибок

### Frontend:
- Svelte с Vite
- Tailwind CSS для стилизации
- Роутинг (svelte-spa-router)
- Состояние приложения (Svelte stores)
- PWA манифест и service worker

### GPS интеграция:
- Использование Geolocation API
- Haversine формула для расчета дистанции
- Отслеживание позиции в реальном времени
- Обработка ошибок GPS

## Структура проекта:
```
golf-stats/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── index.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── components/
│   │   ├── stores/
│   │   └── main.js
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── package.json
│   └── vite.config.js
├── deploy.sh
└── README.md
```

## Дополнительные требования:

### Безопасность:
- Валидация всех входных данных
- Защита от SQL инъекций (Prisma)
- CORS настройки

### Производительность:
- Индексы в базе данных
- Кэширование статических ресурсов
- Оптимизация запросов

### Развертывание:
- Скрипт для деплоя на собственный сервер
- Docker контейнеризация (опционально)
- Настройка Nginx для продакшена

Создай полнофункциональное приложение с современным интерфейсом, готовое для продакшена.
