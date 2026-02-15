# Общий контекст для всех агентов

## Технический стек (НЕ ПОДЛЕЖИТ ИЗМЕНЕНИЮ)

### Mobile — Expo (React Native)
- **Framework**: Expo SDK 52+ (managed workflow, переход на bare только если критически необходимо)
- **Навигация**: expo-router (file-based routing)
- **State management**: Zustand + React Query (TanStack Query)
- **Стилизация**: Nativewind (Tailwind для React Native) или StyleSheet
- **Формы**: React Hook Form + Zod
- **Хранилище**: expo-secure-store (чувствительные данные), @react-native-async-storage/async-storage (остальное)
- **Реклама**: react-native-google-mobile-ads (AdMob) + Yandex Mobile Ads SDK
- **Аналитика**: expo-firebase-analytics
- **Уведомления**: expo-notifications + FCM
- **OTA Updates**: expo-updates
- **Сборка**: EAS Build + EAS Submit

### Server — NestJS
- **Framework**: NestJS 10.x
- **ORM**: Prisma 5.x
- **БД**: PostgreSQL 16+
- **Валидация**: class-validator + class-transformer
- **Документация API**: Swagger (@nestjs/swagger)
- **Аутентификация**: @nestjs/passport + JWT (если нужна)
- **Кэширование**: @nestjs/cache-manager + Redis (если нужно)
- **Логирование**: Pino (@nestjs/pino) или встроенный Logger
- **Деплой**: Docker + Railway / Render / VPS

### Web — React + Vite (если понадобится)
- **Framework**: React 19 + Vite 6
- **Роутинг**: React Router 7
- **State**: Zustand + TanStack Query (общий подход с mobile)
- **Стилизация**: Tailwind CSS 4
- **Компоненты**: shadcn/ui
- **Формы**: React Hook Form + Zod (общие схемы с mobile)

### Монорепо
- **Менеджер**: pnpm workspaces
- **Оркестрация**: Turborepo
- **Общие пакеты**:
  - `packages/shared` — TypeScript типы, Zod-схемы, константы, утилиты
  - `packages/api-client` — типизированный клиент для API (используется в mobile и web)

### AI-интеграции (серверная сторона, только для генерации контента)
- **Генерация вопросов/фактов**: Claude API или OpenAI API — вызывается из админки владельцем
- **Генерация иллюстраций**: DALL-E 3 API или Stable Diffusion API — вызывается из админки
- **Хранилище изображений**: Cloudflare R2 (S3-совместимое, 10 GB бесплатно)
- **Важно**: AI НЕ используется в реальном времени для пользователей. Только при создании контента через админку. Весь AI-контент проходит ручную модерацию владельца

### Общие инструменты
- **TypeScript**: strict mode, пути через aliases (@app/*, @server/*, @shared/*)
- **ESLint**: @typescript-eslint, prettier plugin
- **Prettier**: singleQuote, trailingComma: all, semi: true
- **Git**: conventional commits, husky + lint-staged
- **ENV**: dotenv, разные .env для dev/staging/prod

## Целевые платформы
- iOS 16+
- Android 8+ (API 26+)
- Web (Chrome, Safari, Firefox — последние 2 версии) — только если нужен веб

## Языки интерфейса
- Русский (основной)
- Английский
- Использовать i18next + expo-localization (mobile), react-i18next (web)

## Монетизация
- Бесплатное приложение
- Доход от рекламы: баннеры, interstitial, rewarded video
- Целевой доход: $300/месяц
- AdMob как основной SDK
- Yandex Mobile Ads как fallback для RuStore
