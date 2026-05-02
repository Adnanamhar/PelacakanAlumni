import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      // Return a dummy client that won't crash during build
      _supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
    } else {
      _supabase = createClient(url, key);
    }
  }
  return _supabase;
}

// For convenience - lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

export type Alumni = {
  id: string;
  nim: string;
  nama_lulusan: string;
  tahun_masuk: number;
  tanggal_lulus: string;
  fakultas: string;
  program_studi: string;
  status_pelacakan: 'belum_dilacak' | 'teridentifikasi' | 'perlu_verifikasi' | 'tidak_ditemukan';
  confidence_score: number;
  pddikti_verified: boolean;
  pddikti_data: Record<string, unknown> | null;
  pddikti_score: number;
  ringkasan_terbaru: string | null;
  tanggal_pelacakan: string | null;
  // Data Kontak & Sosial Media
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  email: string | null;
  no_hp: string | null;
  // Data Pekerjaan
  tempat_bekerja: string | null;
  alamat_bekerja: string | null;
  posisi: string | null;
  jenis_pekerjaan: string | null; // PNS, Swasta, Wirausaha
  sosmed_tempat_bekerja: string | null;
  created_at: string;
  updated_at: string;
};

export type TrackingResult = {
  id: string;
  alumni_id: string;
  sumber: string;
  nama_ditemukan: string;
  afiliasi: string | null;
  jabatan: string | null;
  lokasi: string | null;
  bidang_topik: string | null;
  tahun_aktivitas: string | null;
  link_profil: string | null;
  link_bukti: string | null;
  snippet: string | null;
  confidence: 'tinggi' | 'sedang' | 'rendah';
  score: number;
  status: 'kemungkinan_kuat' | 'perlu_verifikasi' | 'tidak_cocok';
  created_at: string;
};

export type TrackingQuery = {
  id: string;
  alumni_id: string;
  query_text: string;
  sumber_target: string;
  url: string;
  created_at: string;
};

export type TrackingHistory = {
  id: string;
  alumni_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
  alumni?: Alumni;
};
