# Исследование: Deeplinks для iOS и Android

## Область: mobile + deploy

## Задача
Добавить поддержку Universal Links (iOS) и App Links (Android) через домен factfront.org. Обновить nginx для раздачи verification-файлов. Обновить ссылки шеринга.

## Затрагиваемые модули
- `mobile/app.json` — конфигурация Expo (scheme, associatedDomains, intentFilters)
- `mobile/src/utils/share.ts` — функции шеринга (3 штуки)
- `deploy/prod/nginx-proxy.conf` — nginx для продакшена
- `deploy/stage/nginx-proxy.conf` — nginx для стейджа
- `deploy/prod/docker-compose.yml` — монтирование файлов
- `deploy/stage/docker-compose.yml` — монтирование файлов

## Существующие паттерны
- Custom URL scheme: `factfront://` (`mobile/app.json:7`)
- SEO-файлы раздаются через nginx из `deploy/prod/seo/` (`nginx-proxy.conf:33-43`)
- Docker mount: `./seo:/usr/share/nginx/seo:ro` (prod `docker-compose.yml:76`)
- Stage НЕ монтирует seo-директорию

## Зависимости и интеграции
- `expo-linking` ~7.0.0 — установлен
- `expo-router` ~4.0.0 — file-based routing
- React Native `Share` API — используется для шеринга

## Ключевые файлы
- `mobile/app.json` — нет associatedDomains/intentFilters
- `mobile/src/utils/share.ts` — URL: `factfront.app` и `https://factfront.app` (неверный домен!)
- `mobile/app/_layout.tsx` — root layout, Stack навигация
- `deploy/prod/nginx-proxy.conf` — нет location для .well-known
- `deploy/prod/seo/` — директория для статических файлов

## Модель данных
Не затрагивается.

## API контракты
Не затрагиваются.

## Критические находки
1. В share.ts используется домен `factfront.app` — нужно заменить на `factfront.org`
2. Нет файлов `apple-app-site-association` и `assetlinks.json`
3. Нет nginx location для `/.well-known/`
4. Bundle ID: `com.factfront.app` (iOS и Android)
5. Team ID нужно уточнить у пользователя для apple-app-site-association
