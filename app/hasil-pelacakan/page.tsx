'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ClientLayout from '@/components/ClientLayout';
import Header from '@/components/Header';
import { supabase, Alumni } from '@/lib/supabase';

export default function HasilPelacakanPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const [totalCount, setTotalCount] = useState(0);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('alumni').select('*', { count: 'exact' }).order('confidence_score', { ascending: false });
      if (filterStatus !== 'semua') {
        query = query.eq('status_pelacakan', filterStatus);
      }
      if (searchQuery) {
        query = query.or(`nama_lulusan.ilike.%${searchQuery}%,nim.ilike.%${searchQuery}%`);
      }
      const { data, count } = await query.range((currentPage - 1) * perPage, currentPage * perPage - 1);
      if (data) setAlumni(data);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching:', err);
    }
    setLoading(false);
  }, [filterStatus, searchQuery, currentPage]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  const totalPages = Math.ceil(totalCount / perPage);
  const paginated = alumni;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'teridentifikasi': return <span className="badge badge-success">✓ Teridentifikasi</span>;
      case 'perlu_verifikasi': return <span className="badge badge-warning">⚠ Perlu Verifikasi</span>;
      case 'tidak_ditemukan': return <span className="badge badge-danger">✗ Tidak Ditemukan</span>;
      default: return <span className="badge badge-secondary">○ Belum Dilacak</span>;
    }
  };

  const getScoreColor = (score: number) => score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';

  return (
    <ClientLayout>
      <Header title="Hasil Pelacakan" subtitle="Lihat dan kelola hasil pelacakan alumni" />
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h3>🔍 Hasil Pelacakan Alumni</h3>
          </div>

          <div className="filter-bar">
            <div className="header-search" style={{ width: 300 }}>
              <span>🔍</span>
              <input placeholder="Cari nama atau NIM..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
            </div>
            <select className="form-select" style={{ width: 200 }} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
              <option value="semua">Semua Status</option>
              <option value="teridentifikasi">Teridentifikasi</option>
              <option value="perlu_verifikasi">Perlu Verifikasi</option>
              <option value="tidak_ditemukan">Tidak Ditemukan</option>
              <option value="belum_dilacak">Belum Dilacak</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : paginated.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>Belum ada hasil pelacakan</h3>
              <p>Mulai pelacakan dari halaman detail alumni.</p>
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
                      <th>Score</th>
                      <th>Status</th>
                      <th>Sosmed</th>
                      <th>Tempat Bekerja</th>
                      <th>Posisi</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((a, i) => (
                      <tr key={a.id}>
                        <td>{(currentPage - 1) * perPage + i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{a.nama_lulusan}</td>
                        <td>{a.nim}</td>
                        <td>{a.program_studi}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="score-bar" style={{ width: 60 }}>
                              <div className={`score-bar-fill ${getScoreColor(a.confidence_score)}`} style={{ width: `${a.confidence_score}%` }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: a.confidence_score >= 70 ? '#10B981' : a.confidence_score >= 40 ? '#F59E0B' : '#EF4444' }}>
                              {a.confidence_score}
                            </span>
                          </div>
                        </td>
                        <td>{getStatusBadge(a.status_pelacakan)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {a.linkedin_url && <a href={a.linkedin_url} target="_blank" rel="noopener noreferrer" title="LinkedIn" style={{ fontSize: 16 }}>💼</a>}
                            {a.instagram_url && <a href={a.instagram_url} target="_blank" rel="noopener noreferrer" title="Instagram" style={{ fontSize: 16 }}>📷</a>}
                            {a.facebook_url && <a href={a.facebook_url} target="_blank" rel="noopener noreferrer" title="Facebook" style={{ fontSize: 16 }}>👤</a>}
                            {a.tiktok_url && <a href={a.tiktok_url} target="_blank" rel="noopener noreferrer" title="TikTok" style={{ fontSize: 16 }}>🎵</a>}
                            {a.email && <span title={a.email} style={{ fontSize: 16, cursor: 'help' }}>📧</span>}
                            {a.no_hp && <span title={a.no_hp} style={{ fontSize: 16, cursor: 'help' }}>📱</span>}
                            {!a.linkedin_url && !a.instagram_url && !a.facebook_url && !a.email && <span style={{ color: '#CBD5E1', fontSize: 12 }}>-</span>}
                          </div>
                        </td>
                        <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.tempat_bekerja || <span style={{ color: '#CBD5E1' }}>-</span>}
                        </td>
                        <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.posisi || <span style={{ color: '#CBD5E1' }}>-</span>}
                        </td>
                        <td>
                          <Link href={`/hasil-pelacakan/${a.id}`} className="btn btn-sm btn-primary">
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(page => (
                    <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                  ))}
                  {totalPages > 7 && <span className="pagination-info">... {totalPages}</span>}
                  <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
