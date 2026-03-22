# Контракты: @platforms-core/user

## Публичный API (index.ts)

```typescript
export { atoms as userAtoms } from './atoms';
export { actions as userActions } from './actions';
export { helpers as userHelpers } from './helpers';
export { validation as userValidation } from './validation';
export type { Types as UserTypes } from './types';
```

## Atoms

```typescript
// atoms/users.ts
usersAtom: Atom<User[]>  // withRollback() — автооткат при ошибке в transaction

// atoms/current-user.ts
currentUserAtom: Computed<User | null>  // computed от authAtoms.session → session.user
```

## Actions

```typescript
// actions/fetch-users.ts
fetchUsers: AsyncAction<void, User[]>
// getApiV1Users() → usersAtom.set(data)
// .extend(withAsync())

// actions/fetch-user.ts
fetchUser: AsyncAction<GetApiV1UserPathParams, User>
// getApiV1User() → добавляет/обновляет в usersAtom
// .extend(withAsync())

// actions/create-user.ts
createUser: AsyncAction<UserRequest, User>
// 1. Optimistic: usersAtom.set([...users, optimisticUser])
// 2. API: createApiV1User(data)
// 3. При успехе: заменить optimistic на реальные данные
// 4. При ошибке: withRollback автоматически откатит usersAtom
// .extend(withAsync(), withTransaction())

// actions/update-user.ts
updateUser: AsyncAction<{ userId: string; data: UserRequest }, User>
// 1. Optimistic: обновить user в usersAtom
// 2. API: putApiV1User(params, data)
// 3. При успехе: обновить реальными данными
// 4. При ошибке: withRollback автоматически откатит usersAtom
// .extend(withAsync(), withTransaction())
```

## Helpers

```typescript
// helpers/user-utils.ts
getFullName(user: User): string
getDisplayName(user: User): string
getInitials(user: User): string
getAvatarColor(user: User): string

// helpers/user-sort-filter.ts
sortByName(users: User[]): User[]
sortByUsername(users: User[]): User[]
sortByStatus(users: User[], onlineUsers: string[]): User[]
filterOnline(users: User[], onlineUsers: string[]): User[]
filterOffline(users: User[], onlineUsers: string[]): User[]
filterByTeam(users: User[], teamMembers: string[]): User[]

// helpers/format-last-seen.ts (уже существует)
formatLastSeen(lastSeenAt: string | undefined | null): string
```

## Validation

```typescript
// validation/user.ts
userValidationRules: {
    username: { required, minLength: 3, maxLength: 20, pattern: /^[a-zA-Z0-9_]+$/ }
    email: { pattern: emailRegex }
    firstName: { maxLength: 50 }
    lastName: { maxLength: 50 }
    password: { minLength: 8, pattern: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ }
}
```

## React-SDK хуки

```typescript
useUsers(): User[]
// useAtom(userAtoms.users)

useCurrentUser(): User | null
// useAtom(userAtoms.currentUser)

useFetchUsers(options?): MutationResult
// useSdkMutation(userActions.fetchUsers)

useFetchUser(options?): MutationResult
// useSdkMutation(userActions.fetchUser)

useCreateUser(options?): MutationResult
// useSdkMutation(userActions.createUser)

useUpdateUser(options?): MutationResult
// useSdkMutation(userActions.updateUser)

useUsernameById(userId: string | null): { username, isLoading }
// Ищет в usersAtom, при промахе вызывает fetchUser
```

## Зависимости (package.json)

```json
{
    "name": "@platforms-core/user",
    "dependencies": {
        "@platforms/kit": "workspace:*",
        "@platforms-base/api": "workspace:*",
        "@platforms-base/i18n": "workspace:*",
        "@platforms-core/auth": "workspace:*",
        "@reatom/core": "catalog:",
        "dayjs": "catalog:"
    }
}
```

Примечание: `@platforms-core/auth` нужен для `computed` от `authAtoms.session` в `currentUserAtom`.
