# API контракты: Факт дня

## Prisma Schema

```prisma
model DailySet {
  id                    String   @id @default(cuid())
  date                  DateTime @unique @db.Date
  theme                 String
  themeEn               String
  status                String   @default("draft")
  factOfDayQuestionId   String?  // NEW: ID вопроса - факт дня
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  questions          DailySetQuestion[]
  leaderboardEntries LeaderboardEntry[]

  @@index([status])
}
```

**Миграция:** После изменения schema.prisma выполнить:
```bash
cd server && npx prisma migrate dev --name add-fact-of-day-question-id && npx prisma generate
```

## API: GET /v1/daily-sets/today

Расширение ответа:

```typescript
// Добавить в существующий ответ
{
  ...existingFields,
  factOfDayQuestionId: string | null,  // NEW
}
```

## API: POST /v1/daily-sets/:id/submit

Расширение ответа SubmissionResult:

```typescript
{
  ...existingFields,
  factOfDay: {                    // NEW (nullable)
    questionId: string;
    statement: string;
    statementEn: string;
    isTrue: boolean;
    wrongPercent: number;         // % людей ответивших неправильно
    userCorrect: boolean;         // правильно ли ответил текущий пользователь
  } | null;
}
```

## Admin DTO: CreateDailySetDto

```typescript
// Добавить опциональное поле с декораторами:
@ApiPropertyOptional({ description: 'ID вопроса — факт дня' })
@IsOptional()
@IsString()
factOfDayQuestionId?: string;
```

## Admin DTO: UpdateDailySetDto

```typescript
// Добавить опциональное поле с декораторами:
@ApiPropertyOptional({ description: 'ID вопроса — факт дня (null для сброса)' })
@IsOptional()
@IsString()
factOfDayQuestionId?: string | null;
```

**Валидация в сервисе:** При create/update проверить, что `factOfDayQuestionId` входит в `questionIds` сета.

## Mobile Types

### DailySetWithQuestions (shared/types/daily-set.ts)
```typescript
{
  ...existingFields,
  factOfDayQuestionId?: string | null;  // NEW
}
```

### SubmissionResult (features/game/types.ts)
```typescript
{
  ...existingFields,
  factOfDay?: {                   // NEW
    questionId: string;
    statement: string;
    statementEn: string;
    isTrue: boolean;
    wrongPercent: number;
    userCorrect: boolean;
  } | null;
}
```

### Share text format
```
Факт дня 🧠
"{statement}" — правда или миф?
{userResult} ({wrongPercent}% ошиблись!)
factfront.app
```

## i18n keys

### RU (`ru.json`)
```json
{
  "factOfDay": {
    "title": "Факт дня",
    "wrongPercent": "{{percent}}% людей ответили неправильно!",
    "youGotIt": "А ты угадал!",
    "youMissed": "Ты тоже ошибся",
    "share": "Поделиться"
  }
}
```

### EN (`en.json`)
```json
{
  "factOfDay": {
    "title": "Fact of the Day",
    "wrongPercent": "{{percent}}% of people answered incorrectly!",
    "youGotIt": "You got it right!",
    "youMissed": "You missed it too",
    "share": "Share"
  }
}
```
