# Implementation Guidelines - What NOT to Do

# Implementation Anti-Patterns & Constraints

## Purpose

This document outlines critical mistakes to avoid, anti-patterns to prevent, and constraints to respect during implementation. Following these guidelines will keep the project focused, maintainable, and aligned with the core vision.

---

## 🚫 Architecture Anti-Patterns

### DON'T Over-Engineer the Solution

**❌ AVOID:**

- Creating unnecessary abstraction layers (e.g., repositories wrapping repositories)
- Building a "framework" instead of an app
- Implementing design patterns "just because"
- Creating 10+ files for a simple feature
- Premature optimization before measuring performance

**✅ INSTEAD:**

- Start simple, refactor when complexity demands it
- Use abstractions only when you have 3+ similar implementations
- Measure first, optimize second
- Keep related code together until it needs to be separated

**Example of Over-Engineering:**

```
❌ DON'T DO THIS:
/services/
  /workout/
    /interfaces/
      IWorkoutRepository.ts
      IWorkoutService.ts
      IWorkoutFactory.ts
    /implementations/
      WorkoutRepositoryImpl.ts
      WorkoutServiceImpl.ts
    /factories/
      WorkoutFactory.ts
    /validators/
      WorkoutValidator.ts
    /mappers/
      WorkoutMapper.ts

✅ DO THIS INSTEAD:
/services/
  workoutService.ts  (contains all workout logic)
```

### DON'T Create Premature Abstractions

**❌ AVOID:**

- Creating "BaseComponent" or "BaseService" classes before you have 3+ similar components
- Building plugin systems or extensibility frameworks
- Creating configuration files for things that rarely change
- Abstracting away platform differences before you encounter them

**✅ INSTEAD:**

- Copy-paste code initially, extract common patterns after 3rd usage
- Build for the requirements you have, not the ones you imagine
- Platform-specific code is OK when platforms differ significantly

### DON'T Build for Imaginary Scale

**❌ AVOID:**

- Implementing caching layers for data that's already fast
- Building microservices architecture for a single-user app
- Creating complex queue systems for simple operations
- Optimizing for "millions of users" when you have zero

**✅ INSTEAD:**

- Build for current requirements (single user, local-first)
- Simple SQLite queries are fine for thousands of records
- Optimize when you measure actual performance issues

---

## 🚫 Scope Creep Anti-Patterns

### DON'T Add Features Not in the Specs

**❌ AVOID:**

- "While I'm here, let me add..."
- Building features because they're "cool" or "easy"
- Adding social features, gamification, or sharing (not in V1)
- Implementing nutrition tracking (explicitly out of scope)
- Building custom exercise video libraries
- Creating workout templates marketplace

**✅ INSTEAD:**

- Stick to the tickets and specs
- If you think of a good feature, document it for V2
- Focus on core value: Chat → Extract → Log → Analyze

### DON'T Build Generic Solutions

**❌ AVOID:**

- Creating a "universal fitness tracking framework"
- Building for multiple sports (running, cycling, swimming)
- Supporting every possible exercise variation
- Creating a CMS for workout content

**✅ INSTEAD:**

- Build specifically for strength training with Claude
- Hard-code reasonable assumptions
- Focus on the 80% use case

### DON'T Implement Every Edge Case

**❌ AVOID:**

- Supporting exercises with fractional reps (e.g., 8.5 reps)
- Handling time-zone changes mid-workout
- Building undo/redo for every action
- Supporting offline Claude conversations (impossible)

**✅ INSTEAD:**

- Handle common cases well
- Show clear error messages for edge cases
- Document known limitations

---

## 🚫 React/React Native Anti-Patterns

### DON'T Create Prop Drilling Nightmares

**❌ AVOID:**

- Passing props through 5+ component levels
- Creating "god components" with 20+ props
- Avoiding Redux/Context when you clearly need it

**✅ INSTEAD:**

- Use Redux for global state (user, workout session, chat)
- Use Context for theme/preferences
- Use local state for UI-only state (modals, dropdowns)

### DON'T Abuse useEffect

**❌ AVOID:**

```typescript
// ❌ DON'T DO THIS
useEffect(() => {
  fetchData();
}, [dependency1, dependency2, dependency3, dependency4]);

// Infinite loop risks, hard to debug
```

**✅ INSTEAD:**

- Use RTK Query for data fetching
- Keep effects simple and focused
- Consider if you need the effect at all

### DON'T Ignore Platform Differences

**❌ AVOID:**

- Assuming web APIs work on mobile (localStorage, Web Speech API)
- Using mobile-only packages in shared code
- Ignoring iOS vs Android differences (permissions, UI patterns)

**✅ INSTEAD:**

- Use platform-specific implementations with shared interfaces
- Test on both iOS and Android regularly
- Use platform detection: `Platform.OS === 'ios'`

### DON'T Create Massive Components

**❌ AVOID:**

- 500+ line components
- Components that do everything (fetch, render, validate, submit)
- Mixing business logic with presentation

**✅ INSTEAD:**

- Extract custom hooks for logic
- Split into smaller components at ~150 lines
- Separate containers (logic) from presentational components

---

## 🚫 Claude API Anti-Patterns

### DON'T Waste API Calls

**❌ AVOID:**

- Sending every keystroke to Claude
- Re-sending entire conversation history on every message
- Using Claude for simple parsing that regex can handle
- Calling Claude API for UI state management

**✅ INSTEAD:**

- Debounce user input (wait for user to finish typing)
- Send only necessary context (last 10 messages + workout summary)
- Use local parsing for structured data extraction
- Cache responses when appropriate

### DON'T Send Sensitive Data Unnecessarily

**❌ AVOID:**

- Including user email, name, or personal info in prompts
- Sending entire database dumps to Claude
- Logging API keys or responses with PII

**✅ INSTEAD:**

- Send only workout-relevant data
- Anonymize data in prompts
- Use workout IDs instead of personal identifiers

### DON'T Ignore Rate Limits

**❌ AVOID:**

- Rapid-fire API calls without throttling
- No retry logic for rate limit errors
- Ignoring 429 responses

**✅ INSTEAD:**

- Implement exponential backoff
- Show user-friendly messages during rate limits
- Queue requests if needed

### DON'T Build Complex Prompt Engineering

**❌ AVOID:**

- 10-page system prompts
- Complex prompt templating systems
- Trying to make Claude return perfect JSON every time
- Building prompt version control systems

**✅ INSTEAD:**

- Keep prompts simple and clear
- Use regex/parsing for structured extraction
- Accept that AI responses vary, build robust parsers
- Iterate on prompts based on real usage

---

## 🚫 Data & Storage Anti-Patterns

### DON'T Normalize Everything

**❌ AVOID:**

- Creating 20+ database tables for simple relationships
- Normalizing to 5th normal form
- Splitting data that's always used together

**✅ INSTEAD:**

- Denormalize when it simplifies queries
- Store JSON blobs for flexible data (exercise notes, metadata)
- Optimize for read patterns, not theoretical purity

### DON'T Ignore Data Migration

**❌ AVOID:**

- Changing schema without migration scripts
- Assuming users will "just reinstall"
- Breaking changes without version checks

**✅ INSTEAD:**

- Write migration scripts for schema changes
- Version your database schema
- Test migrations with real data

### DON'T Build Complex Sync Logic

**❌ AVOID:**

- Operational transformation algorithms
- Complex conflict resolution (3-way merge)
- Real-time sync for every change
- Building your own backend sync protocol

**✅ INSTEAD:**

- Use last-write-wins for conflicts (simple, works for single user)
- Batch sync operations (every 5 minutes, not every second)
- Use Firebase/Supabase built-in sync when possible
- Accept that some conflicts require user resolution

---

## 🚫 Voice Input Anti-Patterns

### DON'T Expect Perfect Transcription

**❌ AVOID:**

- Requiring exact phrases
- Failing on minor transcription errors
- No fallback for unclear speech

**✅ INSTEAD:**

- Build fuzzy matching ("bench press" vs "benchpress")
- Show transcript for user confirmation
- Allow manual correction
- Provide retry option

### DON'T Over-Complicate NLP

**❌ AVOID:**

- Training custom ML models for parsing
- Using heavy NLP libraries (spaCy, NLTK)
- Building intent classification systems
- Supporting every possible phrasing

**✅ INSTEAD:**

- Use regex patterns for common formats
- Support 5-10 common phrasings
- Show examples to guide users
- Let users learn the supported patterns

---

## 🚫 Testing Anti-Patterns

### DON'T Test Implementation Details

**❌ AVOID:**

- Testing internal component state
- Testing that Redux actions were dispatched
- Mocking everything (testing mocks, not code)
- 100% code coverage as a goal

**✅ INSTEAD:**

- Test user-facing behavior
- Test integration points (API, database)
- Mock only external dependencies (Claude API, storage)
- Aim for 70% coverage of critical paths

### DON'T Skip E2E Tests

**❌ AVOID:**

- Only unit testing
- Assuming integration works if units work
- No testing on real devices

**✅ INSTEAD:**

- Write E2E tests for critical flows
- Test on real iOS and Android devices
- Test offline scenarios

---

## 🚫 UI/UX Anti-Patterns

### DON'T Deviate from Wireframes Without Reason

**❌ AVOID:**

- "Improving" the design without user feedback
- Adding animations and transitions everywhere
- Changing layouts because you prefer it differently

**✅ INSTEAD:**

- Implement wireframes as specified
- Document design changes with reasoning
- Get feedback before major UI changes

### DON'T Ignore Loading States

**❌ AVOID:**

- Blank screens while loading
- No feedback during API calls
- Frozen UI during operations

**✅ INSTEAD:**

- Show skeletons or spinners
- Disable buttons during submission
- Provide progress indicators

### DON'T Build Custom UI Components

**❌ AVOID:**

- Building your own date picker, dropdown, modal from scratch
- Reinventing platform UI patterns
- Custom gesture handlers when built-in works

**✅ INSTEAD:**

- Use React Native Paper, NativeBase, or Material-UI
- Use platform-native components when possible
- Customize existing components, don't rebuild

---

## 🚫 Performance Anti-Patterns

### DON'T Optimize Prematurely

**❌ AVOID:**

- Memoizing every component
- Using useMemo/useCallback everywhere
- Optimizing before measuring
- Worrying about milliseconds

**✅ INSTEAD:**

- Profile first, optimize second
- Focus on user-perceivable performance (< 100ms interactions)
- Optimize the slow parts, not everything

### DON'T Load Everything at Once

**❌ AVOID:**

- Loading entire workout history on app start
- Rendering 1000+ items in a list
- Loading all chat messages at once

**✅ INSTEAD:**

- Implement pagination (load 20 workouts at a time)
- Use FlatList/VirtualizedList for long lists
- Lazy load chat history

---

## 🚫 Security Anti-Patterns

### DON'T Store API Keys Insecurely

**❌ AVOID:**

- Storing API keys in AsyncStorage (mobile) or localStorage (web) unencrypted
- Committing API keys to git
- Hardcoding API keys in code

**✅ INSTEAD:**

- Use Keychain (iOS) / Keystore (Android) for API keys
- Encrypt sensitive data at rest
- Use environment variables for development keys

### DON'T Trust User Input

**❌ AVOID:**

- Directly inserting user input into SQL queries
- Assuming numeric inputs are actually numbers
- No validation on form submissions

**✅ INSTEAD:**

- Use parameterized queries
- Validate and sanitize all inputs
- Use TypeScript types for compile-time safety

---

## 🚫 Code Organization Anti-Patterns

### DON'T Create Monolithic Files

**❌ AVOID:**

- 1000+ line files
- Single file with all Redux slices
- All components in one directory

**✅ INSTEAD:**

- Split files at ~200-300 lines
- Organize by feature, not by type
- Use clear folder structure

### DON'T Use Inconsistent Naming

**❌ AVOID:**

- Mixing camelCase and snake_case
- Inconsistent file naming (some .tsx, some .jsx)
- Abbreviations that aren't obvious (wkt, ex, usr)

**✅ INSTEAD:**

- Follow established conventions (camelCase for JS, PascalCase for components)
- Use descriptive names (workout, exercise, user)
- Be consistent across the codebase

---

## 🚫 Dependency Anti-Patterns

### DON'T Install Every Package

**❌ AVOID:**

- Installing 50+ dependencies
- Using heavy libraries for simple tasks (moment.js for date formatting)
- Multiple libraries that do the same thing
- Unmaintained packages

**✅ INSTEAD:**

- Use native APIs when possible (Intl.DateTimeFormat)
- Choose lightweight alternatives (date-fns over moment)
- Audit dependencies regularly
- Check package maintenance status

### DON'T Ignore Bundle Size

**❌ AVOID:**

- Importing entire libraries (`import _ from 'lodash'`)
- Including unused dependencies
- No code splitting on web

**✅ INSTEAD:**

- Import only what you need (`import { debounce } from 'lodash'`)
- Remove unused dependencies
- Use dynamic imports for large features

---

## 🚫 Git & Version Control Anti-Patterns

### DON'T Commit Everything

**❌ AVOID:**

- Committing node_modules
- Committing .env files with secrets
- Committing build artifacts
- Committing IDE-specific files

**✅ INSTEAD:**

- Use proper .gitignore
- Commit only source code
- Use .env.example for templates

### DON'T Make Massive Commits

**❌ AVOID:**

- 50+ files changed in one commit
- Mixing features and bug fixes
- Vague commit messages ("fix stuff", "updates")

**✅ INSTEAD:**

- Commit logical units of work
- One feature/fix per commit
- Write descriptive commit messages

---

## 🚫 Documentation Anti-Patterns

### DON'T Over-Document

**❌ AVOID:**

- JSDoc for every function
- Comments explaining obvious code
- Outdated documentation that contradicts code

**✅ INSTEAD:**

- Write self-documenting code (clear names)
- Document "why", not "what"
- Keep docs in sync with code

### DON'T Under-Document

**❌ AVOID:**

- No README
- No setup instructions
- No API key configuration guide
- No architecture overview

**✅ INSTEAD:**

- Write clear README with setup steps
- Document environment variables
- Explain key architectural decisions
- Add inline comments for complex logic

---

## ✅ Quick Reference: DO vs DON'T

| Category         | ❌ DON'T                        | ✅ DO                              |
| ---------------- | ------------------------------- | ---------------------------------- |
| **Scope**        | Add features not in specs       | Stick to defined requirements      |
| **Architecture** | Over-engineer with abstractions | Start simple, refactor when needed |
| **Components**   | Create 500+ line components     | Keep components under 150 lines    |
| **State**        | Prop drill through 5+ levels    | Use Redux for global state         |
| **API**          | Send every keystroke to Claude  | Debounce and batch requests        |
| **Storage**      | Normalize to 5th normal form    | Optimize for read patterns         |
| **Testing**      | Test implementation details     | Test user-facing behavior          |
| **Performance**  | Optimize before measuring       | Profile first, optimize second     |
| **Dependencies** | Install 50+ packages            | Use native APIs when possible      |
| **UI**           | Build custom components         | Use established UI libraries       |

---

## 🎯 Core Principles to Remember

1. **Build for the user you have, not the user you imagine**
2. **Simple solutions that work > Complex solutions that might work**
3. **Measure before optimizing**
4. **Stick to the specs, document ideas for later**
5. **Code for readability first, performance second**
6. **Test the behavior users care about**
7. **When in doubt, choose the simpler approach**

---

## 🚨 Red Flags During Implementation

If you find yourself:

- Creating more than 5 files for a single feature → You're over-engineering
- Writing code "for future flexibility" → You're premature optimizing
- Building features not in the tickets → You're scope creeping
- Spending hours on edge cases → You're over-thinking
- Creating abstractions before duplication → You're premature abstracting
- Optimizing code that runs in < 10ms → You're wasting time

**STOP and simplify.**

---

## 📋 Pre-Implementation Checklist

Before starting any ticket, ask:

- [ ] Is this feature in the specs?
- [ ] Am I building the simplest solution that works?
- [ ] Am I using existing libraries instead of building from scratch?
- [ ] Am I following the established patterns in the codebase?
- [ ] Will this work offline (if required)?
- [ ] Have I considered both mobile and web?
- [ ] Am I testing the right things?

---

## 🎓 When to Break These Rules

These are guidelines, not laws. Break them when:

- You have a measured performance problem
- You have 3+ instances of duplication
- You have user feedback demanding a feature
- You have a security concern
- The specs explicitly require it

**But document why you're breaking the rule.**

---

## Reference

See also:

- `spec:d8ab43ae-732f-46ea-860e-408533300441/6b10646d-b89a-4a65-a56b-f83800dbc55a` - Product Requirements
- `spec:d8ab43ae-732f-46ea-860e-408533300441/e4d52896-b7ff-4c3d-b862-2afd0c63afa6` - Technical Architecture

Remember: **The best code is code that works, is maintainable, and ships on time.**
