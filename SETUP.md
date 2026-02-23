# 🛠️ Setup Guide — Supabase + Vercel (No Domain, No Card Required)

This is the **complete, simple stack**:
- 🗄️ **Supabase** — database + file storage (free, no card)
- ▲ **Vercel** — hosts frontend + backend API functions (free, no card)
- No Cloudflare, no Railway, no separate backend server, no domain needed

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → sign up (free, no card)
2. Click **"New Project"** → name it `vault-this-file`
3. Set a strong database password (save it somewhere)
4. Pick the region closest to you → wait ~2 min

---

## Step 2 — Run the Database Schema

1. Supabase dashboard → **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `supabase-schema.sql` from this project → paste the entire file
4. Click **"Run"** → you should see "Success. No rows returned"

---

## Step 3 — Create the Storage Bucket

1. Supabase dashboard → **Storage** (left sidebar)
2. Click **"New bucket"**
3. Name: **`vault-files`** (exact, case-sensitive)
4. Toggle "Public bucket" → **OFF**
5. File size limit: `52428800` (50 MB)
6. Click **"Create bucket"**

---

## Step 4 — Get Your Supabase Keys

Go to: Supabase dashboard → **Settings** (gear icon) → **API**

You need:
- **Project URL** e.g. `https://abcdefgh.supabase.co`
- **anon/public key** — safe to expose in frontend
- **service_role key** — SECRET, server-side only, never put in frontend

---

## Step 5 — Deploy to Vercel

1. Push project to GitHub
2. Go to [vercel.com](https://vercel.com) → **"Add New Project"** → import repo
3. Before deploying, add these **Environment Variables** in Vercel:

| Variable                | Where to get it                       |
|-------------------------|---------------------------------------|
| `SUPABASE_URL`          | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY`  | Supabase → Settings → API → service_role key |
| `VITE_SUPABASE_URL`     | Same as SUPABASE_URL                  |
| `VITE_SUPABASE_ANON_KEY`| Supabase → Settings → API → anon key |
| `JWT_SECRET`            | Make up any long random string (32+ chars) |
| `JWT_EXPIRES_IN`        | `7d`                                  |
| `VITE_APP_URL`          | Set to your Vercel URL after first deploy |

4. Click **Deploy**
5. Copy your Vercel URL → update `VITE_APP_URL` → Redeploy

---

## Step 6 — Run Locally

```bash
# Install frontend deps
cd frontend && npm install && cd ..

# Copy env files
cp frontend/.env.example frontend/.env    # fill in Supabase URL + anon key
cp api/.env.example .env.local            # fill in service key + JWT secret

# Install Vercel CLI
npm install -g vercel

# Run locally (handles both frontend + API functions)
vercel dev
# Opens at http://localhost:3000
```

---

## Why Supabase Storage Instead of Cloudflare R2?

- ✅ No domain required
- ✅ No separate Cloudflare account
- ✅ Files upload **directly from browser** to Supabase (bypasses Vercel's 4.5 MB function body limit)
- ✅ Signed URLs for secure downloads (15-minute expiry)
- ✅ 1 GB free — enough for testing and small production use

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `ERR_MODULE_NOT_FOUND: @vitejs/plugin-react` | `cd frontend && npm install` |
| 401 Unauthorized on API | Check `JWT_SECRET` is set in Vercel env vars |
| Upload fails | Make sure bucket name is exactly `vault-files` and not public |
| CORS errors locally | Use `vercel dev` not separate servers |
| QR has wrong URL | Update `VITE_APP_URL` env var in Vercel → Redeploy |
