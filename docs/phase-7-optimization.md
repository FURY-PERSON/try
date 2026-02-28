# Отчёт по оптимизации

## Резюме
- Всего найдено проблем: **83**
- **P0: 5** | **P1: 16** | **P2: 25** | **P3: 37**
- Оценка текущей производительности: **6/10**

### Распределение по частям:
| Часть | P0 | P1 | P2 | P3 | Всего |
|-------|----|----|----|----|-------|
| Server | 0 | 4 | 10 | 13 | 27 |
| Mobile | 3 | 7 | 8 | 17 | 35 |
| Web | 2 | 5 | 7 | 7 | 21 |

---

## 1. Mobile — Найденные проблемы

### P0 — Critical

#### M-1. `useCardGame` подписан на весь Zustand store (P0)
**Файл:** `mobile/src/features/game/hooks/useCardGame.ts:25-33`
**Описание:** Хук деструктурирует множество значений из `useGameStore()` без селекторов, что подписывает компонент на ВСЕ изменения стора. Это ядро игрового процесса — каждый свайп карточки обновляет стор и вызывает каскадные перерисовки.
**Влияние:** Высокое. Дропы FPS при анимациях свайпа.
**Решение:**
```typescript
// ПЛОХО
const { dailyProgress, startCard, submitCardResult, ... } = useGameStore();

// ХОРОШО
const dailyProgress = useGameStore((s) => s.dailyProgress);
const startCard = useGameStore((s) => s.startCard);
const submitCardResult = useGameStore((s) => s.submitCardResult);
const sessionId = useGameStore((s) => s.sessionId);
const collectionType = useGameStore((s) => s.collectionType);
const isReplay = useGameStore((s) => s.isReplay);
```

#### M-2. Табы загружаются ВСЕ сразу, нет `lazy: true` и `freezeOnBlur` (P0)
**Файл:** `mobile/app/(tabs)/_layout.tsx:13-49`
**Описание:** Все 3 таба (Home, Leaderboard, Profile) монтируются при старте приложения, хотя виден только Home. Без `freezeOnBlur` неактивные табы продолжают перерисовываться.
**Влияние:** Высокое. Увеличение времени холодного старта и расход памяти.
**Решение:**
```typescript
<Tabs
  screenOptions={{
    headerShown: false,
    lazy: true,
    freezeOnBlur: true,
  }}
>
```

#### M-3. `lottie-react-native` включён, но не используется (P0)
**Файл:** `mobile/package.json:47`
**Описание:** Зависимость `lottie-react-native` (v7.1.0) установлена, но нигде не импортируется. Добавляет ~200-400KB к бинарнику.
**Влияние:** Высокое. Бессмысленное увеличение размера APK/IPA.
**Решение:** `npm uninstall lottie-react-native`

---

### P1 — High

#### M-4. `useSettings` подписан на весь стор (P1)
**Файл:** `mobile/src/features/settings/hooks/useSettings.ts:8`
**Описание:** `const store = useSettingsStore()` без селектора. Каждое изменение любого поля settings вызывает перерисовку всех подписчиков.
**Решение:** Использовать индивидуальные селекторы для каждого поля.

#### M-5. Результаты — `useGameStore()` без селектора (P1)
**Файл:** `mobile/app/modal/results.tsx:35`
**Описание:** `const { dailyProgress, resetDailyProgress, collectionType, isReplay } = useGameStore()` подписывает экран результатов на весь стор.
**Решение:** Индивидуальные селекторы.

#### M-6. `CategoryCard`, `DifficultyCard`, `CollectionCard` без `React.memo` (P1)
**Файл:** `mobile/app/(tabs)/home/index.tsx:454, 510, 585`
**Описание:** Компоненты содержат анимации (useSharedValue) и рендерятся в FlatList. Каждый ре-рендер HomeScreen пересоздаёт shared values.
**Решение:** Обернуть каждый в `React.memo`.

#### M-7. `LeaderboardEntry` без `React.memo` (P1)
**Файл:** `mobile/src/features/leaderboard/components/LeaderboardEntry.tsx:33`
**Описание:** Рендерится внутри FlatList, обновление списка перерисовывает все видимые записи.
**Решение:** `export const LeaderboardEntry = React.memo(LeaderboardEntryInner);`

#### M-8. FlatList вместо FlashList для лидерборда (P1)
**Файл:** `mobile/src/features/leaderboard/components/LeaderboardList.tsx:47`
**Описание:** FlatList используется для потенциально сотен записей. FlashList в 5-10x быстрее за счёт переиспользования view.
**Решение:**
```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={data}
  estimatedItemSize={64}
  renderItem={({ item, index }) => <LeaderboardEntry ... />}
/>
```

#### M-9. Нет `detachInactiveScreens` в Stack навигаторах (P1)
**Файл:** `mobile/app/_layout.tsx:85`, `mobile/app/game/_layout.tsx:6`
**Описание:** Экраны в стеке (home → category → game/card → results) все остаются в памяти.
**Решение:** `<Stack screenOptions={{ detachInactiveScreens: true }}>`

#### M-10. Проверить совместимость New Architecture с AdMob (P1)
**Файл:** `mobile/app.json:14`
**Описание:** `newArchEnabled: true`, но `react-native-google-mobile-ads` может быть несовместим. Необходимо протестировать.

---

### P2 — Medium

#### M-11. `useGameStore()` без селектора в daily.tsx (P2)
**Файл:** `mobile/app/game/daily.tsx:7`

#### M-12. Inline closure в FlatList renderItem для категорий (P2)
**Файл:** `mobile/app/(tabs)/home/index.tsx:379`
**Описание:** `onPress={() => handleOpenCategory(item.id)}` создаёт новую функцию для каждой карточки на каждом рендере.

#### M-13. FlatList лидерборда без `getItemLayout` / `estimatedItemSize` (P2)
**Файл:** `mobile/src/features/leaderboard/components/LeaderboardList.tsx:47`

#### M-14. Нет blurhash/placeholder для изображений (P2)
**Файл:** `mobile/src/features/game/components/FactCard.tsx:63`, `mobile/src/components/ui/Avatar.tsx:55`
**Описание:** Изображения из сети загружаются без placeholder. Пользователь видит пустую область.
**Решение:** Добавить `placeholder={{ blurhash: '...' }}` и `transition={300}`.

#### M-15. `collectionQuestions` в Zustand store без очистки (P2)
**Файл:** `mobile/src/features/game/stores/useGameStore.ts:17`
**Описание:** До 100 вопросов остаются в памяти после выхода из игры.

#### M-16. Агрессивный refetch в `useHomeFeed` и `useLeaderboard` (P2)
**Файл:** `mobile/src/features/home/hooks/useHomeFeed.ts`, `mobile/src/features/leaderboard/hooks/useLeaderboard.ts`
**Описание:** `staleTime: 2min` + отсутствие `freezeOnBlur` → частые лишние запросы.
**Решение:** Увеличить `staleTime` до 5 минут, добавить `refetchOnWindowFocus: false`.

#### M-17. 6 весов шрифта Nunito (P2)
**Файл:** `mobile/app/_layout.tsx:11-17`
**Описание:** Загружены 400, 500, 600, 700, 800, 900. Каждый вес ~100-200KB. Возможно, 800 и 900 можно объединить.

#### M-18. `@expo/vector-icons` — полные шрифты MaterialCommunityIcons (P2)
**Описание:** MaterialCommunityIcons ~500KB, используется менее 30 иконок. Рассмотреть SVG-альтернативу.

---

### P3 — Low

- M-19. Inline функция `handleSectionScroll` в FlatList (`home/index.tsx:371`)
- M-20. `handleStartDaily` без `useCallback` (`home/index.tsx:100`)
- M-21. `useMemo` на `collections` — no-op (`home/index.tsx:82-84`)
- M-22. `getLockoutText` пересоздаётся каждый рендер (`home/index.tsx:196`)
- M-23. Горизонтальные FlatList без `removeClippedSubviews` (`home/index.tsx:365-383`)
- M-24. `DailyResultCard` — `index` как key (`DailyResultCard.tsx:53`)
- M-25. `Dimensions.get('window')` на уровне модуля (`ExplanationCard.tsx:122`)
- M-26. Нет явного `cachePolicy` для `expo-image`
- M-27. `InterstitialManager` — singleton на уровне модуля
- M-28. `ExplanationCard` — возможно мёртвый код
- M-29. Нет `gcTime` в React Query конфигурации (`_layout.tsx:26-33`)
- M-30. `react-native-clean-project` в dependencies вместо devDependencies
- M-31. `react-native-uuid` можно заменить на `crypto.randomUUID()`
- M-32. Нет явного `"jsEngine": "hermes"` в `app.json`

---

## 2. Server — Найденные проблемы

### P1 — High

#### S-1. N+1 в AI-генерации вопросов (P1)
**Файл:** `server/src/modules/ai/ai.service.ts:144-189`
**Описание:** Цикл из `findFirst` + `create` + `create` на каждый вопрос. Для 10 вопросов = 30 последовательных запросов к БД.
**Решение:** Batch dedup через `findMany({ where: { statement: { in: statements } } })`, затем `$transaction` с `createMany`.

#### S-2. `getQuestionsWithAntiRepeat` загружает ВСЕ вопросы в память (P1)
**Файл:** `server/src/modules/collections/collections.service.ts:490-531`
**Описание:** При старте любой коллекции загружаются ВСЕ approved вопросы (10K+), перемешиваются в JS, берутся первые N.
**Решение:** `ORDER BY RANDOM() LIMIT N` через raw SQL или count + skip подход.

#### S-3. Home feed загружает ВСЕ вопросы для подсчёта категорий (P1)
**Файл:** `server/src/modules/home/home.service.ts:180-193`
**Описание:** `getCategoriesWithCount` грузит каждый approved вопрос с category relations только чтобы посчитать количество. Это hot path (каждый запуск приложения).
**Решение:**
```typescript
const primaryCounts = await this.prisma.question.groupBy({
  by: ['categoryId'],
  where: { status: 'approved' },
  _count: { id: true },
});
```

#### S-4. Home feed загружает ВСЕ вопросы для подсчёта сложности (P1)
**Файл:** `server/src/modules/home/home.service.ts:237-268`
**Описание:** `getDifficultyProgress` грузит все вопросы для подсчёта по уровням сложности. Тот же hot path.
**Решение:** `prisma.question.groupBy({ by: ['difficulty'] })`.

#### S-5. Нет `enableShutdownHooks()` (P1)
**Файл:** `server/src/main.ts:67`
**Описание:** Без graceful shutdown при SIGTERM соединения к БД могут протечь, запросы обрываются.
**Решение:** `app.enableShutdownHooks();` — одна строка.

---

### P2 — Medium

#### S-6. Anti-repeat загружает всю историю пользователя за 14 дней (P2)
**Файл:** `server/src/modules/shared/anti-repeat.ts:14-64`
**Описание:** Для активных пользователей (100 ответов/день × 14 дней = 1400 записей) вся история обрабатывается в JS.
**Решение:** PostgreSQL `DISTINCT ON` — одним запросом.

#### S-7. `getAllAnsweredQuestionIds` без ограничения по времени (P2)
**Файл:** `server/src/modules/shared/anti-repeat.ts:69-79`
**Описание:** Загружает ВСЕ distinct questionId за ВСЮ историю пользователя. Растёт без ограничений.

#### S-8. `answerQuestion` — 3 запроса без транзакции (P2)
**Файл:** `server/src/modules/questions/questions.service.ts:83-141`
**Описание:** `create` + `executeRaw` UPDATE + `user.update` — не обёрнуты в `$transaction`. Ошибка на 3-м шаге оставит некорректные данные.
**Решение:** Обернуть в `this.prisma.$transaction(async (tx) => { ... })`.

#### S-9. N параллельных UPDATE-ов в `updateQuestionStatsBatch` (P2)
**Файл:** `server/src/modules/shared/update-question-stats.ts:16-35`
**Описание:** Для 15 вопросов — 15 отдельных `$executeRaw` UPDATE.
**Решение:** Один UPDATE с `CASE` / `VALUES` CTE.

#### S-10. `$queryRawUnsafe` со строковой интерполяцией в leaderboard (P2)
**Файл:** `server/src/modules/leaderboard/leaderboard.service.ts:446-481`
**Описание:** `ORDER BY ${orderByField}` — потенциальный SQL injection и невозможность кэширования планов.
**Решение:** Два отдельных параметризованных запроса `$queryRaw`.

#### S-11. Over-fetching в `submitDailySet` — загрузка полных вопросов (P2)
**Файл:** `server/src/modules/daily-sets/daily-sets.service.ts:220-227`
**Описание:** `include: { question: true }` для валидации, хотя нужен только `questionId`.
**Решение:** `select: { questionId: true }`.

#### S-12. Дорогой correlated subquery для `getRandomQuestion` (P2)
**Файл:** `server/src/modules/questions/questions.service.ts:14-65`
**Описание:** `NOT { history: { some: ... } }` — Prisma генерирует correlated subqueries.
**Решение:** Использовать `getExcludedQuestionIds` + `NOT: { id: { in: excludedIds } }`.

#### S-13. In-memory Map для игровых сессий (P2)
**Файл:** `server/src/modules/collections/collections.service.ts:32`
**Описание:** Сессии теряются при рестарте сервера, горизонтальное масштабирование невозможно.
**Решение:** Перенести сессии в PostgreSQL или Redis.

#### S-14. Нет Cache-Control заголовков для статических данных (P2)
**Файл:** Все контроллеры
**Описание:** `/v1/categories`, `/v1/reference/*` — данные редко меняются, но не кэшируются.
**Решение:** `@Header('Cache-Control', 'public, max-age=300')`.

#### S-15. Нет request timeout (P2)
**Файл:** `server/src/main.ts`
**Описание:** Медленный DALL-E запрос (30+ сек) может заблокировать connection pool.
**Решение:** `server.setTimeout(60000)` или `TimeoutInterceptor`.

#### S-16. Missing `@@index([answeredAt])` на UserQuestionHistory (P2)
**Файл:** `server/prisma/schema.prisma:115-130`
**Описание:** Leaderboard фильтрует по `answeredAt` без userId, но индекс только composite `[userId, answeredAt]`.
**Решение:** Добавить `@@index([answeredAt])`.

---

### P3 — Low

- S-17. Дублированные fetch-и пользователя в streak leaderboard (`leaderboard.service.ts:196-246`)
- S-18. 3 последовательных count для позиции в leaderboard (`daily-sets.service.ts:370-402`) — заменить на `Promise.all`
- S-19. Missing `@@index([status, sortOrder])` на Collection (`schema.prisma:156`)
- S-20. Missing `@@index([status])` на DailySet (`schema.prisma:90`)
- S-21. No explicit payload size limit (`main.ts`)
- S-22. 3 последовательных запроса в `getNicknameOptions` (`reference.service.ts:8-17`) — заменить на `Promise.all`
- S-23. Over-fetching в admin question list (`admin-questions.service.ts:49`)
- S-24. Over-fetching в admin stats (`admin-stats.service.ts:136-166`)
- S-25. Missing `@@index([createdAt])` на Notification (`schema.prisma:215`)
- S-26. Нет full-text индекса для поиска вопросов (`admin-questions.service.ts:40`)
- S-27. `DeviceAuthGuard` загружает все поля пользователя (`device-auth.guard.ts:65`)

---

## 3. Web — Найденные проблемы

### P0 — Critical

#### W-1. Нет code splitting — все 12 страниц загружаются сразу (P0)
**Файл:** `web/src/App.tsx:1-17`
**Описание:** Все страницы импортированы статически. Включая тяжёлые: `ReferencePage` (620 строк), `CollectionsPage` (600 строк), `DailySetEditPage` (388 строк). Весь JS парсится и выполняется при загрузке.
**Влияние:** Высокое. +100-200KB лишнего JS при первой загрузке.
**Решение:**
```tsx
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
);
// ... аналогично для всех страниц

<Suspense fallback={<PageFallback />}>
  <Route index element={<DashboardPage />} />
</Suspense>
```

#### W-2. Поиск вопросов — запрос на каждый символ, нет debounce (P0)
**Файл:** `web/src/pages/QuestionsListPage.tsx:222-224`
**Описание:** `setSearch(e.target.value)` немедленно обновляет React Query key → новый API-запрос на каждую нажатую клавишу. "hello" = 5 запросов.
**Решение:**
```tsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebouncedValue(search, 300);
// Использовать debouncedSearch в queryKey
```

---

### P1 — High

#### W-3. Нет build optimization в vite.config.ts (P1)
**Файл:** `web/vite.config.ts:6-27`
**Описание:** Нет `manualChunks` — все vendor-библиотеки в одном чанке. Любое изменение кода инвалидирует весь vendor bundle (~200KB gzip).
**Решение:**
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-query': ['@tanstack/react-query'],
        'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        'vendor-ui': ['lucide-react', 'sonner'],
        'vendor-utils': ['axios', 'date-fns', 'zustand'],
      },
    },
  },
},
```

#### W-4. `filteredQuestions` без `useMemo` (500+ элементов) (P1)
**Файл:** `web/src/pages/DailySetCreatePage.tsx:59-63`, `web/src/pages/DailySetEditPage.tsx:78-82`
**Описание:** 500 вопросов фильтруются через 4 цепочки `.filter()` с `.toLowerCase()` на каждый рендер.
**Решение:** Обернуть в `useMemo` с зависимостями.

#### W-5. Нет виртуализации для списков 200-500 элементов (P1)
**Файл:** `web/src/pages/DailySetCreatePage.tsx:290-326`, `DailySetEditPage.tsx:347-383`, `CollectionsPage.tsx:553-581`
**Описание:** До 500 элементов рендерятся в DOM одновременно → 3000+ DOM-нод.
**Решение:** Использовать `@tanstack/react-virtual`.

#### W-6. Google Fonts блокирует рендеринг (P1)
**Файл:** `web/index.html:7-9`
**Описание:** CSS шрифтов загружается синхронно, блокируя First Contentful Paint.
**Решение:** `rel="preload" as="style"` + `media="print" onload="this.media='all'"` или self-hosting.

#### W-7. Нет `gcTime` и `refetchOnWindowFocus: false` (P1)
**Файл:** `web/src/main.tsx:9-16`
**Описание:** Каждый переключение вкладки в браузере → refetch всех видимых запросов. Для админ-панели избыточно.
**Решение:**
```typescript
defaultOptions: {
  queries: {
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  },
},
```

---

### P2 — Medium

#### W-8. Загрузка 500 вопросов одним запросом (P2)
**Файл:** `web/src/pages/DailySetCreatePage.tsx:43`, `DailySetEditPage.tsx:51`
**Описание:** `limit: 500` — потенциально 200-500KB JSON. В связке с отсутствием виртуализации — двойная проблема.
**Решение:** Серверная пагинация или infinite scroll.

#### W-9. Неиспользуемые API endpoint модули в бандле (P2)
**Файл:** `web/src/api-client/client.ts:128-134`
**Описание:** `users`, `questions`, `dailySets`, `leaderboard`, `categories` — не используются в web, только `admin.*`.

#### W-10. Нет `React.memo` на строках таблицы (P2)
**Файл:** `web/src/pages/QuestionsListPage.tsx:305-375`
**Описание:** При изменении выделения (checkbox) перерисовываются все строки.

#### W-11. `<img>` без `loading="lazy"` (P2)
**Файл:** `web/src/pages/QuestionDetailPage.tsx:367-371`

#### W-12. Нет optimistic updates на мутациях (P2)
**Файл:** Множество страниц — все используют `invalidateQueries` on success.

#### W-13. 200 вопросов в dialog picker без виртуализации (P2)
**Файл:** `web/src/pages/CollectionsPage.tsx:98-102`

#### W-14. `refetchOnWindowFocus` по умолчанию true (P2)
**Файл:** `web/src/main.tsx:9-16`

---

### P3 — Low

- W-15. `cards` массив без `useMemo` в Dashboard (`DashboardPage.tsx:88-131`)
- W-16. `toggleSelect`/`toggleSelectAll` без `useCallback` (`QuestionsListPage.tsx:146-158`)
- W-17. `BarChart` без `React.memo` (`DashboardPage.tsx:32-72`)
- W-18. Нет prefetch данных при наведении на ссылки навигации
- W-19. Дублирование констант `DIFFICULTY_LABELS`, `LANGUAGE_OPTIONS`, `IS_TRUE_OPTIONS` в 4+ файлах
- W-20. `autoprefixer` возможно не нужен с Tailwind CSS v4
- W-21. `lucide-react` — проверить эффективность tree shaking

---

## 4. Data Transfer — Найденные проблемы

### Серверные эндпоинты с избыточными данными

| Endpoint | Метод | Проблема | Приоритет |
|----------|-------|----------|-----------|
| `/v1/home/feed` | GET | Загружает ВСЕ вопросы для подсчёта (S-3, S-4) | P1 |
| `/v1/collections/start/*` | POST | Загружает ВСЕ вопросы для выборки (S-2) | P1 |
| `/v1/daily-sets/submit` | POST | include question true при валидации (S-11) | P2 |
| `/v1/categories` | GET | Нет Cache-Control (S-14) | P2 |
| `/v1/reference/*` | GET | Нет Cache-Control (S-14) | P2 |
| Admin questions | GET | include category true — все поля (S-23) | P3 |

### Клиентское кэширование

| Проблема | Где | Приоритет |
|----------|-----|-----------|
| Нет `freezeOnBlur` → refetch при переключении табов | Mobile | P0 |
| `staleTime` 2 мин — слишком агрессивно | Mobile | P2 |
| Нет `refetchOnWindowFocus: false` | Web | P1 |
| Нет `gcTime` | Web + Mobile | P1 |

---

## 5. Рекомендуемый план исправлений

### Итерация 1 — Critical (P0) — Сделать немедленно
1. **[Mobile]** Добавить `lazy: true` + `freezeOnBlur: true` в таб-навигатор (1 файл, 2 строки)
2. **[Mobile]** Переписать `useCardGame` на индивидуальные Zustand селекторы (1 файл)
3. **[Mobile]** Удалить `lottie-react-native` (`npm uninstall`)
4. **[Web]** Добавить code splitting через `React.lazy` + `Suspense` (`App.tsx`)
5. **[Web]** Добавить debounce на поиск (`QuestionsListPage.tsx`)

### Итерация 2 — High (P1) — До релиза
6. **[Server]** `app.enableShutdownHooks()` в main.ts (1 строка)
7. **[Server]** Заменить home feed на `groupBy` вместо загрузки всех вопросов (2 метода)
8. **[Server]** Заменить random selection на `ORDER BY RANDOM() LIMIT N` (1 метод)
9. **[Server]** Batch dedup в AI-генерации (1 метод)
10. **[Mobile]** Переписать все `useGameStore()` без селекторов (3-4 файла)
11. **[Mobile]** Обернуть `CategoryCard`, `DifficultyCard`, `CollectionCard`, `LeaderboardEntry` в `React.memo`
12. **[Mobile]** Заменить FlatList на FlashList для лидерборда
13. **[Mobile]** Добавить `detachInactiveScreens` в Stack
14. **[Web]** Настроить `manualChunks` в vite.config.ts
15. **[Web]** Добавить `useMemo` для filteredQuestions
16. **[Web]** Настроить `gcTime` + `refetchOnWindowFocus: false`
17. **[Web]** Исправить загрузку шрифтов (preload)

### Итерация 3 — Medium (P2) — Ближайший спринт
18. **[Server]** Обернуть `answerQuestion` в транзакцию
19. **[Server]** Batch UPDATE вместо N параллельных
20. **[Server]** Добавить `@@index([answeredAt])` на UserQuestionHistory
21. **[Server]** Добавить Cache-Control заголовки
22. **[Server]** Настроить request timeout
23. **[Server]** Оптимизировать anti-repeat через DISTINCT ON
24. **[Mobile]** Добавить blurhash для изображений
25. **[Mobile]** Увеличить `staleTime` до 5 минут
26. **[Web]** Добавить виртуализацию для 500-элементных списков
27. **[Web]** Серверная пагинация вместо загрузки 500 вопросов

### Бэклог (P3)
28. Все оставшиеся P3 проблемы (37 штук)

---

## 6. Метрики до/после (ожидаемые)

| Метрика | До (оценка) | После оптимизации | Прирост |
|---------|-------------|-------------------|---------|
| Холодный старт (iOS) | ~2.5s | < 1.5s | -40% |
| Холодный старт (Android) | ~3.5s | < 2s | -43% |
| FPS при свайпе карточек | ~45-55fps | ≥ 58fps | +20% |
| FPS при скролле лидерборда | ~40-50fps | ≥ 58fps | +30% |
| API `/v1/home/feed` p50 | ~200ms | < 50ms | -75% |
| API `/v1/collections/start` p95 | ~500ms | < 100ms | -80% |
| RAM usage (средний) | ~150MB | < 100MB | -33% |
| JS Bundle (mobile) | ~5MB | < 4MB | -20% |
| APK size | ~50MB | < 40MB | -20% |
| Web initial load JS | ~400KB | < 150KB | -62% |
| Lighthouse Score (web) | ~65 | > 90 | +38% |
| Средний трафик / сессия | ~3MB | < 1.5MB | -50% |

---

*Отчёт сгенерирован: 2026-02-28*
*Анализатор: Специалист по оптимизации (09-optimization-specialist)*
