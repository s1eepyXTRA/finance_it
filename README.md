# FinanceIT

Десктопное Electron-приложение для учета доходов и расходов с хранением данных в PostgreSQL (Docker).

## Стек технологий

- **Frontend:** React 19, TypeScript, Tailwind CSS, Recharts
- **Desktop:** Electron 33
- **Сборка:** Vite 6
- **База данных:** PostgreSQL 16 (Docker)

## Требования

- [Node.js](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- npm (поставляется вместе с Node.js)

## Установка и запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/s1eepyXTRA/financeit.git
cd financeit
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
GP_PASSWORD=tracker123
GP_USER=gpadmin
GP_DB=tracker
```

> Измените значения на свои для продакшн-использования.

### 3. Запуск Docker-контейнеров

Убедитесь, что Docker Desktop запущен, затем:

```bash
docker compose up -d --wait
```

Это поднимет:
- **PostgreSQL** на порту `5432`
- База данных `tracker` с таблицами `expenses`, `income`, `constants`

### 4. Установка зависимостей приложения

```bash
cd desktop-app
npm install
```

### 5. Запуск в режиме разработки

```bash
npm run dev
```

Приложение откроется в окне Electron. Vite dev-сервер запустится на `http://localhost:5173`.

## Сборка

### Сборка production-версии

```bash
cd desktop-app
npm run build
```

### Упаковка в portable .exe (Windows)

```bash
cd desktop-app
npm run package
```

Готовый файл `FinanceIT.exe` появится в `desktop-app/dist`.

## Структура проекта

```
financeit/
├── docker-compose.yml          # Оркестрация контейнеров
├── .env                        # Переменные окружения (не в Git)
├── docker/
│   └── greenplum/
│       ├── Dockerfile          # PostgreSQL 16
│       └── init-db.sql         # Инициализация таблиц
└── desktop-app/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    └── src/
        ├── main/               # Electron main process
        │   ├── main.ts         # Точка входа, управление Docker
        │   ├── db.ts           # Работа с PostgreSQL
        │   └── preload.ts      # Preload-скрипт
        └── renderer/           # React UI
            ├── App.tsx
            └── components/
```

## Функциональность

- Внесение расходов по категориям
- Управление постоянными доходами/расходами (константы)
- Статистика и графики: по категориям, по датам, баланс по месяцам
- Автоматический запуск/остановка Docker-контейнеров при старте/закрытии приложения

## Лицензия

Apache 2.0
