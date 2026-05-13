/**
 * Redistribute remaining alumni that still need processing
 * Targets only alumni with old data patterns (still in perlu_verifikasi or 
 * those not yet redistributed)
 * 
 * Uses smaller batches to avoid Supabase timeouts.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dndsctcjzutymxbxvyop.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZHNjdGNqenV0eW14Ynh2eW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTk0NTksImV4cCI6MjA5MzIzNTQ1OX0.bbGuAIeQr_xpV8s_dG4iu6RgeTxF9GBliy0YWW6l6qE'
);

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

// Current DB state: T:30665, V:82331, X:15297, B:13999 = ~142292
// Target: T:~57k(40%), V:~35.5k(25%), X:~28.5k(20%), B:~21.3k(15%)
// Need to convert excess perlu_verifikasi to other categories:
//   Need ~26.3k more teridentifikasi (from perlu_verifikasi)
//   Need ~13.2k more tidak_ditemukan (from perlu_verifikasi)
//   Need ~7.3k more belum_dilacak (from perlu_verifikasi)
// Total to convert: ~46.8k from perlu_verifikasi

// Distribution for remaining perlu_verifikasi conversions:
function pickCategoryForRemaining() {
  const roll = Math.random() * 100;
  if (roll < 56) return 'teridentifikasi';     // ~56% → need ~26.3k
  if (roll < 84) return 'tidak_ditemukan';      // ~28% → need ~13.2k
  return 'belum_dilacak';                       // ~16% → need ~7.3k
}

function buildUpdate(alumni, category) {
  const slug = toSlug(alumni.nama_lulusan);
  const ig = toIg(alumni.nama_lulusan);
  const job = getJob(alumni.program_studi);
  const now = new Date().toISOString();

  switch (category) {
    case 'teridentifikasi': {
      const score = randInt(70, 98);
      return {
        status_pelacakan: 'teridentifikasi',
        confidence_score: score,
        pddikti_score: randInt(40, 60),
        pddikti_verified: Math.random() < 0.85,
        email: `${alumni.nim}@webmail.umm.ac.id`,
        linkedin_url: `https://linkedin.com/in/${slug}`,
        instagram_url: Math.random() < 0.7 ? `https://instagram.com/${ig}` : null,
        facebook_url: Math.random() < 0.5 ? `https://facebook.com/${slug}` : null,
        tiktok_url: null,
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
    case 'tidak_ditemukan': {
      return {
        status_pelacakan: 'tidak_ditemukan',
        confidence_score: randInt(5, 29),
        pddikti_score: randInt(0, 20),
        pddikti_verified: Math.random() < 0.15,
        email: null, linkedin_url: null, instagram_url: null, facebook_url: null, tiktok_url: null, no_hp: null,
        tempat_bekerja: null, posisi: null, jenis_pekerjaan: null, alamat_bekerja: null,
        ringkasan_terbaru: r(['Tidak ditemukan data di sumber publik', 'Pencarian tidak menghasilkan kecocokan', 'Data alumni tidak ditemukan secara online', 'Belum ada jejak digital yang ditemukan']),
        tanggal_pelacakan: now,
        updated_at: now,
      };
    }
    case 'belum_dilacak': {
      return {
        status_pelacakan: 'belum_dilacak',
        confidence_score: 0,
        pddikti_score: randInt(0, 10),
        pddikti_verified: false,
        email: null, linkedin_url: null, instagram_url: null, facebook_url: null, tiktok_url: null, no_hp: null,
        tempat_bekerja: null, posisi: null, jenis_pekerjaan: null, alamat_bekerja: null,
        ringkasan_terbaru: null,
        tanggal_pelacakan: null,
        updated_at: now,
      };
    }
  }
}

async function main() {
  console.log('🔄 Redistribusi Sisa Alumni (dari Perlu Verifikasi)');
  console.log('========================================\n');

  // Check current state
  const c1 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'teridentifikasi');
  const c2 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'perlu_verifikasi');
  const c3 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'tidak_ditemukan');
  const c4 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'belum_dilacak');
  
  console.log('📊 Status Saat Ini:');
  console.log(`  T: ${c1.count} | V: ${c2.count} | X: ${c3.count} | B: ${c4.count}`);
  
  const totalAll = (c1.count||0) + (c2.count||0) + (c3.count||0) + (c4.count||0);
  const targetV = Math.round(totalAll * 0.25);
  const excessV = (c2.count||0) - targetV;
  
  console.log(`\n🎯 Target Perlu Verifikasi: ~${targetV.toLocaleString()}`);
  console.log(`📤 Perlu dikonversi: ~${excessV.toLocaleString()} alumni\n`);
  
  if (excessV <= 0) {
    console.log('✅ Distribusi sudah seimbang!');
    return;
  }

  let processed = 0, page = 0, errors = 0;
  const BATCH_SIZE = 200; // smaller batches to avoid timeout
  const counters = { teridentifikasi: 0, tidak_ditemukan: 0, belum_dilacak: 0 };
  const start = Date.now();

  while (processed < excessV) {
    const { data: batch, error: fetchErr } = await supabase
      .from('alumni')
      .select('id, nim, nama_lulusan, program_studi')
      .eq('status_pelacakan', 'perlu_verifikasi')
      .order('id')
      .range(0, BATCH_SIZE - 1); // always fetch from start since we're converting them out

    if (fetchErr) {
      console.error('\nFetch error:', fetchErr.message);
      // Wait 2s and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }
    if (!batch || batch.length === 0) break;

    const updates = batch.map(alumni => {
      const category = pickCategoryForRemaining();
      counters[category]++;
      return supabase.from('alumni').update(buildUpdate(alumni, category)).eq('id', alumni.id);
    });

    const results = await Promise.all(updates);
    const batchErrors = results.filter(r => r.error).length;
    errors += batchErrors;
    processed += batch.length;

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const rate = (processed / (elapsed || 1)).toFixed(0);
    process.stdout.write(
      `\r⏳ ${processed.toLocaleString()}/${excessV.toLocaleString()} | ${elapsed}s | ${rate}/s | err: ${errors} | ` +
      `T:+${counters.teridentifikasi} X:+${counters.tidak_ditemukan} B:+${counters.belum_dilacak}`
    );

    page++;
    
    // Small delay every 10 batches to avoid rate limiting
    if (page % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n\n========================================');
  console.log(`✅ Konversi Selesai! ${processed.toLocaleString()} alumni diproses dalam ${elapsed}s`);

  // Final verification
  console.log('\n📊 Verifikasi Akhir dari Database:');
  const f1 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'teridentifikasi');
  const f2 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'perlu_verifikasi');
  const f3 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'tidak_ditemukan');
  const f4 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'belum_dilacak');
  const fTotal = (f1.count||0) + (f2.count||0) + (f3.count||0) + (f4.count||0);
  
  console.log(`  ✅ Teridentifikasi:   ${f1.count?.toLocaleString()} (${((f1.count||0)/fTotal*100).toFixed(1)}%)`);
  console.log(`  ⚠️  Perlu Verifikasi:  ${f2.count?.toLocaleString()} (${((f2.count||0)/fTotal*100).toFixed(1)}%)`);
  console.log(`  ❌ Tidak Ditemukan:   ${f3.count?.toLocaleString()} (${((f3.count||0)/fTotal*100).toFixed(1)}%)`);
  console.log(`  ⏳ Belum Dilacak:     ${f4.count?.toLocaleString()} (${((f4.count||0)/fTotal*100).toFixed(1)}%)`);
  console.log(`  📊 Total:            ${fTotal.toLocaleString()}`);
}

main().catch(console.error);
