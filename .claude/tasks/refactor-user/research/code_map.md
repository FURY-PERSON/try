# Карта кода: user

## API-эндпоинты (из @platforms-base/api)

- `getApiV1Users` — GET /api/v1/users — Список всех пользователей
- `getApiV1User` — GET /api/v1/users/{user_id} — Один пользователь по ID
- `getApiV1UserMe` — GET /api/v1/users/me — Текущий авторизованный пользователь
- `getApiV1UsersSearch` — GET /api/v1/users/search — Поиск пользователей
- `createApiV1User` — POST /api/v1/users — Создать пользователя (регистрация)
- `putApiV1User` — PUT /api/v1/users/{user_id} — Обновить пользователя
- `postApiV1UsersPresence` — POST /api/v1/users/presence — Batch-запрос онлайн-статуса

## Типы (из @platforms-base/api)

- `User` — { id, username, email, first_name, last_name, created_at }
- `UserRequest` — запрос на создание/обновление
- `UsersResponse` — { users: User[] }
- `UsersPresenceResponse` — { users: UserPresenceStatus[] }
- `UsersPresenceRequest` — { user_ids: string[] }
- `UserPresenceStatus` — статус присутствия пользователя

## Web SDK (platforms/web/products/sdk/)

### Queries (React Query)
- `react/api/queries/users.ts` — `useUsers()`, `useUser(params)`, `useCurrentUser()` → queryKey: ["users", "list"|"detail"|"current"] → `→ shared core` (actions)
- `react/api/keys/queries/users.ts` — Query options factories: `users.list()`, `users.detail()`, `users.current()`, `users.presence()` → `→ остаётся в legacy` (React Query специфично)

### Mutations (React Query)
- `react/api/mutations/users.ts` — `useCreateUser()`, `useUpdateUser()` с optimistic updates → `→ shared core` (actions, без optimistic — упростить до прямого обновления атома)

### Cache updaters
- `react/api/cache/users.ts` — `UserCacheUtils` (createOptimisticUser, getUsers, setUsers, findUserById, findUsernameById, findUserByUsername, getUser, setUser, updateUser, getCurrentUser, setCurrentUser, updateCurrentUser, forceUpdate*, updateUserPresence) → `→ shared core` (логика станет частью actions/atoms)

### Hooks
- `react/hooks/presence/useUsersPresence.ts` — Batch-запрос онлайн-статуса с polling → `→ shared core` (action) + `→ react-sdk` (хук)
- `react/hooks/presence/useUserOnlineStatus.ts` — Проверка онлайн одного пользователя (через presence cache) → `→ остаётся в legacy` (завязан на React Query cache)
- `react/hooks/useUsernameById.ts` — Получить username по userId из кеша/API → `→ react-sdk` (хук поверх atom)

### Context/Store
- Нет отдельного user store/context (используется через auth context: `useAuthContext().user`)

### Shared utils
- `shared/user.ts` — `UserUtils` (getFullName, getDisplayName, getInitials, getAvatarColor, isOnline, getStatusText, sortUsers, filterUsers, validateUserData) → `→ shared core` (helpers)

### Adapters
- `react/adapters/react-router/usePeerUserIdFromUsernameParam.ts` — React Router param → userId → `→ остаётся в legacy` (React Router специфично)

### Realtime
- `realtime/handlers/presence.ts` — subscribeToPresence/unsubscribeFromPresence (Centrifuge join/leave) → `→ остаётся в legacy` (завязан на QueryClient + Centrifuge)

## Small-Chat legacy (platforms/web/products/small-chat/src/)

### Компоненты, использующие user SDK
- `components/dialogs/UserInfoDialog.tsx` — useUsersPresence, userHelpers.formatLastSeen
- `components/molecules/DMHeader.tsx` — useAuthContext, useUsersPresence, userHelpers.formatLastSeen
- `components/molecules/ConversationChannelHeader.tsx` — useUsersPresence (onlineUsersCount)
- `components/molecules/DirectChannelCard.tsx` — useAuthContext (currentUser)
- `components/molecules/ProfileSection.tsx` — useAuthContext (logout)
- `components/molecules/MessageReaction.tsx` — useAuthContext (user)
- `components/organisms/UserProfile.tsx` — useAuthContext (user, logout, refreshUser)
- `components/forms/StartChannelForm.tsx` — useAuthContext, useUsers
- `components/forms/AddTeamMemberForm.tsx` — useUsers
- `components/forms/AddMemberForm.tsx` — useUsers, useTeamMembers
- `components/forms/UserParticipantsPicker.tsx` — useAuthContext, useUsers
- `components/forms/LoginForm.tsx` — useAuthContext (login)
- `components/forms/StartChatModal.tsx` — useAuthContext
- `components/layouts/DirectMessagesSidebar.tsx` — useAuthContext, useUsersPresence
- `components/layouts/TeamSidebar/components/DirectMessagesList.tsx` — useUsersPresence
- `components/tables/Members.tsx` — useAuthContext
- `hooks/useTeamSidebarData.ts` — useAuthContext
- `hooks/useInAppMessageNotifications.tsx` — useAuthContext
- `hooks/useInAppNotifications.tsx` — useAuthContext
- `hooks/useReactionNotifications.ts` — useAuthContext

### Прямые импорты из @platforms-core/user
- `UserInfoDialog.tsx` — `userHelpers.formatLastSeen`
- `DMHeader.tsx` — `userHelpers.formatLastSeen`

## Уже перенесено (shared/mobile)

### Shared core (@platforms-core/user)
- `helpers/format-last-seen.ts` — formatLastSeen (единственная функция)
- `index.ts` — export { helpers as userHelpers }
- Нет atoms, actions, types, validation

### React-SDK
- Нет хуков для user

### Mobile
- Нет user-специфичного кода

## Зависимости на другие сущности

- user → auth: currentUser берётся из useAuthContext (session.user в auth atoms)
- user → presence: онлайн-статус через отдельные presence endpoints
- user → team: фильтрация пользователей по команде (TeamMembers)

## Зависимости ОТ других сущностей

- auth → user: session хранит User объект
- channel → user: DirectChannel содержит user_ids
- message → user: сообщения привязаны к sender_id
- team → user: TeamMember содержит user_id

## Классификация файлов

| Файл | Статус |
|------|--------|
| sdk/react/api/queries/users.ts (useUsers, useUser, useCurrentUser) | → shared core (actions) |
| sdk/react/api/mutations/users.ts (useCreateUser, useUpdateUser) | → shared core (actions) |
| sdk/react/api/cache/users.ts (UserCacheUtils) | → shared core (логика в actions/atoms) |
| sdk/shared/user.ts (UserUtils) | → shared core (helpers) |
| sdk/react/hooks/presence/useUsersPresence.ts | → shared core (action+atom) + react-sdk (хук) |
| sdk/react/hooks/useUsernameById.ts | → react-sdk (хук поверх atoms) |
| sdk/react/api/keys/queries/users.ts | → остаётся в legacy (React Query keys) |
| sdk/react/hooks/presence/useUserOnlineStatus.ts | → остаётся в legacy (React Query cache) |
| sdk/react/adapters/react-router/usePeerUserIdFromUsernameParam.ts | → остаётся в legacy (React Router) |
| sdk/realtime/handlers/presence.ts | → остаётся в legacy (Centrifuge + QueryClient) |
