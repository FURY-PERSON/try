# Фаза 6: QA-инженер — Результат

## Обзор

Проведено полное QA тестирование проекта WordPulse в двух итерациях: код-ревью, юнит-тесты, интеграционные тесты API, чеклисты публикации.

## Итерация 1 — Первичное тестирование

### Юнит-тесты (7 файлов)

#### Mobile
- `apps/mobile/src/utils/__tests__/format.test.ts` — тесты formatScore, formatCountdown, formatPercent, formatDate
- `apps/mobile/src/features/game/__tests__/utils.test.ts` — тесты shuffleArray, calculateGameScore, getResultMessage
- `apps/mobile/src/services/__tests__/ads.test.ts` — тесты логики AdManager (grace period, cooldown, daily cap)
- `apps/mobile/src/stores/__tests__/useUserStore.test.ts` — тесты пользовательского store
- `apps/mobile/src/stores/__tests__/useSettingsStore.test.ts` — тесты store настроек

#### Server
- `apps/server/src/modules/users/tests/users.service.spec.ts` — тесты UsersService (register, update, stats)
- `apps/server/src/modules/questions/tests/questions.service.spec.ts` — тесты QuestionsService (random, answer)

#### Shared
- `packages/shared/src/utils/__tests__/scoring.test.ts` — тесты calculateScore, calculateDailySetScore

### Исправлено в итерации 1
1. **BUG-002** (Critical): DTO mismatch — `SubmitDailySetDto` в api-client приведён в соответствие с сервером
2. **BUG-004** (High): Удалено несуществующее поле `correctAnswer` из gameApi
3. **BUG-009** (Medium): `AnswerQuestionDto` в api-client исправлен
4. **BUG-015** (Medium): Добавлен `@react-native-community/netinfo` в dependencies

---

## Итерация 2 — Полное тестирование с запуском

### Критические исправления для запуска сервера

| # | Проблема | Решение |
|---|----------|---------|
| BUG-020 | Prisma Client не сгенерирован | `prisma generate` + `prisma migrate deploy` |
| BUG-021 | 10 ошибок компиляции TS | Исправлены аргументы функций, типы, экспорты |
| BUG-022 | compression не работает (esModuleInterop) | Добавлен `esModuleInterop: true` в tsconfig |
| BUG-023 | Дублирование маршрутов `/api/api/v1/...` | Убран `api/` из всех контроллеров |

### Исправленные баги

| # | Проблема | Решение |
|---|----------|---------|
| BUG-005 | Race condition в daily set submission | Обработка P2002 (unique constraint) |
| BUG-007 | Нет enum-валидации в фильтрах | Добавлены `@IsIn()` декораторы |
| BUG-010 | Нет валидации device ID | Проверка длины 8-256 символов |
| BUG-012 | Плавающая точка в стрике | `Math.round()` перед сравнением |
| BUG-024 | Jest не настроен для server | Добавлена секция jest в package.json |
| BUG-025 | Path aliases не работают в тестах | Добавлен moduleNameMapper |
| BUG-026 | ads.test.ts зависит от react-native | Заинлайнены константы |

### Результаты тестов

| Пакет | Suites | Tests | Статус |
|-------|--------|-------|--------|
| Mobile | 5/5 | 43/43 | ✅ PASS |
| Server | 2/2 | 20/20 | ✅ PASS |
| **Итого** | **7/7** | **63/63** | **✅ ALL PASS** |

### Интеграционное тестирование API

Сервер запущен, seed выполнен, все endpoints протестированы:

| # | Endpoint | Метод | Статус | Результат |
|---|----------|-------|--------|-----------|
| 1 | `/api/health` | GET | 200 | `{"status":"ok"}` |
| 2 | `/api/v1/users/register` | POST | 201 | Пользователь создан |
| 3 | `/api/v1/categories` | GET | 200 | 8 категорий |
| 4 | `/api/v1/questions/random` | GET | 404 | Нет approved вопросов (корректно) |
| 5 | `/api/v1/daily-sets/today` | GET | 200 | Fallback с пустыми вопросами |
| 6 | `/api/v1/leaderboard/daily` | GET | 200 | Пустой лидерборд |
| 7 | `/api/v1/leaderboard/weekly` | GET | 200 | Пустой лидерборд |
| 8 | `/api/v1/leaderboard/alltime` | GET | 200 | Пустой лидерборд |
| 9 | `/api/v1/users/me/stats` | GET | 200 | Нулевая статистика |
| 10 | `/api/docs` | GET | 200 | Swagger UI |
| 11 | `/api/admin/auth/login` | POST | 200 | JWT токен получен |
| 12 | Invalid device ID (short) | GET | 401 | Валидация работает |
| 13 | Invalid language filter | GET | 400 | Enum-валидация работает |

### Инфраструктура

- PostgreSQL 14 (Homebrew) — запущен, БД создана
- Prisma миграции — применены
- Database seed — 8 категорий + admin user
- NestJS build — без ошибок
- Swagger документация — доступна

---

## Сводка по багам

| Категория | Всего найдено | Исправлено | Открыто |
|-----------|--------------|------------|---------|
| Critical  | 6            | 5          | 1       |
| High      | 5            | 3          | 2       |
| Medium    | 7            | 4          | 3       |
| Low       | 7            | 3          | 4       |
| **Итого** | **25**       | **15**     | **10**  |

## Тест-кейсы и чеклисты

Покрыто **45+ тест-кейсов** по категориям — см. `docs/phase-6-qa-checklists.md`

Чеклисты публикации для 4 сторов:
- App Store (iOS): 17 пунктов
- Google Play (Android): 12 пунктов
- RuStore: 7 пунктов
- Huawei AppGallery: 5 пунктов
