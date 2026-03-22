# Архитектура: Deeplinks

## Обзор

Universal Links (iOS) и App Links (Android) через домен `factfront.org`.

## Поток данных

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant B as Браузер/Мессенджер
    participant N as Nginx (factfront.org)
    participant A as Приложение

    Note over U,A: Верификация (однократно)
    B->>N: GET /.well-known/apple-app-site-association
    N-->>B: JSON (Team ID + Bundle ID + paths)
    B->>N: GET /.well-known/assetlinks.json
    N-->>B: JSON (package + fingerprints)

    Note over U,A: Открытие deeplink
    U->>B: Нажимает ссылку https://factfront.org/...
    B->>A: Если приложение установлено → открывает app
    B->>N: Если не установлено → fallback на сайт
```

## Компоненты

```mermaid
graph TD
    subgraph Deploy
        AASA[apple-app-site-association]
        AL[assetlinks.json]
        NC[nginx-proxy.conf]
        DC[docker-compose.yml]
    end

    subgraph Mobile
        AJ[app.json]
        SH[share.ts]
    end

    NC -->|serves| AASA
    NC -->|serves| AL
    DC -->|mounts| NC
    AJ -->|associatedDomains| AASA
    AJ -->|intentFilters| AL
    SH -->|URLs| AJ
```

## Решения по путям deeplink

Для MVP — один универсальный путь `/*` который открывает приложение. Конкретные маршруты (типа `/fact/123`) можно добавить позже.
