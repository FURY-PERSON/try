# Фаза 6: QA — Найденные баги и проблемы

---

## CRITICAL (3)

### BUG-001: Использование `any` в серверных контроллерах
- **Файлы**: `apps/server/src/modules/*/controllers`
- **Описание**: Контроллеры используют `@CurrentUser() user: any` вместо типизированного User
- **Риск**: Runtime ошибки, возможность обращения к undefined свойствам
- **Решение**: Создать тип User в shared и использовать `@CurrentUser() user: User`

### BUG-002: Несоответствие DTO между api-client и сервером
- **Файлы**: `packages/api-client/src/types.ts` vs `apps/server/src/modules/daily-sets/dto/submit-daily-set.dto.ts`
- **Описание**: Клиент отправляет `{ correct: boolean, timeSeconds: number, hintUsed: boolean }`, сервер ожидает `{ result: 'correct'|'incorrect', timeSpentSeconds: number }`
- **Риск**: Отправка результатов ежедневного набора будет падать с ошибками валидации
- **Решение**: Привести типы api-client в соответствие с серверными DTO. Аналогичная проблема в `AnswerQuestionDto`

### BUG-003: Отсутствие try-catch при JSON.parse AI ответов
- **Файл**: `apps/server/src/modules/ai/ai.service.ts:125`
- **Описание**: `JSON.parse()` вызывается без обработки ошибок при парсинге ответа AI
- **Риск**: Неожиданные crash при невалидном JSON от AI
- **Решение**: Обернуть в try-catch, вернуть InternalServerErrorException

---

## HIGH (5)

### BUG-004: Несуществующее поле correctAnswer в gameApi
- **Файл**: `apps/mobile/src/features/game/api/gameApi.ts`
- **Описание**: `SubmitAnswerResponse` определяет поле `correctAnswer`, которое сервер не возвращает
- **Решение**: Удалить поле из типа или добавить на сервере

### BUG-005: Race condition при отправке результатов daily set
- **Файл**: `apps/server/src/modules/daily-sets/daily-sets.service.ts`
- **Описание**: Check-then-act паттерн: два параллельных запроса могут пройти проверку на дубликат
- **Решение**: Использовать database constraint (unique) + catch P2002 ошибку Prisma

### BUG-006: Тихий отказ в storage сервисе
- **Файл**: `apps/mobile/src/services/storage.ts`
- **Описание**: Все catch блоки тихо проглатывают ошибки, fallback SecureStore → AsyncStorage небезопасен для токенов
- **Решение**: Добавить логирование, не fallback-ить безопасное хранилище на небезопасное

### BUG-007: Отсутствие enum-валидации в filter DTO
- **Файл**: `apps/server/src/modules/questions/dto/question-filter.dto.ts`
- **Описание**: language, type принимают любые строки, нет UUID-валидации для categoryId
- **Решение**: Добавить `@IsEnum()` и `@IsUUID()` декораторы

### BUG-008: Необработанные ошибки API в mobile хуках
- **Файл**: `apps/mobile/src/features/game/api/gameApi.ts`
- **Описание**: API вызовы могут падать без обработки ошибок, что приведёт к crash
- **Решение**: React Query обрабатывает, но нужно добавить error UI в компонентах

---

## MEDIUM (7)

### BUG-009: Несоответствие поля в AnswerQuestionDto
- **Описание**: api-client использует `correct: boolean, timeSeconds`, сервер — `result: string, timeSpentSeconds`
- **Решение**: Синхронизировать типы

### BUG-010: Отсутствие валидации формата device ID
- **Файл**: `apps/server/src/common/guards/device-auth.guard.ts`
- **Решение**: Добавить проверку длины и формата

### BUG-011: JWT токены в localStorage без шифрования (web)
- **Файл**: `apps/web/src/stores/useAuthStore.ts`
- **Решение**: Рассмотреть sessionStorage или httpOnly cookies

### BUG-012: Плавающая точка при подсчёте стрика
- **Файл**: `apps/server/src/modules/daily-sets/daily-sets.service.ts`
- **Описание**: Деление timestamp даёт дробные числа, сравнение `=== 1` ненадёжно
- **Решение**: Использовать `Math.floor()` перед сравнением

### BUG-013: Нет Error Boundary в web-приложении
- **Файл**: `apps/web/src/App.tsx`
- **Решение**: Добавить React Error Boundary

### BUG-014: Потенциальная утечка памяти в useAppState
- **Файл**: `apps/mobile/src/hooks/useAppState.ts`
- **Описание**: Частая переподписка на AppState при изменении колбэков
- **Решение**: Использовать useCallback для стабильных ссылок

### BUG-015: @react-native-community/netinfo не в зависимостях
- **Файл**: `apps/mobile/package.json`
- **Описание**: Пакет импортируется в useNetworkStatus.ts, но не указан в dependencies
- **Решение**: Добавить в dependencies

---

## LOW (4)

### BUG-016: Пустые catch блоки в рекламных компонентах
- **Файлы**: `InterstitialManager.tsx`, `RewardedAdManager.tsx`
- **Решение**: Добавить хотя бы console.warn

### BUG-017: Захардкоженная модель AI по умолчанию
- **Файл**: `apps/server/src/modules/ai/ai.service.ts`
- **Решение**: Обновить default model

### BUG-018: Нет .env.example для mobile
- **Решение**: Создать apps/mobile/.env.example

### BUG-019: Непоследовательный стиль сообщений об ошибках
- **Решение**: Стандартизировать формат ошибок

---

## Приоритет исправлений

1. BUG-002 + BUG-009 (DTO mismatch) — без этого API не работает
2. BUG-001 (any types) — типобезопасность
3. BUG-003 (JSON.parse) — crash prevention
4. BUG-005 (race condition) — дупликаты в БД
5. BUG-015 (missing dependency) — build failure
