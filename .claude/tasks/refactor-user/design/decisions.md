# Решения: рефакторинг user

## 1. currentUser — computed от auth session

**Решение:** `currentUserAtom = computed(() => authAtoms.session.user)` — derived state, не отдельное хранение.

**Обоснование:**
- Единственный источник правды — auth session
- Автоматическая синхронизация: когда session обновляется, currentUser обновляется тоже
- Зависимость `@platforms-core/user → @platforms-core/auth` допустима (оба в shared слое)

## 2. Optimistic updates с withRollback + withTransaction

**Решение:** `usersAtom.extend(withRollback())`. Actions `createUser` и `updateUser` используют `withTransaction()`:
1. Обновить атом оптимистично
2. Выполнить API-запрос через `wrap()`
3. При успехе — обновить реальными данными
4. При ошибке — `withRollback` автоматически откатит `usersAtom`

**Паттерн (Reatom v1000):**
```typescript
const usersAtom = atom<User[]>([], 'usersAtom').extend(withRollback());

const updateUser = action(async ({ userId, data }) => {
    // Optimistic update
    usersAtom.set((users) => users.map((u) => u.id === userId ? { ...u, ...data } : u));
    // API call
    const result = await wrap(putApiV1User({ user_id: userId }, data));
    // Replace with real data
    usersAtom.set((users) => users.map((u) => u.id === userId ? result : u));
    return result;
}, 'updateUser').extend(withAsync(), withTransaction());
```

## 3. Presence не трогаем

**Решение:** Вся логика presence (useUsersPresence, useUserOnlineStatus, realtime presence handler) остаётся как есть в legacy SDK.

**Обоснование:**
- Presence — отдельная ответственность, будет перенесена отдельно
- Текущая реализация работает стабильно

## 4. ВСЯ user-логика переносится в shared core

**Решение:** Ничего не остаётся в legacy SDK кроме presence и React Router адаптера. React Query keys для users удаляются (не нужны с Reatom).

**Что переносится:**
- Queries (useUsers, useUser, useCurrentUser) → atoms + actions
- Mutations (useCreateUser, useUpdateUser) → actions с optimistic updates
- Cache updaters (UserCacheUtils) → логика внутри actions (прямое обновление атомов)
- Helpers (UserUtils) → helpers/
- Validation → validation/
- useUsernameById → react-sdk хук

**Что не трогаем (не user-логика):**
- Presence hooks/handlers — отдельная сущность
- React Router adapter — платформозависимый код

## 5. usersAtom как единый список

**Решение:** Один `usersAtom: atom<User[]>` хранит всех загруженных пользователей. `fetchUser` (одиночный) добавляет/обновляет пользователя в этом же атоме.

**Обоснование:**
- В legacy SDK два уровня кеша: `["users", "list"]` и `["users", "detail", {id}]` — это React Query специфика
- В Reatom достаточно одного списка с поиском O(n), пользователей мало

## 6. Обратная совместимость

**Решение:** Старый код в legacy SDK продолжает работать параллельно. Не удаляем старый код до подтверждения через тестирование.

**Обоснование:**
- ~20 компонентов используют legacy хуки
- Миграция потребителей — отдельный шаг
