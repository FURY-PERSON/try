# Решения: Deeplinks

## 1. Один домен для deeplinks
**Решение:** Использовать `factfront.org` (prod домен)
**Обоснование:** Это основной домен проекта, уже настроен SSL

## 2. Файлы в seo/ директории
**Решение:** Создать `.well-known/` внутри `deploy/prod/seo/` и раздавать через nginx
**Обоснование:** Паттерн уже используется для robots.txt, sitemap.xml, app-ads.txt

## 3. Пути deeplinks — широкие с исключениями
**Решение:** `/*` с исключением `/api/*`, `/admin/*`, `/privacy-policy/*`
**Обоснование:** Максимальная гибкость, не ломает существующий функционал

## 4. Stage — без deeplinks
**Решение:** Deeplinks только для prod домена
**Обоснование:** Stage использует duckdns.org — нет смысла настраивать deeplinks

## Риски
- **SHA256 fingerprint для Android:** Без fingerprint App Links не будут автоматически верифицированы. Fallback — intent filter откроет диалог выбора приложения. Нужно добавить fingerprint позже.
- **Пересборка нативного кода:** Изменения в app.json (associatedDomains, intentFilters) требуют пересборки iOS/Android. Это НЕ OTA update.
