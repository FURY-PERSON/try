# Задача Tech Lead: Система фича-флагов

## Контекст
Стек: NestJS 10 + Prisma 5 + PostgreSQL 16 (server), React 19 + Vite 6 + Tailwind (web), Expo SDK 52 + Zustand (mobile).
Структура сервера: `server/src/modules/<module>/`. Паттерн — module/controller/service/repository + DTO.
API-клиент веба: `web/src/api-client/client.ts` + `endpoints/<name>.ts`.
Мобильный API: `mobile/src/services/api.ts` (fetch-обёртка с `X-Device-Id`).
Инициализация мобилы: `mobile/app/_layout.tsx` → `useEffect` при старте.

---

## Часть 1 — Server (NestJS)

### 1.1 Prisma schema
Добавить в `server/prisma/schema.prisma`:

```prisma
model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique          // уникальный строковый ключ, напр. "new_leaderboard"
  name        String                    // человекочитаемое название
  description String   @default("")     // зачем нужен флаг
  isEnabled   Boolean  @default(false)
  payload     Json?                     // опциональные данные (цвет, текст, число и т.д.)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

После добавления — миграция: `npx prisma migrate dev --name add-feature-flags`.

### 1.2 Файловая структура модуля
```
server/src/modules/feature-flags/
├── feature-flags.module.ts
├── feature-flags.controller.ts
├── feature-flags.service.ts
├── feature-flags.repository.ts
├── dto/
│   ├── create-feature-flag.dto.ts
│   └── update-feature-flag.dto.ts
└── entities/
    └── feature-flag.entity.ts
```

### 1.3 DTO

**create-feature-flag.dto.ts**
```typescript
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, Matches } from 'class-validator';

export class CreateFeatureFlagDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9_]*$/, { message: 'key must be snake_case, start with a letter' })
  key: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>;
}
```

**update-feature-flag.dto.ts** — `PartialType(CreateFeatureFlagDto)`, но `key` нельзя менять (убрать из partial через `OmitType`).

### 1.4 REST API

| Метод  | Путь                        | Описание                        | Auth   |
|--------|-----------------------------|---------------------------------|--------|
| GET    | /feature-flags              | Список всех флагов              | Public |
| GET    | /feature-flags/:key         | Один флаг по key                | Public |
| POST   | /feature-flags              | Создать флаг                    | Admin  |
| PATCH  | /feature-flags/:key         | Обновить флаг (частично)        | Admin  |
| DELETE | /feature-flags/:key         | Удалить флаг                    | Admin  |
| PATCH  | /feature-flags/:key/toggle  | Быстрый toggle enabled/disabled | Admin  |

**Важно:**
- `GET /feature-flags` и `GET /feature-flags/:key` — публичные (без Bearer-токена). Мобилка обращается к ним без авторизации.
- Все мутирующие методы — только с `AdminGuard` (Bearer-токен).
- Если `key` не найден — `NotFoundException`.
- Если `key` уже существует при создании — `ConflictException`.

### 1.5 Формат ответа (публичный список для мобилки)
```json
{
  "data": [
    {
      "key": "new_leaderboard",
      "isEnabled": true,
      "payload": { "variant": "v2" }
    }
  ]
}
```
Публичный эндпоинт возвращает только `key`, `isEnabled`, `payload` (без `id`, `createdAt`, `updatedAt` для экономии).
Полный объект возвращают только admin-эндпоинты.

### 1.6 Кэширование (опционально, но желательно)
GET /feature-flags кэшировать в памяти на 60 секунд через NestJS CacheModule (`@nestjs/cache-manager`). При любой мутации флага — инвалидировать кэш.

### 1.7 Seed (пример флагов)
Добавить в `server/prisma/seed.ts` несколько дефолтных флагов:
```typescript
const flags = [
  { key: 'show_ads', name: 'Показ рекламы', description: 'Глобальное управление рекламой', isEnabled: true },
  { key: 'show_leaderboard', name: 'Таблица лидеров', description: 'Вкладка с лидербордом', isEnabled: true },
  { key: 'show_collections', name: 'Коллекции', description: 'Вкладка с коллекциями', isEnabled: true },
  { key: 'show_daily_set', name: 'Ежедневный набор', description: 'Блок на главной', isEnabled: true },
  { key: 'maintenance_mode', name: 'Режим обслуживания', description: 'Показывает заглушку вместо контента', isEnabled: false },
];
```

---

## Часть 2 — Web Admin Panel (React + Vite)

### 2.1 Файловая структура
```
web/src/
├── api-client/endpoints/feature-flags.ts   # новый файл
├── pages/FeatureFlagsPage.tsx              # новый файл
```
Изменяемые файлы:
- `web/src/api-client/client.ts` — добавить `featureFlags` endpoint
- `web/src/api-client/index.ts` — реэкспортировать
- `web/src/App.tsx` — добавить Route `/feature-flags`
- `web/src/components/layout/AppLayout.tsx` (или аналогичный Sidebar) — добавить пункт меню

### 2.2 API-клиент (web/src/api-client/endpoints/feature-flags.ts)
```typescript
import type { AxiosInstance } from 'axios';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  payload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureFlagDto {
  key: string;
  name: string;
  description?: string;
  isEnabled?: boolean;
  payload?: Record<string, unknown>;
}

export type UpdateFeatureFlagDto = Partial<Omit<CreateFeatureFlagDto, 'key'>>;

export function createFeatureFlagsEndpoints(instance: AxiosInstance) {
  return {
    getAll: () => instance.get<FeatureFlag[]>('/feature-flags'),
    getByKey: (key: string) => instance.get<FeatureFlag>(`/feature-flags/${key}`),
    create: (dto: CreateFeatureFlagDto) => instance.post<FeatureFlag>('/feature-flags', dto),
    update: (key: string, dto: UpdateFeatureFlagDto) => instance.patch<FeatureFlag>(`/feature-flags/${key}`, dto),
    delete: (key: string) => instance.delete<void>(`/feature-flags/${key}`),
    toggle: (key: string) => instance.patch<FeatureFlag>(`/feature-flags/${key}/toggle`),
  };
}
```

### 2.3 FeatureFlagsPage.tsx — требования к UI

Страница `/feature-flags` в защищённой зоне (ProtectedRoute).

**Шапка:**
- Заголовок "Feature Flags"
- Кнопка "+ Новый флаг" → открывает модальное окно создания

**Таблица флагов (columns):**
| Колонка | Содержимое |
|---------|-----------|
| Key | `monospace` тег с key |
| Название | name + description (серым, мелко) |
| Payload | если есть — `<code>` с JSON.stringify, иначе "—" |
| Статус | Toggle switch (inline, без submit) — вызывает `toggle` API |
| Действия | Кнопки: ✏️ Редактировать, 🗑️ Удалить |

**Модальное окно создания/редактирования:**
- Поля: Key (disabled при редактировании), Название, Описание, Enabled (checkbox), Payload (textarea с валидным JSON)
- Валидация: key — `/^[a-z][a-z0-9_]*$/`, name — обязательно, payload — валидный JSON или пусто
- Кнопки: "Сохранить" / "Отмена"

**Удаление:**
- Confirm-диалог перед удалением: "Удалить флаг `{key}`? Это действие необратимо."

**Состояния:**
- Loading skeleton пока грузятся данные
- Empty state если флагов нет
- Error state если запрос упал

**Технически:**
- `@tanstack/react-query` для fetching (useQuery + useMutation)
- Toast уведомления при успехе/ошибке (через существующий механизм в проекте)
- Tailwind классы, shadcn/ui компоненты (Dialog, Switch, Table, Button)

### 2.4 Навигация
Добавить в Sidebar пункт "Feature Flags" с иконкой `Flag` (lucide-react) между "Notifications" и "Reference".

---

## Часть 3 — Mobile (Expo + Zustand)

### 3.1 Файловая структура
```
mobile/src/
├── features/feature-flags/
│   ├── api.ts          # API-запрос
│   ├── types.ts        # типы
│   └── hooks/
│       └── useFeatureFlag.ts   # хук для использования в компонентах
├── stores/
│   └── useFeatureFlagsStore.ts # Zustand store
```

### 3.2 Типы (mobile/src/features/feature-flags/types.ts)
```typescript
export interface FeatureFlag {
  key: string;
  isEnabled: boolean;
  payload: Record<string, unknown> | null;
}

export type FeatureFlagsMap = Record<string, FeatureFlag>;
```

### 3.3 API (mobile/src/features/feature-flags/api.ts)
```typescript
import { API_URL } from '@/constants/config';

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const response = await fetch(`${API_URL}/feature-flags`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Failed to fetch feature flags');
  const json = await response.json();
  // Сервер возвращает { data: [...] } или [...] — обработать оба варианта
  return Array.isArray(json) ? json : json.data ?? [];
}
```

### 3.4 Zustand Store (mobile/src/stores/useFeatureFlagsStore.ts)
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeatureFlagsMap } from '@/features/feature-flags/types';

type FeatureFlagsState = {
  flags: FeatureFlagsMap;
  lastFetchedAt: number | null;   // timestamp ms
  isLoading: boolean;
  error: string | null;

  setFlags: (flags: FeatureFlagsMap) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isEnabled: (key: string, defaultValue?: boolean) => boolean;
  getPayload: <T = Record<string, unknown>>(key: string) => T | null;
};

export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  persist(
    (set, get) => ({
      flags: {},
      lastFetchedAt: null,
      isLoading: false,
      error: null,

      setFlags: (flags) => set({ flags, lastFetchedAt: Date.now(), error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      isEnabled: (key, defaultValue = false) => {
        const flag = get().flags[key];
        return flag ? flag.isEnabled : defaultValue;
      },

      getPayload: <T>(key: string): T | null => {
        const flag = get().flags[key];
        return flag?.payload as T ?? null;
      },
    }),
    {
      name: 'feature-flags-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Персистить флаги — чтобы работали при оффлайн-старте
    },
  ),
);
```

### 3.5 Хук (mobile/src/features/feature-flags/hooks/useFeatureFlag.ts)
```typescript
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';

export function useFeatureFlag(key: string, defaultValue = false): boolean {
  return useFeatureFlagsStore((s) => s.isEnabled(key, defaultValue));
}

export function useFeatureFlagPayload<T = Record<string, unknown>>(key: string): T | null {
  return useFeatureFlagsStore((s) => s.getPayload<T>(key));
}
```

### 3.6 Загрузка при старте (mobile/app/_layout.tsx)

В существующий `useEffect` в `RootLayout` добавить вызов загрузки флагов:

```typescript
// Импорты добавить:
import { fetchFeatureFlags } from '@/features/feature-flags/api';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';

// Внутри компонента:
const setFlags = useFeatureFlagsStore((s) => s.setFlags);
const setFlagsLoading = useFeatureFlagsStore((s) => s.setLoading);
const lastFetchedAt = useFeatureFlagsStore((s) => s.lastFetchedAt);

// В useEffect (или отдельный useEffect):
const loadFeatureFlags = useCallback(async () => {
  // Не перезагружать чаще чем раз в 5 минут (используем закэшированные)
  const CACHE_TTL_MS = 5 * 60 * 1000;
  if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_TTL_MS) return;

  setFlagsLoading(true);
  try {
    const flags = await fetchFeatureFlags();
    const flagsMap = Object.fromEntries(flags.map((f) => [f.key, f]));
    setFlags(flagsMap);
  } catch {
    // Не бросаем ошибку вверх — приложение работает с закэшированными/дефолтными флагами
  } finally {
    setFlagsLoading(false);
  }
}, [lastFetchedAt, setFlags, setFlagsLoading]);

useEffect(() => {
  loadFeatureFlags();
}, [loadFeatureFlags]);
```

**Важно:** Если запрос упал (нет сети) — используются ранее закэшированные в AsyncStorage флаги. Если кэша нет — `isEnabled` вернёт `defaultValue` (обычно `false`). Приложение не падает.

### 3.7 Пример использования в компоненте
```typescript
// mobile/app/(tabs)/_layout.tsx или любой экран
import { useFeatureFlag } from '@/features/feature-flags/hooks/useFeatureFlag';

export default function TabLayout() {
  const showLeaderboard = useFeatureFlag('show_leaderboard', true);
  const showCollections = useFeatureFlag('show_collections', true);

  return (
    <Tabs>
      <Tabs.Screen name="home" ... />
      {showLeaderboard && <Tabs.Screen name="leaderboard" ... />}
      {showCollections && <Tabs.Screen name="collections" ... />}
      <Tabs.Screen name="profile" ... />
    </Tabs>
  );
}
```

```typescript
// Пример: скрыть рекламу через флаг
const showAds = useFeatureFlag('show_ads', true);
if (showAds) {
  adManager.showInterstitial();
}
```

---

## Чеклист реализации

### Server
- [ ] Prisma-модель `FeatureFlag` добавлена и мигрирована
- [ ] Модуль `feature-flags` создан и подключён в `AppModule`
- [ ] Все 6 эндпоинтов реализованы и задокументированы
- [ ] Публичные GET защищены только от мутаций, мутации — `AdminGuard`
- [ ] Seed с дефолтными флагами
- [ ] Конфликт при дублировании `key` обрабатывается корректно

### Web
- [ ] `endpoints/feature-flags.ts` создан
- [ ] `FeatureFlagsPage.tsx` создан с таблицей и модалками
- [ ] Toggle работает без перезагрузки страницы
- [ ] Inline-валидация полей формы
- [ ] Confirm при удалении
- [ ] Маршрут `/feature-flags` добавлен в `App.tsx`
- [ ] Пункт "Feature Flags" добавлен в Sidebar

### Mobile
- [ ] `useFeatureFlagsStore` создан с persist
- [ ] Загрузка происходит при старте в `_layout.tsx`
- [ ] TTL-кэш 5 минут — нет лишних запросов
- [ ] При ошибке сети — работают закэшированные флаги, не краш
- [ ] `useFeatureFlag(key, defaultValue)` хук доступен
- [ ] Пример использования добавлен минимум в 2 местах (таб-бар + реклама)

---

## Глобальные правила (из CLAUDE.md)
- TypeScript strict, no `any`
- Полные файлы без `// остальной код...`
- i18n: все пользовательские строки через `t()` (веб и мобила)
- Обработка всех edge-cases: сеть упала, ключ не найден, невалидный JSON в payload
