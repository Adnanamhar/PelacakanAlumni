import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const maxDuration = 300;

/**
 * Reset all alumni status to 'belum_dilacak' (for fresh start)
 * Only resets alumni that haven't been manually tracked
 */
export async function POST(request: Request) {
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.json({ error: 'Supabase belum dikonfigurasi' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    const { from_status, to_status = 'belum_dilacak', confirm } = body;

    if (!confirm) {
      // Count how many will be affected
      const { count } = await supabase
        .from('alumni')
        .select('*', { count: 'exact', head: true })
        .eq('status_pelacakan', from_status);

      return NextResponse.json({
        preview: true,
        from_status,
        to_status,
        affected_count: count || 0,
        message: `${count || 0} alumni akan diubah dari "${from_status}" ke "${to_status}". Kirim confirm=true untuk melanjutkan.`,
      });
    }

    // Execute the reset in batches
    const BATCH_SIZE = 5000;
    let totalUpdated = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('alumni')
        .update({
          status_pelacakan: to_status,
          confidence_score: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('status_pelacakan', from_status)
        .select('id')
        .limit(BATCH_SIZE);

      if (error) {
        return NextResponse.json({
          error: error.message,
          updated_so_far: totalUpdated,
        }, { status: 500 });
      }

      totalUpdated += data?.length || 0;
      hasMore = (data?.length || 0) === BATCH_SIZE;
    }

    return NextResponse.json({
      success: true,
      total_updated: totalUpdated,
      message: `${totalUpdated} alumni berhasil diubah dari "${from_status}" ke "${to_status}"`,
    });

  } catch (error) {
    console.error('Status reset error:', error);
    return NextResponse.json(
      { error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
