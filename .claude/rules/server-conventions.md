---
paths: ["server/**"]
description: Конвенции разработки NestJS API сервера Fact Front
---

# Конвенции серверной разработки

## Структура модуля

```
server/src/modules/{module-name}/
  {module-name}.module.ts      # NestJS модуль
  {module-name}.controller.ts  # REST контроллер
  {module-name}.service.ts     # Бизнес-логика
  dto/                         # DTO (Data Transfer Objects)
    create-{entity}.dto.ts
    update-{entity}.dto.ts
  tests/                       # Unit тесты (*.spec.ts)
```

## База данных (Prisma)

- Схема: `server/prisma/schema.prisma`
- После изменения схемы: `npx prisma migrate dev` + `npx prisma generate`
- Алиас `@/` → `server/src/`
- Использовать `include` / `select` для оптимизации запросов
- Избегать N+1 — загружать связи в одном запросе

## API

- Префикс: `/api`
- Swagger: `/api/docs` (в development)
- Все эндпоинты — REST
- Swagger-декораторы обязательны: `@ApiTags`, `@ApiOperation`, `@ApiResponse`

## Аутентификация

- Mobile: device ID → JWT
- Admin: email/password → JWT
- Guards: `JwtAuthGuard` (mobile), `AdminJwtAuthGuard` (admin)
- Декоратор `@CurrentUser()` для получения пользователя из request

## Валидация

- DTO через `class-validator` + `class-transformer`
- Global `ValidationPipe` применяется автоматически
- Zod используется точечно для сложных валидаций

## Тестирование

- Jest: файлы `*.spec.ts` рядом с тестируемым кодом
- Запуск: `npm test` из `server/`

## Cron задачи

- `@nestjs/schedule` — декораторы `@Cron()`
- Используются для генерации daily sets и других периодических задач

## Rate Limiting

- Global `ThrottlerGuard` — настроен в `app.module.ts`
- Можно переопределить через `@Throttle()` на контроллере/методе
