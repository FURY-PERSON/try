# Задача Tech Lead: Изоляция вопросов подборок

> **Дата:** 2026-02-28
> **Приоритет:** Must
> **Релиз:** v1.3

---

## Контекст

В текущей реализации подборки (`Collection`) содержат вопросы из общего пула (`Question`). Это означает, что вопросы, добавленные в подборку, могут появляться в:
- Случайных фактах (`type: random`)
- Ежедневном наборе (`DailySet`)
- Вопросах по сложности (`type: difficulty`)
- Вопросах по теме/категории (`type: category`)

Это нежелательно: подборки должны иметь **собственный изолированный пул вопросов**, которые не пересекаются с другими режимами.

Дополнительно: в мобильном приложении раздел "Подборки" должен располагаться под "Случайными фактами" (сейчас он в конце, после "По сложности").

---

## Требования

### R-1: Изоляция вопросов подборок
Вопросы подборки хранятся в отдельной модели `CollectionItem`, не связанной с таблицей `Question`. Такие вопросы **не участвуют** ни в одном из общих пулов (random, daily, difficulty, category).

### R-2: Ручное создание вопросов в подборке (Admin Panel)
При создании/редактировании подборки администратор **создаёт вопросы вручную** (форма с полями), а не выбирает из существующего общего списка вопросов.

### R-3: Позиция "Подборок" в мобильном приложении
Секция "Подборки" отображается **сразу после** кнопки "Случайные факты" (до категорий и сложностей).

---

## Архитектурное решение

### Изменение схемы БД

**Удалить:** модель `CollectionQuestion` (join-table `collection_questions`, связывающий `Collection` → `Question`)

**Добавить:** модель `CollectionItem` — самостоятельная модель вопроса, принадлежащая только подборке:

```prisma
model CollectionItem {
  id           String     @id @default(cuid())
  collectionId String
  statement    String
  isTrue       Boolean
  explanation  String
  source       String     @default("")
  sourceUrl    String?
  difficulty   Int        @default(3)
  sortOrder    Int        @default(0)
  language     String     @default("ru")

  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@index([collectionId])
}
```

**Обновить `Collection`:** заменить `questions CollectionQuestion[]` на `questions CollectionItem[]`
(имя отношения `questions` сохраняется — это важно для обратной совместимости с `_count`)

**Обновить `Question`:** удалить обратную ссылку `collectionQuestions CollectionQuestion[]`

### Миграция
1. Удалить таблицу `collection_questions`
2. Создать таблицу `collection_items`
3. Существующие подборки потеряют вопросы — **это ожидаемо**, они будут наполнены заново в admin-панели

---

## Затронутые файлы

### Backend (server/)

| Файл | Изменение |
|------|-----------|
| `prisma/schema.prisma` | Добавить `CollectionItem`, обновить `Collection`, удалить `CollectionQuestion` и ссылку из `Question` |
| `src/modules/admin/collections/dto/create-collection.dto.ts` | Заменить `questionIds: string[]` на `items: CreateCollectionItemDto[]` |
| `src/modules/admin/collections/dto/update-collection.dto.ts` | Обновить (наследует от `CreateCollectionDto`) |
| `src/modules/admin/collections/admin-collections.service.ts` | Убрать валидацию `Question`, создавать `CollectionItem` напрямую |
| `src/modules/collections/collections.service.ts` | `startByCollection` использует `CollectionItem`; в `submit` пропускать `UserQuestionHistory` и `updateQuestionStatsBatch` для `type === 'collection'` |

### Web Admin (web/)

| Файл | Изменение |
|------|-----------|
| `src/shared/types/collection.ts` | Обновить `CollectionWithQuestions` — вложенные элементы теперь `CollectionItem`, не `Question` |
| `src/pages/CollectionsPage.tsx` | Убрать question picker, добавить inline-форму создания вопросов |
| `src/api-client/endpoints/admin.ts` | Обновить типы DTO для коллекций |

### Mobile (mobile/)

| Файл | Изменение |
|------|-----------|
| `src/shared/types/collection.ts` | Обновить `CollectionSessionQuestion` — `categoryId` и `category` становятся опциональными |
| `app/(tabs)/home/index.tsx` | Переместить секцию "Featured Collections" (Section 4) на позицию сразу после Random Facts (между Random Facts и Categories) |

---

## Детали реализации

### DTO для вопроса внутри подборки

```typescript
class CreateCollectionItemDto {
  @IsString() @MinLength(10)
  statement: string;

  @IsBoolean()
  isTrue: boolean;

  @IsString() @MinLength(5)
  explanation: string;

  @IsOptional() @IsString()
  source?: string;

  @IsOptional() @IsString()
  sourceUrl?: string;

  @IsInt() @Min(1) @Max(5)
  difficulty: number;

  @IsOptional() @IsEnum(['ru', 'en', 'both'])
  language?: string;

  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}
```

### AdminCollectionsService: create()
- Убрать проверку `Question.status === 'approved'`
- Создавать `CollectionItem` записи вместо `CollectionQuestion`

### CollectionsService: startByCollection()
- Получать вопросы через `collection.questions` (теперь `CollectionItem[]`)
- Маппинг: `categoryId: null`, `illustrationUrl: null`, `category: null`

### CollectionsService: submit()
- Добавить проверку: `if (session.type === 'collection') → пропустить UserQuestionHistory + updateQuestionStatsBatch`
- Сохранение `UserCollectionProgress` и обновление `User` stats — **сохранить**

### CollectionsPage.tsx: UI inline-редактора вопросов
- Список добавленных вопросов с кнопками "Редактировать / Удалить"
- Кнопка "Добавить вопрос" открывает форму с полями:
  - statement (textarea)
  - isTrue (toggle: Правда / Ложь)
  - explanation (textarea)
  - difficulty (select 1–5)
  - language (select: RU / EN)
  - source (input, необязательно)
- При сохранении — вопрос добавляется в список

### Home Screen: порядок секций

**Было:**
1. Hero Daily Set
2. Случайные факты (Random button)
3. Категории (horizontal scroll)
4. По сложности (3 карточки)
5. Подборки (horizontal scroll) ← в конце

**Стало:**
1. Hero Daily Set
2. Случайные факты (Random button)
3. **Подборки (horizontal scroll)** ← переместить сюда
4. Категории (horizontal scroll)
5. По сложности (3 карточки)

---

## Критерии готовности

- [ ] `CollectionItem` существует в схеме, `CollectionQuestion` удалён
- [ ] Миграция Prisma применена (`prisma migrate dev`)
- [ ] Вопросы подборок **не появляются** в random/daily/difficulty/category запросах
- [ ] Admin: можно создать подборку с вопросами через inline-форму
- [ ] Admin: при редактировании подборки вопросы отображаются и редактируются
- [ ] Mobile: секция "Подборки" отображается под "Случайными фактами"
- [ ] Mobile: игра в подборку работает корректно
- [ ] Submit collection: `UserCollectionProgress` сохраняется, стрик и очки обновляются
