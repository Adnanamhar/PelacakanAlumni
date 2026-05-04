import { NextResponse } from 'next/server';
import { searchAlumni } from '@/lib/serper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, prodi, universitas, tahun_lulus } = body;

    if (!nama) {
      return NextResponse.json({ error: 'Parameter "nama" diperlukan' }, { status: 400 });
    }

    const result = await searchAlumni(
      nama,
      prodi || '',
      universitas || 'Universitas Muhammadiyah Malang',
      tahun_lulus,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: `Error melakukan pencarian: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
