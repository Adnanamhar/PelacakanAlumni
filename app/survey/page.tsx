'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SurveyPage() {
  const [step, setStep] = useState<'nim' | 'form' | 'done'>('nim');
  const [nim, setNim] = useState('');
  const [alumni, setAlumni] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    linkedin_url: '', instagram_url: '', facebook_url: '', tiktok_url: '',
    email: '', no_hp: '',
    tempat_bekerja: '', alamat_bekerja: '', posisi: '', jenis_pekerjaan: '',
    sosmed_tempat_bekerja: '',
  });

  const handleLookup = async () => {
    if (!nim.trim()) { setError('Masukkan NIM Anda'); return; }
    setLoading(true); setError('');
    const { data, error: e } = await supabase.from('alumni').select('*').eq('nim', nim.trim()).single();
    if (e || !data) { setError('NIM tidak ditemukan dalam database alumni UMM'); setLoading(false); return; }
    setAlumni(data);
    setForm({
      linkedin_url: data.linkedin_url || '',
      instagram_url: data.instagram_url || '',
      facebook_url: data.facebook_url || '',
      tiktok_url: data.tiktok_url || '',
      email: data.email || '',
      no_hp: data.no_hp || '',
      tempat_bekerja: data.tempat_bekerja || '',
      alamat_bekerja: data.alamat_bekerja || '',
      posisi: data.posisi || '',
      jenis_pekerjaan: data.jenis_pekerjaan || '',
      sosmed_tempat_bekerja: data.sosmed_tempat_bekerja || '',
    });
    setStep('form');
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    
    // Calculate score
    let dataScore = 0;
    if (form.linkedin_url) dataScore += 6;
    if (form.instagram_url) dataScore += 2;
    if (form.facebook_url) dataScore += 2;
    if (form.tiktok_url) dataScore += 1;
    if (form.email) dataScore += 5;
    if (form.no_hp) dataScore += 4;
    if (form.tempat_bekerja) dataScore += 6;
    if (form.posisi) dataScore += 5;
    if (form.jenis_pekerjaan) dataScore += 4;
    if (form.alamat_bekerja) dataScore += 3;
    if (form.sosmed_tempat_bekerja) dataScore += 2;

    const pddiktiScore = (alumni as Record<string, number>)?.pddikti_score || 0;
    const total = Math.min(100, pddiktiScore + dataScore);
    const status = total >= 70 ? 'teridentifikasi' : total >= 40 ? 'perlu_verifikasi' : 'tidak_ditemukan';

    const { error: e } = await supabase.from('alumni').update({
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
      confidence_score: total,
      status_pelacakan: status,
      ringkasan_terbaru: form.posisi && form.tempat_bekerja ? `${form.posisi} di ${form.tempat_bekerja}` : form.tempat_bekerja || null,
      tanggal_pelacakan: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', (alumni as Record<string, string>).id);

    if (e) { setError('Gagal menyimpan. Coba lagi.'); setLoading(false); return; }

    await supabase.from('tracking_history').insert({
      alumni_id: (alumni as Record<string, string>).id,
      action: 'Data diperbarui via Survey Alumni',
      old_status: (alumni as Record<string, string>).status_pelacakan,
      new_status: status,
      detail: { source: 'survey', data_score: dataScore, total },
    });

    setStep('done');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 600, boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>Survey Alumni UMM</h1>
          <p style={{ color: '#64748B', fontSize: 14 }}>Perbarui data kontak & pekerjaan Anda</p>
        </div>

        {step === 'nim' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#334155' }}>Masukkan NIM Anda</label>
              <input value={nim} onChange={e => setNim(e.target.value)} placeholder="Contoh: 201010160311628"
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: 12, fontSize: 16, outline: 'none', fontFamily: 'inherit', transition: 'border 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#3B82F6'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
            </div>
            {error && <div style={{ padding: 12, background: '#FEE2E2', borderRadius: 8, color: '#991B1B', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button onClick={handleLookup} disabled={loading}
              style={{ width: '100%', padding: 14, background: '#3B82F6', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? '⏳ Mencari...' : '🔍 Cari Data Saya'}
            </button>
          </div>
        )}

        {step === 'form' && alumni && (
          <div>
            <div style={{ background: '#F1F5F9', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Data Akademik Anda</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: '#64748B' }}>Nama:</span> <strong>{String((alumni as Record<string, unknown>).nama_lulusan)}</strong></div>
                <div><span style={{ color: '#64748B' }}>NIM:</span> {String((alumni as Record<string, unknown>).nim)}</div>
                <div><span style={{ color: '#64748B' }}>Prodi:</span> {String((alumni as Record<string, unknown>).program_studi)}</div>
                <div><span style={{ color: '#64748B' }}>Lulus:</span> {String((alumni as Record<string, unknown>).tanggal_lulus || '-')}</div>
              </div>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#334155' }}>🌐 Sosial Media & Kontak</h3>
            {[
              { label: 'LinkedIn', key: 'linkedin_url', ph: 'https://linkedin.com/in/username' },
              { label: 'Instagram', key: 'instagram_url', ph: 'https://instagram.com/username' },
              { label: 'Facebook', key: 'facebook_url', ph: 'https://facebook.com/username' },
              { label: 'TikTok', key: 'tiktok_url', ph: 'https://tiktok.com/@username' },
              { label: 'Email', key: 'email', ph: 'email@domain.com' },
              { label: 'No. HP', key: 'no_hp', ph: '08xxxxxxxxxx' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#475569' }}>{f.label}</label>
                <input value={form[f.key as keyof typeof form]} onChange={e => setForm({...form, [f.key]: e.target.value})} placeholder={f.ph}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            ))}

            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 16px', color: '#334155' }}>💼 Data Pekerjaan</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Tempat Bekerja</label>
              <input value={form.tempat_bekerja} onChange={e => setForm({...form, tempat_bekerja: e.target.value})} placeholder="Nama perusahaan/instansi"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Posisi/Jabatan</label>
              <input value={form.posisi} onChange={e => setForm({...form, posisi: e.target.value})} placeholder="Posisi Anda saat ini"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Jenis Pekerjaan</label>
                <select value={form.jenis_pekerjaan} onChange={e => setForm({...form, jenis_pekerjaan: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: 'white' }}>
                  <option value="">-- Pilih --</option>
                  <option value="PNS">PNS</option><option value="Swasta">Swasta</option><option value="Wirausaha">Wirausaha</option>
                  <option value="BUMN">BUMN</option><option value="TNI/Polri">TNI/Polri</option><option value="Profesional">Profesional</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Alamat Bekerja</label>
                <input value={form.alamat_bekerja} onChange={e => setForm({...form, alamat_bekerja: e.target.value})} placeholder="Kota, Provinsi"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            {error && <div style={{ padding: 12, background: '#FEE2E2', borderRadius: 8, color: '#991B1B', fontSize: 13, marginBottom: 16 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => { setStep('nim'); setAlumni(null); }}
                style={{ flex: 1, padding: 12, background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Kembali
              </button>
              <button onClick={handleSubmit} disabled={loading}
                style={{ flex: 2, padding: 12, background: '#10B981', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? '⏳ Menyimpan...' : '✅ Simpan Data Saya'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#10B981', marginBottom: 8 }}>Terima Kasih!</h2>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>Data Anda berhasil diperbarui. Tim admin akan memverifikasi informasi yang diberikan.</p>
            <button onClick={() => { setStep('nim'); setNim(''); setAlumni(null); setForm({ linkedin_url: '', instagram_url: '', facebook_url: '', tiktok_url: '', email: '', no_hp: '', tempat_bekerja: '', alamat_bekerja: '', posisi: '', jenis_pekerjaan: '', sosmed_tempat_bekerja: '' }); }}
              style={{ padding: '12px 32px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              📝 Isi Survey Lagi
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: '#94A3B8' }}>
          © 2026 Universitas Muhammadiyah Malang — Alumni Tracker
        </div>
      </div>
    </div>
  );
}
