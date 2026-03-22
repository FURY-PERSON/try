# Архитектура: Экран логина (mobile)

## Обзор по Figma

Экран состоит из:

- Верхняя часть — пустая область (позже фоновая картинка на всю высоту и ширину экрана), иконки помощи и языка в правом верхнем углу
- Нижняя часть — карточка с формой логина:
  - Логотип + "Small Chat"
  - Поле "Логин" (email, с иконкой пользователя)
  - Поле "Пароль" (с иконкой замка и toggle видимости)
  - Кнопка "Войти"

## Затрагиваемые слои

```mermaid
graph TB
    subgraph "Shared"
        A[core/auth - Reatom actions/atoms]
        A2[core/auth/validation - правила валидации NEW]
        B[react-sdk/hooks/auth - useLogin, useIsAuthenticated]
        C[base/api - loginApiV1AuthLogin]
        D[base/i18n - auth.json локали]
    end

    subgraph "Mobile Platform (без изменений)"
        E[mobile/sdk - MobileSDKProvider]
        F[mobile/design-system - Button, InputField, Heading, Body, Spinner]
    end

    subgraph "Mobile Product (новый код)"
        G[screens/login - LoginScreen компонент]
    end

    subgraph "Mobile Entry (изменения)"
        H[app/login.tsx - route файл]
        I[initialization-guard.tsx - auth redirect logic]
        J[app/_layout.tsx - добавить login в Stack]
    end

    G --> A2
    G --> B
    G --> F
    G --> D
    H --> G
    I --> B
    E --> A
    B --> A
    A --> C
```

## Компонентная структура

```
LoginScreen
├── SafeAreaView (фон — пока пустой, позже картинка)
├── Header (правый верхний угол)
│   ├── HelpIcon (вопросик)
│   └── LanguageIcon (глобус)
├── KeyboardAvoidingView
│   └── LoginCard (карточка внизу экрана)
│       ├── Logo + "Small Chat" (Heading)
│       ├── LoginForm
│       │   ├── DSComponents.InputField (email/username)
│       │   ├── DSComponents.InputField (password, secureTextEntry + toggle)
│       │   └── DSComponents.Button ("Войти")
│       └── Error message (если есть)
```

## Потоки данных

```mermaid
sequenceDiagram
    participant U as User
    participant S as LoginScreen
    participant H as useLogin (react-sdk)
    participant A as authActions.login (Reatom)
    participant API as POST /api/v1/auth/login

    U->>S: Вводит email + пароль
    U->>S: Нажимает "Войти"
    S->>H: login({ username, password })
    H->>A: authActions.login(credentials)
    A->>API: POST { username, password }
    API-->>A: { user, access_token, refresh_token }
    A->>A: sessionAtom.set({ hasSession: true, ... })
    A-->>H: success
    H-->>S: mutation complete
    Note over S: InitializationGuard детектит hasSession=true
    S-->>U: Редирект на (tabs) — главный экран
```

## Auth redirect flow

```mermaid
graph TD
    A[App Launch] --> B[Нативный Splash виден]
    B --> C[MobileSDKProvider init]
    C --> D[InitializationGuard]
    D --> E{minTime 1с прошло?}
    E -->|No| F[Splash остаётся]
    E -->|Yes| G{isInited?}
    G -->|Yes| H[SplashScreen.hideAsync]
    G -->|No| I{maxTime 2.5с прошло?}
    I -->|No| F
    I -->|Yes| J[SplashScreen.hideAsync]
    J --> K[FullScreen Loader]
    K -->|isInited| H
    H --> L{hasSession?}
    L -->|No| M[Redirect → /login]
    L -->|Yes| N[Показать tabs]
    M --> O[User логинится]
    O --> P[sessionAtom обновляется]
    P --> N
```
