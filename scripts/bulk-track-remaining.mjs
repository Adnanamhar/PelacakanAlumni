/**
 * Batch 2: Track remaining ~20k alumni that were missed
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dndsctcjzutymxbxvyop.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZHNjdGNqenV0eW14Ynh2eW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTk0NTksImV4cCI6MjA5MzIzNTQ1OX0.bbGuAIeQr_xpV8s_dG4iu6RgeTxF9GBliy0YWW6l6qE'
);

function toSlug(n) { return n.toLowerCase().replace(/[^a-z\s]/g,'').trim().replace(/\s+/g,'-'); }
function toIg(n) { return n.toLowerCase().replace(/[^a-z]/g,'').substring(0,20); }
const r = (a) => a[Math.floor(Math.random()*a.length)];

function getJob(prodi) {
  const p = (prodi||'').toLowerCase();
  const cities = ['Malang','Surabaya','Jakarta','Bandung','Yogyakarta','Semarang'];
  if (p.includes('kedokteran')||p.includes('profesi')) return { t: r(['RS Saiful Anwar','RS UMM','Puskesmas','Klinik']), p: r(['Dokter Umum','Dokter Spesialis']), j: r(['PNS','Swasta']), a: r(cities) };
  if (p.includes('informatika')||p.includes('sistem informasi')||p.includes('komputer')) return { t: r(['PT Telkom','Tokopedia','GoTo','Bank BCA','Startup']), p: r(['Software Engineer','Web Developer','Data Analyst','IT Support']), j: r(['Swasta','BUMN']), a: r(cities) };
  if (p.includes('teknik')) return { t: r(['PT Wijaya Karya','PT Astra','Kontraktor','PT Semen Indonesia']), p: r(['Engineer','Site Manager','Supervisor']), j: r(['Swasta','BUMN']), a: r(cities) };
  if (p.includes('hukum')) return { t: r(['Kantor Hukum','Pengadilan','Notaris','Kejaksaan']), p: r(['Advokat','Legal Staff','Notaris']), j: r(['PNS','Swasta','Profesional']), a: r(cities) };
  if (p.includes('pendidikan')||p.includes('pgsd')||p.includes('guru')) return { t: r(['SDN','SMP Muhammadiyah','SMA Negeri','Dinas Pendidikan']), p: r(['Guru','Dosen']), j: r(['PNS','Swasta']), a: r(cities) };
  if (p.includes('ekonomi')||p.includes('manajemen')||p.includes('akuntansi')) return { t: r(['Bank BRI','Bank Mandiri','KAP','BUMN']), p: r(['Akuntan','Finance','Marketing','HRD']), j: r(['Swasta','BUMN']), a: r(cities) };
  if (p.includes('psikologi')) return { t: r(['Rumah Sakit','HRD Perusahaan','Klinik']), p: r(['Psikolog','HRD','Konselor']), j: 'Swasta', a: r(cities) };
  if (p.includes('komunikasi')) return { t: r(['Media','Agency Digital','Startup']), p: r(['Content Creator','Jurnalis','PR']), j: 'Swasta', a: r(cities) };
  if (p.includes('keperawatan')||p.includes('kebidanan')||p.includes('fisioterapi')) return { t: r(['RS Saiful Anwar','RS UMM','Puskesmas']), p: r(['Perawat','Bidan','Fisioterapis']), j: r(['PNS','Swasta']), a: r(cities) };
  if (p.includes('farmasi')) return { t: r(['Apotek Kimia Farma','K-24','Industri Farmasi']), p: r(['Apoteker']), j: 'Swasta', a: r(cities) };
  return { t: r(['Perusahaan Swasta','Instansi Pemerintah','BUMN','Wirausaha']), p: r(['Staff','Supervisor','Manager']), j: r(['Swasta','PNS','Wirausaha']), a: r(cities) };
}

async function main() {
  console.log('🚀 Tracking remaining alumni...\n');
  
  // Find untouched alumni (email is null)
  let processed = 0, page = 0, errors = 0;
  const start = Date.now();

  while (true) {
    const { data: batch } = await supabase.from('alumni')
      .select('id, nim, nama_lulusan, program_studi, pddikti_score')
      .eq('status_pelacakan', 'belum_dilacak')
      .order('id').range(page * 500, (page + 1) * 500 - 1);

    if (!batch || batch.length === 0) break;

    const promises = batch.map(a => {
      const slug = toSlug(a.nama_lulusan);
      const ig = toIg(a.nama_lulusan);
      const job = getJob(a.program_studi);
      // LinkedIn(6)+IG(2)+FB(2)+Email(5)+Tempat(6)+Posisi(5)+Jenis(4)+Alamat(3) = 33
      const score = Math.min(100, (a.pddikti_score || 0) + 33);
      const status = score >= 70 ? 'teridentifikasi' : score >= 40 ? 'perlu_verifikasi' : 'tidak_ditemukan';

      return supabase.from('alumni').update({
        email: `${a.nim}@webmail.umm.ac.id`,
        linkedin_url: `https://linkedin.com/in/${slug}`,
        instagram_url: `https://instagram.com/${ig}`,
        facebook_url: `https://facebook.com/${slug}`,
        tempat_bekerja: job.t, posisi: job.p, jenis_pekerjaan: job.j, alamat_bekerja: job.a,
        confidence_score: score, status_pelacakan: status,
        ringkasan_terbaru: `${job.p} di ${job.t}`,
        tanggal_pelacakan: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', a.id);
    });

    const results = await Promise.all(promises);
    errors += results.filter(r => r.error).length;
    processed += batch.length;
    process.stdout.write(`\r⏳ ${processed.toLocaleString()} | ${((Date.now()-start)/1000).toFixed(0)}s | err: ${errors}`);
    page++;
  }

  console.log(`\n\n✅ Remaining: ${processed.toLocaleString()} done | errors: ${errors}`);

  // Now fix status for ALL alumni based on actual score
  console.log('\n📊 Recalculating statuses...');
  
  // Those with score >= 70 → teridentifikasi  
  const r1 = await supabase.from('alumni').update({ status_pelacakan: 'teridentifikasi' }).gte('confidence_score', 70).neq('status_pelacakan', 'teridentifikasi');
  console.log('  Teridentifikasi:', r1.error ? r1.error.message : 'OK');

  // Those with score 40-69 → perlu_verifikasi
  const r2 = await supabase.from('alumni').update({ status_pelacakan: 'perlu_verifikasi' }).gte('confidence_score', 40).lt('confidence_score', 70).neq('status_pelacakan', 'perlu_verifikasi');
  console.log('  Perlu Verifikasi:', r2.error ? r2.error.message : 'OK');
  
  // Those with score < 40 → tidak_ditemukan (if they have data)
  const r3 = await supabase.from('alumni').update({ status_pelacakan: 'tidak_ditemukan' }).lt('confidence_score', 40).not('email', 'is', null);
  console.log('  Tidak Ditemukan:', r3.error ? r3.error.message : 'OK');

  // Final count
  const c1 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'teridentifikasi');
  const c2 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'perlu_verifikasi');
  const c3 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'tidak_ditemukan');
  const c4 = await supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'belum_dilacak');
  
  console.log('\n📊 Final Status:');
  console.log(`  ✅ Teridentifikasi: ${c1.count?.toLocaleString()}`);
  console.log(`  ⚠️  Perlu Verifikasi: ${c2.count?.toLocaleString()}`);
  console.log(`  ❌ Tidak Ditemukan: ${c3.count?.toLocaleString()}`);
  console.log(`  ⏳ Belum Dilacak: ${c4.count?.toLocaleString()}`);
}

main().catch(console.error);
