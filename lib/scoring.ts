/**
 * Scoring & Disambiguation Logic for Alumni Tracking
 * 
 * Total Score: 100 points
 * - PDDIKTI Verification: 0-60 points
 * - Data Pelacakan: 0-40 points
 *   - Kontak & Sosmed: 0-20 points
 *   - Data Pekerjaan: 0-20 points
 */

export interface PddiktiScoreInput {
  namaAlumni: string;
  nimAlumni: string;
  prodiAlumni: string;
  tahunLulusAlumni: string;
  namaPddikti: string;
  nimPddikti: string;
  prodiPddikti: string;
  ptPddikti: string;
  tahunLulusPddikti: string;
}

export interface AlumniDataInput {
  // Sosmed & Kontak
  linkedin_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  email?: string | null;
  no_hp?: string | null;
  // Pekerjaan
  tempat_bekerja?: string | null;
  alamat_bekerja?: string | null;
  posisi?: string | null;
  jenis_pekerjaan?: string | null;
  sosmed_tempat_bekerja?: string | null;
}

/**
 * Normalize Indonesian name for comparison
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check name similarity (handles abbreviations)
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);

  if (n1 === n2) return 1.0;

  const parts1 = n1.split(' ');
  const parts2 = n2.split(' ');

  const lastName1 = parts1[parts1.length - 1];
  const lastName2 = parts2[parts2.length - 1];

  if (lastName1 !== lastName2) return 0.2;

  let matchCount = 0;
  const maxParts = Math.max(parts1.length, parts2.length);

  for (const p1 of parts1) {
    for (const p2 of parts2) {
      if (p1 === p2) { matchCount++; break; }
      if (p1.length === 1 && p2.startsWith(p1)) { matchCount += 0.5; break; }
      if (p2.length === 1 && p1.startsWith(p2)) { matchCount += 0.5; break; }
    }
  }

  return Math.min(matchCount / maxParts, 1.0);
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

/**
 * Calculate PDDIKTI verification score (0-30 points)
 */
export function calculatePddiktiScore(input: PddiktiScoreInput): {
  total: number;
  breakdown: { criteria: string; score: number; maxScore: number }[];
} {
  const breakdown: { criteria: string; score: number; maxScore: number }[] = [];

  // 1. Name match (0-20)
  const nameSim = calculateNameSimilarity(input.namaAlumni, input.namaPddikti);
  const nameScore = Math.round(nameSim * 20);
  breakdown.push({ criteria: 'Kecocokan Nama', score: nameScore, maxScore: 20 });

  // 2. NIM match (0-20)
  const nimClean1 = input.nimAlumni.replace(/\s/g, '');
  const nimClean2 = input.nimPddikti.replace(/\s/g, '');
  const nimScore = nimClean1 === nimClean2 ? 20 : 0;
  breakdown.push({ criteria: 'Kecocokan NIM', score: nimScore, maxScore: 20 });

  // 3. Prodi + University match (0-10)
  const ummKeywords = ['universitas muhammadiyah malang', 'umm'];
  const prodiMatch = input.prodiAlumni.toLowerCase().includes(input.prodiPddikti.toLowerCase()) ||
    input.prodiPddikti.toLowerCase().includes(input.prodiAlumni.toLowerCase());
  const ptMatch = containsAny(input.ptPddikti, ummKeywords);
  const prodiPtScore = (prodiMatch ? 5 : 0) + (ptMatch ? 5 : 0);
  breakdown.push({ criteria: 'Kecocokan Prodi & PT', score: prodiPtScore, maxScore: 10 });

  // 4. Graduation year match (0-10)
  const yearMatch = input.tahunLulusAlumni && input.tahunLulusPddikti &&
    input.tahunLulusAlumni.substring(0, 4) === input.tahunLulusPddikti.substring(0, 4);
  const yearScore = yearMatch ? 10 : 0;
  breakdown.push({ criteria: 'Kecocokan Tahun Lulus', score: yearScore, maxScore: 10 });

  const total = breakdown.reduce((sum, b) => sum + b.score, 0);

  return { total, breakdown };
}

/**
 * Calculate data completeness score (0-40 points)
 * Based on how many contact/employment fields are filled
 */
export function calculateDataScore(input: AlumniDataInput): {
  total: number;
  breakdown: { criteria: string; score: number; maxScore: number }[];
} {
  const breakdown: { criteria: string; score: number; maxScore: number }[] = [];

  // === KONTAK & SOSMED (0-20) ===

  // LinkedIn (0-6)
  const linkedinScore = input.linkedin_url ? 6 : 0;
  breakdown.push({ criteria: 'LinkedIn', score: linkedinScore, maxScore: 6 });

  // Sosmed lain: IG, FB, TikTok (max 5)
  let sosmedScore = 0;
  if (input.instagram_url) sosmedScore += 2;
  if (input.facebook_url) sosmedScore += 2;
  if (input.tiktok_url) sosmedScore += 1;
  breakdown.push({ criteria: 'Sosial Media (IG/FB/TikTok)', score: sosmedScore, maxScore: 5 });

  // Email (0-5)
  const emailScore = input.email ? 5 : 0;
  breakdown.push({ criteria: 'Email', score: emailScore, maxScore: 5 });

  // No HP (0-4)
  const hpScore = input.no_hp ? 4 : 0;
  breakdown.push({ criteria: 'No. HP', score: hpScore, maxScore: 4 });

  // === DATA PEKERJAAN (0-20) ===

  // Tempat Bekerja (0-6)
  const tempatScore = input.tempat_bekerja ? 6 : 0;
  breakdown.push({ criteria: 'Tempat Bekerja', score: tempatScore, maxScore: 6 });

  // Posisi (0-5)
  const posisiScore = input.posisi ? 5 : 0;
  breakdown.push({ criteria: 'Posisi/Jabatan', score: posisiScore, maxScore: 5 });

  // Jenis Pekerjaan (0-4)
  const jenisScore = input.jenis_pekerjaan ? 4 : 0;
  breakdown.push({ criteria: 'Jenis Pekerjaan', score: jenisScore, maxScore: 4 });

  // Alamat Bekerja (0-3)
  const alamatScore = input.alamat_bekerja ? 3 : 0;
  breakdown.push({ criteria: 'Alamat Bekerja', score: alamatScore, maxScore: 3 });

  // Sosmed Tempat Bekerja (0-2)
  const sosmedKerjaScore = input.sosmed_tempat_bekerja ? 2 : 0;
  breakdown.push({ criteria: 'Sosmed Tempat Bekerja', score: sosmedKerjaScore, maxScore: 2 });

  const total = breakdown.reduce((sum, b) => sum + b.score, 0);

  return { total, breakdown };
}

/**
 * Calculate total confidence score from PDDIKTI + Data
 */
export function calculateTotalScore(pddiktiScore: number, dataInput: AlumniDataInput): {
  total: number;
  pddiktiScore: number;
  dataScore: number;
  breakdown: { criteria: string; score: number; maxScore: number }[];
} {
  const data = calculateDataScore(dataInput);
  const total = Math.min(100, pddiktiScore + data.total);

  return {
    total,
    pddiktiScore,
    dataScore: data.total,
    breakdown: data.breakdown,
  };
}

/**
 * Classify alumni status based on total score
 */
export function classifyStatus(totalScore: number): {
  status: 'teridentifikasi' | 'perlu_verifikasi' | 'tidak_ditemukan';
  label: string;
  color: string;
} {
  if (totalScore >= 70) {
    return { status: 'teridentifikasi', label: 'Teridentifikasi', color: '#10b981' };
  } else if (totalScore >= 30) {
    return { status: 'perlu_verifikasi', label: 'Perlu Verifikasi Manual', color: '#f59e0b' };
  } else {
    return { status: 'tidak_ditemukan', label: 'Tidak Ditemukan', color: '#ef4444' };
  }
}

export function getConfidenceLevel(score: number): 'tinggi' | 'sedang' | 'rendah' {
  if (score >= 50) return 'tinggi';
  if (score >= 25) return 'sedang';
  return 'rendah';
}

export function getTrackingStatus(score: number): 'kemungkinan_kuat' | 'perlu_verifikasi' | 'tidak_cocok' {
  if (score >= 50) return 'kemungkinan_kuat';
  if (score >= 25) return 'perlu_verifikasi';
  return 'tidak_cocok';
}

// Keep backward compatibility
export function calculateTrackingScore(input: {
  namaAlumni: string; prodiAlumni: string; tahunLulusAlumni: number;
  fakultasAlumni: string; namaDitemukan: string; afiliasi: string;
  jabatan: string; lokasi: string; bidangTopik: string;
  tahunAktivitas: string; linkProfil: string; jumlahSumberCocok: number;
}): { total: number; breakdown: { criteria: string; score: number; maxScore: number }[] } {
  // Map old format to new data score
  return calculateDataScore({
    linkedin_url: input.linkProfil || null,
    tempat_bekerja: input.afiliasi || null,
    posisi: input.jabatan || null,
    alamat_bekerja: input.lokasi || null,
  });
}
