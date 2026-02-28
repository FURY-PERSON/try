# Отчет Tech Lead: Ревью серверной части

## Дата: 2026-02-28

---

## 1. Критические проблемы производительности

### 1.1. N+1 запрос при submit в DailySetsService (КРИТИЧНАЯ)

**Файл:** `/server/src/modules/daily-sets/daily-sets.service.ts`, строки 334-357

Внутри транзакции для каждого результата ответа (15 вопросов в daily set) выполняется отдельный `findUnique` + `update` к таблице `Question`. Это создает **30 запросов к БД** вместо 2.

```typescript
// Текущий код — N+1 паттерн:
for (const result of dto.results) {
  const isCorrect = result.result === 'correct';
  const question = await tx.question.findUnique({    // <-- запрос в цикле
    where: { id: result.questionId },
  });
  if (question) {
    await tx.question.update({                        // <-- ещё запрос в цикле
      where: { id: result.questionId },
      data: { ... },
    });
  }
}
```

**Решение:** Загрузить все вопросы одним `findMany` до цикла (они уже есть в `dailySet.questions`), а обновления выполнять через `$executeRaw` с `CASE WHEN` или собирать updates в `Promise.all`.

---

### 1.2. N+1 запрос при submit в CollectionsService (КРИТИЧНАЯ)

**Файл:** `/server/src/modules/collections/collections.service.ts`, строки 233-255

Абсолютно та же проблема, что и в п.1.1. Для каждого ответа в коллекции выполняется отдельный `findUnique` + `update` к таблице `Question`.

```typescript
for (const result of dto.results) {
  const isCorrect = result.result === 'correct';
  const question = await tx.question.findUnique({    // <-- N+1
    where: { id: result.questionId },
  });
  if (question) {
    await tx.question.update({ ... });               // <-- ещё N+1
  }
}
```

**Решение:** Аналогично п.1.1 — загрузить все вопросы одним запросом и использовать batch update.

---

### 1.3. Загрузка ВСЕХ пользователей в getAllTimeLeaderboard (КРИТИЧНАЯ)

**Файл:** `/server/src/modules/leaderboard/leaderboard.service.ts`, строки 99-111

Метод `getAllTimeLeaderboard` загружает **ВСЕХ** пользователей с ненулевым показателем в память, сортирует в JS, ищет позицию текущего пользователя линейным поиском, затем берет топ-100. При 100K+ пользователей это катастрофа.

```typescript
const users = await this.prisma.user.findMany({
  where: type === 'score'
    ? { totalScore: { gt: 0 } }
    : { totalCorrectAnswers: { gt: 0 } },
  select: { ... },
  orderBy,
  // Нет take/limit — загружает ВСЕ записи!
});

const totalPlayers = users.length;               // подсчёт в JS
const userIndex = users.findIndex(...);          // линейный поиск O(n)
const top100 = users.slice(0, 100);              // после загрузки всех
```

**Решение:** Использовать `COUNT` для `totalPlayers`, отдельный запрос с `take: 100` для топа, и raw SQL для определения позиции пользователя.

---

### 1.4. Загрузка ВСЕХ пользователей в getStreakLeaderboard (КРИТИЧНАЯ)

**Файл:** `/server/src/modules/leaderboard/leaderboard.service.ts`, строки 169-182

Та же проблема, что в п.1.3 — загрузка всех пользователей с `bestAnswerStreak > 0` в память.

---

### 1.5. Полная агрегация UserQuestionHistory в памяти сервера (КРИТИЧНАЯ)

**Файл:** `/server/src/modules/leaderboard/leaderboard.service.ts`, строки 399-446

Метод `getAggregatedLeaderboard` выполняет raw SQL без `LIMIT`, получает агрегированные данные по ВСЕМ пользователям, затем сортирует в JS:

```typescript
aggregated = await this.prisma.$queryRaw<AggRow[]>`
  SELECT "userId", COUNT(*) ...
  FROM "UserQuestionHistory"
  WHERE "answeredAt" >= ${dateFilter.gte} ...
  GROUP BY "userId"
  HAVING COUNT(*) FILTER (WHERE "result" = 'correct') > 0
`;  // Нет LIMIT — все пользователи

aggregated.sort((a, b) => { ... });              // Сортировка в JS
```

**Решение:** Добавить `ORDER BY` и `LIMIT` в SQL-запрос. Для определения позиции пользователя — отдельный запрос.

---

### 1.6. Home feed: множественные запросы на каждую категорию (ВЫСОКАЯ)

**Файл:** `/server/src/modules/home/home.service.ts`, строки 152-209

Метод `getCategoriesWithCount` для **каждой** категории выполняет 3 параллельных запроса (count доступных, count всего, findMany для подсчёта отвеченных):

```typescript
const counts = await Promise.all(
  categories.map(async (cat) => {
    const [availableCount, totalCount, catQuestions] = await Promise.all([
      this.prisma.question.count({ where: { ...catWhere, NOT: { id: { in: excludedIds } } } }),
      this.prisma.question.count({ where: catWhere }),
      this.prisma.question.findMany({         // <-- загружает ВСЕ вопросы категории
        where: catWhere,
        select: { id: true },
      }),
    ]);
    const answeredCount = catQuestions.filter((q) => answeredSet.has(q.id)).length;
  }),
);
```

При 10 категориях это **30 запросов** к БД. Плюс `catQuestions` загружает все ID вопросов каждой категории в память.

**Решение:** Использовать один SQL-запрос с `GROUP BY categoryId` и подзапросами.

---

### 1.7. Home feed: getDifficultyProgress загружает все вопросы (ВЫСОКАЯ)

**Файл:** `/server/src/modules/home/home.service.ts`, строки 212-234

Для каждого уровня сложности загружаются ВСЕ id вопросов, потом считается пересечение в JS:

```typescript
for (const [key, levels] of Object.entries(difficultyMap)) {
  const questions = await this.prisma.question.findMany({   // <-- 3 запроса в цикле
    where: { status: 'approved', difficulty: { in: levels } },
    select: { id: true },                                    // <-- все ID в память
  });
  const answeredCount = questions.filter((q) => answeredSet.has(q.id)).length;
}
```

**Решение:** Один raw SQL запрос с `CASE WHEN difficulty IN (1,2) THEN 'easy' ...` и `LEFT JOIN` на историю пользователя.

---

### 1.8. DeviceAuthGuard: запрос к БД на КАЖДЫЙ запрос (СРЕДНЯЯ)

**Файл:** `/server/src/common/guards/device-auth.guard.ts`, строки 25-48

Каждый защищённый endpoint выполняет `findUnique` по `deviceId`. При высокой нагрузке это критический bottleneck.

```typescript
const existing = await this.prisma.user.findUnique({
  where: { deviceId },   // Запрос на каждый HTTP-запрос
});
```

**Решение:** Добавить in-memory кэш (LRU) с TTL 5-10 минут для маппинга `deviceId -> User`. Можно использовать `@nestjs/cache-manager` или простой LRU-кэш.

---

### 1.9. anti-repeat.ts: загрузка всей истории пользователя (СРЕДНЯЯ)

**Файл:** `/server/src/modules/shared/anti-repeat.ts`, строки 21-32

Функция `getExcludedQuestionIds` загружает ВСЮ историю ответов пользователя за 14 дней без лимита:

```typescript
const recentHistory = await prisma.userQuestionHistory.findMany({
  where: {
    userId,
    answeredAt: { gte: cutoffDate },
  },
  // Нет limit — при активном использовании может быть тысячи записей
});
```

А функция `getAllAnsweredQuestionIds` загружает ВСЕ уникальные questionId без ограничений:

```typescript
const records = await prisma.userQuestionHistory.findMany({
  where: { userId },
  select: { questionId: true },
  distinct: ['questionId'],   // Нет limit!
});
```

**Решение:** Для `getExcludedQuestionIds` — можно вычислять на уровне SQL. Для `getAllAnsweredQuestionIds` — использовать `COUNT` вместо загрузки всех ID, когда нужен только подсчёт.

---

### 1.10. Дублирование вычислений anti-repeat в Home feed (СРЕДНЯЯ)

**Файл:** `/server/src/modules/home/home.service.ts`, строки 169-170

```typescript
const excludedIds = await getExcludedQuestionIds(this.prisma, userId);   // запрос 1
const answeredIds = await getAllAnsweredQuestionIds(this.prisma, userId); // запрос 2
```

Обе функции запрашивают `UserQuestionHistory` — можно объединить в один запрос.

---

### 1.11. QuestionsService.getRandomQuestion: double count (НИЗКАЯ)

**Файл:** `/server/src/modules/questions/questions.service.ts`, строки 51-65

Выполняется `count` + `findFirst(skip: random)`. Два отдельных запроса с одинаковым WHERE к большой таблице. При этом `count` с `NOT { history: { some: ... } }` — очень тяжёлый запрос с подзапросом.

**Решение:** Использовать `$queryRaw` с `ORDER BY random() LIMIT 1` или `TABLESAMPLE`.

---

### 1.12. getUserStats: 4 последовательных запроса к БД (НИЗКАЯ)

**Файл:** `/server/src/modules/users/users.service.ts`, строки 75-160

Метод выполняет 4 запроса последовательно вместо параллельно (кроме первого, все независимы). Можно обернуть в `Promise.all`.

```typescript
const user = await this.prisma.user.findUnique({ ... });           // 1
const factsLearned = await this.prisma.userQuestionHistory.count({ ... });  // 2
const scoreAgg = await this.prisma.leaderboardEntry.aggregate({ ... });     // 3
const leaderboardEntries = await this.prisma.leaderboardEntry.findMany({ ... }); // 4
const collectionProgress = await this.prisma.userCollectionProgress.findMany({ ... }); // 5
```

**Решение:** Запросы 2-5 не зависят друг от друга — обернуть в `Promise.all`.

---

## 2. Проблемы хранения данных

### 2.1. Таблица UserQuestionHistory — бесконтрольный рост (КРИТИЧНАЯ)

**Файл:** `/server/prisma/schema.prisma`, строки 107-122

Каждый ответ каждого пользователя сохраняется навсегда. При 10K пользователей по 20 ответов/день = **200K записей/день** = **73M записей/год**.

Таблица используется для:
- Anti-repeat (нужны только последние 14 дней)
- Лидерборд по периодам (агрегация)
- Подсчёт "factsLearned"
- Activity map (последний год)

**Решение:**
1. Создать cron-задачу для архивации/удаления записей старше 90 дней
2. Агрегированные данные хранить в отдельной таблице `UserDailyStats` (date, userId, correct, incorrect, totalTime)
3. Поле `totalCorrectAnswers` в User уже дублирует подсчёт — можно использовать его вместо агрегации

---

### 2.2. Таблица UserCollectionProgress — дублирование с UserQuestionHistory (СРЕДНЯЯ)

**Файл:** `/server/prisma/schema.prisma`, строки 190-204

Каждое прохождение коллекции, категории, ежедневного набора сохраняется отдельной записью. При этом те же данные уже есть в `UserQuestionHistory` (их можно агрегировать).

**Решение:** Оценить, нужна ли эта таблица вообще, или достаточно агрегации из `UserQuestionHistory`. Если нужна — добавить retention policy.

---

### 2.3. Поля timesShown/timesCorrect/avgTimeSeconds в Question — race condition (СРЕДНЯЯ)

**Файл:** `/server/prisma/schema.prisma`, строки 68-70

Эти поля обновляются при каждом ответе (не атомарно). При конкурентных запросах будет lost update:

```typescript
// В questions.service.ts, строки 110-123:
const newTimesShown = question.timesShown + 1;   // Прочитали значение
// ...
await this.prisma.question.update({
  data: { timesShown: newTimesShown },           // Записали прочитанное + 1
  // Если другой запрос прочитал то же значение — потеря данных
});
```

**Решение:** Использовать атомарный increment:
```typescript
await this.prisma.question.update({
  where: { id: questionId },
  data: {
    timesShown: { increment: 1 },
    timesCorrect: { increment: isCorrect ? 1 : 0 },
    // avgTimeSeconds нужно пересчитывать через raw SQL
  },
});
```

---

### 2.4. Notification — бесконтрольный рост (НИЗКАЯ)

**Файл:** `/server/prisma/schema.prisma`, строки 206-215

Каждая отправленная нотификация сохраняется навсегда. При ежедневной рассылке через год будет 365+ записей — это не критично, но retention policy не помешает.

---

## 3. Аналитика для удаления

Поскольку проект теперь использует Firebase для аналитики, серверная аналитика должна быть удалена или значительно упрощена. Вот полный список кода, связанного с аналитикой:

### 3.1. AdminStatsService.getUserAnalytics() — КАНДИДАТ на удаление

**Файл:** `/server/src/modules/admin/stats/admin-stats.service.ts`, строки 199-271

Метод `getUserAnalytics` вычисляет:
- DAU (ежедневные активные пользователи) — тяжёлый raw SQL запрос
- Новые пользователи по дням — запрос с GROUP BY
- Топ игроков — запрос с ORDER BY
- Общая точность ответов — groupBy

Эти данные доступны в Firebase Analytics (DAU, MAU, retention, user activity). Серверный вычисление — дублирование.

**Рекомендация:** Удалить метод `getUserAnalytics` и соответствующий endpoint.

### 3.2. AdminStatsController.getUserAnalytics() — endpoint для удаления

**Файл:** `/server/src/modules/admin/stats/admin-stats.controller.ts`, строки 38-46

```typescript
@Get('user-analytics')
@ApiOperation({ summary: 'Get user analytics' })
async getUserAnalytics() {
  return this.adminStatsService.getUserAnalytics();
}
```

**Рекомендация:** Удалить endpoint.

### 3.3. Тест admin-stats.service.spec.ts — обновить

**Файл:** `/server/src/modules/admin/stats/tests/admin-stats.service.spec.ts`

Удалить тесты, связанные с `getUserAnalytics`.

### 3.4. Поля Question: timesShown, timesCorrect, avgTimeSeconds — ПЕРЕСМОТРЕТЬ

**Файл:** `/server/prisma/schema.prisma`, строки 68-70

Эти поля — серверная аналитика по вопросам. Они используются в `AdminStatsService.getQuestionStats()` для отображения самых сложных/лёгких вопросов. Это полезно для контентной команды (админ-панель), поэтому **НЕ удалять**, но:

**Рекомендация:** Пересчитывать эти поля через cron (раз в час) из `UserQuestionHistory`, а не при каждом ответе. Это:
1. Устраняет race condition (п.2.3)
2. Убирает лишние update-запросы из hot path ответа на вопрос
3. Позволяет со временем удалить старые записи из `UserQuestionHistory`

### 3.5. Что НЕ нужно удалять

- `AdminStatsService.getDashboard()` — полезна для админ-панели (общие счётчики)
- `AdminStatsService.getQuestionStats()` — полезна для контент-менеджмента
- Поля `User.totalScore`, `totalCorrectAnswers`, `totalGamesPlayed` — нужны для лидерборда

---

## 4. Индексы

### 4.1. Отсутствующие индексы

#### 4.1.1. Question.status (КРИТИЧНАЯ)

Почти все запросы фильтруют по `status = 'approved'`. Без индекса это full table scan.

```prisma
// Добавить в модель Question:
@@index([status])
```

#### 4.1.2. Question.categoryId (ВЫСОКАЯ)

Используется в фильтрации вопросов по категориям, но индекса нет. Prisma создаёт FK constraint, но не всегда создаёт index.

```prisma
@@index([categoryId])
```

#### 4.1.3. Question.language (СРЕДНЯЯ)

Фильтрация по языку используется в `getRandomQuestion` и в admin-панели.

```prisma
@@index([language])
```

#### 4.1.4. Составной индекс Question [status, categoryId] (ВЫСОКАЯ)

Очень часто используется комбинация `status = 'approved' AND categoryId = X`.

```prisma
@@index([status, categoryId])
```

#### 4.1.5. Составной индекс Question [status, difficulty] (СРЕДНЯЯ)

Используется в `startByDifficulty` и `getDifficultyProgress`.

```prisma
@@index([status, difficulty])
```

#### 4.1.6. LeaderboardEntry.userId (СРЕДНЯЯ)

Используется при проверке weekly lockout (поиск по userId + createdAt). Составной индекс:

```prisma
@@index([userId, createdAt])
```

Текущий индекс `@@index([dailySetId, score(sort: Desc)])` покрывает только ранжирование в рамках daily set.

#### 4.1.7. User.lastPlayedDate (НИЗКАЯ)

Используется в `AdminStatsService.getDashboard()` для DAU/MAU.

```prisma
@@index([lastPlayedDate])
```

#### 4.1.8. DailySetQuestion.dailySetId (НИЗКАЯ)

Уже есть unique constraint `@@unique([dailySetId, questionId])`, который Prisma использует как индекс. Дополнительный индекс не нужен.

### 4.2. Существующие индексы — оценка

| Индекс | Модель | Статус |
|--------|--------|--------|
| `@@index([userId, questionId])` | UserQuestionHistory | OK — используется в anti-repeat |
| `@@index([userId, result])` | UserQuestionHistory | OK — используется в подсчётах |
| `@@index([userId, answeredAt])` | UserQuestionHistory | OK — используется в лидерборде |
| `@@index([dailySetId, score(sort: Desc)])` | LeaderboardEntry | OK — ранжирование |
| `@@unique([userId, dailySetId])` | LeaderboardEntry | OK — уникальность + индекс |
| `@@index([categoryId])` | QuestionCategory | OK |
| `@@index([userId, collectionType])` | UserCollectionProgress | OK |
| `@@index([userId, referenceId])` | UserCollectionProgress | OK |

---

## 5. Общие проблемы оптимизации

### 5.1. Сессии коллекций хранятся в памяти процесса (КРИТИЧНАЯ)

**Файл:** `/server/src/modules/collections/collections.service.ts`, строка 31

```typescript
private sessions = new Map<string, SessionData>();
```

Проблемы:
1. **Утечка памяти:** Если клиент не отправит submit, сессия живёт 30 мин. При DDoS или ошибках клиента — неконтролируемый рост Map.
2. **Потеря данных при рестарте:** Все активные сессии теряются при перезапуске сервера.
3. **Несовместимость с масштабированием:** При 2+ инстансах сервера сессии не шарятся.

**Решение:** Хранить сессии в Redis с TTL или в БД в таблице `GameSession`.

---

### 5.2. Полное отсутствие кэширования (ВЫСОКАЯ)

Ни один endpoint не использует кэширование. Данные, которые можно кэшировать:

| Данные | TTL | Причина |
|--------|-----|---------|
| Список категорий | 5-10 мин | Меняются редко |
| Avatar emojis | 1 час | Меняются очень редко |
| Nickname options (прилагательные/животные) | 1 час | Справочные данные |
| Лидерборд (топ-100) | 1-5 мин | Обновляется только при submit |
| Daily set (read-only часть) | 1-5 мин | Меняется раз в день |

**Решение:** Использовать `@nestjs/cache-manager` с Redis или in-memory хранилищем.

---

### 5.3. generateUniqueNickname: до 22 запросов при генерации (СРЕДНЯЯ)

**Файл:** `/server/src/utils/generate-nickname.ts`, строки 81-106

Функция выполняет до 10 итераций, каждая из которых:
1. `findMany` для прилагательных
2. `findMany` для животных
3. `findUnique` для проверки уникальности

Итого: до **30 запросов** при регистрации нового пользователя.

```typescript
for (let i = 0; i < maxAttempts; i++) {
  const { nickname, avatarEmoji } = await generateNickname(prisma, language);
  // generateNickname делает 2 запроса findMany каждый раз!
  const existing = await prisma.user.findUnique({ where: { nickname: candidate } });
  // ...
}
```

**Решение:**
1. Кэшировать прилагательные и животные (загружать один раз)
2. Передавать загруженные данные в `generateNickname` как параметр
3. Batch-проверка уникальности: сгенерировать 10 кандидатов, сделать один `findMany({ where: { nickname: { in: candidates } } })`

---

### 5.4. Отсутствие connection pooling настроек в PrismaService (СРЕДНЯЯ)

**Файл:** `/server/src/prisma/prisma.service.ts`

Prisma по умолчанию создаёт пул из `num_cpus * 2 + 1` соединений. Для production стоит настроить явно через `datasource` URL параметры или `connection_limit`.

**Решение:** Добавить `?connection_limit=10&pool_timeout=10` в DATABASE_URL для production.

---

### 5.5. Запросы вопросов в getRandomQuestion используют NOT EXISTS подзапрос (СРЕДНЯЯ)

**Файл:** `/server/src/modules/questions/questions.service.ts`, строки 14-41

```typescript
NOT: {
  history: {
    some: {
      userId,
      result: 'correct',
    },
  },
},
```

Prisma транслирует `NOT { history: { some: { ... } } }` в `NOT EXISTS (SELECT 1 FROM ...)`. Для таблицы с миллионами записей в `UserQuestionHistory` это очень медленно.

**Решение:** Использовать `NOT IN` с предварительно загруженным списком ID (как в anti-repeat.ts) или raw SQL с `LEFT JOIN ... IS NULL`.

---

### 5.6. DailySetsService.submitDailySet: избыточный запрос recentCompletion (НИЗКАЯ)

**Файл:** `/server/src/modules/daily-sets/daily-sets.service.ts`, строки 281-295

Weekly lockout уже проверяется в `getTodaySet()` на клиенте. Но в `submitDailySet` проверка дублируется отдельным запросом `findFirst`. При этом `existingEntry` (строка 235) уже частично покрывает этот кейс.

---

### 5.7. Логирование SQL-запросов в development (НИЗКАЯ)

**Файл:** `/server/src/prisma/prisma.service.ts`, строки 17-22

```typescript
log: process.env.NODE_ENV === 'production'
  ? ['error', 'warn']
  : ['query', 'info', 'warn', 'error'],
```

В development все SQL-запросы логируются. Это OK, но стоит убедиться, что на staging эта настройка выключена (используется `production` NODE_ENV).

---

### 5.8. Дублирование кода обновления question stats (СРЕДНЯЯ)

Код обновления `timesShown`/`timesCorrect`/`avgTimeSeconds` продублирован в **3 местах**:

1. `/server/src/modules/questions/questions.service.ts`, строки 110-123
2. `/server/src/modules/daily-sets/daily-sets.service.ts`, строки 333-357
3. `/server/src/modules/collections/collections.service.ts`, строки 233-255

**Решение:** Вынести в общую функцию `updateQuestionStats(tx, questionId, isCorrect, timeSpent)`.

---

### 5.9. UsersRepository — мёртвый код (НИЗКАЯ)

**Файл:** `/server/src/modules/users/users.repository.ts`

Этот repository определяет методы `findByDeviceId`, `findById`, `create`, `update`, `updateStreak`, `resetStreak`, `getStats`, `countDistinctCorrectQuestions`, но `UsersService` использует PrismaService напрямую, а не через repository.

**Решение:** Удалить `users.repository.ts` или мигрировать `UsersService` на его использование.

---

### 5.10. CollectionsService.getQuestionsWithAntiRepeat — загрузка ВСЕХ вопросов (СРЕДНЯЯ)

**Файл:** `/server/src/modules/collections/collections.service.ts`, строки 511-552

Загружает ВСЕ подходящие вопросы, шаффлит в JS, затем берёт нужное количество. При большой базе вопросов это неэффективно.

```typescript
const questions = await this.prisma.question.findMany({
  where: { status: 'approved', ...where, NOT: { id: { in: excludedIds } } },
  // Нет limit — загружает ВСЕ
});
// Shuffle all, then slice
```

**Решение:** Использовать `ORDER BY random() LIMIT N` через raw SQL.

---

## 6. Рекомендации (приоритизированный список)

### Приоритет P0 (сделать немедленно — влияет на production)

1. **Исправить N+1 запросы в submitDailySet и submit коллекций** (п.1.1, 1.2)
   - Загрузить вопросы одним `findMany`, использовать атомарный `increment` или batch raw SQL
   - Оценка: 2-3 часа

2. **Оптимизировать лидерборд — убрать загрузку всех пользователей в память** (п.1.3, 1.4, 1.5)
   - Переписать на SQL с `ORDER BY ... LIMIT 100` + отдельный запрос позиции
   - Оценка: 4-6 часов

3. **Добавить критические индексы в Prisma schema** (п.4.1.1, 4.1.2, 4.1.4)
   - `Question: @@index([status])`, `@@index([categoryId])`, `@@index([status, categoryId])`
   - Оценка: 30 минут + миграция

4. **Перенести сессии коллекций из памяти в Redis/БД** (п.5.1)
   - Оценка: 2-3 часа

### Приоритет P1 (в ближайшие 1-2 недели)

5. **Оптимизировать Home feed** (п.1.6, 1.7, 1.10)
   - Переписать `getCategoriesWithCount` и `getDifficultyProgress` на batch SQL
   - Оценка: 3-4 часа

6. **Добавить кэширование** (п.5.2)
   - Категории, emoji, лидерборд — через `@nestjs/cache-manager`
   - Оценка: 3-4 часа

7. **Исправить race condition в question stats** (п.2.3, п.5.8)
   - Перейти на атомарный `increment` + вынести в общую функцию
   - Оценка: 1-2 часа

8. **Оптимизировать generateUniqueNickname** (п.5.3)
   - Кэшировать справочные данные, batch-проверка уникальности
   - Оценка: 1-2 часа

9. **Кэшировать DeviceAuthGuard** (п.1.8)
   - LRU кэш для маппинга deviceId -> userId
   - Оценка: 1-2 часа

### Приоритет P2 (в ближайший месяц)

10. **Удалить серверную аналитику getUserAnalytics** (п.3.1, 3.2, 3.3)
    - Удалить endpoint и метод, настроить Firebase Analytics в админ-панели
    - Оценка: 1 час

11. **Добавить retention policy для UserQuestionHistory** (п.2.1)
    - Cron-задача для архивации записей старше 90 дней
    - Оценка: 2-3 часа

12. **Удалить мёртвый код UsersRepository** (п.5.9)
    - Оценка: 15 минут

13. **Оптимизировать getRandomQuestion** (п.1.11)
    - Использовать raw SQL с `ORDER BY random() LIMIT 1`
    - Оценка: 1 час

14. **Добавить оставшиеся индексы** (п.4.1.3, 4.1.5, 4.1.6, 4.1.7)
    - Оценка: 30 минут

15. **Распараллелить getUserStats** (п.1.12)
    - Обернуть независимые запросы в `Promise.all`
    - Оценка: 30 минут

16. **Настроить connection pooling** (п.5.4)
    - Добавить параметры в DATABASE_URL
    - Оценка: 15 минут

---

## Итого

| Приоритет | Кол-во задач | Оценка (часы) |
|-----------|-------------|---------------|
| P0 | 4 | 9-13 |
| P1 | 5 | 9-14 |
| P2 | 7 | 5-8 |
| **Всего** | **16** | **23-35** |

Критические проблемы (P0) необходимо исправить до публикации приложения, так как при реальной нагрузке они приведут к деградации производительности и потенциальным сбоям.
