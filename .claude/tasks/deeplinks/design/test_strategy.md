# Тестирование: Deeplinks

## Критерии приёмки
1. Файл `apple-app-site-association` доступен по `https://factfront.org/.well-known/apple-app-site-association`
2. Файл `assetlinks.json` доступен по `https://factfront.org/.well-known/assetlinks.json`
3. app.json содержит `associatedDomains` для iOS и `intentFilters` для Android
4. Share-ссылки используют `https://factfront.org`
5. TypeScript компилируется без ошибок
6. Lint проходит

## Ручное тестирование (после деплоя)
1. Проверить доступность файлов через curl
2. Отправить ссылку `https://factfront.org` в мессенджер → нажать → должно открыть приложение (iOS)
3. Проверить шеринг из приложения — ссылки должны быть `https://factfront.org`
4. Валидация AASA: https://branch.io/resources/aasa-validator/
