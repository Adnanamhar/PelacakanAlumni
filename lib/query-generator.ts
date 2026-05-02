/**
 * Search Query Generator for Alumni Tracking
 * Generates search queries with links to various platforms
 */

export interface GeneratedQuery {
  query: string;
  sumber: string;
  url: string;
  icon: string;
}

/**
 * Generate name variations for an alumni
 */
export function generateNameVariations(namaLengkap: string): string[] {
  const parts = namaLengkap.trim().split(/\s+/);
  const variations: string[] = [namaLengkap];

  if (parts.length >= 2) {
    // First initial + last name: "M. Rizky"
    variations.push(`${parts[0][0]}. ${parts.slice(1).join(' ')}`);

    // Last name + first initial: "Rizky M."
    variations.push(`${parts.slice(1).join(' ')} ${parts[0][0]}.`);

    // First + last only (skip middle names)
    if (parts.length > 2) {
      variations.push(`${parts[0]} ${parts[parts.length - 1]}`);
    }

    // Without first name
    if (parts.length > 2) {
      variations.push(parts.slice(1).join(' '));
    }
  }

  return [...new Set(variations)];
}

/**
 * Generate search queries for all platforms
 */
export function generateSearchQueries(
  namaLengkap: string,
  prodi: string,
  fakultas: string,
  tahunLulus: string
): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const nameVariations = generateNameVariations(namaLengkap);
  const mainName = namaLengkap;

  // === Google Scholar ===
  queries.push({
    query: `"${mainName}" "Universitas Muhammadiyah Malang"`,
    sumber: 'Google Scholar',
    url: `https://scholar.google.com/scholar?q="${encodeURIComponent(mainName)}"+"Universitas+Muhammadiyah+Malang"`,
    icon: '🎓',
  });

  queries.push({
    query: `"${mainName}" "${prodi}" UMM`,
    sumber: 'Google Scholar',
    url: `https://scholar.google.com/scholar?q="${encodeURIComponent(mainName)}"+"${encodeURIComponent(prodi)}"+UMM`,
    icon: '🎓',
  });

  // === Google Search (General) ===
  queries.push({
    query: `"${mainName}" site:scholar.google.com`,
    sumber: 'Google Search',
    url: `https://www.google.com/search?q="${encodeURIComponent(mainName)}"+site:scholar.google.com`,
    icon: '🔍',
  });

  queries.push({
    query: `"${mainName}" "Universitas Muhammadiyah Malang" ${tahunLulus}`,
    sumber: 'Google Search',
    url: `https://www.google.com/search?q="${encodeURIComponent(mainName)}"+"Universitas+Muhammadiyah+Malang"+${tahunLulus}`,
    icon: '🔍',
  });

  // === LinkedIn ===
  queries.push({
    query: `"${mainName}" UMM`,
    sumber: 'LinkedIn',
    url: `https://www.google.com/search?q="${encodeURIComponent(mainName)}"+UMM+site:linkedin.com`,
    icon: '💼',
  });

  queries.push({
    query: `"${mainName}" "${prodi}" Malang`,
    sumber: 'LinkedIn',
    url: `https://www.google.com/search?q="${encodeURIComponent(mainName)}"+"${encodeURIComponent(prodi)}"+Malang+site:linkedin.com`,
    icon: '💼',
  });

  // === ORCID ===
  queries.push({
    query: `${mainName}`,
    sumber: 'ORCID',
    url: `https://orcid.org/orcid-search/search?searchQuery=${encodeURIComponent(mainName)}`,
    icon: '📗',
  });

  // === ResearchGate ===
  queries.push({
    query: `"${mainName}" UMM`,
    sumber: 'ResearchGate',
    url: `https://www.google.com/search?q="${encodeURIComponent(mainName)}"+UMM+site:researchgate.net`,
    icon: '🔬',
  });

  // === Instagram ===
  queries.push({
    query: `${mainName.replace(/\s+/g, '')}`,
    sumber: 'Instagram',
    url: `https://www.google.com/search?q="${encodeURIComponent(mainName)}"+UMM+site:instagram.com`,
    icon: '📸',
  });

  // === Facebook ===
  queries.push({
    query: `${mainName} UMM Malang`,
    sumber: 'Facebook',
    url: `https://www.facebook.com/search/top?q=${encodeURIComponent(mainName + ' UMM Malang')}`,
    icon: '👤',
  });

  // === GitHub ===
  queries.push({
    query: `${mainName}`,
    sumber: 'GitHub',
    url: `https://github.com/search?q=${encodeURIComponent(mainName)}&type=users`,
    icon: '💻',
  });

  // === Google with name variations ===
  for (const variation of nameVariations.slice(1, 3)) {
    queries.push({
      query: `"${variation}" "${prodi}" UMM ${tahunLulus}`,
      sumber: 'Google Search (variasi nama)',
      url: `https://www.google.com/search?q="${encodeURIComponent(variation)}"+"${encodeURIComponent(prodi)}"+UMM+${tahunLulus}`,
      icon: '🔄',
    });
  }

  return queries;
}
