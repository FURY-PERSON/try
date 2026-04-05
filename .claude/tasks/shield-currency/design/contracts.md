# API-контракты: Валюта "Щит"

## Prisma Schema Changes

```prisma
model User {
  // ... existing fields
  shields Int @default(0)  // Shield balance
}
```

Начальное значение 0 — при регистрации присваивается 5 через код (не default, т.к. существующие пользователи получат 5 при первом запросе баланса).

## Новые API эндпоинты

### POST /v1/shields/use
Атомарное списание щита. Вызывается при неправильном ответе с активным щитом.

**Guard:** DeviceAuthGuard

**Request:**
```json
{
  "questionId": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "remainingShields": 4
}
```

**Response 400:**
```json
{
  "message": "Not enough shields"
}
```

**Логика:** Атомарная проверка и списание через `UPDATE ... WHERE shields > 0`

### POST /v1/shields/reward
Начисление щитов за просмотр видео.

**Guard:** DeviceAuthGuard

**Request:**
```json
{
  "source": "rewarded_video"
}
```

**Response 200:**
```json
{
  "shieldsAdded": 2,
  "totalShields": 6
}
```

## Изменения существующих API

### GET /v1/home/feed
**userProgress расширяется:**
```json
{
  "userProgress": {
    "dailyCompleted": false,
    "streak": 5,
    "shields": 3,
    "nickname": "...",
    "avatarEmoji": "..."
  }
}
```

### GET /v1/users/me/stats
**Добавляется поле:**
```json
{
  "shields": 3,
  // ...existing fields
}
```

### POST /v1/questions/:id/answer
**Request расширяется:**
```json
{
  "userAnswer": true,
  "timeSpentSeconds": 5,
  "useShield": true  // optional, default false
}
```

**Response расширяется:**
```json
{
  "correct": false,
  "shieldUsed": true,
  "remainingShields": 4,
  "streakPreserved": true,
  // ...existing fields
}
```

### POST /v1/daily-sets/:id/submit
**results item расширяется:**
```json
{
  "results": [
    {
      "questionId": "...",
      "result": "incorrect",
      "timeSpentSeconds": 5,
      "shieldUsed": true
    }
  ]
}
```

**Response расширяется:**
```json
{
  "shieldsEarned": 3,  // бонус за ≥50% правильных
  "totalShields": 7,
  // ...existing fields
}
```

## DTO

### UseShieldDto
```typescript
class UseShieldDto {
  @IsString()
  questionId: string;
}
```

### RewardShieldDto
```typescript
class RewardShieldDto {
  @IsEnum(['rewarded_video'])
  source: string;
}
```

### AnswerQuestionDto (расширение)
```typescript
class AnswerQuestionDto {
  @IsBoolean()
  userAnswer: boolean;

  @IsNumber()
  timeSpentSeconds: number;

  @IsBoolean()
  @IsOptional()
  useShield?: boolean;  // NEW
}
```

## Начисление щитов (streak milestone)

В `answerQuestion` и `submitDailySet`: при каждом кратном 10 streak → `shields += 1`.

Логика: `if (isCorrect && currentAnswerStreak > 0 && currentAnswerStreak % 10 === 0) shields++`
