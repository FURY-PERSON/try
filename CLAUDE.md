# MASTER ORCHESTRATOR: Разработка мобильного приложения

## Контекст проекта
Я — соло-разработчик. Цель — создать бесплатное мобильное приложение с монетизацией через рекламу, приносящее пассивный доход ~$300/месяц. Публикация: App Store, Google Play, RuStore, Huawei AppGallery.

## Обязательный технологический стек

| Слой | Технология | Версия |
|------|-----------|--------|
| Мобильное приложение | Expo (React Native) | SDK 52+ |
| Язык | TypeScript | 5.x |
| Серверная часть | NestJS | 10.x |
| База данных | PostgreSQL | 16+ |
| ORM | Prisma | 5.x |
| Веб-интерфейс (если нужен) | React.js + Vite | React 19, Vite 6 |
| Runtime | Node.js | 20 LTS |

## Структура монорепозитория
```
project-root/
├── apps/
│   ├── mobile/          # Expo приложение
│   ├── server/          # NestJS API
│   └── web/             # React + Vite (если потребуется)
├── packages/
│   ├── shared/          # Общие типы, утилиты, константы
│   ├── ui/              # Общие UI-компоненты (если web + mobile)
│   └── api-client/      # Типизированный API-клиент
├── prisma/
│   └── schema.prisma    # Схема базы данных
├── package.json         # Workspace root
├── turbo.json           # Turborepo конфигурация
└── tsconfig.base.json   # Базовый TS конфиг
```

## Порядок выполнения фаз

Выполняй фазы СТРОГО последовательно. После каждой фазы сохраняй результаты в `docs/phase-N-output.md`.

### Фаза 1 → Креативный директор
Загрузи контекст из `.claude/agents/01-creative-director.md` и выполни все задачи.
Результат сохрани в `docs/phase-1-idea.md`.

### Фаза 2 → Бизнес-аналитик
Загрузи `.claude/agents/02-business-analyst.md`.
Используй результаты Фазы 1 как входные данные.
Результат сохрани в `docs/phase-2-requirements.md`.

### Фаза 3 → UI/UX Дизайнер
Загрузи `.claude/agents/03-ui-ux-designer.md`.
Используй результаты Фаз 1-2.
Результат сохрани в `docs/phase-3-design.md`.

### Фаза 4 → Tech Lead
Загрузи `.claude/agents/04-tech-lead.md`.
Используй результаты Фаз 1-3.
Результат сохрани в `docs/phase-4-architecture.md`.

### Фаза 5a → Backend-разработчик
Загрузи `.claude/agents/06-backend-developer.md`.
Реализуй серверную часть в `apps/server/`.

### Фаза 5b → Mobile-разработчик
Загрузи `.claude/agents/05-mobile-developer.md`.
Реализуй мобильное приложение в `apps/mobile/`.

### Фаза 5c → Web-разработчик (если требуется)
Загрузи `.claude/agents/07-web-developer.md`.
Реализуй веб-интерфейс в `apps/web/`.

### Фаза 6 → QA-инженер
Загрузи `.claude/agents/08-qa-engineer.md`.
Протестируй всё приложение.

## Глобальные правила

1. **Язык кода**: TypeScript ВЕЗДЕ, strict mode, no any
2. **Стиль**: ESLint + Prettier, единый конфиг на весь монорепо
3. **Коммиты**: Conventional Commits (feat:, fix:, chore:, docs:)
4. **Файлы**: создавай ПОЛНЫЕ файлы, никаких "// остальной код..."
5. **Ошибки**: обработка ВСЕХ edge cases, graceful degradation
6. **i18n**: русский + английский с первого дня
7. **Один разработчик**: все решения оптимизированы под соло-разработку
