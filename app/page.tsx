'use client';

import { useState, useEffect, useCallback } from 'react';
import ClientLayout from '@/components/ClientLayout';
import Header from '@/components/Header';
import { supabase, Alumni, TrackingHistory } from '@/lib/supabase';

export default function HomePage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [history, setHistory] = useState<TrackingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const [stats, setStats] = useState({
    total: 0, teridentifikasi: 0, perluVerifikasi: 0, tidakDitemukan: 0, belumDilacak: 0,
  });
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Bulk search state
  const [bulkSearching, setBulkSearching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ processed: 0, total: 0, identified: 0, needsVerification: 0, notFound: 0 });
  const [bulkMessage, setBulkMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch counts (not all data!)
      const [totalRes, identifiedRes, verifyRes, notFoundRes, notTrackedRes] = await Promise.all([
        supabase.from('alumni').select('*', { count: 'exact', head: true }),
        supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'teridentifikasi'),
        supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'perlu_verifikasi'),
        supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'tidak_ditemukan'),
        supabase.from('alumni').select('*', { count: 'exact', head: true }).eq('status_pelacakan', 'belum_dilacak'),
      ]);

      setStats({
        total: totalRes.count || 0,
        teridentifikasi: identifiedRes.count || 0,
        perluVerifikasi: verifyRes.count || 0,
        tidakDitemukan: notFoundRes.count || 0,
        belumDilacak: notTrackedRes.count || 0,
      });

      // Fetch paginated data
      let query = supabase.from('alumni').select('*', { count: 'exact' })
        .order('updated_at', { ascending: false });

      if (activeTab !== 'semua') {
        query = query.eq('status_pelacakan', activeTab);
      }
      if (searchQuery) {
        query = query.or(`nama_lulusan.ilike.%${searchQuery}%,nim.ilike.%${searchQuery}%`);
      }

      const { data: alumniData, count } = await query.range((currentPage - 1) * perPage, currentPage * perPage - 1);
      if (alumniData) setAlumni(alumniData);
      setTotalFiltered(count || 0);

      // Fetch recent history
      const { data: historyData } = await supabase
        .from('tracking_history')
        .select('*, alumni(nama_lulusan, nim)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (historyData) setHistory(historyData);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }, [activeTab, searchQuery, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(totalFiltered / perPage);
  const paginatedAlumni = alumni; // already paginated from server

  // Handle bulk search (2,500 alumni max)
  const handleBulkSearch = async () => {
    if (!confirm('Mulai pelacakan otomatis untuk alumni berstatus "Belum Dilacak"?\n\nLimit: 2.500 alumni (free tier Serper.dev)\nEstimasi waktu: ~5-15 menit')) return;

    setBulkSearching(true);
    setBulkMessage('');
    setBulkProgress({ processed: 0, total: Math.min(stats.belumDilacak, 2500), identified: 0, needsVerification: 0, notFound: 0 });

    let offset = 0;
    let totalProcessed = 0;
    let totalIdentified = 0;
    let totalNeedsVerification = 0;
    let totalNotFound = 0;
    const maxTotal = 2500;

    try {
      while (totalProcessed < maxTotal) {
        const batchSize = Math.min(50, maxTotal - totalProcessed);

        setBulkMessage(`⏳ Mencari batch ${Math.floor(offset / 50) + 1}... (${totalProcessed}/${maxTotal} alumni)`);

        const res = await fetch('/api/search/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: batchSize, offset, filter_status: 'belum_dilacak' }),
        });

        const result = await res.json();

        if (result.error) {
          setBulkMessage(`❌ Error: ${result.error}`);
          break;
        }

        totalProcessed += result.processed;
        totalIdentified += result.identified || 0;
        totalNeedsVerification += result.needs_verification || 0;
        totalNotFound += result.not_found || 0;

        setBulkProgress({
          processed: totalProcessed,
          total: Math.min(stats.belumDilacak, maxTotal),
          identified: totalIdentified,
          needsVerification: totalNeedsVerification,
          notFound: totalNotFound,
        });

        if (!result.has_more || result.processed === 0) break;
        offset = result.next_offset;
      }

      setBulkMessage(`✅ Selesai! ${totalProcessed} alumni berhasil dilacak. Teridentifikasi: ${totalIdentified}, Perlu Verifikasi: ${totalNeedsVerification}, Tidak Ditemukan: ${totalNotFound}`);
      fetchData(); // Refresh stats
    } catch (err) {
      console.error(err);
      setBulkMessage(`❌ Error koneksi. ${totalProcessed} alumni sudah diproses sebelum error.`);
    }

    setBulkSearching(false);
  };

  // Handle status reset
  const handleResetStatus = async () => {
    if (stats.perluVerifikasi === 0) {
      alert('Tidak ada data dengan status "Perlu Verifikasi" untuk direset.');
      return;
    }
    if (!confirm(`Reset ${stats.perluVerifikasi.toLocaleString()} alumni dari "Perlu Verifikasi" ke "Belum Dilacak"?\n\nIni akan mereset status agar bisa dilacak ulang menggunakan API.`)) return;

    setBulkMessage('⏳ Mereset status...');
    try {
      const res = await fetch('/api/alumni/reset-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_status: 'perlu_verifikasi', to_status: 'belum_dilacak', confirm: true }),
      });
      const result = await res.json();
      if (result.success) {
        setBulkMessage(`✅ ${result.total_updated.toLocaleString()} alumni berhasil direset ke "Belum Dilacak"`);
        fetchData();
      } else {
        setBulkMessage(`❌ Error: ${result.error}`);
      }
    } catch {
      setBulkMessage('❌ Error koneksi');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'teridentifikasi': return <span className="badge badge-success">✓ Teridentifikasi</span>;
      case 'perlu_verifikasi': return <span className="badge badge-warning">⚠ Perlu Verifikasi</span>;
      case 'tidak_ditemukan': return <span className="badge badge-danger">✗ Tidak Ditemukan</span>;
      default: return <span className="badge badge-secondary">○ Belum Dilacak</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'green';
    if (score >= 40) return 'yellow';
    return 'red';
  };

  return (
    <ClientLayout>
      <Header title="Dashboard" subtitle="Ringkasan pelacakan alumni UMM" />
      <div className="page-content">
        {/* Stats Cards - 5 cards balanced */}
        <div className="stats-grid-5">
          <div className="stat-card blue">
            <div className="stat-card-header">
              <div className="stat-card-icon" style={{ background: '#EFF6FF' }}>📊</div>
            </div>
            <div className="stat-card-value">{stats.total.toLocaleString()}</div>
            <div className="stat-card-label">Total Alumni</div>
          </div>
          <div className="stat-card green">
            <div className="stat-card-header">
              <div className="stat-card-icon">✓</div>
            </div>
            <div className="stat-card-value">{stats.teridentifikasi.toLocaleString()}</div>
            <div className="stat-card-label">Teridentifikasi</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-card-header">
              <div className="stat-card-icon">⚠</div>
            </div>
            <div className="stat-card-value">{stats.perluVerifikasi.toLocaleString()}</div>
            <div className="stat-card-label">Perlu Verifikasi</div>
          </div>
          <div className="stat-card red">
            <div className="stat-card-header">
              <div className="stat-card-icon">✗</div>
            </div>
            <div className="stat-card-value">{stats.tidakDitemukan.toLocaleString()}</div>
            <div className="stat-card-label">Tidak Ditemukan</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="stat-card-icon">◷</div>
            </div>
            <div className="stat-card-value">{stats.belumDilacak.toLocaleString()}</div>
            <div className="stat-card-label">Belum Dilacak</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-header">
            <h3>🚀 Pelacakan Otomatis</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {stats.perluVerifikasi > 0 && stats.belumDilacak === 0 && (
                <button className="btn btn-warning" onClick={handleResetStatus} disabled={bulkSearching}>
                  🔄 Reset Status ({stats.perluVerifikasi.toLocaleString()})
                </button>
              )}
              <button className="btn btn-primary" onClick={handleBulkSearch} disabled={bulkSearching || stats.belumDilacak === 0}>
                {bulkSearching ? <><span className="spinner" /> Mencari...</> : `🔍 Mulai Pelacakan (${Math.min(stats.belumDilacak, 2500).toLocaleString()} alumni)`}
              </button>
            </div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Pelacakan otomatis menggunakan <strong>Serper.dev Google Search API</strong> untuk mencari informasi alumni di LinkedIn, Google Scholar, Instagram, dan lainnya.
              <br />
              <span style={{ color: '#F59E0B' }}>⚠ Limit: 2.500 alumni per sesi (free tier).</span> Dalam penerapan aslinya, limit ini bisa dihilangkan dengan upgrade API key.
            </p>

            {/* Bulk Progress */}
            {(bulkSearching || bulkProgress.processed > 0) && (
              <div style={{ marginBottom: 16 }}>
                <div className="score-bar-label">
                  <span>Progress Pelacakan</span>
                  <span>{bulkProgress.processed}/{bulkProgress.total}</span>
                </div>
                <div className="score-bar" style={{ height: 12, marginBottom: 12 }}>
                  <div className="score-bar-fill blue" style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.processed / bulkProgress.total) * 100 : 0}%`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748B' }}>
                  <span>✓ Teridentifikasi: <strong style={{ color: '#10B981' }}>{bulkProgress.identified}</strong></span>
                  <span>⚠ Perlu Verifikasi: <strong style={{ color: '#F59E0B' }}>{bulkProgress.needsVerification}</strong></span>
                  <span>✗ Tidak Ditemukan: <strong style={{ color: '#EF4444' }}>{bulkProgress.notFound}</strong></span>
                </div>
              </div>
            )}

            {bulkMessage && (
              <div style={{
                padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: bulkMessage.includes('❌') ? '#FEE2E2' :
                  bulkMessage.includes('⏳') ? '#EFF6FF' : '#D1FAE5',
              }}>
                {bulkMessage}
              </div>
            )}
          </div>
        </div>

        {/* Alumni Table */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-header">
            <h3>Data Alumni</h3>
            <div className="header-search">
              <span>🔍</span>
              <input
                placeholder="Cari nama atau NIM..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div className="tabs" style={{ padding: '0 24px' }}>
            {[
              { key: 'semua', label: `Semua (${stats.total.toLocaleString()})` },
              { key: 'teridentifikasi', label: `Teridentifikasi (${stats.teridentifikasi.toLocaleString()})` },
              { key: 'perlu_verifikasi', label: `Perlu Verifikasi (${stats.perluVerifikasi.toLocaleString()})` },
              { key: 'tidak_ditemukan', label: `Tidak Ditemukan (${stats.tidakDitemukan.toLocaleString()})` },
              { key: 'belum_dilacak', label: `Belum Dilacak (${stats.belumDilacak.toLocaleString()})` },
            ].map(tab => (
              <button
                key={tab.key}
                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : paginatedAlumni.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Belum ada data</h3>
              <p>Import data alumni dari menu Data Alumni untuk memulai pelacakan.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Lulusan</th>
                      <th>NIM</th>
                      <th>Program Studi</th>
                      <th>Tahun Lulus</th>
                      <th>Confidence</th>
                      <th>Status</th>
                      <th>PDDIKTI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAlumni.map((a, i) => (
                      <tr key={a.id} className="fade-in">
                        <td>{(currentPage - 1) * perPage + i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{a.nama_lulusan}</td>
                        <td>{a.nim}</td>
                        <td>{a.program_studi}</td>
                        <td>{a.tanggal_lulus && !isNaN(new Date(a.tanggal_lulus).getTime()) ? new Date(a.tanggal_lulus).getFullYear() : '-'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="score-bar" style={{ width: 60 }}>
                              <div
                                className={`score-bar-fill ${getScoreColor(a.confidence_score)}`}
                                style={{ width: `${a.confidence_score}%` }}
                              />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{a.confidence_score ?? 0}</span>
                          </div>
                        </td>
                        <td>{getStatusBadge(a.status_pelacakan)}</td>
                        <td>
                          {a.pddikti_verified
                            ? <span className="badge badge-success">✓ Verified</span>
                            : <span className="badge badge-secondary">-</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                        {page}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="pagination-info">...</span>}
                  {totalPages > 5 && (
                    <button className={`pagination-btn ${currentPage === totalPages ? 'active' : ''}`} onClick={() => setCurrentPage(totalPages)}>
                      {totalPages}
                    </button>
                  )}
                  <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* History */}
        <div className="card">
          <div className="card-header">
            <h3>📜 Riwayat Pelacakan Terbaru</h3>
          </div>
          <div className="card-body">
            {history.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <p style={{ color: '#94A3B8' }}>Belum ada riwayat pelacakan</p>
              </div>
            ) : (
              <div className="timeline">
                {history.slice(0, 10).map((h) => (
                  <div key={h.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <h4>
                        {(h.alumni as unknown as { nama_lulusan: string })?.nama_lulusan || 'Alumni'} — {h.action}
                      </h4>
                      {h.old_status && h.new_status && (
                        <p>Status: {h.old_status} → {h.new_status}</p>
                      )}
                      <div className="time">
                        {new Date(h.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
