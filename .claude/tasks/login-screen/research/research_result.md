# Исследование: Экран логина (mobile)

## Задача

Реализовать экран логина в мобильном приложении small-chat. Дизайн из Figma, UI-kit из mobile design system.

## Затрагиваемые модули

### Shared (новый модуль validation + существующее без изменений)

- `platforms/shared/modules/core/auth/` — Reatom бизнес-логика авторизации
- `platforms/shared/modules/base/api/gen/client/auth/` — API клиент логина (POST `/api/v1/auth/login`)
- `platforms/shared/products/react-sdk/hooks/auth/` — React хуки: `useLogin`, `useIsAuthenticated`, `useIsInited`

### Web (рефакторинг валидации)

- `platforms/web/products/small-chat/src/components/forms/LoginForm.tsx` — перевести inline zod правила на общие из `@platforms-core/auth`

### Mobile (потребуются изменения)

- `platforms/mobile/entries/small-chat/app/` — Expo Router навигация (нужно добавить экран login)
- `platforms/mobile/entries/small-chat/src/initialization/` — InitializationGuard (нужно добавить проверку авторизации)
- `platforms/mobile/products/small-chat/screens/` — Экраны приложения (нужно создать экран login)

## Существующие паттерны

### Auth flow (shared)

- **Login action:** `platforms/shared/modules/core/auth/actions/login.ts` — Reatom action, вызывает API и обновляет sessionAtom
- **Session atom:** `platforms/shared/modules/core/auth/atoms/session.ts` — хранит `{hasSession, user, accessToken, refreshToken}`, персистится
- **API контракт:** `POST /api/v1/auth/login` — принимает `{username: string, password: string}`, возвращает `{user, access_token, refresh_token?}`
- **useLogin hook:** `platforms/shared/products/react-sdk/hooks/auth/use-login.ts` — обёртка над `authActions.login` через `useSdkMutation`
- **useIsAuthenticated:** `platforms/shared/products/react-sdk/hooks/auth/use-is-authenticated.ts` — `session.hasSession`
- **useIsInited:** `platforms/shared/products/react-sdk/hooks/auth/use-is-inited.ts` — `session.isHydrated`

### Web login screen (reference)

- **Login screen:** `platforms/web/products/small-chat/screens/auth/login/Login.tsx` — Card с LoginForm, навигация на "/u" после успеха
- **LoginForm:** `platforms/web/products/small-chat/src/components/forms/LoginForm.tsx` — react-hook-form + zod валидация, поля email/password, `useAuthContext()` для login/isLoading/error
- **AuthLayout:** `platforms/web/products/small-chat/navigation/layouts/AuthLayout.tsx` — редиректит на главную если авторизован

### Mobile app structure

- **Entry point:** `platforms/mobile/entries/small-chat/app/_layout.tsx` — MobileSDKProvider → InitializationGuard → Stack (expo-router)
- **Навигация:** Expo Router с file-based routing, Stack навигатор, вложенные Tabs
- **Текущие экраны:** `(tabs)/index` (Home), `(tabs)/explore`, `modal`, `playground`
- **SDK:** `platforms/mobile/products/sdk/` — MobileSDKProvider оборачивает ReactSDKProvider с `authMode: 'jwt'`
- **InitializationGuard:** `platforms/mobile/entries/small-chat/src/initialization/initialization-guard.tsx` — пока пустой, просто рендерит children

### Mobile Design System

Путь: `platforms/mobile/shared/modules/base/design-system/components/`
Реэкспорт из `@small-tech/ui-kit-rn`. Доступные компоненты:

- **Button** — кнопка
- **Input** — поле ввода
- **FloatingInput** — floating label input
- **InputField** — поле с лейблом/ошибкой
- **Body, Heading, ButtonText, FieldText, LinkText** — типография
- **Spinner** — индикатор загрузки
- **Alert** — алерт
- Также: Checkbox, Chip, Modal, OTPField, и др.

### Mobile формы (паттерн из ui-kit)

- `DSComponents.InputField` — интегрирован с `react-hook-form` (принимает `name`, `control`, `label`, `placeholder`, `rules`)
- Валидация через `rules` (react-hook-form native), не zod (в отличие от web)
- В нашем приложении нужно добавлять i18n для лейблов, плейсхолдеров и сообщений валидации

```tsx
// Паттерн использования (из ui-kit, адаптировать под i18n)
<DSComponents.InputField
    name="email"
    control={control}
    label="Email"           // → t('auth:login.emailLabel')
    placeholder="..."       // → t('auth:login.emailPlaceholder')
    keyboardType="email-address"
    autoCapitalize="none"
    rules={{
        required: 'Email обязателен',  // → t('validation:email.required')
        pattern: { value: /^\S+@\S+$/i, message: '...' },
    }}
/>
```

### Именование пакетов (mobile screens)

- Формат: `@small-chat-mobile-screens/{screen-name}`
- Пример: `@small-chat-mobile-screens/home` (package.json → `platforms/mobile/products/small-chat/screens/home/`)
- Зависимости: `@mobile-base/design-system: workspace:*`

## Зависимости и интеграции

| Зависимость   | Пакет                        | Что используем                                  |
| ------------- | ---------------------------- | ----------------------------------------------- |
| Auth actions  | `@platforms-core/auth`       | `authActions.login`                             |
| Auth hooks    | `@platforms/react-sdk`       | `useLogin`, `useIsAuthenticated`, `useIsInited` |
| API types     | `@platforms-base/api`        | `LoginApiV1AuthLoginMutationRequest`            |
| Design System | `@mobile-base/design-system` | `Button`, `Input`, `Heading`, `Body`, `Spinner` |
| i18n          | `@platforms-base/i18n`       | Локали `auth.json` (уже есть ключи login.\*)    |

## Ключевые файлы

| Файл                                                                              | Роль                              |
| --------------------------------------------------------------------------------- | --------------------------------- |
| `platforms/shared/modules/core/auth/actions/login.ts`                             | Reatom action логина              |
| `platforms/shared/modules/core/auth/atoms/session.ts`                             | Атом сессии                       |
| `platforms/shared/products/react-sdk/hooks/auth/use-login.ts`                     | React hook useLogin               |
| `platforms/shared/products/react-sdk/hooks/auth/use-is-authenticated.ts`          | Проверка авторизации              |
| `platforms/shared/modules/base/api/gen/types/auth/LoginApiV1AuthLogin.ts`         | Типы API                          |
| `platforms/mobile/entries/small-chat/app/_layout.tsx`                             | Root layout мобильного приложения |
| `platforms/mobile/entries/small-chat/src/initialization/initialization-guard.tsx` | Guard инициализации               |
| `platforms/mobile/shared/modules/base/design-system/components/index.ts`          | Entry point дизайн-системы        |
| `platforms/web/products/small-chat/src/components/forms/LoginForm.tsx`            | Web LoginForm (reference)         |

## Модель данных

```typescript
// Request
type LoginApiV1AuthLoginMutationRequest = {
  username: string; // Email или username
  password: string;
};

// Response
type LoginResponse = {
  user: User;
  access_token: string;
  refresh_token?: string;
};

// Session (Reatom atom)
interface Session {
  authMode: "cookie" | "jwt";
  hasSession: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}
```

## Заметки по дизайну

- Сейчас фон экрана логина пустой, но позже будет добавлена фоновая картинка. Нужно учесть это при вёрстке — контент должен корректно отображаться поверх фона (контраст, прозрачности и т.д.)

## API контракты

- `POST /api/v1/auth/login` — логин (username + password → tokens + user)
- `POST /api/v1/auth/refresh` — рефреш токена
- `POST /api/v1/auth/logout` — логаут
