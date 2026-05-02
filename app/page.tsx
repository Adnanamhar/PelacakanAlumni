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
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-card-header">
              <div className="stat-card-icon" style={{ background: '#EFF6FF' }}>📊</div>
            </div>
            <div className="stat-card-value">{stats.total}</div>
            <div className="stat-card-label">Total Alumni</div>
          </div>
          <div className="stat-card green">
            <div className="stat-card-header">
              <div className="stat-card-icon">✓</div>
            </div>
            <div className="stat-card-value">{stats.teridentifikasi}</div>
            <div className="stat-card-label">Teridentifikasi</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-card-header">
              <div className="stat-card-icon">⚠</div>
            </div>
            <div className="stat-card-value">{stats.perluVerifikasi}</div>
            <div className="stat-card-label">Perlu Verifikasi</div>
          </div>
          <div className="stat-card red">
            <div className="stat-card-header">
              <div className="stat-card-icon">✗</div>
            </div>
            <div className="stat-card-value">{stats.tidakDitemukan}</div>
            <div className="stat-card-label">Tidak Ditemukan</div>
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
              { key: 'semua', label: `Semua (${stats.total})` },
              { key: 'teridentifikasi', label: `Teridentifikasi (${stats.teridentifikasi})` },
              { key: 'perlu_verifikasi', label: `Perlu Verifikasi (${stats.perluVerifikasi})` },
              { key: 'tidak_ditemukan', label: `Tidak Ditemukan (${stats.tidakDitemukan})` },
              { key: 'belum_dilacak', label: `Belum Dilacak (${stats.belumDilacak})` },
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
                        <td>{a.tanggal_lulus ? new Date(a.tanggal_lulus).getFullYear() : '-'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="score-bar" style={{ width: 60 }}>
                              <div
                                className={`score-bar-fill ${getScoreColor(a.confidence_score)}`}
                                style={{ width: `${a.confidence_score}%` }}
                              />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{a.confidence_score}</span>
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
