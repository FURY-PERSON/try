# Фаза 6: QA — Найденные баги и проблемы

---

## CRITICAL (3)

### BUG-001: Использование `any` в серверных контроллерах
- **Файлы**: `apps/server/src/modules/*/controllers`
- **Описание**: Контроллеры используют `@CurrentUser() user: any` вместо типизированного User
- **Риск**: Runtime ошибки, возможность обращения к undefined свойствам
- **Решение**: Создать тип User в shared и использовать `@CurrentUser() user: User`
- **Статус**: Частично в UsersController (User из @prisma/client), остальные используют any

### ~~BUG-002: Несоответствие DTO между api-client и сервером~~ ✅ ИСПРАВЛЕНО (Phase 6, итерация 1)
- **Файлы**: `packages/api-client/src/types.ts` vs `apps/server/src/modules/daily-sets/dto/submit-daily-set.dto.ts`
- **Описание**: Клиент отправляет `{ correct: boolean, timeSeconds: number, hintUsed: boolean }`, сервер ожидает `{ result: 'correct'|'incorrect', timeSpentSeconds: number }`

### ~~BUG-003: Отсутствие try-catch при JSON.parse AI ответов~~ ✅ НЕ БАГ
- **Файл**: `apps/server/src/modules/ai/ai.service.ts:125`
- **Описание**: JSON.parse уже находится внутри try-catch блока (строки 92-138), ошибка перехватывается

---

## CRITICAL — НОВЫЕ (найдены в итерации 2)

### BUG-020: Prisma Client не генерируется при установке ✅ ИСПРАВЛЕНО
- **Описание**: `Cannot find module '.prisma/client/default'` при запуске сервера
- **Причина**: Prisma Client не был сгенерирован после установки зависимостей
- **Решение**: Выполнен `prisma generate` + `prisma migrate deploy`

### BUG-021: 10 ошибок компиляции TypeScript в серверном коде ✅ ИСПРАВЛЕНО
- **Описание**: Сервер не собирался из-за TypeScript ошибок
- **Исправлено**:
  - `createPaginatedResponse` вызывался с 4 аргументами вместо 3
  - `Record<string, unknown>` не совместим с `Prisma.InputJsonValue` (добавлены касты)
  - `Express.Multer.File` — заменён на inline тип
  - `response.data` possibly undefined — добавлена optional chaining
  - `LeaderboardResponse` не экспортировался — добавлен export + return types

### BUG-022: `compression` не работает — esModuleInterop не включён ✅ ИСПРАВЛЕНО
- **Файл**: `apps/server/tsconfig.json`
- **Описание**: `import compression from 'compression'` не работает в runtime из-за отсутствия `esModuleInterop`
- **Решение**: Добавлен `esModuleInterop: true`

### BUG-023: Дублирование маршрутов `/api/api/v1/...` ✅ ИСПРАВЛЕНО
- **Файлы**: Все контроллеры в `apps/server/src/modules/`
- **Описание**: `main.ts` устанавливает `setGlobalPrefix('api')`, а контроллеры используют `@Controller('api/v1/...')`, в результате маршруты дублируются: `/api/api/v1/...`
- **Решение**: Изменены все контроллеры на `@Controller('v1/...')`

---

## HIGH (5)

### ~~BUG-004: Несуществующее поле correctAnswer в gameApi~~ ✅ ИСПРАВЛЕНО (Phase 6, итерация 1)

### ~~BUG-005: Race condition при отправке результатов daily set~~ ✅ ИСПРАВЛЕНО
- **Файл**: `apps/server/src/modules/daily-sets/daily-sets.service.ts`
- **Описание**: Check-then-act паттерн: два параллельных запроса могут пройти проверку на дубликат
- **Решение**: Добавлена обработка `Prisma.PrismaClientKnownRequestError` с кодом `P2002` (unique constraint violation)

### BUG-006: Тихий отказ в storage сервисе
- **Файл**: `apps/mobile/src/services/storage.ts`
- **Описание**: Все catch блоки тихо проглатывают ошибки, fallback SecureStore → AsyncStorage небезопасен для токенов
- **Статус**: Открыт

### ~~BUG-007: Отсутствие enum-валидации в filter DTO~~ ✅ ИСПРАВЛЕНО
- **Файл**: `apps/server/src/modules/questions/dto/question-filter.dto.ts`
- **Описание**: language, type принимали любые строки
- **Решение**: Добавлены `@IsIn()` декораторы с допустимыми значениями

### BUG-008: Необработанные ошибки API в mobile хуках
- **Файл**: `apps/mobile/src/features/game/api/gameApi.ts`
- **Описание**: API вызовы могут падать без обработки ошибок, что приведёт к crash
- **Статус**: Открыт (React Query обрабатывает, но нужно error UI)

---

## MEDIUM (7)

### ~~BUG-009: Несоответствие поля в AnswerQuestionDto~~ ✅ ИСПРАВЛЕНО (Phase 6, итерация 1)

### ~~BUG-010: Отсутствие валидации формата device ID~~ ✅ ИСПРАВЛЕНО
- **Файл**: `apps/server/src/common/guards/device-auth.guard.ts`
- **Решение**: Добавлена проверка длины (8-256 символов)

### BUG-011: JWT токены в localStorage без шифрования (web)
- **Файл**: `apps/web/src/stores/useAuthStore.ts`
- **Статус**: Открыт

### ~~BUG-012: Плавающая точка при подсчёте стрика~~ ✅ ИСПРАВЛЕНО
- **Файл**: `apps/server/src/modules/daily-sets/daily-sets.service.ts`
- **Описание**: Деление timestamp даёт дробные числа, сравнение `=== 1` ненадёжно
- **Решение**: Добавлен `Math.round()` перед сравнением

### BUG-013: Нет Error Boundary в web-приложении
- **Файл**: `apps/web/src/App.tsx`
- **Статус**: Открыт

### BUG-014: Потенциальная утечка памяти в useAppState
- **Файл**: `apps/mobile/src/hooks/useAppState.ts`
- **Статус**: Открыт

### ~~BUG-015: @react-native-community/netinfo не в зависимостях~~ ✅ ИСПРАВЛЕНО (Phase 6, итерация 1)

---

## LOW (4)

### BUG-016: Пустые catch блоки в рекламных компонентах
- **Файлы**: `InterstitialManager.tsx`, `RewardedAdManager.tsx`
- **Статус**: Открыт

### BUG-017: Захардкоженная модель AI по умолчанию
- **Файл**: `apps/server/src/modules/ai/ai.service.ts`
- **Статус**: Открыт

### BUG-018: Нет .env.example для mobile
- **Статус**: Открыт

### BUG-019: Непоследовательный стиль сообщений об ошибках
- **Статус**: Открыт

---

## LOW — НОВЫЕ (найдены в итерации 2)

### BUG-024: Jest не настроен для server и shared пакетов ✅ ИСПРАВЛЕНО
- **Описание**: Серверные тесты не запускались из-за отсутствия конфигурации ts-jest
- **Решение**: Добавлена секция `jest` в `apps/server/package.json` с ts-jest transform и moduleNameMapper

### BUG-025: Jest не настроен для mobile — path aliases ✅ ИСПРАВЛЕНО
- **Описание**: `@/` path alias не резолвился в тестах
- **Решение**: Добавлен `moduleNameMapper` в `apps/mobile/package.json`

### BUG-026: ads.test.ts импортирует react-native через @/constants/ads ✅ ИСПРАВЛЕНО
- **Описание**: Тест импортировал `AD_FREQUENCY` из модуля, зависящего от `react-native`, что требует полного RN окружения
- **Решение**: Заинлайнены константы в тест-файле

---

## Сводка

| Категория | Всего | Исправлено | Открыто |
|-----------|-------|------------|---------|
| Critical  | 6     | 5          | 1       |
| High      | 5     | 3          | 2       |
| Medium    | 7     | 4          | 3       |
| Low       | 7     | 3          | 4       |
| **Итого** | **25** | **15**    | **10**  |

## Приоритет оставшихся исправлений

1. BUG-001 (any types) — типобезопасность контроллеров
2. BUG-006 (silent storage errors) — безопасность хранилища
3. BUG-008 (error UI) — UX при ошибках API
4. BUG-013 (Error Boundary web) — устойчивость web-приложения
5. Остальные LOW — при наличии времени
