import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchAlumni } from '@/lib/serper';
import { calculateDataScore, classifyStatus } from '@/lib/scoring';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const maxDuration = 300; // 5 minutes max for Vercel

/**
 * Bulk search API: searches for multiple alumni using Serper.dev
 * Limited to 2,500 alumni per session (free tier limit)
 */
export async function POST(request: Request) {
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.json({ error: 'Supabase belum dikonfigurasi' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    const { limit = 50, offset = 0, filter_status = 'belum_dilacak' } = body;

    // Cap at 50 per batch to stay within Vercel timeout
    const batchSize = Math.min(limit, 50);

    // Fetch alumni to search
    const { data: alumniList, error: fetchError } = await supabase
      .from('alumni')
      .select('id, nama_lulusan, program_studi, fakultas, tanggal_lulus, pddikti_score, confidence_score, status_pelacakan')
      .eq('status_pelacakan', filter_status)
      .order('nama_lulusan')
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!alumniList || alumniList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada alumni yang perlu dilacak',
        processed: 0,
        total_queries: 0,
      });
    }

    let processed = 0;
    let identified = 0;
    let needsVerification = 0;
    let notFound = 0;
    let totalQueries = 0;
    const errors: string[] = [];

    for (const alm of alumniList) {
      try {
        // Search using Serper
        const searchResult = await searchAlumni(
          alm.nama_lulusan,
          alm.program_studi || '',
          'Universitas Muhammadiyah Malang',
          alm.tanggal_lulus ? new Date(alm.tanggal_lulus).getFullYear().toString() : undefined,
        );

        totalQueries += searchResult.queries_used;

        // Calculate new score including extracted data
        const dataInput = {
          linkedin_url: searchResult.extracted.linkedin_url || null,
          instagram_url: searchResult.extracted.instagram_url || null,
          facebook_url: searchResult.extracted.facebook_url || null,
          email: searchResult.extracted.email || null,
          tempat_bekerja: searchResult.extracted.tempat_bekerja || null,
          posisi: searchResult.extracted.posisi || null,
          alamat_bekerja: searchResult.extracted.lokasi || null,
        };

        const dataScore = calculateDataScore(dataInput);
        const totalScore = Math.min(100, (alm.pddikti_score || 0) + dataScore.total);
        const newStatus = classifyStatus(totalScore);

        // Update alumni record
        const updateData: Record<string, unknown> = {
          status_pelacakan: newStatus.status,
          confidence_score: totalScore,
          tanggal_pelacakan: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ringkasan_terbaru: searchResult.results.length > 0
            ? `Ditemukan ${searchResult.results.length} hasil pencarian`
            : 'Tidak ditemukan hasil pencarian',
        };

        // Only update contact/work fields if we found data
        if (searchResult.extracted.linkedin_url) updateData.linkedin_url = searchResult.extracted.linkedin_url;
        if (searchResult.extracted.instagram_url) updateData.instagram_url = searchResult.extracted.instagram_url;
        if (searchResult.extracted.facebook_url) updateData.facebook_url = searchResult.extracted.facebook_url;
        if (searchResult.extracted.email) updateData.email = searchResult.extracted.email;
        if (searchResult.extracted.tempat_bekerja) updateData.tempat_bekerja = searchResult.extracted.tempat_bekerja;
        if (searchResult.extracted.posisi) updateData.posisi = searchResult.extracted.posisi;
        if (searchResult.extracted.lokasi) updateData.alamat_bekerja = searchResult.extracted.lokasi;

        await supabase.from('alumni').update(updateData).eq('id', alm.id);

        // Log to tracking history
        await supabase.from('tracking_history').insert({
          alumni_id: alm.id,
          action: 'Pencarian otomatis (Serper.dev)',
          old_status: alm.status_pelacakan,
          new_status: newStatus.status,
          detail: {
            search_results: searchResult.total_results,
            queries_used: searchResult.queries_used,
            data_score: dataScore.total,
            total_score: totalScore,
            extracted: searchResult.extracted,
          },
        });

        // Track counts
        if (newStatus.status === 'teridentifikasi') identified++;
        else if (newStatus.status === 'perlu_verifikasi') needsVerification++;
        else notFound++;

        processed++;

        // Small delay to avoid rate limiting (100ms between searches)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        errors.push(`${alm.nama_lulusan}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total_queries: totalQueries,
      identified,
      needs_verification: needsVerification,
      not_found: notFound,
      errors: errors.length,
      error_details: errors.slice(0, 10),
      has_more: alumniList.length === batchSize,
      next_offset: offset + batchSize,
    });

  } catch (error) {
    console.error('Bulk search error:', error);
    return NextResponse.json(
      { error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
