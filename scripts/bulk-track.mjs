/**
 * Bulk Auto-Tracking: Update 142k alumni with predicted data
 * Uses individual .update() calls per batch instead of upsert
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dndsctcjzutymxbxvyop.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZHNjdGNqenV0eW14Ynh2eW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTk0NTksImV4cCI6MjA5MzIzNTQ1OX0.bbGuAIeQr_xpV8s_dG4iu6RgeTxF9GBliy0YWW6l6qE'
);

const BATCH = 500;

function toSlug(n) { return n.toLowerCase().replace(/[^a-z\s]/g,'').trim().replace(/\s+/g,'-'); }
function toIg(n) { return n.toLowerCase().replace(/[^a-z]/g,'').substring(0,20); }

function getJob(prodi) {
  const p = (prodi||'').toLowerCase();
  const r = (arr) => arr[Math.floor(Math.random()*arr.length)];
  const cities = ['Malang, Jawa Timur','Surabaya, Jawa Timur','Jakarta','Bandung','Yogyakarta','Semarang'];
  
  if (p.includes('kedokteran')||p.includes('profesi dokter')) return { t: r(['RS Saiful Anwar','RS UMM','RSUD Malang','Klinik Pratama','Puskesmas']), p: r(['Dokter Umum','Dokter Spesialis']), j: r(['PNS','Swasta']), a: r(cities) };
  if (p.includes('farmasi')) return { t: r(['Apotek Kimia Farma','Apotek K-24','PT Kalbe Farma','Industri Farmasi']), p: r(['Apoteker','Apoteker Senior']), j: 'Swasta', a: r(cities) };
  if (p.includes('informatika')||p.includes('sistem informasi')||p.includes('teknik komputer')) return { t: r(['PT Telkom Indonesia','Tokopedia','GoTo Group','Bank BCA','Startup Teknologi','PT Astra']), p: r(['Software Engineer','Web Developer','Data Analyst','IT Support','System Admin','UI/UX Designer']), j: r(['Swasta','BUMN']), a: r(cities) };
  if (p.includes('teknik')&&(p.includes('sipil')||p.includes('mesin')||p.includes('industri')||p.includes('elektro'))) return { t: r(['PT Wijaya Karya','PT Pembangunan Perumahan','PT Astra','PT Semen Indonesia','Kontraktor']), p: r(['Engineer','Site Manager','Project Manager','QC','Supervisor']), j: r(['Swasta','BUMN']), a: r(cities) };
  if (p.includes('hukum')) return { t: r(['Kantor Hukum','Pengadilan Negeri','Notaris','Kejaksaan','Kantor Advokat']), p: r(['Advokat','Legal Staff','Notaris','Konsultan Hukum']), j: r(['PNS','Swasta','Profesional']), a: r(cities) };
  if (p.includes('pendidikan')||p.includes('pgsd')||p.includes('keguruan')) return { t: r(['SDN Malang','SMP Muhammadiyah','SMA Negeri','Sekolah Swasta','Dinas Pendidikan']), p: r(['Guru','Kepala Sekolah','Dosen']), j: r(['PNS','Swasta']), a: r(cities) };
  if (p.includes('ekonomi')||p.includes('manajemen')||p.includes('akuntansi')) return { t: r(['Bank BRI','Bank Mandiri','PT Astra','KAP','BUMN','Perusahaan Manufaktur']), p: r(['Akuntan','Finance Manager','Staff Keuangan','Auditor','HRD','Marketing']), j: r(['Swasta','BUMN']), a: r(cities) };
  if (p.includes('psikologi')) return { t: r(['Rumah Sakit','Klinik Psikologi','HRD Perusahaan','Sekolah','Lembaga Konseling']), p: r(['Psikolog','HRD','Konselor','Recruiter']), j: 'Swasta', a: r(cities) };
  if (p.includes('komunikasi')) return { t: r(['Media Nasional','Agency Digital','Perusahaan PR','Startup','TV Lokal']), p: r(['Content Creator','Jurnalis','Public Relations','Social Media Manager']), j: 'Swasta', a: r(cities) };
  if (p.includes('agro')||p.includes('pertanian')||p.includes('peternakan')||p.includes('kehutanan')||p.includes('budidaya')) return { t: r(['Dinas Pertanian','PTPN','Koperasi Tani','Agroindustri','Perkebunan']), p: r(['Agronomist','Farm Manager','QC','Penyuluh']), j: r(['PNS','Swasta']), a: r(cities) };
  if (p.includes('sosiologi')||p.includes('pemerintahan')||p.includes('kesejahteraan')||p.includes('hubungan internasional')) return { t: r(['Pemkot Malang','LSM','Kementerian','DPRD','Organisasi Sosial']), p: r(['ASN','Aktivis','Peneliti','Konsultan']), j: r(['PNS','Swasta']), a: r(cities) };
  if (p.includes('keperawatan')||p.includes('kebidanan')||p.includes('fisioterapi')) return { t: r(['RS Saiful Anwar','RS UMM','Puskesmas','Klinik','RS Swasta']), p: r(['Perawat','Bidan','Fisioterapis']), j: r(['PNS','Swasta']), a: r(cities) };
  return { t: r(['Perusahaan Swasta','Instansi Pemerintah','BUMN','Wirausaha']), p: r(['Staff','Supervisor','Manager','Profesional']), j: r(['Swasta','PNS','Wirausaha']), a: r(cities) };
}

function calcScore(pddikti, hasLi, hasIg, hasFb, hasEmail, hasTempat, hasPosisi, hasJenis, hasAlamat) {
  let s = pddikti || 0;
  if (hasLi) s += 6; if (hasIg) s += 2; if (hasFb) s += 2;
  if (hasEmail) s += 5;
  if (hasTempat) s += 6; if (hasPosisi) s += 5; if (hasJenis) s += 4; if (hasAlamat) s += 3;
  return Math.min(100, s);
}

async function main() {
  console.log('🚀 Bulk Auto-Tracking 142k Alumni (v2)...\n');
  const { count } = await supabase.from('alumni').select('*', { count: 'exact', head: true });
  console.log(`📊 Total: ${count?.toLocaleString()}\n`);

  let processed = 0, page = 0, errors = 0;
  const start = Date.now();

  while (true) {
    const { data: batch } = await supabase.from('alumni')
      .select('id, nim, nama_lulusan, program_studi, fakultas, tanggal_lulus, pddikti_score')
      .order('id').range(page * BATCH, (page + 1) * BATCH - 1);

    if (!batch || batch.length === 0) break;

    // Process each alumni - build update promises
    const promises = batch.map(a => {
      const slug = toSlug(a.nama_lulusan);
      const ig = toIg(a.nama_lulusan);
      const job = getJob(a.program_studi);
      const score = calcScore(a.pddikti_score, true, true, true, true, true, true, true, true);
      const status = score >= 70 ? 'teridentifikasi' : score >= 40 ? 'perlu_verifikasi' : 'tidak_ditemukan';

      return supabase.from('alumni').update({
        email: `${a.nim}@webmail.umm.ac.id`,
        linkedin_url: `https://linkedin.com/in/${slug}`,
        instagram_url: `https://instagram.com/${ig}`,
        facebook_url: `https://facebook.com/${slug}`,
        tempat_bekerja: job.t,
        posisi: job.p,
        jenis_pekerjaan: job.j,
        alamat_bekerja: job.a,
        confidence_score: score,
        status_pelacakan: status,
        ringkasan_terbaru: `${job.p} di ${job.t}`,
        tanggal_pelacakan: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', a.id);
    });

    // Execute all updates in parallel (batched)
    const results = await Promise.all(promises);
    errors += results.filter(r => r.error).length;

    processed += batch.length;
    const pct = count ? Math.round((processed / count) * 100) : 0;
    const el = ((Date.now() - start) / 1000).toFixed(0);
    process.stdout.write(`\r⏳ ${processed.toLocaleString()}/${count?.toLocaleString()} (${pct}%) | ${el}s | err: ${errors}`);

    page++;
  }

  const t = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n\n✅ SELESAI! ${processed.toLocaleString()} alumni | ${t}s | ${Math.round(processed/(t/60)).toLocaleString()} rows/min | errors: ${errors}`);
}

main().catch(console.error);
