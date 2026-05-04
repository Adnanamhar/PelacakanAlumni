'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ClientLayout from '@/components/ClientLayout';
import Header from '@/components/Header';
import { supabase, Alumni, TrackingHistory } from '@/lib/supabase';
import { generateSearchQueries, GeneratedQuery } from '@/lib/query-generator';
import { calculateDataScore, calculateTotalScore, classifyStatus } from '@/lib/scoring';

export default function DetailPelacakanPage() {
  const params = useParams();
  const id = params.id as string;
  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [history, setHistory] = useState<TrackingHistory[]>([]);
  const [queries, setQueries] = useState<GeneratedQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('data');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [autoSearching, setAutoSearching] = useState(false);
  const [autoSearchResult, setAutoSearchResult] = useState<Record<string, unknown> | null>(null);

  // Form state for alumni contact/employment data
  const [form, setForm] = useState({
    linkedin_url: '', instagram_url: '', facebook_url: '', tiktok_url: '',
    email: '', no_hp: '',
    tempat_bekerja: '', alamat_bekerja: '', posisi: '', jenis_pekerjaan: '',
    sosmed_tempat_bekerja: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [alumniRes, historyRes] = await Promise.all([
      supabase.from('alumni').select('*').eq('id', id).single(),
      supabase.from('tracking_history').select('*').eq('alumni_id', id).order('created_at', { ascending: false }),
    ]);

    if (alumniRes.data) {
      const a = alumniRes.data;
      setAlumni(a);
      setForm({
        linkedin_url: a.linkedin_url || '',
        instagram_url: a.instagram_url || '',
        facebook_url: a.facebook_url || '',
        tiktok_url: a.tiktok_url || '',
        email: a.email || '',
        no_hp: a.no_hp || '',
        tempat_bekerja: a.tempat_bekerja || '',
        alamat_bekerja: a.alamat_bekerja || '',
        posisi: a.posisi || '',
        jenis_pekerjaan: a.jenis_pekerjaan || '',
        sosmed_tempat_bekerja: a.sosmed_tempat_bekerja || '',
      });
      const q = generateSearchQueries(a.nama_lulusan, a.program_studi, a.fakultas, a.tanggal_lulus || '');
      setQueries(q);
    }
    if (historyRes.data) setHistory(historyRes.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!alumni) return;
    setSaving(true);
    setSaveMsg('');

    // Calculate new score
    const dataResult = calculateDataScore(form);
    const totalScore = Math.min(100, (alumni.pddikti_score || 0) + dataResult.total);
    const newStatus = classifyStatus(totalScore);

    const { error } = await supabase.from('alumni').update({
      ...form,
      linkedin_url: form.linkedin_url || null,
      instagram_url: form.instagram_url || null,
      facebook_url: form.facebook_url || null,
      tiktok_url: form.tiktok_url || null,
      email: form.email || null,
      no_hp: form.no_hp || null,
      tempat_bekerja: form.tempat_bekerja || null,
      alamat_bekerja: form.alamat_bekerja || null,
      posisi: form.posisi || null,
      jenis_pekerjaan: form.jenis_pekerjaan || null,
      sosmed_tempat_bekerja: form.sosmed_tempat_bekerja || null,
      confidence_score: totalScore,
      status_pelacakan: newStatus.status,
      ringkasan_terbaru: form.posisi && form.tempat_bekerja 
        ? `${form.posisi} di ${form.tempat_bekerja}` 
        : form.tempat_bekerja || null,
      tanggal_pelacakan: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', alumni.id);

    if (!error) {
      await supabase.from('tracking_history').insert({
        alumni_id: alumni.id,
        action: 'Data pelacakan diperbarui',
        old_status: alumni.status_pelacakan,
        new_status: newStatus.status,
        detail: { data_score: dataResult.total, pddikti_score: alumni.pddikti_score, total: totalScore, breakdown: dataResult.breakdown },
      });
      setSaveMsg(`✅ Data tersimpan! Score: ${totalScore}/100 — ${newStatus.label}`);
      fetchData();
    } else {
      setSaveMsg(`❌ Error: ${error.message}`);
    }
    setSaving(false);
  };

  const handleAutoSearch = async () => {
    if (!alumni) return;
    setAutoSearching(true);
    setAutoSearchResult(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: alumni.nama_lulusan,
          prodi: alumni.program_studi,
          tahun_lulus: alumni.tanggal_lulus ? new Date(alumni.tanggal_lulus).getFullYear().toString() : undefined,
        }),
      });
      const data = await res.json();
      setAutoSearchResult(data);
      // Auto-fill form with extracted data
      if (data.extracted) {
        const ext = data.extracted as Record<string, string>;
        setForm(prev => ({
          ...prev,
          linkedin_url: ext.linkedin_url || prev.linkedin_url,
          instagram_url: ext.instagram_url || prev.instagram_url,
          facebook_url: ext.facebook_url || prev.facebook_url,
          email: ext.email || prev.email,
          tempat_bekerja: ext.tempat_bekerja || prev.tempat_bekerja,
          posisi: ext.posisi || prev.posisi,
          alamat_bekerja: ext.lokasi || prev.alamat_bekerja,
        }));
      }
    } catch {
      setAutoSearchResult({ error: 'Gagal melakukan pencarian' });
    }
    setAutoSearching(false);
  };

  const totalScoreResult = alumni ? calculateTotalScore(alumni.pddikti_score || 0, form) : null;

  if (loading) {
    return (
      <ClientLayout>
        <Header title="Detail Pelacakan" subtitle="Memuat..." />
        <div className="page-content" style={{ textAlign: 'center', paddingTop: 100 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>
      </ClientLayout>
    );
  }

  if (!alumni) {
    return (
      <ClientLayout>
        <Header title="Detail Pelacakan" subtitle="Data tidak ditemukan" />
        <div className="page-content">
          <div className="empty-state">
            <h3>Alumni tidak ditemukan</h3>
            <Link href="/hasil-pelacakan" className="btn btn-primary" style={{ marginTop: 16 }}>Kembali</Link>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const scoreColor = (totalScoreResult?.total || 0) >= 70 ? 'green' : (totalScoreResult?.total || 0) >= 40 ? 'yellow' : 'red';

  return (
    <ClientLayout>
      <Header title="Detail Pelacakan" subtitle={alumni.nama_lulusan} />
      <div className="page-content">
        {/* Top: Alumni Info + Score */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 24 }}>
          <div className="card">
            <div className="card-header"><h3>📋 Informasi Alumni</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div><label className="form-label">Nama</label><div style={{ fontWeight: 600, fontSize: 15 }}>{alumni.nama_lulusan}</div></div>
                <div><label className="form-label">NIM</label><div>{alumni.nim}</div></div>
                <div><label className="form-label">Prodi</label><div>{alumni.program_studi}</div></div>
                <div><label className="form-label">Fakultas</label><div>{alumni.fakultas || '-'}</div></div>
                <div><label className="form-label">Tahun Masuk</label><div>{alumni.tahun_masuk || '-'}</div></div>
                <div><label className="form-label">Tanggal Lulus</label><div>{alumni.tanggal_lulus || '-'}</div></div>
                <div><label className="form-label">PDDIKTI</label><div>{alumni.pddikti_verified ? <span className="badge badge-success">✓ Verified ({alumni.pddikti_score}/60)</span> : <span className="badge badge-secondary">Belum</span>}</div></div>
              </div>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-header"><h3>📊 Score</h3></div>
            <div className="card-body">
              <div className={`score-circle ${scoreColor}`} style={{ width: 90, height: 90, fontSize: 26, marginBottom: 8 }}>
                {totalScoreResult?.total || 0}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>dari 100</div>
              <div className="score-bar-container">
                <div className="score-bar-label"><span>PDDIKTI</span><span>{alumni.pddikti_score || 0}/60</span></div>
                <div className="score-bar"><div className="score-bar-fill blue" style={{ width: `${((alumni.pddikti_score || 0) / 60) * 100}%` }} /></div>
              </div>
              <div className="score-bar-container">
                <div className="score-bar-label"><span>Data</span><span>{totalScoreResult?.dataScore || 0}/40</span></div>
                <div className="score-bar"><div className={`score-bar-fill ${scoreColor}`} style={{ width: `${((totalScoreResult?.dataScore || 0) / 40) * 100}%` }} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="tabs" style={{ padding: '0 24px' }}>
            <button className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>
              📝 Input Data Pelacakan
            </button>
            <button className={`tab-btn ${activeTab === 'queries' ? 'active' : ''}`} onClick={() => setActiveTab('queries')}>
              🔗 Bantuan Pencarian ({queries.length})
            </button>
            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              📜 Riwayat ({history.length})
            </button>
          </div>

          {/* DATA INPUT TAB */}
          {activeTab === 'data' && (
            <div className="card-body">
              {/* Auto Search Section */}
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0369A1' }}>🔍 Pencarian Otomatis (Serper.dev)</h4>
                  <button className="btn btn-primary btn-sm" onClick={handleAutoSearch} disabled={autoSearching}>
                    {autoSearching ? <><span className="spinner" /> Mencari...</> : '🔍 Cari Otomatis'}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                  Cari informasi alumni secara otomatis di Google, LinkedIn, Instagram, dan lainnya. Data yang ditemukan akan otomatis mengisi form di bawah.
                </p>
                {autoSearchResult && !autoSearchResult.error && (
                  <div style={{ marginTop: 12, fontSize: 13 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span className="badge badge-info">📊 {(autoSearchResult.total_results as number) || 0} hasil ditemukan</span>
                      <span className="badge badge-info">Status: {autoSearchResult.suggested_status as string}</span>
                      <span className="badge badge-info">Score: +{autoSearchResult.suggested_score as number}</span>
                    </div>
                    {(autoSearchResult.results as Array<Record<string, unknown>>)?.slice(0, 5).map((r: Record<string, unknown>, i: number) => (
                      <div key={i} style={{ padding: 8, background: 'white', borderRadius: 8, marginBottom: 6, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{r.sumber as string}</div>
                        <a href={r.link as string} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', fontSize: 12 }}>{(r.link as string)?.substring(0, 60)}...</a>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{(r.snippet as string)?.substring(0, 120)}...</div>
                      </div>
                    ))}
                  </div>
                )}
                {autoSearchResult && 'error' in autoSearchResult && autoSearchResult.error !== undefined && (
                  <div style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>❌ {String(autoSearchResult.error)}</div>
                )}
              </div>

              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                Masukkan data alumni yang ditemukan. Setiap field yang terisi akan menambah skor. URL sosial media harus berupa link langsung ke profil (bukan ke pencarian Google).
              </p>

              {/* Sosial Media */}
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#334155' }}>🌐 Sosial Media & Kontak</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">LinkedIn URL (+6 poin)</label>
                  <input className="form-input" placeholder="https://linkedin.com/in/username" value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Instagram URL (+2 poin)</label>
                  <input className="form-input" placeholder="https://instagram.com/username" value={form.instagram_url} onChange={e => setForm({...form, instagram_url: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Facebook URL (+2 poin)</label>
                  <input className="form-input" placeholder="https://facebook.com/username" value={form.facebook_url} onChange={e => setForm({...form, facebook_url: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">TikTok URL (+1 poin)</label>
                  <input className="form-input" placeholder="https://tiktok.com/@username" value={form.tiktok_url} onChange={e => setForm({...form, tiktok_url: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email (+5 poin)</label>
                  <input className="form-input" type="email" placeholder="alumni@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">No. HP (+4 poin)</label>
                  <input className="form-input" placeholder="08xxxxxxxxxx" value={form.no_hp} onChange={e => setForm({...form, no_hp: e.target.value})} />
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '24px 0' }} />

              {/* Data Pekerjaan */}
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#334155' }}>💼 Data Pekerjaan</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tempat Bekerja (+6 poin)</label>
                  <input className="form-input" placeholder="PT XYZ / Universitas ABC / dll" value={form.tempat_bekerja} onChange={e => setForm({...form, tempat_bekerja: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Posisi/Jabatan (+5 poin)</label>
                  <input className="form-input" placeholder="Software Engineer, Dosen, dll" value={form.posisi} onChange={e => setForm({...form, posisi: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Jenis Pekerjaan (+4 poin)</label>
                  <select className="form-select" value={form.jenis_pekerjaan} onChange={e => setForm({...form, jenis_pekerjaan: e.target.value})}>
                    <option value="">-- Pilih --</option>
                    <option value="PNS">PNS</option>
                    <option value="Swasta">Swasta</option>
                    <option value="Wirausaha">Wirausaha</option>
                    <option value="BUMN">BUMN</option>
                    <option value="TNI/Polri">TNI/Polri</option>
                    <option value="Profesional">Profesional</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Alamat Bekerja (+3 poin)</label>
                  <input className="form-input" placeholder="Jl. ..., Kota, Provinsi" value={form.alamat_bekerja} onChange={e => setForm({...form, alamat_bekerja: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Sosmed Tempat Bekerja (+2 poin)</label>
                <input className="form-input" placeholder="https://instagram.com/perusahaan atau website" value={form.sosmed_tempat_bekerja} onChange={e => setForm({...form, sosmed_tempat_bekerja: e.target.value})} />
              </div>

              {/* Score Preview */}
              {totalScoreResult && (
                <div style={{ marginTop: 24, padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: 14, marginBottom: 12 }}>📊 Preview Skor</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {totalScoreResult.breakdown.map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                        <span>{b.score > 0 ? '✅' : '⬜'} {b.criteria}</span>
                        <span style={{ fontWeight: 600, color: b.score > 0 ? '#10B981' : '#CBD5E1' }}>{b.score}/{b.maxScore}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid #E2E8F0', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
                    <span>Total Score</span>
                    <span style={{ color: scoreColor === 'green' ? '#10B981' : scoreColor === 'yellow' ? '#F59E0B' : '#EF4444' }}>
                      {totalScoreResult.total}/100
                    </span>
                  </div>
                </div>
              )}

              {saveMsg && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: saveMsg.includes('❌') ? '#FEE2E2' : '#D1FAE5' }}>
                  {saveMsg}
                </div>
              )}

              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner" /> Menyimpan...</> : '💾 Simpan Data & Hitung Skor'}
                </button>
              </div>
            </div>
          )}

          {/* QUERIES TAB */}
          {activeTab === 'queries' && (
            <div className="card-body">
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                Gunakan link di bawah untuk mencari alumni di platform terkait. Copy data yang ditemukan ke tab &quot;Input Data Pelacakan&quot;.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {queries.map((q, i) => (
                  <div key={i} className="query-card">
                    <div className="query-card-icon">{q.icon}</div>
                    <div className="query-card-content">
                      <div className="source">{q.sumber}</div>
                      <div className="query-text">{q.query}</div>
                    </div>
                    <a href={q.url} target="_blank" rel="noopener noreferrer">Buka →</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="card-body">
              {history.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <p style={{ color: '#94A3B8' }}>Belum ada riwayat</p>
                </div>
              ) : (
                <div className="timeline">
                  {history.map(h => (
                    <div key={h.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <h4>{h.action}</h4>
                        {h.old_status && h.new_status && <p>Status: {h.old_status} → {h.new_status}</p>}
                        <div className="time">{new Date(h.created_at).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Data Summary */}
        {(alumni.linkedin_url || alumni.email || alumni.tempat_bekerja) && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header"><h3>📌 Data Tersimpan</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {alumni.linkedin_url && (
                  <div><label className="form-label">LinkedIn</label><a href={alumni.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6' }}>🔗 {alumni.linkedin_url}</a></div>
                )}
                {alumni.instagram_url && (
                  <div><label className="form-label">Instagram</label><a href={alumni.instagram_url} target="_blank" rel="noopener noreferrer" style={{ color: '#E4405F' }}>📷 {alumni.instagram_url}</a></div>
                )}
                {alumni.facebook_url && (
                  <div><label className="form-label">Facebook</label><a href={alumni.facebook_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }}>👤 {alumni.facebook_url}</a></div>
                )}
                {alumni.tiktok_url && (
                  <div><label className="form-label">TikTok</label><a href={alumni.tiktok_url} target="_blank" rel="noopener noreferrer" style={{ color: '#000' }}>🎵 {alumni.tiktok_url}</a></div>
                )}
                {alumni.email && (
                  <div><label className="form-label">Email</label><div>📧 {alumni.email}</div></div>
                )}
                {alumni.no_hp && (
                  <div><label className="form-label">No. HP</label><div>📱 {alumni.no_hp}</div></div>
                )}
                {alumni.tempat_bekerja && (
                  <div><label className="form-label">Tempat Bekerja</label><div>🏢 {alumni.tempat_bekerja}</div></div>
                )}
                {alumni.posisi && (
                  <div><label className="form-label">Posisi</label><div>💼 {alumni.posisi}</div></div>
                )}
                {alumni.jenis_pekerjaan && (
                  <div><label className="form-label">Jenis</label><div><span className="badge badge-info">{alumni.jenis_pekerjaan}</span></div></div>
                )}
                {alumni.alamat_bekerja && (
                  <div><label className="form-label">Alamat Bekerja</label><div>📍 {alumni.alamat_bekerja}</div></div>
                )}
                {alumni.sosmed_tempat_bekerja && (
                  <div><label className="form-label">Sosmed Perusahaan</label><a href={alumni.sosmed_tempat_bekerja} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6' }}>🔗 {alumni.sosmed_tempat_bekerja}</a></div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
