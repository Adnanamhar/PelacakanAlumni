/**
 * Serper.dev Google Search API Wrapper
 * For Alumni Tracking - searches Google, LinkedIn, Scholar
 */

const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

export interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface SerperResponse {
  organic: SerperSearchResult[];
  knowledgeGraph?: {
    title?: string;
    type?: string;
    description?: string;
    attributes?: Record<string, string>;
  };
  searchParameters?: {
    q: string;
    gl: string;
    hl: string;
  };
}

export interface AlumniSearchResult {
  sumber: string;
  nama_ditemukan: string;
  link: string;
  snippet: string;
  confidence: 'tinggi' | 'sedang' | 'rendah';
  extracted_data: {
    linkedin_url?: string;
    instagram_url?: string;
    facebook_url?: string;
    email?: string;
    tempat_bekerja?: string;
    posisi?: string;
    lokasi?: string;
  };
}

export interface AlumniSearchSummary {
  nama_alumni: string;
  total_results: number;
  results: AlumniSearchResult[];
  suggested_status: 'teridentifikasi' | 'perlu_verifikasi' | 'tidak_ditemukan';
  suggested_score: number;
  extracted: {
    linkedin_url?: string;
    instagram_url?: string;
    facebook_url?: string;
    email?: string;
    tempat_bekerja?: string;
    posisi?: string;
    lokasi?: string;
  };
  queries_used: number;
}

/**
 * Call Serper.dev search API
 */
async function serperSearch(query: string, num: number = 10): Promise<SerperResponse> {
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY tidak dikonfigurasi');
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      gl: 'id',
      hl: 'id',
      num,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Serper API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Extract LinkedIn URL from search results
 */
function extractLinkedIn(results: SerperSearchResult[]): string | undefined {
  for (const r of results) {
    const match = r.link.match(/linkedin\.com\/in\/[\w-]+/i);
    if (match) return `https://www.${match[0]}`;
  }
  return undefined;
}

/**
 * Extract Instagram URL from search results
 */
function extractInstagram(results: SerperSearchResult[]): string | undefined {
  for (const r of results) {
    const match = r.link.match(/instagram\.com\/[\w.]+/i);
    if (match) return `https://www.${match[0]}`;
  }
  return undefined;
}

/**
 * Extract Facebook URL from search results
 */
function extractFacebook(results: SerperSearchResult[]): string | undefined {
  for (const r of results) {
    const match = r.link.match(/facebook\.com\/[\w.]+/i);
    if (match) return `https://www.${match[0]}`;
  }
  return undefined;
}

/**
 * Extract email from snippets
 */
function extractEmail(results: SerperSearchResult[]): string | undefined {
  for (const r of results) {
    const match = (r.snippet + ' ' + r.title).match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    if (match) return match[0];
  }
  return undefined;
}

/**
 * Extract workplace from LinkedIn snippet
 */
function extractWorkplace(results: SerperSearchResult[]): { tempat_bekerja?: string; posisi?: string; lokasi?: string } {
  const data: { tempat_bekerja?: string; posisi?: string; lokasi?: string } = {};

  for (const r of results) {
    // LinkedIn format: "Name - Title - Company | LinkedIn"
    if (r.link.includes('linkedin.com')) {
      const titleParts = r.title.replace(/\s*[\|–—-]\s*LinkedIn.*$/i, '').split(/\s*[\|–—-]\s*/);
      if (titleParts.length >= 3) {
        data.posisi = titleParts[1].trim();
        data.tempat_bekerja = titleParts[2].trim();
      } else if (titleParts.length === 2) {
        data.posisi = titleParts[1].trim();
      }

      // Extract location from snippet
      const locMatch = r.snippet.match(/(?:lokasi|location|di|based in|from)\s*[:\s]*([^.·,]+)/i);
      if (locMatch) data.lokasi = locMatch[1].trim();

      // Also try "Company · Location" pattern in snippet
      const snippetParts = r.snippet.split('·').map(s => s.trim());
      if (snippetParts.length >= 2 && !data.tempat_bekerja) {
        // Check if first part looks like a company
        if (snippetParts[0].length > 2 && snippetParts[0].length < 60) {
          data.tempat_bekerja = snippetParts[0];
        }
      }

      break; // LinkedIn data is highest priority
    }
  }

  // Fallback: look for company-related keywords in other results
  if (!data.tempat_bekerja) {
    for (const r of results) {
      const snippetLower = r.snippet.toLowerCase();
      if (snippetLower.includes('bekerja di') || snippetLower.includes('works at') || snippetLower.includes('employed at')) {
        const match = r.snippet.match(/(?:bekerja di|works at|employed at)\s+([^.,;]+)/i);
        if (match) {
          data.tempat_bekerja = match[1].trim();
          break;
        }
      }
    }
  }

  return data;
}

/**
 * Check if a search result is relevant to the alumni
 */
function isRelevantResult(result: SerperSearchResult, namaAlumni: string): boolean {
  const nameParts = namaAlumni.toLowerCase().split(/\s+/);
  const textToCheck = (result.title + ' ' + result.snippet).toLowerCase();

  // At least first name or last name should match
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  return textToCheck.includes(firstName) || textToCheck.includes(lastName);
}

/**
 * Calculate confidence for a single result
 */
function calculateResultConfidence(
  result: SerperSearchResult,
  namaAlumni: string,
  prodi: string
): 'tinggi' | 'sedang' | 'rendah' {
  const textToCheck = (result.title + ' ' + result.snippet).toLowerCase();
  const namaLower = namaAlumni.toLowerCase();
  const nameParts = namaLower.split(/\s+/);

  let score = 0;

  // Full name match
  if (textToCheck.includes(namaLower)) score += 3;
  // Partial name match
  else if (nameParts.filter(p => textToCheck.includes(p)).length >= 2) score += 2;

  // University match
  if (textToCheck.includes('muhammadiyah malang') || textToCheck.includes('umm')) score += 2;

  // Prodi match
  if (prodi && textToCheck.includes(prodi.toLowerCase().split(' ')[0])) score += 1;

  // LinkedIn is high quality source
  if (result.link.includes('linkedin.com/in/')) score += 1;

  if (score >= 5) return 'tinggi';
  if (score >= 3) return 'sedang';
  return 'rendah';
}

/**
 * Determine source label from URL
 */
function getSourceLabel(url: string): string {
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('scholar.google')) return 'Google Scholar';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('researchgate.net')) return 'ResearchGate';
  if (url.includes('github.com')) return 'GitHub';
  if (url.includes('orcid.org')) return 'ORCID';
  if (url.includes('tiktok.com')) return 'TikTok';
  return 'Google';
}

/**
 * Main function: Search for a single alumni across multiple sources
 * Uses 1 smart query to maximize free tier (2,500 queries)
 */
export async function searchAlumni(
  namaAlumni: string,
  prodi: string,
  universitas: string = 'Universitas Muhammadiyah Malang',
  tahunLulus?: string,
): Promise<AlumniSearchSummary> {
  const queriesUsed = 1;

  // Single smart query combining name + university + LinkedIn
  const query = `"${namaAlumni}" "${universitas}" OR UMM ${prodi} ${tahunLulus || ''} site:linkedin.com OR site:instagram.com OR site:facebook.com OR site:scholar.google.com`.trim();

  let allResults: SerperSearchResult[] = [];

  try {
    const response = await serperSearch(query, 10);
    allResults = response.organic || [];
  } catch (error) {
    console.error('Serper search error:', error);
    return {
      nama_alumni: namaAlumni,
      total_results: 0,
      results: [],
      suggested_status: 'tidak_ditemukan',
      suggested_score: 0,
      extracted: {},
      queries_used: queriesUsed,
    };
  }

  // If first query yields nothing, try a simpler query
  if (allResults.length === 0) {
    try {
      const simpleResponse = await serperSearch(`"${namaAlumni}" UMM Malang`, 10);
      allResults = simpleResponse.organic || [];
    } catch {
      // ignore
    }
  }

  // Filter relevant results
  const relevantResults = allResults.filter(r => isRelevantResult(r, namaAlumni));

  // Build alumni search results
  const results: AlumniSearchResult[] = relevantResults.map(r => ({
    sumber: getSourceLabel(r.link),
    nama_ditemukan: r.title.split(/\s*[-|–—]\s*/)[0].trim(),
    link: r.link,
    snippet: r.snippet,
    confidence: calculateResultConfidence(r, namaAlumni, prodi),
    extracted_data: {},
  }));

  // Extract data from all results
  const linkedin_url = extractLinkedIn(relevantResults);
  const instagram_url = extractInstagram(relevantResults);
  const facebook_url = extractFacebook(relevantResults);
  const email = extractEmail(relevantResults);
  const workplace = extractWorkplace(relevantResults);

  const extracted = {
    linkedin_url,
    instagram_url,
    facebook_url,
    email,
    ...workplace,
  };

  // Calculate suggested score
  let suggestedScore = 0;
  if (linkedin_url) suggestedScore += 6;
  if (instagram_url) suggestedScore += 2;
  if (facebook_url) suggestedScore += 2;
  if (email) suggestedScore += 5;
  if (workplace.tempat_bekerja) suggestedScore += 6;
  if (workplace.posisi) suggestedScore += 5;
  if (workplace.lokasi) suggestedScore += 3;

  // Determine suggested status
  let suggested_status: 'teridentifikasi' | 'perlu_verifikasi' | 'tidak_ditemukan';
  const highConfResults = results.filter(r => r.confidence === 'tinggi');

  if (highConfResults.length >= 2 || (highConfResults.length >= 1 && suggestedScore >= 10)) {
    suggested_status = 'teridentifikasi';
  } else if (results.length > 0) {
    suggested_status = 'perlu_verifikasi';
  } else {
    suggested_status = 'tidak_ditemukan';
  }

  return {
    nama_alumni: namaAlumni,
    total_results: results.length,
    results,
    suggested_status,
    suggested_score: suggestedScore,
    extracted,
    queries_used: queriesUsed,
  };
}
