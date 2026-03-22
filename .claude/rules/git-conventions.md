---
description: Git branch and commit conventions for Fact Front
---

# Git Conventions

## Branch Structure

```
main             # Production-ready code
feature/*        # Feature branches (from main)
fix/*            # Bug fix branches
hotfix/*         # Critical production fixes
```

## Conventional Commits

**Format:** `<type>(<scope>): <subject>`

**Types:**
| Type | Purpose |
|------|---------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, no code changes |
| `refactor` | Code refactoring |
| `test` | Adding/changing tests |
| `chore` | Dependencies, tool config |
| `perf` | Performance improvements |
| `ci` | CI/CD changes |

**Scopes:** `server`, `web`, `mobile`, `deploy`, `prisma`

**Rules:**
1. Subject up to 50 chars, starts lowercase, no period at end
2. Imperative mood in Russian: "добавить", "исправить", "обновить"
3. Scope — optional, specify module/component
4. Body — optional, explain "what" and "why"
5. Footer — optional, issue references
6. Breaking changes: add `!` after type/scope
7. Language: Russian for subject and body
8. No push — developer pushes manually after task completion
9. **Без Co-Authored-By** — НЕ добавлять `Co-Authored-By: Claude` в коммиты
