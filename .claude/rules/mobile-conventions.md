---
paths: ["mobile/**"]
description: Конвенции разработки мобильного приложения Fact Front (Expo + React Native)
---

# Конвенции мобильной разработки

## Маршрутизация (Expo Router)

- Файловая маршрутизация в `mobile/app/`
- Группы маршрутов через `(groupName)/` — `(tabs)`, `(onboarding)`
- Динамические маршруты через `[param].tsx`
- Layout файлы `_layout.tsx` в каждой директории

## Стейт-менеджмент

- **Zustand** для клиентского состояния (stores в `mobile/src/stores/`)
- **React Query** (`@tanstack/react-query`) для серверных данных
- Не дублировать серверное состояние в Zustand

## Формы

- React Hook Form + Zod валидация
- Ошибки API ДОЛЖНЫ выводиться пользователю (не хардкодить "Произошла ошибка")

## Локализация (i18next)

- Все пользовательские строки через `t('key')`
- Два языка: RU и EN
- Переводы в `mobile/src/i18n/`
- При добавлении нового текста — добавить ключ в оба языка

## Firebase

- Analytics, Crashlytics, FCM push через `@react-native-firebase/*`
- Конфигурация через `google-services.json` (Android) и `GoogleService-Info.plist` (iOS)

## Структура фичи

```
src/features/{feature-name}/
  components/          # UI компоненты фичи
  hooks/               # Хуки фичи
  types.ts             # Типы
  index.ts             # Реэкспорт
```

## Структура экрана

```
app/{route}.tsx         # Файл маршрута (Expo Router)
src/features/{name}/    # Логика и компоненты
```

## Правила

- **НЕ использовать `expo prebuild`** (указано в CLAUDE.md)
- Expo SDK версия ~52.0
- Все API-вызовы через сервисный слой (`mobile/src/services/`)
- Стили через `StyleSheet.create` из `react-native`
- Тема (цвета, spacing) из `mobile/src/theme/`
