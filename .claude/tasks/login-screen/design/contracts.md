# Контракты: Экран логина (mobile)

## API контракты (без изменений)

Используем существующий API — новых эндпоинтов не требуется.

```typescript
// POST /api/v1/auth/login
// Request
type LoginApiV1AuthLoginMutationRequest = {
    username: string;  // Email или username
    password: string;
}

// Response (200)
type LoginResponse = {
    user: User;
    access_token: string;
    refresh_token?: string;
}

// Errors: 401 (неверные credentials), 500 (server error)
```

## Модель данных (без изменений)

Session atom уже существует и персистится:

```typescript
interface Session {
    authMode: 'cookie' | 'jwt';  // mobile = 'jwt'
    hasSession: boolean;
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
}
```

## Валидация формы

Правила валидации — в shared слое: `platforms/shared/modules/core/auth/validation/`.
Это бизнес-логика, общая для всех платформ.

### Новый модуль: `platforms/shared/modules/core/auth/validation/`

Структура по аналогии с `actions/`, `atoms/`, `types/`:

```
platforms/shared/modules/core/auth/validation/
├── index.ts    # createEntryPoint, реэкспорт
└── login.ts    # правила валидации логина
```

```typescript
// platforms/shared/modules/core/auth/validation/login.ts
export const loginValidationRules = {
    username: {
        required: true,
        pattern: /^\S+@\S+$/i,
    },
    password: {
        required: true,
        minLength: 6,
    },
};

// platforms/shared/modules/core/auth/validation/index.ts
import { createEntryPoint, type EntryPoint } from '@platforms/kit';
import { loginValidationRules } from './login';

const entry = {
    login: () => loginValidationRules,
};

export const validation = createEntryPoint<EntryPoint<typeof entry>>((key) => entry[key]());
```

Реэкспорт из корневого `platforms/shared/modules/core/auth/index.ts`:

```typescript
export { validation as authValidation } from './validation';
```

### Использование в mobile (react-hook-form rules)

```typescript
import { loginValidationRules } from '@platforms-core/auth';

<DSComponents.InputField
    name="email"
    control={control}
    rules={{
        required: t('validation:email.required'),
        pattern: { value: loginValidationRules.username.pattern, message: t('validation:email.invalid') },
    }}
/>
```

### Использование в web (zod — рефакторинг)

Web `LoginForm.tsx` сейчас дублирует правила через inline zod schema. Нужно перевести на общие правила из `@platforms-core/auth`:

```typescript
import { loginValidationRules } from '@platforms-core/auth';

const createLoginSchema = () =>
    z.object({
        email: z.string()
            .min(1, t('validation:email.required'))
            .regex(loginValidationRules.username.pattern, t('validation:email.invalid')),
        password: z.string()
            .min(1, t('validation:password.required'))
            .min(loginValidationRules.password.minLength, t('validation:password.minLength')),
    });
```

### Принцип

| Слой | Ответственность |
|------|----------------|
| `core/auth/validation` | Правила (pattern, minLength, required) — без i18n |
| UI (mobile/web) | i18n сообщения + привязка правил к форме (rules/zod) |

## Новые компоненты

### LoginScreen (`@small-chat-mobile-screens/login`)

```typescript
// Props — нет, экран самодостаточен
export function LoginScreen(): JSX.Element;
```

### Изменения в InitializationGuard

```typescript
// До
export const InitializationGuard = ({ children }: { children: ReactNode }) => {
    return <>{children}</>;
};

// После — нативный splash 1-2.5с, затем fallback loader если не готовы
export const InitializationGuard = ({ children }: { children: ReactNode }) => {
    const isInited = hooks.auth.useIsInited();
    const isAuthenticated = hooks.auth.useIsAuthenticated();
    const [minTimeReached, setMinTimeReached] = useState(false);
    const [maxTimeReached, setMaxTimeReached] = useState(false);

    useEffect(() => {
        const minTimer = setTimeout(() => setMinTimeReached(true), 1000);
        const maxTimer = setTimeout(() => setMaxTimeReached(true), 2500);
        return () => { clearTimeout(minTimer); clearTimeout(maxTimer); };
    }, []);

    const readyToHideSplash = minTimeReached && (isInited || maxTimeReached);

    useEffect(() => {
        if (readyToHideSplash) {
            SplashScreen.hideAsync();
        }
    }, [readyToHideSplash]);

    // Нативный splash ещё показан
    if (!readyToHideSplash) return null;

    // Splash скрыт, но данные ещё не готовы — fullscreen loader
    if (!isInited) return <FullScreenLoader />;

    if (!isAuthenticated) return <Redirect href="/login" />;
    return <>{children}</>;
};
```

Логика:
1. **0 — 1с** — нативный splash всегда (минимум для плавного UX)
2. **1с — 2.5с** — если `isInited` стал `true` → скрываем splash, редирект
3. **> 2.5с** — скрываем splash принудительно, показываем fullscreen loader пока не загрузимся
4. Как только `isInited === true` → решаем: login или приложение

## i18n ключи

Существующие ключи из `auth.json` (ru):
- `login.title` — нужно добавить (= "Small Chat")
- `login.description` — "Введите свои данные для доступа к мессенджеру"
- `login.emailLabel` — "Email адрес" → в Figma "Логин"
- `login.passwordLabel` — "Пароль"
- `login.passwordPlaceholder` — "Введите ваш пароль"
- `login.submitButton` — "Войти"
- `login.submitting` — "Вход..."
- `login.apiError` — "Неверный email или пароль..."

Может потребоваться:
- Изменить `login.emailLabel` → "Логин" (согласно Figma) или добавить отдельный ключ для mobile
