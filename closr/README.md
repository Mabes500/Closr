# Closr

Job application tracker. React + Vite + Supabase, deployed on Vercel.

## Run locally
1. Install Node.js 20 or newer (nodejs.org, the LTS version).
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key.
3. In this folder, run `npm install`, then `npm run dev`.
4. Open http://localhost:5173.

## Database
The schema is in `supabase/migrations/`. To apply a new migration, open Supabase dashboard > SQL Editor, paste the file's contents and click Run. Apply the files in filename order, each one once.

## Deploy
Vercel deploys automatically on every push to `main`. The environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in Vercel > Project > Settings > Environment Variables.
