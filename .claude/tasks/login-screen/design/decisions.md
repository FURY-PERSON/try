# Решения: Экран логина (mobile)

## Решение 1: Навигация — Expo Router redirect vs conditional rendering

**Выбор:** Conditional rendering в InitializationGuard + отдельный route `/login`

**Обоснование:**

- InitializationGuard уже оборачивает Stack — логичное место для auth check
- Expo Router поддерживает `<Redirect href="/login" />` из expo-router
- Экран login вне группы `(tabs)` — не показывает tab bar
- Паттерн аналогичен web (AuthLayout/ProtectedLayout), но адаптирован под Expo Router

**Риски:** При deep linking неавторизованный пользователь может попасть на защищённый экран до гидрации сессии → митигация: показывать splash до `isHydrated`

## Решение 2: Форма — react-hook-form с rules (не zod)

**Выбор:** `react-hook-form` с `rules` prop через `DSComponents.InputField`

**Обоснование:**

- `DSComponents.InputField` уже интегрирован с react-hook-form через `control` + `rules`
- Это паттерн из ui-kit, подходит для mobile
- Web использует zod, но mobile design system работает с rules напрямую
- i18n для лейблов и сообщений валидации

## Решение 3: Фон экрана — подготовка к фоновой картинке

**Выбор:** Использовать View с настраиваемым фоном, позже заменить на ImageBackground

**Обоснование:**

- Сейчас фон пустой (белый/тёмный)
- Позже будет добавлена фоновая картинка
- Карточка формы должна быть поверх фона с достаточным контрастом
- Структура должна позволять легко добавить `ImageBackground` без рефакторинга

## Решение 4: Размещение экрана — product layer

**Выбор:** `platforms/mobile/products/small-chat/screens/login/`

**Обоснование:**

- Соответствует паттерну других экранов (home, explore, modal)
- Пакет `@small-chat-mobile-screens/login`
- Зависимости: `@mobile-base/design-system`, `@platforms/react-sdk`

## Решение 5: Иконки помощи и языка (header)

**Выбор:** Заглушки

**Обоснование:**

- В Figma есть иконки `?` и глобус в правом верхнем углу
- Функциональность смены языка и помощи — отдельные задачи
- В будущем будет проще

**Риск:** Нет — декоративные элементы без бизнес-логики

## Компромиссы

| Аспект        | Выбор                   | Альтернатива         | Почему                                   |
| ------------- | ----------------------- | -------------------- | ---------------------------------------- |
| Валидация     | rules (react-hook-form) | zod schema           | DSComponents.InputField работает с rules |
| Auth guard    | InitializationGuard     | Отдельный AuthLayout | Уже есть guard, минимум кода             |
| Иконки header | Заглушки                | не реализовывать     | Отдельные задачи, не блокируют логин     |
