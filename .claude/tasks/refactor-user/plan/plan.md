# План фаз: рефакторинг user

## Фаза 1: Типы, константы и структура

- **Слой:** shared (`platforms/shared/modules/core/user/`)
- **Что:**
  - Обновить `package.json` — добавить зависимости (`@platforms-base/api`, `@platforms-core/auth`, `@reatom/core`)
  - Создать `constants/index.ts` — moduleName
  - Создать `types/index.ts` — реэкспорт типов, вспомогательные типы
  - Обновить `index.ts` — добавить экспорты atoms, actions, validation, types
- **Файлы (4):**
  - `package.json` (edit)
  - `constants/index.ts` (new)
  - `types/index.ts` (new)
  - `index.ts` (edit)
- **Коммит:** `refactor(user): создать структуру типов и констант @platforms-core/user`

## Фаза 2: Atoms

- **Слой:** shared (`platforms/shared/modules/core/user/atoms/`)
- **Что:**
  - Создать `atoms/users.ts` — `usersAtom: atom<User[]>([]).extend(withRollback())`
  - Создать `atoms/current-user.ts` — `currentUserAtom: computed(() => authAtoms.session.user)`
  - Создать `atoms/index.ts` — createEntryPoint
- **Файлы (3):**
  - `atoms/users.ts` (new)
  - `atoms/current-user.ts` (new)
  - `atoms/index.ts` (new)
- **Коммит:** `refactor(user): добавить atoms для user`

## Фаза 3: Actions

- **Слой:** shared (`platforms/shared/modules/core/user/actions/`)
- **Что:**
  - `actions/fetch-users.ts` — getApiV1Users() → usersAtom.set(), withAsync()
  - `actions/fetch-user.ts` — getApiV1User() → добавить/обновить в usersAtom, withAsync()
  - `actions/create-user.ts` — optimistic add → createApiV1User() → replace, withAsync()+withTransaction()
  - `actions/update-user.ts` — optimistic update → putApiV1User() → replace, withAsync()+withTransaction()
  - `actions/index.ts` — createEntryPoint
- **Файлы (5):**
  - `actions/fetch-users.ts` (new)
  - `actions/fetch-user.ts` (new)
  - `actions/create-user.ts` (new)
  - `actions/update-user.ts` (new)
  - `actions/index.ts` (new)
- **Коммит:** `refactor(user): добавить actions для user`

## Фаза 4: Helpers и Validation

- **Слой:** shared (`platforms/shared/modules/core/user/helpers/`, `validation/`)
- **Что:**
  - `helpers/user-utils.ts` — getFullName, getDisplayName, getInitials, getAvatarColor (из sdk/shared/user.ts)
  - `helpers/user-sort-filter.ts` — sortByName, sortByUsername, sortByStatus, filterOnline, filterOffline, filterByTeam
  - Обновить `helpers/index.ts` — добавить новые хелперы в createEntryPoint
  - `validation/user.ts` — userValidationRules (из UserUtils.validateUserData)
  - `validation/index.ts` — createEntryPoint
- **Файлы (5):**
  - `helpers/user-utils.ts` (new)
  - `helpers/user-sort-filter.ts` (new)
  - `helpers/index.ts` (edit)
  - `validation/user.ts` (new)
  - `validation/index.ts` (new)
- **Коммит:** `refactor(user): добавить helpers и validation для user`

## Фаза 5: React-SDK хуки

- **Слой:** shared (`platforms/shared/products/react-sdk/hooks/user/`)
- **Что:**
  - `use-users.ts` — useAtom(userAtoms.users)
  - `use-current-user.ts` — useAtom(userAtoms.currentUser)
  - `use-fetch-users.ts` — useSdkMutation(userActions.fetchUsers)
  - `use-fetch-user.ts` — useSdkMutation(userActions.fetchUser)
  - `use-create-user.ts` — useSdkMutation(userActions.createUser)
  - `use-update-user.ts` — useSdkMutation(userActions.updateUser)
  - `use-username-by-id.ts` — поиск в usersAtom, fallback на fetchUser
  - `index.ts` — createEntryPoint
  - Обновить `react-sdk/hooks/index.ts` — добавить userHooks
- **Файлы (9):**
  - `hooks/user/use-users.ts` (new)
  - `hooks/user/use-current-user.ts` (new)
  - `hooks/user/use-fetch-users.ts` (new)
  - `hooks/user/use-fetch-user.ts` (new)
  - `hooks/user/use-create-user.ts` (new)
  - `hooks/user/use-update-user.ts` (new)
  - `hooks/user/use-username-by-id.ts` (new)
  - `hooks/user/index.ts` (new)
  - `hooks/index.ts` (edit)
- **Коммит:** `refactor(user): добавить react-sdk хуки для user`

## Фаза 6: Реэкспорт в @web/sdk

- **Слой:** web (`platforms/web/products/web-sdk/`)
- **Что:**
  - Хуки уже реэкспортируются через `reactSdkHooks` из `@platforms/react-sdk`
  - Проверить что `@web/sdk` корректно реэкспортирует новые хуки
  - При необходимости обновить `index.ts`
- **Файлы (0-1):**
  - `index.ts` (verify/edit if needed)
- **Коммит:** `refactor(user): добавить реэкспорт user в @web/sdk` (если были изменения)

## Фаза 7: Обновление legacy SDK — подмена user-логики на core

- **Слой:** web (`platforms/web/products/sdk/`)
- **Что:**
  - **AuthProvider.tsx:** заменить `useCurrentUser()` (React Query) на `useAtom(userAtoms.currentUser)` из `@platforms-core/user`. Убрать ручное вычисление `full_name` — использовать `userHelpers.getFullName()`
  - **useUsersPresence.ts:** заменить `useAuthContext().user` на `useAtom(userAtoms.currentUser)` для currentUser.id. Сам presence-механизм (React Query polling) НЕ трогаем
  - **ConversationProvider.tsx:** заменить `useUser()` (React Query) на `userActions.fetchUser` / `usersAtom`
  - **realtime/handlers/team.ts:** заменить `UserCacheUtils.getCurrentUser(queryClient)` на `userAtoms.currentUser()`
  - **realtime/handlers/personal.ts:** заменить `UserCacheUtils.getCurrentUser(queryClient)` на `userAtoms.currentUser()`. `UserCacheUtils.updateUserPresence` — НЕ трогаем (presence)
  - **react/api/core/useOptimisticMutation.ts:** заменить `UserCacheUtils.getCurrentUser(queryClient)` на `userAtoms.currentUser()`
  - **react/api/cache/auth.ts:** заменить `AuthCacheUtils` — методы getCurrentUser/setCurrentUser/updateCurrentUser на `userAtoms.currentUser` (computed от session, read-only)
  - **react/adapters/react-router/usePeerUserIdFromUsernameParam.ts:** заменить `UserCacheUtils.findUserIdByUsername` + `useUsers()` на поиск в `usersAtom`
- **Файлы (~8):**
  - `react/providers/AuthProvider.tsx` (edit)
  - `react/hooks/presence/useUsersPresence.ts` (edit)
  - `react/providers/conversation/ConversationProvider.tsx` (edit)
  - `realtime/handlers/team.ts` (edit)
  - `realtime/handlers/personal.ts` (edit)
  - `react/api/core/useOptimisticMutation.ts` (edit)
  - `react/api/cache/auth.ts` (edit)
  - `react/adapters/react-router/usePeerUserIdFromUsernameParam.ts` (edit)
- **Коммит:** `refactor(user): обновить legacy SDK на core user`

## Фаза 8: Замена legacy хуков в small-chat

- **Слой:** web (`platforms/web/products/small-chat/src/`)
- **Что:**
  - Заменить `useUsers()` из `@small-chat-web/sdk/react` → `reactSdkHooks.user.useUsers()` из `@web/sdk`
  - Заменить `useAuthContext().user` → `reactSdkHooks.user.useCurrentUser()` из `@web/sdk` (где используется только user)
  - Заменить `useUsernameById()` из `@small-chat-web/sdk/react` → `reactSdkHooks.user.useUsernameById()` из `@web/sdk`
  - `userHelpers` из `@platforms-core/user` — оставить как есть (уже импортирует из core)
  - `useAuthContext` — заменить только `.user` на `useCurrentUser()` из `@web/sdk`. Вызовы `login/logout/isAuthenticated` оставить (это auth, не user)
  - `useUsersPresence` — вызовы в small-chat не трогаем (сам хук уже обновлён в Фазе 7)
- **Потребители для замены:**
  - `StartChannelForm.tsx` — `useUsers()` → `@web/sdk`
  - `AddTeamMemberForm.tsx` — `useUsers()` → `@web/sdk`
  - `AddMemberForm.tsx` — `useUsers()` → `@web/sdk`
  - `UserParticipantsPicker.tsx` — `useUsers()` → `@web/sdk`
  - `useUsernameById` (если используется в small-chat) → `@web/sdk`
- **Файлы (~5):**
  - Компоненты/хуки из списка выше (edit)
- **Коммит:** `refactor(user): обновить потребители user в small-chat`

## Фаза 9: Обновление CLAUDE.md

- **Слой:** shared
- **Что:**
  - Обновить `platforms/shared/modules/core/CLAUDE.md` — добавить модуль user
- **Файлы (1):**
  - `CLAUDE.md` (edit)
- **Коммит:** объединить с предыдущим коммитом или отдельно

---

## Критерии

- Код компилируется после каждой фазы (`tsc --noEmit`)
- Одна фаза = один слой
- Каждая фаза = один коммит
- Code quality + compliance ревью после каждой фазы
- ESLint на изменённые файлы
- Build после финальной фазы
