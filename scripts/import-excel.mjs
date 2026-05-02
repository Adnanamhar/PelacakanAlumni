// Script untuk import 142rb data alumni dari Excel ke Supabase
// Jalankan: node scripts/import-excel.mjs

import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';

const supabase = createClient(
  'https://dndsctcjzutymxbxvyop.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZHNjdGNqenV0eW14Ynh2eW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTk0NTksImV4cCI6MjA5MzIzNTQ1OX0.bbGuAIeQr_xpV8s_dG4iu6RgeTxF9GBliy0YWW6l6qE'
);

const EXCEL_PATH = '/Users/macbookpro/Downloads/Alumni 2000-2025.xlsx';
const BATCH_SIZE = 500;

async function main() {
  console.log('📖 Membaca file Excel...');
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  console.log(`✅ Terbaca: ${rows.length.toLocaleString()} baris\n`);

  // Map data
  const mapped = rows.map(row => ({
    nama_lulusan: String(row['Nama Lulusan'] || '').trim(),
    nim: String(row['NIM'] || '').trim(),
    tahun_masuk: parseInt(String(row['Tahun Masuk'])) || 0,
    tanggal_lulus: String(row['Tanggal Lulus'] || '').trim(),
    fakultas: String(row['Fakultas'] || '').trim(),
    program_studi: String(row['Program Studi'] || '').trim(),
    status_pelacakan: 'belum_dilacak',
    confidence_score: 0,
    pddikti_verified: false,
    pddikti_score: 0,
  })).filter(d => d.nama_lulusan && d.nim);

  console.log(`📊 Data valid: ${mapped.length.toLocaleString()} baris\n`);

  const totalBatches = Math.ceil(mapped.length / BATCH_SIZE);
  let inserted = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    const batch = mapped.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const progress = Math.round((i / mapped.length) * 100);

    process.stdout.write(`\r⏳ Batch ${batchNum}/${totalBatches} | ${(i + batch.length).toLocaleString()}/${mapped.length.toLocaleString()} | ${progress}%`);

    const { error } = await supabase.from('alumni').insert(batch);

    if (error) {
      console.log(`\n❌ Batch ${batchNum} error: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ SELESAI!`);
  console.log(`   Inserted: ${inserted.toLocaleString()}`);
  console.log(`   Errors:   ${errors.toLocaleString()}`);
  console.log(`   Waktu:    ${elapsed} detik`);
  console.log(`   Speed:    ${Math.round(inserted / (elapsed / 60)).toLocaleString()} rows/menit`);
}

main().catch(console.error);
