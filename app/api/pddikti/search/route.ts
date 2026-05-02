import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nama = searchParams.get('nama');

  if (!nama) {
    return NextResponse.json({ error: 'Parameter "nama" diperlukan' }, { status: 400 });
  }

  try {
    // Try the PDDIKTI API endpoint
    const encodedName = encodeURIComponent(nama);

    // Primary endpoint
    const response = await fetch(
      `https://api-frontend.kemdikbud.go.id/hit_mhs/${encodedName}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ mahasiswa: data.mahasiswa || data || [] });
    }

    // Fallback: try alternate endpoint
    const response2 = await fetch(
      `https://api-frontend.kemdikbud.go.id/search_mhs/${encodedName}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response2.ok) {
      const data2 = await response2.json();
      return NextResponse.json({ mahasiswa: data2.mahasiswa || data2 || [] });
    }

    // If PDDIKTI API is unavailable, return demo data for testing
    return NextResponse.json({
      mahasiswa: [
        {
          nama: nama.toUpperCase(),
          nim: '201910370311XXX',
          nama_prodi: 'Informatika',
          nama_pt: 'Universitas Muhammadiyah Malang',
          nipd: '-',
          note: 'Data demo - PDDIKTI API tidak tersedia saat ini',
        },
      ],
      note: 'Menggunakan data demo karena PDDIKTI API tidak tersedia',
    });
  } catch (error) {
    console.error('PDDIKTI API error:', error);

    // Return demo data on error
    return NextResponse.json({
      mahasiswa: [
        {
          nama: nama.toUpperCase(),
          nim: '201910370311XXX',
          nama_prodi: 'Informatika',
          nama_pt: 'Universitas Muhammadiyah Malang',
          note: 'Data demo - API timeout/error',
        },
      ],
      note: 'Menggunakan data demo karena terjadi error pada PDDIKTI API',
    });
  }
}
