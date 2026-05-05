# Workout

Cross-platform AI-curated workout app.

## Layout

```
apps/web        Next.js 15 (App Router)
apps/mobile     Expo (React Native)
packages/core   Shared questionnaire spec, Zod schemas, types, copy
packages/db     Supabase client factories + generated DB types
supabase/       SQL migrations
```

## Setup

```bash
# Install
pnpm install

# Copy env template, fill in Supabase URL + anon key
cp .env.example .env
cp .env.example apps/web/.env.local
cp .env.example apps/mobile/.env

# Run web
pnpm --filter web dev

# Run mobile
pnpm --filter mobile start
```

## Database

Apply migrations from `supabase/migrations/` using the Supabase CLI or dashboard.

```bash
supabase db push
supabase gen types typescript --local > packages/db/src/types.gen.ts
```
