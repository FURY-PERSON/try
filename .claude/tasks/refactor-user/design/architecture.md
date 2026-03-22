# Архитектура: @platforms-core/user

## Структура модуля

```
platforms/shared/modules/core/user/
├── package.json              # @platforms-core/user (обновить зависимости)
├── index.ts                  # Публичный API через createEntryPoint
├── types/
│   └── index.ts              # Типы состояния
├── atoms/
│   ├── users.ts              # atom<User[]>.extend(withRollback()) — список всех пользователей
│   ├── current-user.ts       # computed от authAtoms.session → User | null
│   └── index.ts              # createEntryPoint
├── actions/
│   ├── fetch-users.ts        # Загрузить всех пользователей
│   ├── fetch-user.ts         # Загрузить одного пользователя по ID
│   ├── create-user.ts        # Создать пользователя (optimistic + withTransaction)
│   ├── update-user.ts        # Обновить пользователя (optimistic + withTransaction)
│   └── index.ts              # createEntryPoint
├── helpers/
│   ├── format-last-seen.ts   # (уже существует)
│   ├── user-utils.ts         # getFullName, getDisplayName, getInitials, getAvatarColor
│   ├── user-sort-filter.ts   # sortUsers, filterUsers
│   └── index.ts              # createEntryPoint (обновить)
├── validation/
│   ├── user.ts               # Правила валидации user data
│   └── index.ts              # createEntryPoint
└── constants/
    └── index.ts              # moduleName

platforms/shared/products/react-sdk/
└── hooks/user/
    ├── use-users.ts           # Читает usersAtom
    ├── use-current-user.ts    # Читает currentUserAtom (computed от session)
    ├── use-fetch-users.ts     # useSdkMutation(fetchUsers)
    ├── use-fetch-user.ts      # useSdkMutation(fetchUser)
    ├── use-create-user.ts     # useSdkMutation(createUser)
    ├── use-update-user.ts     # useSdkMutation(updateUser)
    ├── use-username-by-id.ts  # Поиск username в usersAtom
    └── index.ts               # createEntryPoint
```

## Маппинг: старый код → новый

| Старый файл | Новый файл | Трансформация |
|-------------|------------|---------------|
| sdk/react/api/queries/users.ts → useUsers() | core/user/actions/fetch-users.ts | React Query → Reatom action + usersAtom |
| sdk/react/api/queries/users.ts → useUser() | core/user/actions/fetch-user.ts | React Query → Reatom action, обновляет usersAtom |
| sdk/react/api/queries/users.ts → useCurrentUser() | core/user/atoms/current-user.ts | React Query → computed от authAtoms.session |
| sdk/react/api/mutations/users.ts → useCreateUser() | core/user/actions/create-user.ts | React Query → Reatom action + withTransaction + withRollback |
| sdk/react/api/mutations/users.ts → useUpdateUser() | core/user/actions/update-user.ts | React Query → Reatom action + withTransaction + withRollback |
| sdk/react/api/cache/users.ts → UserCacheUtils | core/user/actions/*.ts + atoms/*.ts | queryClient → прямое обновление атомов (rollback при ошибке) |
| sdk/shared/user.ts → UserUtils (getFullName и др.) | core/user/helpers/user-utils.ts | Перенос as-is |
| sdk/shared/user.ts → UserUtils (sort/filter) | core/user/helpers/user-sort-filter.ts | Перенос as-is |
| sdk/shared/user.ts → UserUtils.validateUserData | core/user/validation/user.ts | Перенос в validation/ |
| sdk/react/hooks/useUsernameById.ts | react-sdk/hooks/user/use-username-by-id.ts | Переписать на usersAtom |
| sdk/react/api/keys/queries/users.ts | Удаляется | Не нужны с Reatom |

**Не трогаем (presence):**
- sdk/react/hooks/presence/useUsersPresence.ts — остаётся как есть
- sdk/react/hooks/presence/useUserOnlineStatus.ts — остаётся как есть
- sdk/realtime/handlers/presence.ts — остаётся как есть

**Платформозависимое (остаётся в legacy sdk/):**
- sdk/react/adapters/react-router/usePeerUserIdFromUsernameParam.ts — React Router
