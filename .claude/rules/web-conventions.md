---
paths: ["web/**"]
description: Конвенции разработки React admin panel Fact Front
---

# Конвенции веб-разработки (Admin Panel)

## Стек

- React 19 + Vite 6 + TypeScript
- React Router DOM 7 (маршрутизация)
- TanStack React Query 5 (серверное состояние)
- Zustand 5 (клиентское состояние — auth store)
- Tailwind CSS 4 (стили)
- React Hook Form + Zod (формы и валидация)
- Axios (HTTP клиент)

## Структура

```
web/src/
  pages/              # Страницы (по одной на маршрут)
  components/
    layout/           # Layout компоненты (Sidebar, Header)
    ui/               # Переиспользуемые UI компоненты
  api-client/
    client.ts         # Axios instance factory
    endpoints/        # API эндпоинты по модулям
    types.ts          # Типы API
  stores/             # Zustand stores
  services/           # Бизнес-логика
  lib/                # Утилиты
  shared/             # Shared компоненты
```

## API клиент

- Все запросы через `web/src/api-client/`
- Нет прямых axios/fetch вызовов в компонентах
- Proxy: `/api` → `localhost:3001` (настроено в Vite)

## Состояние

- **React Query** для серверных данных (вопросы, категории, коллекции и т.д.)
- **Zustand** только для клиентского состояния (auth token)
- Не дублировать серверное состояние в Zustand

## Формы

- React Hook Form для управления состоянием формы
- Zod для валидации
- Ошибки API показывать пользователю (toast через Sonner)

## Тестирование

- Playwright E2E тесты в `web/e2e/`
- Запуск: `npx playwright test` из `web/`
