-- =============================================
-- Supabase Schema: Alumni Tracker UMM
-- Run this SQL in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================
-- Table: alumni
-- ==================
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nim TEXT NOT NULL,
  nama_lulusan TEXT NOT NULL,
  tahun_masuk INTEGER DEFAULT 0,
  tanggal_lulus TEXT,
  fakultas TEXT DEFAULT '',
  program_studi TEXT DEFAULT '',
  status_pelacakan TEXT DEFAULT 'belum_dilacak' CHECK (status_pelacakan IN ('belum_dilacak', 'teridentifikasi', 'perlu_verifikasi', 'tidak_ditemukan')),
  confidence_score REAL DEFAULT 0,
  pddikti_verified BOOLEAN DEFAULT FALSE,
  pddikti_data JSONB,
  pddikti_score REAL DEFAULT 0,
  ringkasan_terbaru TEXT,
  tanggal_pelacakan TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- Table: tracking_results
-- ==================
CREATE TABLE IF NOT EXISTS tracking_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumni_id UUID REFERENCES alumni(id) ON DELETE CASCADE,
  sumber TEXT NOT NULL,
  nama_ditemukan TEXT NOT NULL,
  afiliasi TEXT,
  jabatan TEXT,
  lokasi TEXT,
  bidang_topik TEXT,
  tahun_aktivitas TEXT,
  link_profil TEXT,
  link_bukti TEXT,
  snippet TEXT,
  confidence TEXT DEFAULT 'rendah' CHECK (confidence IN ('tinggi', 'sedang', 'rendah')),
  score REAL DEFAULT 0,
  status TEXT DEFAULT 'tidak_cocok' CHECK (status IN ('kemungkinan_kuat', 'perlu_verifikasi', 'tidak_cocok')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- Table: tracking_queries
-- ==================
CREATE TABLE IF NOT EXISTS tracking_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumni_id UUID REFERENCES alumni(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  sumber_target TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- Table: tracking_history
-- ==================
CREATE TABLE IF NOT EXISTS tracking_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumni_id UUID REFERENCES alumni(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  detail JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- Indexes
-- ==================
CREATE INDEX IF NOT EXISTS idx_alumni_status ON alumni(status_pelacakan);
CREATE INDEX IF NOT EXISTS idx_alumni_nama ON alumni(nama_lulusan);
CREATE INDEX IF NOT EXISTS idx_alumni_nim ON alumni(nim);
CREATE INDEX IF NOT EXISTS idx_tracking_results_alumni ON tracking_results(alumni_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_alumni ON tracking_history(alumni_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_created ON tracking_history(created_at DESC);

-- ==================
-- Row Level Security (RLS) - Disable for admin-only app
-- ==================
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations with anon key (admin-only app)
CREATE POLICY "Allow all for alumni" ON alumni FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tracking_results" ON tracking_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tracking_queries" ON tracking_queries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tracking_history" ON tracking_history FOR ALL USING (true) WITH CHECK (true);
