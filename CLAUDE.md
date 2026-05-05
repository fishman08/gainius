# Gainius — project context for Claude Code

This is an AI-powered workout tracker. The user chats with a Claude AI coach to
plan workouts, logs sets in real time (voice or tap), and tracks progress over time.

**Monorepo layout**

- `apps/web` — Vite + React PWA (primary)
- `apps/mobile` — React Native / Expo (iOS + Android)
- `packages/shared` — typed theme, parsers, analytics, sync, storage interfaces
- `packages/ui-components` — currently empty stub

---

## Design tokens — source of truth

**JS/TS**: `packages/shared/src/types/theme.ts` exports `lightTheme` and `darkTheme`.
Use `useTheme()` / `useAppTheme()` to access them in components — never hardcode hex values.

**CSS** (web only): `apps/web/src/styles/gainius-tokens.css` — same values as CSS variables.
Loaded globally in `main.tsx`. Available as `var(--primary)`, `var(--surface)`, etc.

Key values for reference:

```
Primary:         #F97316  (light)  /  #FB923C  (dark)
Background:      #F8FAFC  (light)  /  #0F172A  (dark)
Surface:         #FFFFFF  (light)  /  #1E293B  (dark)
SurfaceElevated: #FFFFFF  (light)  /  #334155  (dark)   ← raised cards on dark mode
Text:            #0F172A  (light)  /  #F1F5F9  (dark)
Text secondary:  #64748B  (light)  /  #94A3B8  (dark)
Success:         #22C55E  (light)  /  #4ADE80  (dark)
Accent:          #22C55E  (light)  /  #4ADE80  (dark)   ← same family as success, but use for highlights/borders
Error:           #EF4444  (light)  /  #F87171  (dark)
Nav bar:         #0F172A  (light)  /  #1E293B  (dark)
PrimaryMuted:    #FFF7ED  (light)  /  #431407  (dark)   ← background tint for completed sets
Gradient 1 / 2:  #F97316 → #FB923C (light) / #FB923C → #FDBA74 (dark)  ← reserved for hero CTA only
```

---

## Typography

Two font families only. Never introduce a third.

| Role                             | Family           | Weight        | Notes                                              |
| -------------------------------- | ---------------- | ------------- | -------------------------------------------------- |
| Display / titles / stats / timer | Barlow Condensed | 600, 700      | Tight tracking, uppercase for wordmark + overlines |
| Body / labels / inputs / buttons | Rethink Sans     | 400, 500, 600 | Sentence case                                      |
| Monospace (code, debug)          | JetBrains Mono   | 400, 500      | Never in product UI                                |

Both fonts are loaded from Google Fonts in `apps/web/index.html`.
On mobile they are loaded via `expo-font` in `App.tsx`.

**Numeric values** (weights, reps, timer): always `font-variant-numeric: tabular-nums`
with Barlow Condensed Bold so digits don't jump during countdown.

**Typography is exposed via `theme.typography`** (`packages/shared/src/types/theme.ts`)
so components can spread it instead of repeating font/size declarations:

| Slot       | Family           | Weight | Size | Use                            |
| ---------- | ---------------- | ------ | ---- | ------------------------------ |
| `display`  | Barlow Condensed | 700    | 32   | Hero stats, splash wordmark    |
| `headline` | Barlow Condensed | 600    | 24   | Screen titles, section headers |
| `title`    | Rethink Sans     | 600    | 18   | Card titles, exercise names    |
| `body`     | Rethink Sans     | 400    | 16   | Default paragraph + chat       |
| `label`    | Rethink Sans     | 500    | 14   | Buttons, form labels, tab text |
| `caption`  | Rethink Sans     | 400    | 12   | Helper text, timestamps        |

---

## Brand voice

- **Second-person**: "you", "your". Never "we" or "our".
- **Sentence case** for all body copy, labels, empty states, and toasts.
- **Title Case** only for primary action buttons and screen headings.
- **UPPERCASE** only in Barlow Condensed for the wordmark, overlines, and stat labels.
- No emoji except `🎤` on the voice input button. No fitness bro copy.
- Set/rep notation: `3 × 10` (unicode ×, U+00D7). Dense UI may use `3x10`.
- Weight: `lbs` (lowercase). Imperial first; kg toggle is not yet built.

**Example strings (match this tone exactly)**

- Empty state: "No workout plan yet" → "Chat with your AI coach to create one!"
- Set complete label: "All sets complete"
- Suggested weight chip: "Suggested: 135 lbs"
- Voice button: "Voice Log Set"
- Extraction confirmation: "Extracted 4 exercises"

---

## Components

All components use inline styles driven by the `theme` object from `useTheme()` /
`useAppTheme()`. Do NOT introduce a CSS-in-JS library or Tailwind.

### Key component patterns

**ExerciseCard** (`components/workout/ExerciseCard.tsx`)

- White surface, 14px radius, 1px `surfaceBorder`, `shadow-sm`
- **Completed state**: 4px left border in `theme.colors.accent` (success green) + inner set rows get `primaryMuted` background tint
- This is the ONLY sanctioned colored-left-border pattern in the system

**SetRow** (`components/workout/SetRow.tsx`)

- Flex row: label (48px) + two outlined inputs (reps / lbs) + circle toggle
- Completed row gets `primaryMuted` background tint
- Toggle: `check-circle` (MCI) when done, `check-circle-outline` when pending

**StatCard** (`components/progress/StatCard.tsx`)

- Centered value in Barlow Condensed 700 + label in Rethink Sans 500 10–11px uppercase
- No colored backgrounds on stat cards — white surface only

**MessageBubble** (`components/chat/MessageBubble.tsx`)

- User: `messageBubbleUser` bg (#F97316), white text, 20px radius
- AI: `messageBubbleAI` bg (#F1F5F9), slate-900 text, 20px radius
- Never use a different color for either bubble

**NavBar** (`components/NavBar.tsx` — web)

- Slate-900 background, wordmark in orange on the left, 3px orange underline on active tab
- Icons: Lucide (MessageSquare, Dumbbell, TrendingUp, Settings)

### Corner radii

Exposed as `theme.borderRadius.{sm, md, lg, xl, full}`.

```
sm   = 8     — chips, pills, badges
md   = 14    — cards, inputs, buttons  ← workhorse
lg   = 20    — modals, message bubbles
xl   = 28    — sheets, FAB
full = 9999  — avatars, full pill tags
```

### Shadows

Exposed as `theme.shadows.{sm, md, lg}`. Light mode uses slate-tinted alpha; dark
mode uses pure black at higher opacity (matches the values in `theme.ts`).

```
sm   — 0 1px 3px rgba(15,23,42,0.08)   light  /  rgba(0,0,0,0.20)  dark   — cards
md   — 0 4px 12px rgba(15,23,42,0.10)  light  /  rgba(0,0,0,0.25)  dark   — modals
lg   — 0 8px 24px rgba(15,23,42,0.12)  light  /  rgba(0,0,0,0.30)  dark   — full-screen overlays
glow — 0 8px 28px rgba(249,115,22,0.28)  ← primary CTA hero only, not in theme
```

### Spacing

`4 / 8 / 16 / 24 / 32` px (xs / sm / md / lg / xl).
16px is the default screen edge padding on mobile; 24px on web.

---

## Iconography

**Web**: `lucide-react` — already installed. Use it exclusively.
**Mobile**: MaterialCommunityIcons via `react-native-paper` `<IconButton icon="…">`.

| Action       | Lucide name                | MCI name       |
| ------------ | -------------------------- | -------------- |
| Chat         | MessageSquare              | chat           |
| Workout      | Dumbbell                   | dumbbell       |
| Progress     | TrendingUp                 | chart-line     |
| Settings     | Settings                   | cog            |
| Mic / voice  | Mic                        | (emoji 🎤)     |
| Set complete | CheckCircle / CheckCircle2 | check-circle   |
| Edit         | Pencil                     | pencil         |
| Delete       | Trash2                     | delete-outline |
| Add          | Plus                       | plus           |
| Close        | X                          | close          |

Do not introduce new icon names for actions already in this table.

---

## Logo

The **barbell** is the chosen mark. Three SVG files live in `apps/web/public/`:

| File                          | Use                                                       |
| ----------------------------- | --------------------------------------------------------- |
| `logomark-barbell.svg`        | Default everywhere — orange plates on slate tile          |
| `logomark-barbell-orange.svg` | Hero / splash / primary CTA — slate plates on orange tile |
| `logomark-barbell-mono.svg`   | Footers, watermarks, single-color contexts                |

Reference in web: `<img src="/logomark-barbell.svg">` (no import needed).

Wordmark: Barlow Condensed 700, tight tracking, trailing orange square as period.
In JSX: `<span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>GAINIUS</span>`
followed by a `12×12px` `#F97316` square.

---

## What NOT to do

- ❌ Never hardcode `#F97316` or any other hex — always use `theme.colors.*`
- ❌ Never add a third font family
- ❌ Never use a colored left border on a card except for the completed ExerciseCard
- ❌ Never add emoji beyond 🎤
- ❌ Never use gradients as card or section backgrounds (`gradient1`/`gradient2` are reserved for the primary hero CTA only)
- ❌ Never use `blur()` or `backdrop-filter` in the app UI (reserved for iOS native chrome)
- ❌ Never write "we" or "our" in product copy
- ❌ Never introduce Tailwind, Styled Components, or Emotion — inline styles + theme object only
- ❌ Never modify `packages/shared/src/types/theme.ts` token values without updating `apps/web/src/styles/gainius-tokens.css` to match

---

## Folder conventions

```
apps/web/src/
  components/     # Reusable UI — grouped by feature (chat, workout, progress, settings)
  pages/          # Route-level components (ChatPage, HomePage, ProgressPage, SettingsPage)
  providers/      # Context providers (ThemeProvider, AuthProvider, StorageProvider, SyncProvider)
  hooks/          # Custom hooks
  services/       # External API wrappers (storage keys, notification service)
  storage/        # Dexie DB + storage service
  store/          # Redux store + slices
  styles/         # CSS files (gainius-tokens.css — do not add more)

apps/mobile/src/
  components/     # Same feature grouping as web
  screens/        # Route-level screens
  providers/      # Mirror of web providers, RN-specific
  services/       # SecureStore, notifications
  storage/        # SQLite storage service
  store/          # Shared Redux store

packages/shared/src/
  types/theme.ts  # ← design token source of truth
  api/            # Claude API client + context builder
  parsers/        # Exercise and voice parsers
  analytics/      # Weight suggestion, volume tracking
  sync/           # Supabase sync engine
```

---

## Anti-patterns seen in earlier drafts — avoid

- Generating blue `#4A90E2` as the primary — that was a wireframe placeholder, not the brand color
- Wrapping exercise names in `<h1>` — use `Text variant="titleMedium"` (mobile) or a `<div>` with title styles (web)
- Adding a "Today's Date" header to every screen — the app infers context, it doesn't announce it
- Putting `box-shadow` on dark-mode surfaces — dark mode uses surface color elevation, not shadows
