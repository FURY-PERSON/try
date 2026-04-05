# Исследование: Валюта "Щит" для защиты стрика

## Область: full-stack (server + mobile)

## Задача
Реализовать валюту "Щит" — при использовании во время игры защищает стрик от сброса при неправильном ответе.

## Затрагиваемые модули

### Server
- `server/src/modules/users/` — регистрация, статистика, обновление пользователя
- `server/src/modules/questions/` — `answerQuestion()` — основная логика streak reset (строки 93-98)
- `server/src/modules/daily-sets/` — `submitDailySet()` — дублирует streak логику (строки 336-346)
- `server/src/modules/home/` — `getFeed()` — возвращает `userProgress.streak`
- `server/src/modules/game-config/` — streak bonus config через feature flags
- `server/prisma/schema.prisma` — модель User (нет полей для shields)

### Mobile
- `mobile/src/features/game/` — основная фича игры
  - `hooks/useCardGame.ts` — логика ответов, streak increment (строка 124)
  - `stores/useGameStore.ts` — game state, currentStreak
  - `components/GameHeader.tsx` — верхняя панель игры (close + progress + streak badge)
  - `components/StreakBadge.tsx` — отображение streak
  - `api/gameApi.ts` — API-вызовы (submitAnswer, submitDailySet)
- `mobile/app/game/card.tsx` — экран игры, основной UI
- `mobile/app/(tabs)/home/index.tsx` — домашний экран, header с StreakBadge
- `mobile/src/stores/useAppStore.ts` — persisted app state (onboarding flags)
- `mobile/src/components/feedback/OverlayModal.tsx` — паттерн модальных окон
- `mobile/src/components/ads/DisableAdsModal.tsx` — пример rewarded video modal

## Существующие паттерны

### Streak logic (server)
- `questions.service.ts:93-98`: `if (isCorrect) { currentStreak++; currentAnswerStreak++ } else { currentStreak = 0; currentAnswerStreak = 0 }`
- `daily-sets.service.ts:340-346`: аналогичная логика для batch submit
- Два типа streak: `currentStreak` (ответы) и `currentAnswerStreak` (серия правильных подряд)
- Score = 0 при неправильном ответе

### Score calculation
- `QuestionsService.calculateScore()`: baseScore + difficultyBonus + timeBonus + streakBonusPercent
- Streak bonus через `GameConfigService.getStreakBonusPercent()` — feature flag `streak_bonus`

### Game flow (mobile)
- `useCardGame.handleSwipe()` → local check → `setLiveStreak(prev => isCorrect ? prev + 1 : 0)` → fire-and-forget `gameApi.submitAnswer()`
- При завершении → `submitDailySetResults()` / `submitCollectionResults()`
- Streak display: `GameHeader` → `StreakBadge`

### Home header
- `home/index.tsx:237-245`: `<Text>{t('home.title')}</Text>` + `<AdFreeIcon>` + `<StreakBadge>`
- Данные: `feed?.userProgress?.streak`

### Modal pattern
- `OverlayModal` — reusable animated overlay (backdrop + scale animation)
- `DisableAdsModal` — пример: rewarded video + `useRewardedAd()` hook

### Persisted state
- `useAppStore` (Zustand + AsyncStorage): boolean flags like `hasSeenSwipeAnswerHint`
- `useAdsStore`: ad-related state

### API pattern
- `apiClient` in `services/api.ts`: `get/post/patch/put/delete` with X-Device-Id header
- Feature-specific API files: `gameApi.ts`, `collectionsApi.ts`

### Rewarded ads
- `useRewardedAd()` hook — `{ showForReward, isReady, getAdNetwork }`
- `adManager.getRewardedUnitId()` — Unity rewarded ad unit

## Зависимости и интеграции
- Prisma ORM (PostgreSQL)
- `@nestjs/common` guards: `DeviceAuthGuard`, `@CurrentUser()` decorator
- `react-native-reanimated` — анимации
- `@tanstack/react-query` — серверное состояние
- `zustand` + AsyncStorage — клиентское состояние
- `i18next` — локализация (ru.json / en.json)
- Unity Ads — rewarded video

## Ключевые файлы
| Файл | Роль |
|------|------|
| `server/prisma/schema.prisma:10-35` | Модель User — добавить shields |
| `server/src/modules/questions/questions.service.ts:65-161` | answerQuestion — streak + shield |
| `server/src/modules/daily-sets/daily-sets.service.ts:219-499` | submitDailySet — streak + shield |
| `server/src/modules/users/users.service.ts` | getUserStats — добавить shields |
| `server/src/modules/users/users.controller.ts` | Добавить endpoint для shields |
| `server/src/modules/home/home.service.ts:32-38` | userProgress — добавить shields |
| `mobile/src/features/game/hooks/useCardGame.ts:65-178` | handleSwipe — shield usage |
| `mobile/src/features/game/stores/useGameStore.ts` | shield state |
| `mobile/src/features/game/components/GameHeader.tsx` | shield display in game |
| `mobile/app/(tabs)/home/index.tsx:236-245` | shield display in home header |
| `mobile/app/game/card.tsx` | shield UI + animation |
| `mobile/src/stores/useAppStore.ts` | guideline flags |

## Модель данных (Prisma)
- User: `currentStreak`, `bestStreak`, `currentAnswerStreak`, `bestAnswerStreak`, `totalScore`
- **Нет полей для shields/currency** — нужно добавить
- Нет моделей для транзакций валюты

## API контракты (существующие)
- `POST /v1/questions/:id/answer` — `{ userAnswer: boolean, timeSpentSeconds: number }` → `{ correct, score, isTrue, explanation, ... }`
- `POST /v1/daily-sets/:id/submit` — `{ results: [{ questionId, result, timeSpentSeconds }] }` → `{ score, streak, bestStreak, ... }`
- `GET /v1/users/me/stats` — `{ totalScore, currentStreak, bestStreak, ... }`
- `GET /v1/home/feed` — `{ daily, categories, collections, userProgress: { streak, nickname, avatarEmoji } }`
