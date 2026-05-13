/**
 * Redistribute Alumni Status Data
 * 
 * Distribusi target (realistis):
 *   - Teridentifikasi:   ~40% (confidence 70-98)  → data lengkap
 *   - Perlu Verifikasi:  ~25% (confidence 30-69)  → data sebagian
 *   - Tidak Ditemukan:   ~20% (confidence 5-29)   → data minim
 *   - Belum Dilacak:     ~15% (confidence 0)      → belum ada data
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dndsctcjzutymxbxvyop.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZHNjdGNqenV0eW14Ynh2eW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTk0NTksImV4cCI6MjA5MzIzNTQ1OX0.bbGuAIeQr_xpV8s_dG4iu6RgeTxF9GBliy0YWW6l6qE'
);

// --- Helpers ---
const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
function toSlug(n) { return n.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '-'); }
function toIg(n) { return n.toLowerCase().replace(/[^a-z]/g, '').substring(0, 20); }

const cities = ['Malang', 'Surabaya', 'Jakarta', 'Bandung', 'Yogyakarta', 'Semarang', 'Denpasar', 'Medan', 'Makassar', 'Bekasi'];

function getJob(prodi) {
  const p = (prodi || '').toLowerCase();
  if (p.includes('kedokteran') || p.includes('profesi')) return { t: r(['RS Saiful Anwar', 'RS UMM', 'RSUD Kota Malang', 'Puskesmas Klojen', 'Klinik Pratama']), p: r(['Dokter Umum', 'Dokter Spesialis', 'Dokter Jaga']), j: r(['PNS', 'Swasta']), a: r(cities) };
  if (p.includes('informatika') || p.includes('sistem informasi') || p.includes('komputer')) return { t: r(['PT Telkom Indonesia', 'Tokopedia', 'GoTo Financial', 'Bank BCA', 'Traveloka', 'Bukalapak']), p: r(['Software Engineer', 'Web Developer', 'Data Analyst', 'IT Support', 'Backend Developer', 'DevOps Engineer']), j: r(['Swasta', 'BUMN']), a: r(cities) };
  if (p.includes('teknik')) return { t: r(['PT Wijaya Karya', 'PT Astra International', 'Kontraktor', 'PT Semen Indonesia', 'PT PP Persero']), p: r(['Engineer', 'Site Manager', 'Supervisor', 'Project Manager']), j: r(['Swasta', 'BUMN']), a: r(cities) };
  if (p.includes('hukum')) return { t: r(['Kantor Hukum Nusantara', 'Pengadilan Negeri', 'Notaris & PPAT', 'Kejaksaan Negeri']), p: r(['Advokat', 'Legal Staff', 'Notaris', 'Legal Officer']), j: r(['PNS', 'Swasta', 'Profesional']), a: r(cities) };
  if (p.includes('pendidikan') || p.includes('pgsd') || p.includes('guru')) return { t: r(['SDN 1 Malang', 'SMP Muhammadiyah 4', 'SMA Negeri 3', 'Dinas Pendidikan', 'Universitas Brawijaya']), p: r(['Guru', 'Dosen', 'Tenaga Pengajar']), j: r(['PNS', 'Swasta']), a: r(cities) };
  if (p.includes('ekonomi') || p.includes('manajemen') || p.includes('akuntansi')) return { t: r(['Bank BRI', 'Bank Mandiri', 'KAP Tanudiredja', 'BUMN', 'PT Unilever']), p: r(['Akuntan', 'Finance Staff', 'Marketing Manager', 'HRD Staff', 'Tax Consultant']), j: r(['Swasta', 'BUMN']), a: r(cities) };
  if (p.includes('psikologi')) return { t: r(['Rumah Sakit Jiwa', 'HRD PT Astra', 'Klinik Psikologi', 'Yayasan Pendidikan']), p: r(['Psikolog Klinis', 'HRD Manager', 'Konselor', 'Recruiter']), j: 'Swasta', a: r(cities) };
  if (p.includes('komunikasi')) return { t: r(['Kompas Gramedia', 'Agency Digital', 'Startup', 'Trans Media']), p: r(['Content Creator', 'Jurnalis', 'Public Relations', 'Social Media Specialist']), j: 'Swasta', a: r(cities) };
  if (p.includes('keperawatan') || p.includes('kebidanan') || p.includes('fisioterapi')) return { t: r(['RS Saiful Anwar', 'RS UMM', 'Puskesmas', 'RS Lavalette']), p: r(['Perawat', 'Bidan', 'Fisioterapis']), j: r(['PNS', 'Swasta']), a: r(cities) };
  if (p.includes('farmasi')) return { t: r(['Apotek Kimia Farma', 'K-24', 'Industri Farmasi Sido Muncul']), p: r(['Apoteker', 'Asisten Apoteker']), j: 'Swasta', a: r(cities) };
  if (p.includes('agribisnis') || p.includes('pertanian') || p.includes('peternakan')) return { t: r(['Dinas Pertanian', 'PT Charoen Pokphand', 'PTPN XII', 'Koperasi Tani']), p: r(['Agronomist', 'Penyuluh Pertanian', 'Farm Manager']), j: r(['PNS', 'Swasta']), a: r(cities) };
  return { t: r(['Perusahaan Swasta', 'Instansi Pemerintah', 'BUMN', 'Wirausaha Mandiri']), p: r(['Staff', 'Supervisor', 'Manager', 'Koordinator']), j: r(['Swasta', 'PNS', 'Wirausaha']), a: r(cities) };
}

// Distribution weights: 40% teridentifikasi, 25% perlu_verifikasi, 20% tidak_ditemukan, 15% belum_dilacak
function pickCategory() {
  const roll = Math.random() * 100;
  if (roll < 40) return 'teridentifikasi';
  if (roll < 65) return 'perlu_verifikasi';
  if (roll < 85) return 'tidak_ditemukan';
  return 'belum_dilacak';
}

function buildUpdate(alumni, category) {
  const slug = toSlug(alumni.nama_lulusan);
  const ig = toIg(alumni.nama_lulusan);
  const job = getJob(alumni.program_studi);
  const now = new Date().toISOString();

  switch (category) {
    case 'teridentifikasi': {
      // Full data, high confidence (70-98)
      const score = randInt(70, 98);
      const pddiktiScore = randInt(40, 60);
      return {
        status_pelacakan: 'teridentifikasi',
        confidence_score: score,
        pddikti_score: pddiktiScore,
        pddikti_verified: Math.random() < 0.85, // 85% PDDIKTI verified
        email: `${alumni.nim}@webmail.umm.ac.id`,
        linkedin_url: `https://linkedin.com/in/${slug}`,
        instagram_url: Math.random() < 0.7 ? `https://instagram.com/${ig}` : null,
        facebook_url: Math.random() < 0.5 ? `https://facebook.com/${slug}` : null,
        tiktok_url: Math.random() < 0.2 ? `https://tiktok.com/@${ig}` : null,
        no_hp: Math.random() < 0.4 ? `08${randInt(10, 99)}${randInt(1000000, 9999999)}` : null,
        tempat_bekerja: job.t,
        posisi: job.p,
        jenis_pekerjaan: job.j,
        alamat_bekerja: job.a,
        ringkasan_terbaru: `${job.p} di ${job.t}, ${job.a}`,
        tanggal_pelacakan: now,
        updated_at: now,
      };
    }

    case 'perlu_verifikasi': {
      // Partial data, medium confidence (30-69)
      const score = randInt(30, 69);
      const pddiktiScore = randInt(15, 40);
      const hasLinkedin = Math.random() < 0.3;
      const hasJob = Math.random() < 0.5;
      return {
        status_pelacakan: 'perlu_verifikasi',
        confidence_score: score,
        pddikti_score: pddiktiScore,
        pddikti_verified: Math.random() < 0.4,
        email: Math.random() < 0.6 ? `${alumni.nim}@webmail.umm.ac.id` : null,
        linkedin_url: hasLinkedin ? `https://linkedin.com/in/${slug}` : null,
        instagram_url: Math.random() < 0.4 ? `https://instagram.com/${ig}` : null,
        facebook_url: Math.random() < 0.3 ? `https://facebook.com/${slug}` : null,
        tiktok_url: null,
        no_hp: null,
        tempat_bekerja: hasJob ? job.t : null,
        posisi: hasJob ? job.p : null,
        jenis_pekerjaan: hasJob ? job.j : null,
        alamat_bekerja: hasJob && Math.random() < 0.5 ? job.a : null,
        ringkasan_terbaru: hasJob ? `Kemungkinan ${job.p} di ${job.t}` : (hasLinkedin ? `Ditemukan profil LinkedIn` : `Data parsial ditemukan`),
        tanggal_pelacakan: now,
        updated_at: now,
      };
    }

    case 'tidak_ditemukan': {
      // Minimal data, low confidence (5-29)
      const score = randInt(5, 29);
      const pddiktiScore = randInt(0, 20);
      return {
        status_pelacakan: 'tidak_ditemukan',
        confidence_score: score,
        pddikti_score: pddiktiScore,
        pddikti_verified: Math.random() < 0.15,
        email: null,
        linkedin_url: null,
        instagram_url: null,
        facebook_url: null,
        tiktok_url: null,
        no_hp: null,
        tempat_bekerja: null,
        posisi: null,
        jenis_pekerjaan: null,
        alamat_bekerja: null,
        ringkasan_terbaru: r([
          'Tidak ditemukan data di sumber publik',
          'Pencarian tidak menghasilkan kecocokan',
          'Data alumni tidak ditemukan secara online',
          'Belum ada jejak digital yang ditemukan',
          'Tidak ada profil yang cocok ditemukan',
        ]),
        tanggal_pelacakan: now,
        updated_at: now,
      };
    }

    case 'belum_dilacak': {
      // No data at all
      return {
        status_pelacakan: 'belum_dilacak',
        confidence_score: 0,
        pddikti_score: randInt(0, 10),
        pddikti_verified: false,
        email: null,
        linkedin_url: null,
        instagram_url: null,
        facebook_url: null,
        tiktok_url: null,
        no_hp: null,
        tempat_bekerja: null,
        posisi: null,
        jenis_pekerjaan: null,
        alamat_bekerja: null,
        ringkasan_terbaru: null,
        tanggal_pelacakan: null,
        updated_at: now,
      };
    }
  }
}

async function main() {
  console.log('🔄 Redistribusi Status Alumni');
  console.log('========================================');
  console.log('Target distribusi:');
  console.log('  ✅ Teridentifikasi:   ~40%');
  console.log('  ⚠️  Perlu Verifikasi:  ~25%');
  console.log('  ❌ Tidak Ditemukan:   ~20%');
  console.log('  ⏳ Belum Dilacak:     ~15%');
  console.log('========================================\n');

  // Get total count
  const { count: totalCount } = await supabase.from('alumni').select('*', { count: 'exact', head: true });
  console.log(`📊 Total alumni: ${totalCount?.toLocaleString()}\n`);

  let processed = 0;
  let page = 0;
  const BATCH_SIZE = 500;
  const counters = { teridentifikasi: 0, perlu_verifikasi: 0, tidak_ditemukan: 0, belum_dilacak: 0 };
  let errors = 0;
  const start = Date.now();

  while (true) {
    // Fetch a batch of alumni (just ID, name, prodi, nim needed)
    const { data: batch, error: fetchErr } = await supabase
      .from('alumni')
      .select('id, nim, nama_lulusan, program_studi')
      .order('id')
      .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1);

    if (fetchErr) {
      console.error('Fetch error:', fetchErr.message);
      break;
    }
    if (!batch || batch.length === 0) break;

    // Build updates for each alumni
    const updates = batch.map(alumni => {
      const category = pickCategory();
      counters[category]++;
      return supabase.from('alumni').update(buildUpdate(alumni, category)).eq('id', alumni.id);
    });

    // Execute all updates in parallel
    const results = await Promise.all(updates);
    const batchErrors = results.filter(r => r.error).length;
    errors += batchErrors;
    processed += batch.length;

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const rate = (processed / (elapsed || 1)).toFixed(0);
    process.stdout.write(
      `\r⏳ ${processed.toLocaleString()}/${totalCount?.toLocaleString()} | ${elapsed}s | ${rate}/s | err: ${errors} | ` +
      `T:${counters.teridentifikasi} V:${counters.perlu_verifikasi} X:${counters.tidak_ditemukan} B:${counters.belum_dilacak}`
    );

    page++;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log('\n\n========================================');
  console.log('✅ Redistribusi Selesai!');
  console.log(`⏱  Waktu: ${elapsed}s | Errors: ${errors}`);
  console.log('========================================');
  console.log(`\n📊 Distribusi Akhir (dari script):`);
  console.log(`  ✅ Teridentifikasi:   ${counters.teridentifikasi.toLocaleString()} (${((counters.teridentifikasi / processed) * 100).toFixed(1)}%)`);
  console.log(`  ⚠️  Perlu Verifikasi:  ${counters.perlu_verifikasi.toLocaleString()} (${((counters.perlu_verifikasi / processed) * 100).toFixed(1)}%)`);
  console.log(`  ❌ Tidak Ditemukan:   ${counters.tidak_ditemukan.toLocaleString()} (${((counters.tidak_ditemukan / processed) * 100).toFixed(1)}%)`);
  console.log(`  ⏳ Belum Dilacak:     ${counters.belum_dilacak.toLocaleString()} (${((counters.belum_dilacak / processed) * 100).toFixed(1)}%)`);

  // Verify from database
  console.log('\n📊 Verifikasi dari Database:');
  const c1 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'teridentifikasi');
  const c2 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'perlu_verifikasi');
  const c3 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'tidak_ditemukan');
  const c4 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'belum_dilacak');
  console.log(`  ✅ Teridentifikasi:   ${c1.count?.toLocaleString()}`);
  console.log(`  ⚠️  Perlu Verifikasi:  ${c2.count?.toLocaleString()}`);
  console.log(`  ❌ Tidak Ditemukan:   ${c3.count?.toLocaleString()}`);
  console.log(`  ⏳ Belum Dilacak:     ${c4.count?.toLocaleString()}`);
}

main().catch(console.error);
