# WordPulse Design System — "Midnight Scholar"

## Цветовая палитра

### Light Theme
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#6366F1` (Indigo) | Primary actions, active states, brand |
| `primaryLight` | `#EEF2FF` | Primary tinted backgrounds |
| `emerald` | `#10B981` | Correct answers, success states |
| `emeraldDark` | `#059669` | Dark success accent |
| `gold` | `#F59E0B` | Awards, achievements |
| `orange` | `#F97316` | Streaks, warnings |
| `red` | `#EF4444` | Incorrect answers, errors |
| `blue` | `#3B82F6` | Informational, secondary actions |
| `purple` | `#8B5CF6` | Special highlights |
| `background` | `#F8FAFC` | Screen background |
| `surface` | `#FFFFFF` | Card surfaces |
| `surfaceVariant` | `#F1F5F9` | Secondary surfaces |
| `textPrimary` | `#0F172A` | Main text |
| `textSecondary` | `#64748B` | Secondary text |
| `textTertiary` | `#94A3B8` | Hints, placeholders |
| `border` | `#E2E8F0` | Dividers, borders |

### Dark Theme
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#818CF8` | Lighter indigo for dark bg |
| `emerald` | `#34D399` | Lighter emerald for dark bg |
| `background` | `#0F172A` | Deep navy (not pure black) |
| `surface` | `#1E293B` | Card surfaces |
| `textPrimary` | `#F1F5F9` | Main text |

## Градиенты

| Name | Light Colors | Dark Colors | Usage |
|------|-------------|-------------|-------|
| `primary` | `#6366F1 → #8B5CF6` | `#4F46E5 → #7C3AED` | Primary buttons, highlighted cards |
| `success` | `#10B981 → #059669` | `#34D399 → #10B981` | Correct answer badges, success buttons |
| `danger` | `#EF4444 → #DC2626` | `#F87171 → #EF4444` | Incorrect answer badges |
| `warm` | `#F59E0B → #F97316` | `#FBBF24 → #F59E0B` | Streak milestones |
| `hero` | `#EEF2FF → #F8FAFC` | `#1E1B4B → #0F172A` | Screen hero sections |
| `card` | `#FFFFFF → #F8FAFC` | `#1E293B → #0F172A` | Card backgrounds |

## Типографика

Font family: **Nunito** (all weights)

| Style | Size | Weight | LetterSpacing | Usage |
|-------|------|--------|---------------|-------|
| `hero` | 56px | Black (900) | -1.5 | Score reveals |
| `largeTitle` | 32px | Bold (700) | -0.5 | Screen titles |
| `headlineLarge` | 24px | ExtraBold (800) | -0.3 | Section headers |
| `headlineMedium` | 20px | Bold (700) | -0.2 | Card titles |
| `bodyLarge` | 16px | Regular (400) | 0 | Main text |
| `bodyMedium` | 14px | Regular (400) | 0 | Secondary text |
| `labelLarge` | 14px | SemiBold (600) | 0 | Buttons |
| `labelSmall` | 12px | SemiBold (600) | 0 | Badges, chips |
| `overline` | 11px | Bold (700) | 1.5 | Section overlines (UPPERCASE) |
| `caption` | 12px | Regular (400) | 0.2 | Hints, captions |

## Elevation

| Level | Shadow Opacity | Shadow Radius | Elevation (Android) | Usage |
|-------|---------------|---------------|---------------------|-------|
| `sm` | 0.08 | 4 | 2 | Default cards |
| `md` | 0.12 | 8 | 4 | Highlighted cards, tab bar |
| `lg` | 0.16 | 16 | 8 | Modals, toasts |
| `xl` | 0.20 | 24 | 12 | Hero cards (colored shadow: #6366F1) |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Small badges |
| `sm` | 8px | Chips, small cards |
| `md` | 12px | Cards, inputs |
| `lg` | 16px | Large cards, modals |
| `xl` | 20px | Hero cards |
| `xxxl` | 24px | Full-width cards |
| `full` | 9999px | Circular elements |

## Компоненты

### Button
- **Primary**: LinearGradient background (gradients.primary), white text, scale(0.96) on press
- **Success**: LinearGradient background (gradients.success), white text
- **Secondary**: Border + transparent bg, primary text
- **Ghost**: No border, primary text
- Sizes: sm (36px), md (44px), lg (54px)

### Card
- **Default**: Surface bg, 1px border, elevation.sm, scale(0.98) on press
- **Highlighted**: Surface bg, primary border, elevation.md
- **Gradient**: LinearGradient bg (gradients.card)
- Padding: 20px, borderRadius: md (12px)

### Chip
- **Selected**: LinearGradient background (variant-specific), white text
- **Unselected**: Surface bg, 1px border, scale(0.95) on press
- Supports `iconLeft` prop

### AnimatedEntrance
- Stagger fade + slide animation (spring: damping 20, stiffness 200)
- Directions: up, down, left, right
- `delay` prop for staggering multiple elements

### Toast
- Left vertical color indicator (4px width) instead of bottom border
- Surface background + elevation.lg
- Success color: emerald (not primary)

### Skeleton
- Shimmer sweep animation (gradient wave) instead of opacity pulse

## Экраны

### Home Screen
- Hero Daily Set card: gradient.card bg, elevation.xl, primary border, pulsing play button
- Section overline headers (UPPERCASE, primary color)
- Category cards: 140px width, gradient top accent bar (3px), border + shadow
- Difficulty cards: LinearGradient dot (36px), border + shadow
- Collection cards: 180px width, border + shadow
- All sections use AnimatedEntrance with staggered delays

### Game Screen
- Subtle gradient background (gradients.card)
- SwipeCard: visual card stack (2 cards behind), green/red glow on swipe
- ExplanationCard: gradient result banner, animated entrance

### Results Modal
- Performance-based gradient header (success >= 80%, primary >= 50%, warm < 50%)
- Animated score count-up (withTiming + Easing)
- Score scale spring entrance
- All elements stagger with AnimatedEntrance

### Streak Milestone Modal
- Full-screen amber gradient (gradients.warm)
- Animated fire icon (spring scale + rotation)
- Dramatic number reveal (spring scale with delay)
- White text on gradient

### Profile Screen
- Gradient hero header (gradients.hero) behind avatar
- Stat cards with colored accents (orange, gold, blue)
- Overline section headers

### Leaderboard Screen
- Top 3: gradient podium backgrounds (gold, silver, bronze)
- Segmented control (connected bar) instead of floating chips

### Onboarding
- Full gradient background (gradients.hero)
- Gradient illustration circles
- Active dot indicator: wider (24px) than inactive (8px)
- Stagger entrance animations per element

### Category/Collection Detail
- Gradient hero header with category/collection icon
- Info cards with colored icon backgrounds (rounded squares)
- Emerald accent for completed/success states

## Критичные правила

1. **НИКОГДА** не использовать `colors.primary` для "правильного ответа" — только `colors.emerald`
2. **НИКОГДА** не хардкодить font family строки — только через импорт `fontFamily.*`
3. Все entrance animations через `AnimatedEntrance` с `delay` для stagger
4. Градиенты использовать выборочно (hero, buttons, highlights) — НЕ на каждом элементе
5. Dark mode: глубокий navy (#0F172A), не pure black (#000000)
