-- ============================================================
-- Vault This File — Supabase PostgreSQL Schema
-- Run this in: supabase.com → Your Project → SQL Editor → New query
-- ============================================================

-- ─── Users ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  phone           TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  two_fa_secret   TEXT,
  two_fa_enabled  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Vaults ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vaults (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  visibility      TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  password_hash   TEXT,
  share_code      TEXT UNIQUE NOT NULL,
  download_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Files ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id        UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  original_name   TEXT NOT NULL,
  mime_type       TEXT,
  size_bytes      BIGINT DEFAULT 0,
  storage_path    TEXT NOT NULL,    -- path inside 'vault-files' bucket
  confirmed       BOOLEAN DEFAULT FALSE,
  download_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vaults_owner_id   ON vaults(owner_id);
CREATE INDEX IF NOT EXISTS idx_vaults_share_code ON vaults(share_code);
CREATE INDEX IF NOT EXISTS idx_files_vault_id    ON files(vault_id);
CREATE INDEX IF NOT EXISTS idx_files_owner_id    ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_confirmed   ON files(confirmed);

-- ─── Auto updated_at trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at  BEFORE UPDATE ON users  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER vaults_updated_at BEFORE UPDATE ON vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security (RLS) — IMPORTANT ────────────────────────────
-- We use the SERVICE ROLE key in API functions which bypasses RLS,
-- so RLS is here as a safety net but not the primary security layer.
ALTER TABLE users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE files  ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (your API functions use this)
CREATE POLICY "service role full access - users"  ON users  USING (true) WITH CHECK (true);
CREATE POLICY "service role full access - vaults" ON vaults USING (true) WITH CHECK (true);
CREATE POLICY "service role full access - files"  ON files  USING (true) WITH CHECK (true);


-- ============================================================
-- STORAGE BUCKET SETUP
-- Do this in: supabase.com → Storage → New Bucket
-- ============================================================
--
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "New bucket"
-- 3. Name it exactly: vault-files
-- 4. Toggle OFF "Public bucket" (we use signed URLs, not public access)
-- 5. Set file size limit to 52428800 (50 MB)
-- 6. Click "Create bucket"
--
-- Then add this Storage policy (Storage → Policies → vault-files):
-- Allow authenticated service role full access (already covered by service key)
--
-- ============================================================
-- THAT'S IT. No Cloudflare, no domain, no R2 needed.
-- Supabase Storage handles everything — signed upload URLs,
-- signed download URLs, and deletion. All free up to 1 GB.
-- ============================================================
