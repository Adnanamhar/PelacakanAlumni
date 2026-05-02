'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ClientLayout from '@/components/ClientLayout';
import Header from '@/components/Header';
import { supabase, Alumni } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export default function DataAlumniPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<Record<string, unknown> | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [importMessage, setImportMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const perPage = 10;

  const [totalCount, setTotalCount] = useState(0);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('alumni').select('*', { count: 'exact' }).order('nama_lulusan');
      
      if (searchQuery) {
        query = query.or(`nama_lulusan.ilike.%${searchQuery}%,nim.ilike.%${searchQuery}%,program_studi.ilike.%${searchQuery}%`);
      }

      const { data, count } = await query.range((currentPage - 1) * perPage, currentPage * perPage - 1);
      if (data) setAlumni(data);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching alumni:', err);
    }
    setLoading(false);
  }, [searchQuery, currentPage]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const allData: Record<string, string>[] = [];
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [allImportData, setAllImportData] = useState<Record<string, string>[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMessage('⏳ Membaca file Excel... (file besar mungkin butuh waktu)');
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
        setAllImportData(json);
        setPreviewData(json.slice(0, 10));
        setImportMessage(`✓ File terbaca: ${json.length.toLocaleString()} baris ditemukan.`);
      } catch {
        setImportMessage('❌ Error membaca file. Pastikan format .xlsx/.xls yang valid.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (allImportData.length === 0) return;
    setUploading(true);
    setImportMessage('');
    setImportProgress(0);

    const CHUNK_SIZE = 5000;
    const totalChunks = Math.ceil(allImportData.length / CHUNK_SIZE);
    setImportTotal(allImportData.length);

    let totalInserted = 0;
    let totalErrors = 0;
    let totalSkipped = 0;

    try {
      for (let i = 0; i < allImportData.length; i += CHUNK_SIZE) {
        const chunk = allImportData.slice(i, i + CHUNK_SIZE);
        const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
        
        setImportMessage(`⏳ Mengirim batch ${chunkNum}/${totalChunks} (${Math.min(i + CHUNK_SIZE, allImportData.length).toLocaleString()}/${allImportData.length.toLocaleString()} baris)...`);
        setImportProgress(Math.round((i / allImportData.length) * 100));

        const res = await fetch('/api/alumni/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: chunk }),
        });

        const result = await res.json();

        if (result.error) {
          setImportMessage(`❌ Error batch ${chunkNum}: ${result.error}`);
          setUploading(false);
          return;
        }

        totalInserted += result.inserted || 0;
        totalErrors += result.errors || 0;
        totalSkipped += result.skipped || 0;
      }

      setImportProgress(100);
      setImportMessage(`✅ Selesai! ${totalInserted.toLocaleString()} data berhasil diimport. ${totalErrors > 0 ? `${totalErrors.toLocaleString()} error.` : ''} ${totalSkipped > 0 ? `${totalSkipped.toLocaleString()} dilewati.` : ''}`);
      setAllImportData([]);
      setPreviewData([]);
      fetchAlumni();
    } catch (err) {
      console.error(err);
      setImportMessage(`❌ Error koneksi. ${totalInserted.toLocaleString()} sudah terimport sebelum error.`);
    }
    setUploading(false);
  };

  const handleVerifyPddikti = async (alm: Alumni) => {
    setSelectedAlumni(alm);
    setShowVerifyModal(true);
    setVerifyLoading(true);
    setVerifyResult(null);

    try {
      const res = await fetch(`/api/pddikti/search?nama=${encodeURIComponent(alm.nama_lulusan)}`);
      const data = await res.json();
      setVerifyResult(data);
    } catch {
      setVerifyResult({ error: 'Gagal mengambil data dari PDDIKTI' });
    }
    setVerifyLoading(false);
  };

  const handleSavePddiktiVerification = async (pddiktiItem: Record<string, unknown>, score: number) => {
    if (!selectedAlumni) return;

    await supabase
      .from('alumni')
      .update({
        pddikti_verified: true,
        pddikti_data: pddiktiItem,
        pddikti_score: score,
        confidence_score: Math.min(100, (selectedAlumni.confidence_score || 0) + score),
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedAlumni.id);

    await supabase.from('tracking_history').insert({
      alumni_id: selectedAlumni.id,
      action: 'Verifikasi PDDIKTI',
      old_status: selectedAlumni.status_pelacakan,
      new_status: selectedAlumni.status_pelacakan,
      detail: { pddikti_score: score, pddikti_data: pddiktiItem },
    });

    setShowVerifyModal(false);
    fetchAlumni();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus alumni ini?')) return;
    await supabase.from('alumni').delete().eq('id', id);
    fetchAlumni();
  };

  const totalPages = Math.ceil(totalCount / perPage);
  const paginated = alumni; // already paginated from server

  return (
    <ClientLayout>
      <Header title="Data Alumni" subtitle="Import dan kelola data alumni dari Excel" />
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h3>📋 Daftar Alumni ({totalCount.toLocaleString()})</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>📥 Import Excel</button>
              <button className="btn btn-outline" onClick={() => {
                const ws = XLSX.utils.json_to_sheet(alumni.map(a => ({
                  'Nama Lulusan': a.nama_lulusan, NIM: a.nim, 'Tahun Masuk': a.tahun_masuk,
                  'Tanggal Lulus': a.tanggal_lulus, Fakultas: a.fakultas, 'Program Studi': a.program_studi,
                  Status: a.status_pelacakan, Score: a.confidence_score,
                })));
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Alumni');
                XLSX.writeFile(wb, 'data_alumni_umm.xlsx');
              }}>📤 Export</button>
            </div>
          </div>

          <div className="filter-bar">
            <div className="header-search" style={{ width: 300 }}>
              <span>🔍</span>
              <input placeholder="Cari nama, NIM, prodi..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : paginated.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Belum ada data alumni</h3>
              <p>Klik &quot;Import Excel&quot; untuk mengupload data alumni dari file Excel.</p>
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
                      <th>Tahun Masuk</th>
                      <th>Tanggal Lulus</th>
                      <th>Fakultas</th>
                      <th>Program Studi</th>
                      <th>PDDIKTI</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((a, i) => (
                      <tr key={a.id}>
                        <td>{(currentPage - 1) * perPage + i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{a.nama_lulusan}</td>
                        <td>{a.nim}</td>
                        <td>{a.tahun_masuk || '-'}</td>
                        <td>{a.tanggal_lulus || '-'}</td>
                        <td>{a.fakultas || '-'}</td>
                        <td>{a.program_studi}</td>
                        <td>
                          {a.pddikti_verified
                            ? <span className="badge badge-success">✓ {a.pddikti_score}/30</span>
                            : <span className="badge badge-secondary">Belum</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-sm btn-primary" onClick={() => handleVerifyPddikti(a)}>Verifikasi</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Hapus</button>
                          </div>
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

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📥 Import Data Alumni dari Excel</h3>
                <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                  Upload file Excel (.xlsx / .xls) dengan kolom: <strong>Nama Lulusan, NIM, Tahun Masuk, Tanggal Lulus, Fakultas, Program Studi</strong>
                </p>

                <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                  <div className="upload-zone-icon">📁</div>
                  <h4>Klik untuk pilih file atau drag & drop</h4>
                  <p>Format: .xlsx, .xls</p>
                </div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />

                {previewData.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ marginBottom: 10, fontSize: 14 }}>
                      Preview (menampilkan 10 dari <strong>{allImportData.length.toLocaleString()}</strong> baris total):
                    </h4>
                    <div style={{ overflowX: 'auto', maxHeight: 300 }}>
                      <table className="data-table" style={{ fontSize: 12 }}>
                        <thead>
                          <tr>{Object.keys(previewData[0]).map(k => <th key={k}>{k}</th>)}</tr>
                        </thead>
                        <tbody>
                          {previewData.slice(0, 5).map((row, i) => (
                            <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v)}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {uploading && (
                  <div style={{ marginTop: 16 }}>
                    <div className="score-bar-label">
                      <span>Progress Import</span>
                      <span>{importProgress}% ({Math.round(importTotal * importProgress / 100).toLocaleString()} / {importTotal.toLocaleString()})</span>
                    </div>
                    <div className="score-bar" style={{ height: 12 }}>
                      <div className="score-bar-fill blue" style={{ width: `${importProgress}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}

                {importMessage && (
                  <div style={{ 
                    marginTop: 16, padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: importMessage.includes('❌') || importMessage.includes('Error') ? '#FEE2E2' : 
                                importMessage.includes('⏳') ? '#EFF6FF' : '#D1FAE5' 
                  }}>
                    {importMessage}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowUploadModal(false)} disabled={uploading}>Batal</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={allImportData.length === 0 || uploading}>
                  {uploading ? <><span className="spinner" /> Mengimport...</> : `📥 Import ${allImportData.length.toLocaleString()} Data`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDDIKTI Verify Modal */}
        {showVerifyModal && selectedAlumni && (
          <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🔎 Verifikasi PDDIKTI — {selectedAlumni.nama_lulusan}</h3>
                <button className="modal-close" onClick={() => setShowVerifyModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div><strong>NIM:</strong> {selectedAlumni.nim}</div>
                    <div><strong>Prodi:</strong> {selectedAlumni.program_studi}</div>
                    <div><strong>Lulus:</strong> {selectedAlumni.tanggal_lulus || '-'}</div>
                  </div>
                </div>

                {verifyLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                    <p style={{ marginTop: 12, fontSize: 13, color: '#64748B' }}>Mencari di PDDIKTI...</p>
                  </div>
                ) : verifyResult?.error ? (
                  <div style={{ padding: 20, background: '#FEE2E2', borderRadius: 8, fontSize: 13 }}>
                    {String(verifyResult.error)}
                  </div>
                ) : verifyResult?.mahasiswa && Array.isArray(verifyResult.mahasiswa) ? (
                  <div>
                    <h4 style={{ fontSize: 14, marginBottom: 12 }}>Hasil Pencarian ({(verifyResult.mahasiswa as unknown[]).length} ditemukan):</h4>
                    {(verifyResult.mahasiswa as Record<string, unknown>[]).map((mhs, i) => {
                      // Calculate matching score
                      let score = 0;
                      const namaMatch = String(mhs.nama || '').toLowerCase().includes(selectedAlumni.nama_lulusan.toLowerCase().split(' ')[0]);
                      if (namaMatch) score += 10;
                      if (String(mhs.nim || '') === selectedAlumni.nim) score += 10;
                      const ptMatch = String(mhs.nama_pt || '').toLowerCase().includes('muhammadiyah malang');
                      if (ptMatch) score += 5;
                      const prodiMatch = String(mhs.nama_prodi || '').toLowerCase().includes(selectedAlumni.program_studi.toLowerCase().split(' ')[0]);
                      if (prodiMatch) score += 5;

                      return (
                        <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>{String(mhs.nama || '-')}</div>
                              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                                NIM: {String(mhs.nim || '-')} | {String(mhs.nama_prodi || '-')} | {String(mhs.nama_pt || '-')}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div className={`score-circle ${score >= 20 ? 'green' : score >= 10 ? 'yellow' : 'red'}`} style={{ width: 48, height: 48, fontSize: 16 }}>
                                {score}
                              </div>
                              <div style={{ fontSize: 10, color: '#94A3B8' }}>/30</div>
                            </div>
                          </div>
                          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm btn-success" onClick={() => handleSavePddiktiVerification(mhs as Record<string, unknown>, score)}>
                              ✓ Pilih & Simpan
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: 32 }}>
                    <p>Tidak ditemukan data di PDDIKTI</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
