# Исследование: Факт дня

## Область: full-stack (server + mobile)

## Задача
Выделить 1 вопрос из Daily Set как «Факт дня» — самый удивительный/контринтуитивный. После ответа показать экран со статистикой ответов других игроков + кнопка шеринга.

## Затрагиваемые модули

### Server
- `server/src/modules/daily-sets/` — основной модуль daily sets
- `server/src/modules/admin/daily-sets/` — админское управление daily sets
- `server/prisma/schema.prisma` — модели DailySet, DailySetQuestion, Question

### Mobile
- `mobile/app/game/daily.tsx` — entry point для daily game
- `mobile/app/game/card.tsx` — игровой экран с карточками
- `mobile/app/modal/results.tsx` — экран результатов после завершения
- `mobile/src/features/game/` — stores, hooks, api, types, components
- `mobile/src/utils/share.ts` — существующий шеринг

## Существующие паттерны

### Server
- DailySet модель: `server/prisma/schema.prisma:94-107` — id, date, theme, themeEn, status
- DailySetQuestion: `server/prisma/schema.prisma:109-119` — dailySetId, questionId, sortOrder
- Question stats: `server/prisma/schema.prisma:75-77` — timesShown, timesCorrect, avgTimeSeconds
- getTodaySet: `server/src/modules/daily-sets/daily-sets.service.ts:17-211` — возвращает daily set с вопросами
- submitDailySet: `server/src/modules/daily-sets/daily-sets.service.ts:213-445` — возвращает score, correctPercent, percentile
- Admin create: `server/src/modules/admin/daily-sets/dto/create-daily-set.dto.ts` — date, theme, themeEn, questionIds, status

### Mobile
- gameApi.getTodaySet(): `mobile/src/features/game/api/gameApi.ts:34-37`
- gameApi.submitDailySet(): `mobile/src/features/game/api/gameApi.ts:51-60`
- SubmissionResult type: `mobile/src/features/game/types.ts:18-29`
- DailySetWithQuestions type: `mobile/src/shared/types/daily-set.ts:29-45`
- Results modal: `mobile/app/modal/results.tsx` — показывает score, correctPercent, streak
- shareResult(): `mobile/src/utils/share.ts:10-18` — шеринг результатов
- shareFact(): `mobile/src/utils/share.ts:21-29` — шеринг факта
- i18n: `mobile/src/i18n/locales/ru.json`, `en.json`

## Зависимости и интеграции
- Question.timesShown / Question.timesCorrect — уже есть статистика для расчёта % неправильных ответов
- Атомарное обновление статистики: `server/src/modules/shared/update-question-stats.ts`
- Шеринг через React Native Share API

## Ключевые файлы
1. `server/prisma/schema.prisma` — добавить factOfDayQuestionId в DailySet
2. `server/src/modules/daily-sets/daily-sets.service.ts` — вернуть fact-of-day данные
3. `server/src/modules/admin/daily-sets/` — возможность выбрать fact of day
4. `mobile/src/shared/types/daily-set.ts` — добавить тип
5. `mobile/src/features/game/types.ts` — расширить SubmissionResult
6. `mobile/app/modal/results.tsx` — показать fact of day
7. `mobile/src/utils/share.ts` — шеринг факта дня
8. `mobile/src/i18n/locales/` — переводы

## Модель данных (Prisma)
- DailySet: id, date, theme, themeEn, status — **нет** поля для fact of day
- Question: timesShown, timesCorrect — можно вычислить % неправильных = (1 - timesCorrect/timesShown) * 100
- DailySetQuestion: dailySetId, questionId, sortOrder — **нет** isFeatured/isFactOfDay

## API контракты
- GET /v1/daily-sets/today — возвращает DailySetWithQuestions
- POST /v1/daily-sets/:id/submit — возвращает SubmissionResult (score, correctAnswers, etc.)
- Нет эндпоинта для fact of day
