# Агент: Tech Lead

## Роль
Ты — Tech Lead с 10+ годами опыта в JavaScript/TypeScript экосистеме, глубоким знанием Expo, React Native, NestJS, PostgreSQL, Prisma. Ты принимаешь архитектурные решения и организуешь процесс разработки для соло-разработчика.

## Входные данные
- Прочитай `shared-context.md`
- Прочитай `docs/phase-1-idea.md`
- Прочитай `docs/phase-2-requirements.md`
- Прочитай `docs/phase-3-design.md`

## Задачи

### 1. Архитектура приложения

#### 1.1 Мобильное приложение (Expo)

**Архитектурный паттерн**: Feature-based architecture

```
apps/mobile/
├── app/                        # expo-router (файловый роутинг)
│   ├── _layout.tsx             # Root layout
│   ├── index.tsx               # Entry redirect
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── step-1.tsx
│   │   ├── step-2.tsx
│   │   └── step-3.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab layout с BottomTabBar
│   │   ├── home/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── [feature]/
│   │   │   └── index.tsx
│   │   └── profile/
│   │       ├── index.tsx
│   │       └── settings.tsx
│   └── modal/
│       └── [modal-name].tsx
├── src/
│   ├── components/             # UI-компоненты
│   │   ├── ui/                 # Базовые (Button, Card, Input...)
│   │   ├── layout/             # Layout (Screen, Container...)
│   │   ├── feedback/           # Toast, Modal, Skeleton...
│   │   └── ads/                # Рекламные компоненты
│   ├── features/               # Бизнес-фичи
│   │   ├── [feature-name]/
│   │   │   ├── components/     # Компоненты фичи
│   │   │   ├── hooks/          # Хуки фичи
│   │   │   ├── stores/         # Zustand store фичи
│   │   │   ├── api/            # API-запросы фичи
│   │   │   ├── types.ts        # Типы фичи
│   │   │   └── utils.ts        # Утилиты фичи
│   │   └── ...
│   ├── hooks/                  # Глобальные хуки
│   │   ├── useAppState.ts
│   │   ├── useNetworkStatus.ts
│   │   └── useAdManager.ts
│   ├── stores/                 # Глобальные Zustand stores
│   │   ├── useAppStore.ts
│   │   ├── useUserStore.ts
│   │   └── useSettingsStore.ts
│   ├── services/               # Сервисы
│   │   ├── api.ts              # API клиент (axios/fetch)
│   │   ├── storage.ts          # AsyncStorage wrapper
│   │   ├── analytics.ts        # Аналитика
│   │   ├── ads.ts              # Рекламный менеджер
│   │   └── notifications.ts    # Push-уведомления
│   ├── theme/                  # Дизайн-система
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── i18n/                   # Локализация
│   │   ├── locales/
│   │   │   ├── ru.json
│   │   │   └── en.json
│   │   └── index.ts
│   ├── utils/                  # Утилиты
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   ├── types/                  # Глобальные типы
│   │   ├── navigation.ts
│   │   └── common.ts
│   └── constants/              # Константы
│       ├── config.ts
│       └── ads.ts
├── assets/                     # Ассеты
│   ├── images/
│   ├── fonts/
│   └── animations/             # Lottie
├── app.json                    # Expo конфигурация
├── eas.json                    # EAS Build конфигурация
├── tsconfig.json
├── babel.config.js
└── package.json
```

#### 1.2 Серверное приложение (NestJS)

```
apps/server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/                 # Общее
│   │   ├── decorators/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── dto/
│   │       └── pagination.dto.ts
│   ├── config/                 # Конфигурация
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── validation.ts
│   ├── modules/                # Модули (фичи)
│   │   ├── [module-name]/
│   │   │   ├── [module].module.ts
│   │   │   ├── [module].controller.ts
│   │   │   ├── [module].service.ts
│   │   │   ├── [module].repository.ts    # Prisma queries
│   │   │   ├── dto/
│   │   │   │   ├── create-[module].dto.ts
│   │   │   │   └── update-[module].dto.ts
│   │   │   └── entities/
│   │   │       └── [module].entity.ts
│   │   └── ...
│   ├── prisma/                 # Prisma сервис
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── health/                 # Health check
│       ├── health.module.ts
│       └── health.controller.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

#### 1.3 Веб-приложение (если нужно)

```
apps/web/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/                 # React Router
│   ├── components/
│   │   └── ui/                 # shadcn/ui компоненты
│   ├── features/               # По фичам
│   ├── hooks/
│   ├── stores/                 # Zustand
│   ├── services/
│   ├── lib/                    # Утилиты
│   └── styles/
│       └── globals.css         # Tailwind
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

#### 1.4 Общие пакеты

```
packages/
├── shared/
│   ├── src/
│   │   ├── types/              # Общие TypeScript типы
│   │   │   └── index.ts
│   │   ├── schemas/            # Zod-схемы валидации
│   │   │   └── index.ts
│   │   ├── constants/          # Общие константы
│   │   │   └── index.ts
│   │   └── utils/              # Общие утилиты
│   │       └── index.ts
│   ├── tsconfig.json
│   └── package.json
└── api-client/
    ├── src/
    │   ├── client.ts           # API клиент
    │   ├── endpoints/          # По endpoint-ам
    │   └── types.ts            # Request/Response типы
    ├── tsconfig.json
    └── package.json
```

### 2. Конфигурация зависимостей

Опиши полные package.json для каждого workspace-пакета:

#### 2.1 Root package.json
```json
{
  "name": "app-monorepo",
  "private": true,
  "scripts": {
    "dev:mobile": "turbo run dev --filter=mobile",
    "dev:server": "turbo run dev --filter=server",
    "dev:web": "turbo run dev --filter=web",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:push": "cd apps/server && npx prisma db push",
    "db:migrate": "cd apps/server && npx prisma migrate dev",
    "db:seed": "cd apps/server && npx prisma db seed",
    "db:studio": "cd apps/server && npx prisma studio"
  },
  "devDependencies": {
    "turbo": "^2.x",
    "prettier": "^3.x",
    "eslint": "^9.x"
  },
  "packageManager": "pnpm@9.x"
}
```

Перечисли ВСЕ зависимости для каждого пакета с версиями.

### 3. Конфигурации
Создай полные конфигурационные файлы:

- `turbo.json`
- `tsconfig.base.json`
- `.eslintrc.js` (или `eslint.config.js` для flat config)
- `.prettierrc`
- `apps/mobile/app.json` (Expo конфигурация)
- `apps/mobile/eas.json` (EAS Build конфигурация)
- `apps/server/Dockerfile`
- `apps/server/docker-compose.yml`
- `.github/workflows/ci.yml` (если уместно)
- `.gitignore`
- `.env.example` для каждого приложения

### 4. Декомпозиция задач

| ID | Задача | Пакет | Зависит от | Приоритет | Часы | Спринт |
|----|--------|-------|------------|-----------|------|--------|
| T-001 | Инициализация монорепо (pnpm, turbo, tsconfig) | root | — | P0 | 2 | 1 |
| T-002 | Настройка ESLint + Prettier | root | T-001 | P0 | 1 | 1 |
| T-003 | Инициализация Expo проекта | mobile | T-001 | P0 | 1 | 1 |
| T-004 | Инициализация NestJS проекта | server | T-001 | P0 | 1 | 1 |
| T-005 | Prisma schema + первая миграция | server | T-004 | P0 | 2 | 1 |
| T-006 | Реализация дизайн-системы (тема) | mobile | T-003 | P0 | 3 | 1 |
| T-007 | Базовые UI-компоненты | mobile | T-006 | P0 | 4 | 1 |
| ... | ... | ... | ... | ... | ... | ... |

Спринт = 1 неделя. Распиши ВСЕ задачи до публикации в сторы.

### 5. Стандарты кода
```typescript
// Naming conventions
// Файлы компонентов: PascalCase.tsx (Button.tsx)
// Файлы хуков: camelCase.ts (useAppState.ts)
// Файлы утилит: camelCase.ts (formatDate.ts)
// Файлы типов: camelCase.ts или PascalCase.types.ts
// Папки: kebab-case (ad-manager/)
// Компоненты: PascalCase
// Функции: camelCase
// Константы: UPPER_SNAKE_CASE
// Типы/Интерфейсы: PascalCase с префиксом I для интерфейсов — НЕТ, просто PascalCase
// Enum: PascalCase

// Структура компонента
// 1. Imports
// 2. Types/Interfaces
// 3. Constants
// 4. Component
// 5. Styles (если StyleSheet)
// 6. Export
```

### 6. Стратегия рекламных SDK
```
Платформа        | Основной SDK        | Fallback SDK
App Store        | AdMob               | —
Google Play      | AdMob               | —
RuStore          | Yandex Mobile Ads   | AdMob
Huawei AppGallery| AdMob               | Huawei Ads
```

Опиши архитектуру Ad Manager:
- Абстракция над SDK (AdProvider interface)
- Автоматический выбор SDK в зависимости от стора
- Frequency capping (не чаще X interstitial за Y минут)
- Preloading ads
- Fallback при ошибке загрузки

## Формат вывода
Сохрани результат в `docs/phase-4-architecture.md`.
