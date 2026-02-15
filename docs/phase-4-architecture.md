# Фаза 4: Tech Lead — Архитектура и план разработки

---

## 1. Архитектура приложения

### 1.1 Мобильное приложение (Expo) — Feature-based architecture

```
apps/mobile/
├── app/                              # expo-router (файловый роутинг)
│   ├── _layout.tsx                   # Root layout (ThemeProvider, fonts, splash)
│   ├── index.tsx                     # Entry redirect → onboarding или tabs
│   ├── (onboarding)/
│   │   ├── _layout.tsx               # Stack, без header
│   │   ├── step-1.tsx
│   │   ├── step-2.tsx
│   │   └── step-3.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx               # BottomTabBar (4 таба)
│   │   ├── home/
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx             # Home Screen
│   │   ├── infinite/
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx             # Бесконечный режим (вход)
│   │   ├── leaderboard/
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx             # Лидерборд
│   │   └── profile/
│   │       ├── _layout.tsx
│   │       ├── index.tsx             # Профиль + статистика
│   │       └── settings.tsx          # Настройки
│   ├── game/
│   │   ├── _layout.tsx               # Fullscreen Stack, без tab bar
│   │   ├── daily.tsx                 # Обёртка ежедневного набора (orchestrator)
│   │   ├── anagram.tsx
│   │   ├── compose.tsx
│   │   ├── chain.tsx
│   │   ├── search.tsx
│   │   └── guess.tsx
│   └── modal/
│       ├── fact.tsx                  # Карточка факта
│       ├── results.tsx              # Результаты ежедневного набора
│       ├── nickname.tsx             # Ввод никнейма
│       └── streak-milestone.tsx     # Празднование стрика
├── src/
│   ├── components/
│   │   ├── ui/                       # Базовые UI-компоненты
│   │   │   ├── Button.tsx            # 3D Duolingo-кнопка
│   │   │   ├── Card.tsx              # 3D-карточка
│   │   │   ├── Input.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Switch.tsx
│   │   │   ├── Divider.tsx
│   │   │   ├── ListItem.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Screen.tsx            # SafeAreaView wrapper
│   │   │   ├── BottomSheet.tsx       # @gorhom/bottom-sheet wrapper
│   │   │   └── index.ts
│   │   ├── feedback/
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── index.ts
│   │   └── ads/
│   │       ├── AdBanner.tsx
│   │       ├── InterstitialManager.tsx
│   │       ├── RewardedAdManager.tsx
│   │       └── index.ts
│   ├── features/
│   │   ├── onboarding/
│   │   │   ├── components/
│   │   │   │   └── OnboardingSlide.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useOnboarding.ts
│   │   │   └── stores/
│   │   │       └── useOnboardingStore.ts
│   │   ├── game/
│   │   │   ├── components/
│   │   │   │   ├── GameHeader.tsx
│   │   │   │   ├── LetterTile.tsx
│   │   │   │   ├── WordGrid.tsx
│   │   │   │   ├── FactCard.tsx
│   │   │   │   ├── DailyResultCard.tsx
│   │   │   │   ├── CustomKeyboard.tsx
│   │   │   │   ├── StreakBadge.tsx
│   │   │   │   └── HintButton.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAnagramGame.ts
│   │   │   │   ├── useComposeGame.ts
│   │   │   │   ├── useChainGame.ts
│   │   │   │   ├── useSearchGame.ts
│   │   │   │   ├── useGuessGame.ts
│   │   │   │   └── useDailySet.ts
│   │   │   ├── stores/
│   │   │   │   └── useGameStore.ts
│   │   │   ├── api/
│   │   │   │   └── gameApi.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── leaderboard/
│   │   │   ├── components/
│   │   │   │   ├── LeaderboardList.tsx
│   │   │   │   └── LeaderboardEntry.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useLeaderboard.ts
│   │   │   └── api/
│   │   │       └── leaderboardApi.ts
│   │   ├── profile/
│   │   │   ├── components/
│   │   │   │   ├── HeatmapCalendar.tsx
│   │   │   │   └── StatCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useStats.ts
│   │   │   └── api/
│   │   │       └── profileApi.ts
│   │   └── settings/
│   │       ├── components/
│   │       │   └── SettingsRow.tsx
│   │       └── hooks/
│   │           └── useSettings.ts
│   ├── hooks/
│   │   ├── useAppState.ts            # App lifecycle (foreground/background)
│   │   ├── useNetworkStatus.ts       # Online/offline detection
│   │   └── useTheme.ts              # Theme context consumer
│   ├── stores/
│   │   ├── useAppStore.ts            # Device ID, onboarding status, app-level state
│   │   ├── useUserStore.ts           # User data, streak, stats
│   │   └── useSettingsStore.ts       # Language, theme, sound, notifications
│   ├── services/
│   │   ├── api.ts                    # Axios/ky instance, interceptors, auth headers
│   │   ├── storage.ts                # SecureStore + AsyncStorage wrappers
│   │   ├── analytics.ts              # Firebase analytics events
│   │   ├── ads.ts                    # Ad Manager (abstraction over SDK)
│   │   └── notifications.ts          # Push-notifications setup
│   ├── theme/
│   │   ├── colors.ts                 # Light & Dark palettes
│   │   ├── typography.ts             # Nunito font styles
│   │   ├── spacing.ts                # Spacing, borderRadius, duoShadow, elevation
│   │   ├── ThemeProvider.tsx          # Context provider (light/dark/system)
│   │   └── index.ts
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── ru.json
│   │   │   └── en.json
│   │   └── index.ts                  # i18next configuration
│   ├── utils/
│   │   ├── format.ts                 # Date, number formatting
│   │   ├── haptics.ts                # Haptic feedback helpers
│   │   └── share.ts                  # Share result/fact image generation
│   ├── types/
│   │   └── common.ts                 # App-level types (not shared)
│   └── constants/
│       ├── config.ts                 # API_URL, APP_VERSION, etc.
│       └── ads.ts                    # Ad unit IDs, frequency caps
├── assets/
│   ├── images/
│   │   ├── icon.png                  # 1024×1024 app icon
│   │   ├── splash.png                # Splash screen image
│   │   └── adaptive-icon.png         # Android adaptive icon foreground
│   ├── fonts/                        # (managed by @expo-google-fonts)
│   └── animations/
│       ├── confetti.json             # Lottie
│       ├── streak-fire.json
│       └── onboarding/
│           ├── slide-1.json
│           ├── slide-2.json
│           └── slide-3.json
├── app.json
├── eas.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── package.json
```

### 1.2 Серверное приложение (NestJS)

```
apps/server/
├── src/
│   ├── main.ts                       # Bootstrap, CORS, validation pipe, swagger
│   ├── app.module.ts                 # Root module
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   │   │   └── api-response.decorator.ts   # Swagger response decorators
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts    # Global exception filter
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts           # Admin JWT guard
│   │   │   └── device-auth.guard.ts        # Mobile device ID guard
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts    # Response wrapper { data, meta }
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── dto/
│   │       └── pagination.dto.ts           # PaginationQueryDto, PaginatedResponseDto
│   ├── config/
│   │   ├── app.config.ts                   # ConfigService registration
│   │   ├── database.config.ts
│   │   └── ai.config.ts                    # AI API keys, models
│   ├── modules/
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts         # POST /register, PATCH /me, GET /me/stats
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── register-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   ├── questions/
│   │   │   ├── questions.module.ts
│   │   │   ├── questions.controller.ts     # GET /random, POST /:id/answer
│   │   │   ├── questions.service.ts
│   │   │   ├── questions.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-question.dto.ts
│   │   │   │   ├── update-question.dto.ts
│   │   │   │   └── answer-question.dto.ts
│   │   │   └── entities/
│   │   │       └── question.entity.ts
│   │   ├── daily-sets/
│   │   │   ├── daily-sets.module.ts
│   │   │   ├── daily-sets.controller.ts    # GET /today, POST /:id/submit
│   │   │   ├── daily-sets.service.ts
│   │   │   ├── daily-sets.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-daily-set.dto.ts
│   │   │   │   └── submit-daily-set.dto.ts
│   │   │   └── entities/
│   │   │       └── daily-set.entity.ts
│   │   ├── leaderboard/
│   │   │   ├── leaderboard.module.ts
│   │   │   ├── leaderboard.controller.ts   # GET /daily, /weekly, /alltime
│   │   │   ├── leaderboard.service.ts
│   │   │   └── leaderboard.repository.ts
│   │   ├── categories/
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   └── dto/
│   │   │       └── create-category.dto.ts
│   │   ├── admin/
│   │   │   ├── admin.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── admin-auth.controller.ts  # POST /login, /refresh
│   │   │   │   ├── admin-auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   └── dto/
│   │   │   │       └── login.dto.ts
│   │   │   ├── questions/
│   │   │   │   ├── admin-questions.controller.ts  # CRUD + approve/reject + bulk
│   │   │   │   └── admin-questions.service.ts
│   │   │   ├── daily-sets/
│   │   │   │   ├── admin-daily-sets.controller.ts
│   │   │   │   └── admin-daily-sets.service.ts
│   │   │   ├── categories/
│   │   │   │   ├── admin-categories.controller.ts
│   │   │   │   └── admin-categories.service.ts
│   │   │   ├── stats/
│   │   │   │   ├── admin-stats.controller.ts
│   │   │   │   └── admin-stats.service.ts
│   │   │   └── upload/
│   │   │       ├── upload.controller.ts
│   │   │       └── upload.service.ts         # S3 (Cloudflare R2)
│   │   └── ai/
│   │       ├── ai.module.ts
│   │       ├── ai.controller.ts              # POST /generate-questions, /generate-illustration
│   │       ├── ai.service.ts
│   │       ├── providers/
│   │       │   ├── llm.provider.ts           # Claude / OpenAI abstraction
│   │       │   └── image.provider.ts         # DALL-E / Stable Diffusion abstraction
│   │       └── prompts/
│   │           ├── question-generation.ts    # System prompts for question generation
│   │           └── illustration-generation.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts                # extends PrismaClient, onModuleInit/Destroy
│   ├── health/
│   │   ├── health.module.ts
│   │   └── health.controller.ts             # GET /health
│   └── tasks/
│       ├── tasks.module.ts
│       └── daily-set-publisher.service.ts   # Cron: auto-publish scheduled sets
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                              # Initial categories + admin user
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

### 1.3 Веб-приложение — Админ-панель (React + Vite)

```
apps/web/
├── src/
│   ├── main.tsx                      # ReactDOM.createRoot
│   ├── App.tsx                       # RouterProvider
│   ├── routes/
│   │   ├── index.tsx                 # Route definitions
│   │   ├── login.tsx                 # Login page
│   │   ├── dashboard.tsx             # Dashboard
│   │   ├── questions/
│   │   │   ├── list.tsx              # Questions list with filters
│   │   │   ├── detail.tsx            # Question detail/edit
│   │   │   └── generate.tsx          # AI generation form
│   │   ├── daily-sets/
│   │   │   ├── calendar.tsx          # Calendar view
│   │   │   └── create.tsx            # Create/edit daily set
│   │   ├── categories/
│   │   │   └── list.tsx
│   │   └── stats/
│   │       └── questions.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components (generated)
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx         # Sidebar + content
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── questions/
│   │   │   ├── QuestionTable.tsx
│   │   │   ├── QuestionForm.tsx
│   │   │   ├── QuestionPreview.tsx
│   │   │   └── GenerateForm.tsx
│   │   ├── daily-sets/
│   │   │   ├── SetCalendar.tsx
│   │   │   └── SetBuilder.tsx
│   │   └── stats/
│   │       ├── DashboardCards.tsx
│   │       └── QuestionStats.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useQuestions.ts
│   ├── stores/
│   │   └── useAuthStore.ts
│   ├── services/
│   │   └── api.ts                    # Axios instance with JWT interceptor
│   ├── lib/
│   │   └── utils.ts                  # cn() helper, etc.
│   └── styles/
│       └── globals.css               # Tailwind directives + shadcn vars
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── components.json                   # shadcn/ui config
└── package.json
```

### 1.4 Общие пакеты

```
packages/
├── shared/
│   ├── src/
│   │   ├── types/
│   │   │   ├── user.ts               # User, UserStats
│   │   │   ├── question.ts           # Question, QuestionType, QuestionData
│   │   │   ├── daily-set.ts          # DailySet, DailySetQuestion
│   │   │   ├── leaderboard.ts        # LeaderboardEntry
│   │   │   ├── category.ts           # Category
│   │   │   ├── api.ts                # ApiResponse, PaginatedResponse, ErrorResponse
│   │   │   └── index.ts
│   │   ├── schemas/
│   │   │   ├── user.schema.ts        # Zod schemas for user DTOs
│   │   │   ├── question.schema.ts
│   │   │   ├── daily-set.schema.ts
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── game-types.ts         # GAME_TYPES enum
│   │   │   ├── question-status.ts    # QUESTION_STATUS enum
│   │   │   ├── daily-set-status.ts   # DAILY_SET_STATUS enum
│   │   │   ├── languages.ts          # SUPPORTED_LANGUAGES
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── scoring.ts            # Score calculation logic
│   │   │   └── index.ts
│   │   └── index.ts                  # Main barrel export
│   ├── tsconfig.json
│   └── package.json
└── api-client/
    ├── src/
    │   ├── client.ts                 # createApiClient(baseUrl, options)
    │   ├── endpoints/
    │   │   ├── users.ts
    │   │   ├── questions.ts
    │   │   ├── daily-sets.ts
    │   │   ├── leaderboard.ts
    │   │   ├── categories.ts
    │   │   └── admin.ts
    │   ├── types.ts                  # Request/Response types
    │   └── index.ts
    ├── tsconfig.json
    └── package.json
```

---

## 2. Конфигурация зависимостей

### 2.1 Root package.json

```json
{
  "name": "wordpulse",
  "private": true,
  "scripts": {
    "dev:mobile": "turbo run dev --filter=@wordpulse/mobile",
    "dev:server": "turbo run dev --filter=@wordpulse/server",
    "dev:web": "turbo run dev --filter=@wordpulse/web",
    "build": "turbo run build",
    "build:server": "turbo run build --filter=@wordpulse/server",
    "build:web": "turbo run build --filter=@wordpulse/web",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "db:push": "pnpm --filter @wordpulse/server exec prisma db push",
    "db:migrate": "pnpm --filter @wordpulse/server exec prisma migrate dev",
    "db:migrate:deploy": "pnpm --filter @wordpulse/server exec prisma migrate deploy",
    "db:seed": "pnpm --filter @wordpulse/server exec prisma db seed",
    "db:studio": "pnpm --filter @wordpulse/server exec prisma studio",
    "db:generate": "pnpm --filter @wordpulse/server exec prisma generate",
    "clean": "turbo run clean",
    "prepare": "husky"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "prettier": "^3.4.0",
    "eslint": "^9.15.0",
    "typescript-eslint": "^8.16.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.2.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.2.0",
    "typescript": "^5.6.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  },
  "packageManager": "pnpm@9.14.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### 2.2 apps/mobile/package.json

```json
{
  "name": "@wordpulse/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "build:dev": "eas build --profile development",
    "build:preview": "eas build --profile preview",
    "build:prod": "eas build --profile production",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "test": "jest",
    "clean": "rm -rf node_modules .expo dist"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-font": "~13.0.0",
    "expo-haptics": "~14.0.0",
    "expo-image": "~2.0.0",
    "expo-linear-gradient": "~14.0.0",
    "expo-linking": "~7.0.0",
    "expo-localization": "~16.0.0",
    "expo-notifications": "~0.29.0",
    "expo-secure-store": "~14.0.0",
    "expo-updates": "~0.27.0",
    "expo-sharing": "~13.0.0",
    "expo-dev-client": "~5.0.0",

    "react": "18.3.1",
    "react-native": "0.76.3",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.1.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-svg": "15.8.0",

    "@expo-google-fonts/nunito": "^0.2.3",
    "@expo/vector-icons": "^14.0.0",
    "@gorhom/bottom-sheet": "^5.0.0",
    "lottie-react-native": "^7.1.0",

    "react-native-google-mobile-ads": "^14.5.0",

    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.60.0",
    "axios": "^1.7.0",
    "i18next": "^24.0.0",
    "react-i18next": "^15.1.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "react-native-uuid": "^2.0.2",

    "@wordpulse/shared": "workspace:*"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/react": "~18.3.0",
    "typescript": "^5.6.0",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "@testing-library/react-native": "^12.8.0",
    "@testing-library/jest-native": "^5.4.0"
  }
}
```

### 2.3 apps/server/package.json

```json
{
  "name": "@wordpulse/server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "lint:fix": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@nestjs/config": "^3.3.0",
    "@nestjs/swagger": "^8.1.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/schedule": "^4.1.0",
    "@nestjs/throttler": "^6.3.0",

    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",

    "@prisma/client": "^5.22.0",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",

    "bcrypt": "^5.1.1",
    "helmet": "^8.0.0",
    "compression": "^1.7.4",

    "@anthropic-ai/sdk": "^0.32.0",
    "openai": "^4.73.0",

    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/s3-request-presigner": "^3.700.0",

    "rxjs": "^7.8.0",
    "reflect-metadata": "^0.2.0",

    "@wordpulse/shared": "workspace:*"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.0",
    "@nestjs/schematics": "^10.2.0",
    "@nestjs/testing": "^10.4.0",
    "@types/express": "^5.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/passport-jwt": "^4.0.1",
    "@types/compression": "^1.7.5",
    "prisma": "^5.22.0",
    "typescript": "^5.6.0",
    "ts-node": "^10.9.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "@types/jest": "^29.5.0",
    "source-map-support": "^0.5.21"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### 2.4 apps/web/package.json

```json
{
  "name": "@wordpulse/web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.1.0",

    "@tanstack/react-query": "^5.60.0",
    "zustand": "^5.0.0",
    "axios": "^1.7.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",

    "tailwind-merge": "^2.6.0",
    "clsx": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.460.0",

    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.0",
    "@radix-ui/react-popover": "^1.1.0",

    "date-fns": "^4.1.0",

    "@wordpulse/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### 2.5 packages/shared/package.json

```json
{
  "name": "@wordpulse/shared",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

### 2.6 packages/api-client/package.json

```json
{
  "name": "@wordpulse/api-client",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "axios": "^1.7.0",
    "@wordpulse/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

---

## 3. Конфигурации

### 3.1 pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 3.2 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", ".expo/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "lint:fix": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 3.3 tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist"]
}
```

### 3.4 apps/mobile/tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "@wordpulse/shared": ["../../packages/shared/src"],
      "@wordpulse/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

### 3.5 apps/server/tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"],
      "@wordpulse/shared": ["../../packages/shared/src"],
      "@wordpulse/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["src/**/*", "prisma/**/*", "test/**/*"]
}
```

### 3.6 apps/server/tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts", "prisma/seed.ts"]
}
```

### 3.7 eslint.config.js (root — flat config)

```javascript
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.expo/**', '**/build/**'],
  },
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
);
```

### 3.8 .prettierrc

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 3.9 .prettierignore

```
node_modules
dist
.expo
*.lock
*.png
*.jpg
*.json
```

### 3.10 apps/mobile/app.json

```json
{
  "expo": {
    "name": "WordPulse",
    "slug": "wordpulse",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "wordpulse",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#58CC02"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.wordpulse.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSUserTrackingUsageDescription": "This identifier will be used to deliver personalized ads to you.",
        "SKAdNetworkItems": [
          { "SKAdNetworkIdentifier": "cstr6suwn9.skadnetwork" }
        ]
      },
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#58CC02"
      },
      "package": "com.wordpulse.app",
      "versionCode": 1,
      "permissions": ["INTERNET", "ACCESS_NETWORK_STATE", "RECEIVE_BOOT_COMPLETED", "VIBRATE"],
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ"
      }
    },
    "plugins": [
      "expo-router",
      "expo-localization",
      "expo-secure-store",
      "expo-font",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#58CC02"
        }
      ],
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ",
          "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
        }
      ],
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#58CC02",
          "image": "./assets/images/splash.png",
          "imageWidth": 200
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    },
    "updates": {
      "url": "https://u.expo.dev/YOUR_EAS_PROJECT_ID"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

### 3.11 apps/mobile/eas.json

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "API_URL": "https://api-staging.wordpulse.app"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "API_URL": "https://api.wordpulse.app"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### 3.12 apps/mobile/babel.config.js

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

### 3.13 apps/mobile/metro.config.js

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

### 3.14 apps/server/nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

### 3.15 apps/server/Dockerfile

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @wordpulse/server...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
RUN cd apps/server && npx prisma generate && pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/apps/server/prisma ./prisma
COPY --from=builder /app/apps/server/package.json ./

EXPOSE 3001
CMD ["node", "dist/main"]
```

### 3.16 apps/server/docker-compose.yml

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: wordpulse
      POSTGRES_PASSWORD: wordpulse_dev
      POSTGRES_DB: wordpulse
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  server:
    build:
      context: ../..
      dockerfile: apps/server/Dockerfile
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://wordpulse:wordpulse_dev@postgres:5432/wordpulse
      PORT: 3001
      JWT_SECRET: dev-secret-change-in-production
      NODE_ENV: development
    ports:
      - "3001:3001"

volumes:
  postgres_data:
```

### 3.17 apps/server/.env.example

```env
# Database
DATABASE_URL="postgresql://wordpulse:wordpulse_dev@localhost:5432/wordpulse"

# Server
PORT=3001
NODE_ENV=development

# Auth
JWT_SECRET=change-this-in-production-to-random-string
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=30d

# Admin
ADMIN_EMAIL=admin@wordpulse.app
ADMIN_PASSWORD=change-this-password

# AI — LLM (choose one)
ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
AI_LLM_PROVIDER=anthropic
AI_LLM_MODEL=claude-sonnet-4-5-20250929

# AI — Images
OPENAI_API_KEY=sk-...
AI_IMAGE_PROVIDER=dall-e
AI_IMAGE_MODEL=dall-e-3

# S3 (Cloudflare R2)
S3_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=wordpulse-images
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_PUBLIC_URL=https://images.wordpulse.app

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### 3.18 apps/mobile/.env.example

```env
# API
API_URL=http://localhost:3001

# Ads (Test IDs — replace with real ones for production)
ADMOB_BANNER_ID_IOS=ca-app-pub-3940256099942544/2934735716
ADMOB_BANNER_ID_ANDROID=ca-app-pub-3940256099942544/6300978111
ADMOB_INTERSTITIAL_ID_IOS=ca-app-pub-3940256099942544/4411468910
ADMOB_INTERSTITIAL_ID_ANDROID=ca-app-pub-3940256099942544/1033173712
ADMOB_REWARDED_ID_IOS=ca-app-pub-3940256099942544/1712485313
ADMOB_REWARDED_ID_ANDROID=ca-app-pub-3940256099942544/5224354917
```

### 3.19 apps/web/.env.example

```env
VITE_API_URL=http://localhost:3001
```

### 3.20 .gitignore

```gitignore
# Dependencies
node_modules/
.pnp/
.pnp.js

# Build
dist/
build/
.next/
.expo/
*.tsbuildinfo

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
!.vscode/settings.json
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Turbo
.turbo/

# Testing
coverage/

# Expo
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*

# EAS
google-service-account.json

# Prisma
apps/server/prisma/migrations/dev/

# Misc
*.tgz
```

### 3.21 .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: wordpulse_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm format:check

      - run: pnpm lint

      - run: pnpm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/wordpulse_test
```

---

## 4. Стандарты кода

### 4.1 Naming Conventions

```
Файлы компонентов:   PascalCase.tsx       (Button.tsx, FactCard.tsx)
Файлы хуков:         camelCase.ts         (useAnagramGame.ts, useTheme.ts)
Файлы утилит:        camelCase.ts         (formatDate.ts, scoring.ts)
Файлы типов:         camelCase.ts         (user.ts, question.ts)
Файлы stores:        camelCase.ts         (useAppStore.ts) — начинается с use
Файлы API:           camelCase.ts         (gameApi.ts, leaderboardApi.ts)
Файлы NestJS:        kebab-case.*.ts      (users.controller.ts, users.service.ts)

Папки:               kebab-case           (daily-sets/, admin-auth/)
Компоненты:          PascalCase           (Button, FactCard)
Функции:             camelCase            (calculateScore, formatDate)
Хуки:                camelCase с use      (useTheme, useGameStore)
Константы:           UPPER_SNAKE_CASE     (API_URL, MAX_STREAK)
Типы/Интерфейсы:     PascalCase           (User, QuestionData) — без I-префикса
Enum:                PascalCase + values   (QuestionStatus.Approved)
```

### 4.2 Структура React-компонента (mobile)

```typescript
// 1. Imports
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import type { FC } from 'react';

// 2. Types
type ButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
};

// 3. Constants
const PRESS_DEPTH = 4;

// 4. Component
export const Button: FC<ButtonProps> = ({ label, variant = 'primary', onPress }) => {
  // hooks
  // derived state
  // handlers
  // render
  return (
    <Animated.View>
      <Text>{label}</Text>
    </Animated.View>
  );
};

// 5. Styles (if StyleSheet)
// const styles = StyleSheet.create({ ... });
```

### 4.3 Структура NestJS-сервиса

```typescript
// 1. Imports
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateQuestionDto } from './dto/create-question.dto';

// 2. Service
@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundException(`Question ${id} not found`);
    }
    return question;
  }
}
```

### 4.4 Правила

- **TypeScript strict mode** везде, `no any` — используй `unknown` + type narrowing
- **Barrel exports** только для `components/ui/index.ts` и `packages/shared/src/index.ts`
- **Абсолютные импорты**: `@/*` для внутренних, `@wordpulse/shared` для общих пакетов
- **Ранний return** вместо вложенных if-else
- **Const arrow functions** для компонентов: `export const Button: FC<Props> = () => {}`
- **Zod-схемы** для валидации на клиенте, class-validator для сервера, общие типы в shared
- **Один компонент — один файл**, исключение: мелкие helper-компоненты в том же файле
- **React Query** для серверного состояния, **Zustand** только для клиентского (UI) состояния

---

## 5. Стратегия рекламных SDK

### 5.1 Матрица SDK по сторам

| Платформа        | Основной SDK        | Fallback SDK     |
|------------------|---------------------|------------------|
| App Store (iOS)  | AdMob               | —                |
| Google Play      | AdMob               | —                |
| RuStore          | Yandex Mobile Ads   | AdMob            |
| Huawei AppGallery| AdMob               | Huawei Ads (v2+) |

### 5.2 Архитектура Ad Manager

```typescript
// services/ads.ts — Абстракция поверх рекламных SDK

// Интерфейс провайдера рекламы
interface AdProvider {
  initialize(): Promise<void>;
  loadBanner(unitId: string): Promise<void>;
  showInterstitial(unitId: string): Promise<boolean>;
  showRewarded(unitId: string): Promise<boolean>;
  isAvailable(): boolean;
}

// Реализации
// - AdMobProvider (react-native-google-mobile-ads)
// - YandexAdsProvider (yandex-mobile-ads — только для RuStore, v2+)

// AdManager — фасад
class AdManager {
  private provider: AdProvider;
  private interstitialLastShown: number = 0;
  private interstitialTodayCount: number = 0;
  private userTotalGames: number = 0;

  // Frequency capping:
  // - Interstitial: не чаще 1 раз в 120 сек
  // - Interstitial: макс 10 в день
  // - Grace period: первые 3 игры без рекламы

  canShowInterstitial(): boolean {
    if (this.userTotalGames < 3) return false;
    if (this.interstitialTodayCount >= 10) return false;
    if (Date.now() - this.interstitialLastShown < 120_000) return false;
    return true;
  }

  // Preloading: загружаем interstitial/rewarded заранее
  // Fallback: при ошибке загрузки — просто не показываем
}
```

### 5.3 Определение стора (для выбора SDK)

Определяется при сборке через EAS build profiles + env variables:

```
EAS profile "production-rustore"  → STORE=rustore  → YandexAdsProvider (primary)
EAS profile "production-huawei"   → STORE=huawei   → AdMobProvider (primary)
EAS profile "production"          → STORE=default   → AdMobProvider (primary)
```

### 5.4 Рекламные Unit ID

Хранятся в `src/constants/ads.ts` — тестовые для dev, реальные через .env для production.

---

## 6. Декомпозиция задач

### Спринт = 1 неделя. Общий объём: ~8 спринтов (56 дней).

### Спринт 1: Инфраструктура и база

| ID    | Задача                                                  | Пакет   | Зависит от | P    | Часы |
|-------|---------------------------------------------------------|---------|------------|------|------|
| T-001 | Инициализация монорепо (pnpm, turbo, tsconfig.base)     | root    | —          | P0   | 2    |
| T-002 | Настройка ESLint + Prettier + Husky + lint-staged       | root    | T-001      | P0   | 1    |
| T-003 | Создание packages/shared (типы, схемы, константы)       | shared  | T-001      | P0   | 3    |
| T-004 | Инициализация NestJS проекта + Prisma                   | server  | T-001      | P0   | 2    |
| T-005 | Prisma schema + первая миграция + seed (категории)      | server  | T-004      | P0   | 3    |
| T-006 | Docker-compose (PostgreSQL) + .env файлы                | server  | T-004      | P0   | 1    |
| T-007 | PrismaService, Health Controller, Global Pipes/Filters  | server  | T-005      | P0   | 2    |
| T-008 | Инициализация Expo проекта + metro.config (monorepo)    | mobile  | T-001      | P0   | 2    |
| T-009 | Инициализация React + Vite проекта + shadcn/ui          | web     | T-001      | P0   | 2    |

### Спринт 2: Дизайн-система + Auth

| ID    | Задача                                                  | Пакет   | Зависит от | P    | Часы |
|-------|---------------------------------------------------------|---------|------------|------|------|
| T-010 | Theme: colors, typography, spacing (mobile)             | mobile  | T-008      | P0   | 2    |
| T-011 | ThemeProvider (light/dark/system) + font loading         | mobile  | T-010      | P0   | 2    |
| T-012 | UI-компоненты: Button (3D), Card, ProgressBar           | mobile  | T-011      | P0   | 4    |
| T-013 | UI-компоненты: Input, Badge, Chip, Switch, ListItem     | mobile  | T-011      | P1   | 3    |
| T-014 | UI-компоненты: Screen, Toast, Skeleton, Empty/Error     | mobile  | T-011      | P0   | 3    |
| T-015 | Admin Auth module (JWT login/refresh, guard, strategy)   | server  | T-007      | P0   | 4    |
| T-016 | Admin Auth seed (create admin user on first run)         | server  | T-015      | P0   | 1    |
| T-017 | Users module (register device, update, stats)            | server  | T-007      | P0   | 4    |

### Спринт 3: Контент-модули (сервер)

| ID    | Задача                                                  | Пакет   | Зависит от | P    | Часы |
|-------|---------------------------------------------------------|---------|------------|------|------|
| T-018 | Categories module (CRUD, admin endpoints)                | server  | T-015      | P0   | 2    |
| T-019 | Questions module — CRUD + фильтры + пагинация            | server  | T-018      | P0   | 5    |
| T-020 | Questions module — approve/reject/bulk-approve            | server  | T-019      | P0   | 2    |
| T-021 | DailySets module — CRUD + автопубликация (cron)          | server  | T-019      | P0   | 4    |
| T-022 | DailySets module — GET /today (для mobile) + кэш         | server  | T-021      | P0   | 2    |
| T-023 | UserQuestionHistory — трекинг ответов, антиповтор        | server  | T-017      | P0   | 3    |
| T-024 | Questions GET /random — с учётом антиповтора             | server  | T-023      | P0   | 2    |
| T-025 | Swagger документация для всех endpoints                  | server  | T-024      | P1   | 2    |

### Спринт 4: AI + Upload + Leaderboard

| ID    | Задача                                                  | Пакет   | Зависит от | P    | Часы |
|-------|---------------------------------------------------------|---------|------------|------|------|
| T-026 | AI module — LLM provider (Claude/OpenAI abstraction)     | server  | T-019      | P0   | 3    |
| T-027 | AI module — генерация вопросов с sources                 | server  | T-026      | P0   | 4    |
| T-028 | AI module — генерация иллюстраций (DALL-E)               | server  | T-026      | P1   | 3    |
| T-029 | Upload module — S3 (Cloudflare R2) upload/presigned URL  | server  | T-007      | P0   | 2    |
| T-030 | Leaderboard module — daily/weekly/alltime                | server  | T-021      | P1   | 3    |
| T-031 | Admin Stats module — dashboard metrics, question stats   | server  | T-023      | P1   | 3    |
| T-032 | Rate limiting (Throttler) + Helmet + CORS                | server  | T-007      | P0   | 1    |

### Спринт 5: Админ-панель (Web)

| ID    | Задача                                                  | Пакет   | Зависит от | P    | Часы |
|-------|---------------------------------------------------------|---------|------------|------|------|
| T-033 | Auth store + Login page + JWT interceptor                | web     | T-015      | P0   | 3    |
| T-034 | AppLayout (Sidebar + Header)                             | web     | T-033      | P0   | 2    |
| T-035 | Dashboard page (DAU/MAU cards, pool status)              | web     | T-031      | P1   | 3    |
| T-036 | Questions List page (table, filters, bulk actions)       | web     | T-020      | P0   | 4    |
| T-037 | Question Detail page (edit, approve, reject, source)     | web     | T-036      | P0   | 3    |
| T-038 | Question Generate page (AI form, preview, approve)       | web     | T-027      | P0   | 4    |
| T-039 | Daily Sets Calendar + Create page                        | web     | T-021      | P0   | 4    |
| T-040 | Categories management page                               | web     | T-018      | P1   | 2    |
| T-041 | Illustration generation UI (preview, regenerate, upload)  | web     | T-028      | P1   | 3    |

### Спринт 6: Mobile — навигация, экраны, хуки

| ID    | Задача                                                  | Пакет   | Зависит от | P    | Часы |
|-------|---------------------------------------------------------|---------|------------|------|------|
| T-042 | expo-router навигация (tabs, stacks, modals)            | mobile  | T-012      | P0   | 3    |
| T-043 | API сервис (axios instance, interceptors, device header) | mobile  | T-042      | P0   | 2    |
| T-044 | Stores: useAppStore (deviceId, onboarding), useUserStore | mobile  | T-043      | P0   | 2    |
| T-045 | Stores: useSettingsStore (language, theme, push, sound)  | mobile  | T-043      | P0   | 2    |
| T-046 | i18n setup (i18next, ru.json, en.json)                   | mobile  | T-042      | P0   | 2    |
| T-047 | Onboarding screens (3 шага + language selection)         | mobile  | T-046      | P0   | 3    |
| T-048 | Home Screen (daily set card, infinite, streak badge)     | mobile  | T-044      | P0   | 4    |
| T-049 | Profile Screen (stats, heatmap, settings link)           | mobile  | T-044      | P1   | 3    |
| T-050 | Settings Screen (language, theme, push, sound)           | mobile  | T-045      | P1   | 2    |

### Спринт 7: Mobile — игры

| ID    | Задача                                                  | Пакет   | Зависит от | P    | Часы |
|-------|---------------------------------------------------------|---------|------------|------|------|
| T-051 | Game components: GameHeader, LetterTile, StreakBadge     | mobile  | T-012      | P0   | 3    |
| T-052 | Game components: FactCard, HintButton, DailyResultCard   | mobile  | T-051      | P0   | 3    |
| T-053 | Game: Анаграмма (drag/tap буквы + animations)            | mobile  | T-052      | P0   | 5    |
| T-054 | Game: Угадай слово / Wordle (keyboard + flip + colors)   | mobile  | T-052      | P0   | 5    |
| T-055 | Game: Составь слова (letter circle + word list)          | mobile  | T-052      | P0   | 4    |
| T-056 | Game: Цепочка слов (step-by-step input)                  | mobile  | T-052      | P1   | 3    |
| T-057 | Game: Поиск слов (WordGrid + gesture swipe)              | mobile  | T-052      | P1   | 5    |
| T-058 | Daily Set orchestrator (game/daily.tsx — 5 games loop)   | mobile  | T-053      | P0   | 3    |
| T-059 | Daily Results screen (score, streak, share)              | mobile  | T-058      | P0   | 3    |
| T-060 | Streak milestone modal (confetti, Lottie)                | mobile  | T-059      | P1   | 2    |

### Спринт 8: Реклама, Push, Polish, Deploy

| ID    | Задача                                                  | Пакет   | Зависит от | P    | Часы |
|-------|---------------------------------------------------------|---------|------------|------|------|
| T-061 | Ad Manager (AdMob) — banner, interstitial, rewarded      | mobile  | T-058      | P0   | 4    |
| T-062 | Ad components: AdBanner, InterstitialManager, Rewarded   | mobile  | T-061      | P0   | 3    |
| T-063 | Push notifications setup (expo-notifications + FCM)      | mobile  | T-048      | P0   | 3    |
| T-064 | Leaderboard screen                                       | mobile  | T-030      | P1   | 3    |
| T-065 | Nickname input modal                                     | mobile  | T-064      | P1   | 1    |
| T-066 | Offline mode (кэширование daily set, offline banner)     | mobile  | T-048      | P1   | 3    |
| T-067 | Share result image generation (expo-sharing)             | mobile  | T-059      | P1   | 2    |
| T-068 | Analytics events (expo-firebase-analytics)                | mobile  | T-048      | P1   | 2    |
| T-069 | EAS Build configs (dev, preview, production)             | mobile  | T-061      | P0   | 2    |
| T-070 | Server deployment (Docker → Railway/Render)              | server  | T-032      | P0   | 2    |
| T-071 | Web deployment (Vite build → Vercel/Cloudflare Pages)    | web     | T-041      | P0   | 1    |
| T-072 | CI/CD pipeline (GitHub Actions)                          | root    | T-070      | P1   | 2    |

### Пост-launch (v1.1+)

| ID    | Задача                                                  | Пакет   | P    |
|-------|---------------------------------------------------------|---------|------|
| T-080 | Выбор категорий интересов (FR-041)                       | all     | P2   |
| T-081 | Yandex Mobile Ads SDK (RuStore)                          | mobile  | P2   |
| T-082 | Huawei AppGallery submit + HMS fallback                  | mobile  | P2   |
| T-083 | Бесконечный режим — выбор формата игры                   | mobile  | P2   |
| T-084 | CSV import вопросов (админка)                            | web     | P2   |
| T-085 | Push-уведомления: «Стрик под угрозой» (вечерний cron)    | server  | P2   |

### Итого: ~72 задачи до первого релиза

---

## 7. Диаграмма зависимостей (ключевые)

```
T-001 (monorepo init)
├── T-002 (lint/format)
├── T-003 (shared package)
├── T-004 (NestJS init) → T-005 (Prisma) → T-007 (common) → T-015 (admin auth)
│                                                            → T-017 (users)
│                                                            → T-018 (categories)
│                                                            → T-019 (questions) → T-020 (approve)
│                                                                                → T-021 (daily-sets) → T-022 (/today)
│                                                            → T-023 (history) → T-024 (/random)
│                                                            → T-026 (AI) → T-027 (gen questions)
│                                                                          → T-028 (gen images)
│
├── T-008 (Expo init) → T-010 (theme) → T-011 (provider) → T-012 (UI components)
│                                                          → T-042 (navigation)
│                                                          → T-047 (onboarding)
│                                                          → T-048 (home) → T-058 (daily orchestrator)
│                                                          → T-051 (game components) → T-053..T-057 (5 games)
│
└── T-009 (Vite init) → T-033 (auth) → T-034 (layout) → T-036 (questions list)
                                                         → T-038 (AI generate)
                                                         → T-039 (daily sets)
```

---

## 8. Переменные окружения — сводная таблица

| Переменная           | Где используется | Обязательна | Описание |
|----------------------|-----------------|-------------|----------|
| `DATABASE_URL`       | server          | Да          | PostgreSQL connection string |
| `PORT`               | server          | Нет (3001)  | Порт сервера |
| `JWT_SECRET`         | server          | Да          | Секрет для JWT |
| `ADMIN_EMAIL`        | server (seed)   | Да          | Email админа |
| `ADMIN_PASSWORD`     | server (seed)   | Да          | Пароль админа |
| `ANTHROPIC_API_KEY`  | server          | Если LLM=anthropic | Ключ Claude API |
| `OPENAI_API_KEY`     | server          | Если LLM=openai или images | Ключ OpenAI |
| `AI_LLM_PROVIDER`   | server          | Да          | anthropic / openai |
| `AI_LLM_MODEL`      | server          | Да          | Модель LLM |
| `AI_IMAGE_PROVIDER`  | server          | Да          | dall-e / stable-diffusion |
| `S3_ENDPOINT`        | server          | Да          | Cloudflare R2 endpoint |
| `S3_BUCKET`          | server          | Да          | Имя бакета |
| `S3_ACCESS_KEY_ID`   | server          | Да          | S3 access key |
| `S3_SECRET_ACCESS_KEY`| server         | Да          | S3 secret key |
| `S3_PUBLIC_URL`      | server          | Да          | Публичный URL картинок |
| `API_URL`            | mobile          | Да          | URL API сервера |
| `VITE_API_URL`       | web             | Да          | URL API для админки |

---

## 9. Инфраструктура деплоя

### Server (NestJS)

```
Вариант 1 (рекомендуемый): Railway
- Бесплатный starter plan → $5/мес при росте
- PostgreSQL аддон (free tier 500MB)
- Автодеплой из GitHub
- Docker или Nixpacks

Вариант 2: Render
- Free web service (spin down after inactivity — не подходит для push-уведомлений)
- Starter $7/мес (always on)
- PostgreSQL free tier (90 дней, потом $7/мес)

Вариант 3: VPS (Hetzner/DigitalOcean)
- €4-5/мес за 2GB RAM
- Полный контроль
- Требует ручной настройки
```

### Web Admin (React + Vite)

```
Vercel (рекомендуемый):
- Free tier
- Автодеплой из GitHub
- Ограничить доступ через Vercel Authentication или IP-whitelist через middleware

Альтернатива: Cloudflare Pages (бесплатно)
```

### S3 Storage (Images)

```
Cloudflare R2:
- 10 GB бесплатно
- Egress бесплатно (!)
- S3-совместимый API
- Публичный домен для картинок
```

### Database

```
Railway PostgreSQL (рекомендуемый) или Neon (free tier):
- Railway: в составе проекта, простая настройка
- Neon: serverless PostgreSQL, 512MB free, автоскейлинг
```
