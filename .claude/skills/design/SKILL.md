---
name: design
description: Создание HLD (High-Level Design) фичи на основе задачи и результатов исследования. Использовать после завершения /research.
argument-hint: "[feature-name]"
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, Write, Edit, AskUserQuestion
model: inherit
---

# Design: Создание архитектурного дизайна фичи

## Входные данные

Feature: $ARGUMENTS

1. Прочитай `.claude/tasks/$0/research/research_result.md`
2. Прочитай `.claude/tasks/$0/status.md` — убедись что исследование завершено

Если файлы не найдены — сообщи пользователю и предложи сначала запустить `/research`.

## Процесс

Создай 4 файла в `.claude/tasks/$0/design/`:

### 1. architecture.md — Архитектурный дизайн

```markdown
# Архитектурный дизайн: {название фичи}

## Обзор
{1-2 абзаца: что делаем и как это вписывается в текущую архитектуру}

## Затрагиваемые компоненты
| Компонент | Директория | Тип изменения |
|-----------|-----------|---------------|
| NestJS модуль | server/src/modules/... | новый / изменение |
| Admin страница | web/src/pages/... | новый / изменение |
| Mobile экран | mobile/app/... | новый / изменение |
| Prisma модель | server/prisma/schema.prisma | изменение |

## Диаграмма компонентов
```mermaid
graph TD
  ...
```

## Диаграмма потоков данных
```mermaid
flowchart LR
  ...
```

## Sequence-диаграммы
```mermaid
sequenceDiagram
  ...
```
```

### 2. contracts.md — API и контракты данных

```markdown
# API и контракты данных

## Изменения API
### {Эндпоинт}
- Метод: GET/POST/PUT/DELETE
- Путь: /api/...
- Request: {схема}
- Response: {схема}
- Auth: JWT (mobile) / AdminJWT

## Изменения Prisma схемы
```prisma
model NewModel {
  // ...
}
```

## DTO
```typescript
class CreateEntityDto {
  // class-validator декораторы
}
```
```

### 3. decisions.md — Решения и риски

```markdown
# Проектные решения

## Решение 1: {название}
- **Контекст:** {почему нужно принять решение}
- **Варианты:** {A, B, ...}
- **Выбор:** {вариант и обоснование}

## Риски
| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| ... | ... | ... | ... |
```

### 4. test_strategy.md — Стратегия тестирования

```markdown
# Стратегия тестирования

## Критерии приёмки
- [ ] {критерий 1}
- [ ] {критерий 2}

## Unit-тесты (Jest)
- {что тестируем: server/src/modules/.../tests/*.spec.ts}

## E2E-тесты (Playwright, если web)
- {сценарии: web/e2e/}

## Ручное тестирование
- {сценарии для ручной проверки}
```

## Шаг 3.1: Проверка соответствия

После создания всех файлов дизайна, запусти саб-агент `compliance-reviewer` для проверки.

Передай агенту:
- Путь к файлам дизайна: `.claude/tasks/$0/design/`
- Путь к исследованию: `.claude/tasks/$0/research/research_result.md`

Если найдены нарушения — исправь дизайн и повтори проверку.

## Завершение

1. Обнови `.claude/tasks/$0/status.md` со статусом "дизайн завершён"
2. Выведи краткую сводку дизайна пользователю
3. Предложи проревьюить файлы в `.claude/tasks/$0/design/`
4. НЕ переходи к планированию без явного подтверждения пользователя
