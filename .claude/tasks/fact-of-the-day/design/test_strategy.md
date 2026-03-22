# Тестовая стратегия: Факт дня

## Критерии приёмки

1. При submit daily set в ответе есть `factOfDay` с корректными данными
2. wrongPercent рассчитывается правильно из timesShown/timesCorrect
3. userCorrect правильно определяется из результатов пользователя
4. Если factOfDayQuestionId не задан — авто-выбор работает
5. Для fallback daily set — factOfDay = null
6. На экране результатов отображается карточка "Факт дня"
7. Шеринг формирует корректный текст
8. i18n работает для RU и EN

## Unit тесты (server)

- `daily-sets.service.spec.ts`:
  - submitDailySet возвращает factOfDay когда factOfDayQuestionId задан
  - submitDailySet авто-выбирает вопрос с min correct rate
  - submitDailySet возвращает factOfDay = null для fallback
  - wrongPercent корректен при разных timesShown/timesCorrect
  - userCorrect = true когда пользователь ответил правильно на этот вопрос
  - userCorrect = false когда пользователь ответил неправильно

## Ручное тестирование (mobile)

- [ ] Пройти daily set → на экране результатов видна карточка "Факт дня"
- [ ] wrongPercent отображается корректно
- [ ] userCorrect показывает правильный статус
- [ ] Кнопка "Поделиться" открывает системный sheet
- [ ] Текст шеринга соответствует формату из задачи
- [ ] Переключение языка RU/EN корректно
- [ ] Если factOfDay = null — карточка не отображается
