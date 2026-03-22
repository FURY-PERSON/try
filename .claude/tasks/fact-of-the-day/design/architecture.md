# Архитектура: Факт дня

## Компоненты

```mermaid
graph TD
    A[DailySet Prisma Model] -->|factOfDayQuestionId| B[DailySetsService]
    B -->|getTodaySet| C[DailySetsController]
    B -->|submitDailySet| C
    C -->|API Response| D[Mobile gameApi]
    D --> E[useCardGame hook]
    E -->|submissionResult.factOfDay| F[ResultsModal]
    F -->|показывает| G[FactOfDayCard component]
    G -->|shareFactOfDay| H[Share API]
```

## Поток данных

```mermaid
sequenceDiagram
    participant Admin as Admin Panel
    participant DB as PostgreSQL
    participant API as NestJS API
    participant App as Mobile App

    Admin->>DB: Создаёт DailySet с factOfDayQuestionId
    Note over Admin,DB: Или авто-выбор по min(timesCorrect/timesShown)

    App->>API: GET /v1/daily-sets/today
    API->>DB: Запрос daily set + factOfDayQuestionId
    API-->>App: DailySetWithQuestions + factOfDayQuestionId

    App->>App: Пользователь играет daily set
    App->>API: POST /v1/daily-sets/:id/submit
    API->>DB: Получить Question stats для factOfDay
    API-->>App: SubmissionResult + factOfDay { statement, wrongPercent, userCorrect }

    App->>App: Показать ResultsModal
    App->>App: Показать FactOfDayCard
    App->>App: Пользователь нажимает "Поделиться"
    App->>App: Share.share({ message })
```

## Авто-выбор факта дня

Если `factOfDayQuestionId` не задан админом — сервер автоматически выбирает вопрос из daily set с наименьшим `timesCorrect / timesShown` (самый трудный = самый контринтуитивный). Если статистики нет (timesShown = 0) — выбирается первый вопрос.
