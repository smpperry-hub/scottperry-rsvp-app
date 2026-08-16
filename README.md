Wedding RSVP app for Scott & Mia — Next.js + Supabase, deployed to Vercel.

## What's here

- `/` — public RSVP form (name, contact, attending, rooming picker, notes)
- `/login` — host magic-link sign in
- `/dashboard` — host-only: live stats, response list with rooming picks, guest list manager
- `/api/rsvp` — public POST endpoint, validates and writes RSVPs
- `/api/guests` — host-only GET/POST/DELETE for the guest list
- `supabase/migrations/0001_init.sql` — schema + RLS policies

## One-time setup

### 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/migrations/0001_init.sql`.
3. Magic link works automatically as soon as the **Email** provider is on (Authentication → Providers → Email), which is the default for new projects — there's no separate "magic link" switch to find.
4. Under **Authentication → Sign In / Up**, turn off **"Allow new users to sign up"**. Our code already blocks self-registration (`shouldCreateUser: false`), but disabling it here too means only pre-created accounts can ever log in.
5. Under **Authentication → Users**, manually add the two host accounts (e.g. both partners' emails). These are the only accounts that will ever be able to sign in.

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=       # Project Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Project Settings > API > anon public key
SUPABASE_SERVICE_ROLE_KEY=      # Project Settings > API > service_role key (server-only, keep secret)
HOST_ALLOWED_EMAILS=            # comma-separated, must match the users created above
```

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

1. Push this repo to GitHub (or connect the local folder via the Vercel CLI).
2. Import the project in Vercel.
3. Add the four environment variables above in the Vercel project settings (Production + Preview).
4. Deploy. Once live, the RSVP form URL is your production domain (e.g. `https://your-app.vercel.app`) — link or embed that from the Canva site.

## Notes

- The public `/api/rsvp` route uses the service-role key server-side to check for duplicate names and validate rooming picks, since the anon key only has `insert` access to `rsvps`.
- The dashboard subscribes to Postgres changes on `rsvps` and `rooming_preferences` via Supabase Realtime, so new responses appear without a refresh.
- Row Level Security is enabled on all three tables; see the migration file for the exact policies.
