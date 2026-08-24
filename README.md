# CleanSnap

CleanSnap is an AI-assisted civic cleanliness reporting platform.

## Core flow

Report an issue → AI verification → GPS/location → Supabase Storage → database report → status tracking → points → rewards.

## Structure

- `src/pages/public` — landing/auth
- `src/pages/citizen` — citizen application
- `src/pages/admin` — municipality/admin application
- `src/components/layout` — application shell/navigation
- `src/services` — Supabase data operations
- `src/contexts` — auth state
- `src/routes` — routing and access control
- `supabase/migrations` — database/RLS/functions
- `supabase/functions/analyze-garbage` — AI image analysis

## Supabase setup

1. Open the Supabase project configured by `VITE_SUPABASE_URL`.
2. Run the migrations in `supabase/migrations` (including `20260824000100_cleansnap_production.sql`) from the Supabase SQL editor or with the Supabase CLI.
3. Deploy the `analyze-garbage` Edge Function.
4. Add the `LOVABLE_API_KEY` secret to the Edge Function environment.
5. Confirm the `report-images` storage bucket exists and is public for report image URLs.
6. To create an administrator, change a trusted user's `profiles.role` to `admin` or `municipality` in Supabase. Do not allow citizens to change their own role.

## Local development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
```

Then deploy the project to Vercel with the same Supabase environment variables.
