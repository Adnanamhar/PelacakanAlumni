import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const maxDuration = 300; // 5 minutes max for Vercel

export async function POST(request: Request) {
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.json({ error: 'Supabase belum dikonfigurasi. Update .env.local' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    const { rows } = body as { rows: Record<string, string>[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Data kosong' }, { status: 400 });
    }

    // Map the data
    const mappedData = rows.map(row => {
      const keys = Object.keys(row);
      const findCol = (patterns: string[]) => {
        const key = keys.find(k => patterns.some(p => k.toLowerCase().replace(/[_\s]/g, '').includes(p.toLowerCase().replace(/[_\s]/g, ''))));
        return key ? String(row[key]).trim() : '';
      };

      return {
        nama_lulusan: findCol(['namalulusan', 'nama', 'name', 'mahasiswa']),
        nim: findCol(['nim', 'nomor', 'nomorinduk']),
        tahun_masuk: parseInt(findCol(['tahunmasuk', 'masuk', 'angkatan', 'entry'])) || 0,
        tanggal_lulus: findCol(['tanggallulus', 'lulus', 'graduate', 'tgllulus']),
        fakultas: findCol(['fakultas', 'faculty']),
        program_studi: findCol(['programstudi', 'prodi', 'program', 'jurusan']),
        status_pelacakan: 'belum_dilacak',
        confidence_score: 0,
        pddikti_verified: false,
        pddikti_data: null,
        pddikti_score: 0,
        ringkasan_terbaru: null,
        tanggal_pelacakan: null,
      };
    }).filter(d => d.nama_lulusan && d.nim);

    if (mappedData.length === 0) {
      return NextResponse.json({ 
        error: 'Tidak ada data valid. Pastikan kolom "Nama Lulusan" dan "NIM" ada di Excel.' 
      }, { status: 400 });
    }

    // Batch insert - 500 rows per batch
    const BATCH_SIZE = 500;
    let inserted = 0;
    let errors = 0;
    const totalBatches = Math.ceil(mappedData.length / BATCH_SIZE);

    for (let i = 0; i < mappedData.length; i += BATCH_SIZE) {
      const batch = mappedData.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('alumni').insert(batch);
      
      if (error) {
        console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches} error:`, error.message);
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      total: mappedData.length,
      inserted,
      errors,
      batches: totalBatches,
      skipped: rows.length - mappedData.length,
      message: `Berhasil import ${inserted} dari ${rows.length} data alumni (${errors} error, ${rows.length - mappedData.length} dilewati karena tidak valid).`,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Server error saat import' }, { status: 500 });
  }
}
