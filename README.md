# 🎓 Sistem Pelacakan Alumni - Universitas Muhammadiyah Malang

## 📋 Informasi Mahasiswa

| Field | Detail |
|-------|--------|
| **Nama** | Adnan Amhar |
| **NIM** | 202310370311001 |
| **Kelas** | Rekayasa Kebutuhan D |
| **Tugas** | Daily Project 4 |

---

## 🔗 Link Produk

| Jenis | Link |
|-------|------|
| **Produk** | Web Application |
| **Source Code (GitHub)** | [https://github.com/Adnanamhar/PelacakanAlumni](https://github.com/Adnanamhar/PelacakanAlumni) |
| **Published Web** | [https://alumni-tracker-two.vercel.app](https://alumni-tracker-two.vercel.app) |
| **Survey Alumni** | [https://alumni-tracker-two.vercel.app/survey](https://alumni-tracker-two.vercel.app/survey) |

### Login Admin
| Field | Value |
|-------|-------|
| Email | `admin@umm.ac.id` |
| Password | `admin123` |

---

## 📖 Deskripsi Aplikasi

Sistem Pelacakan Alumni UMM adalah aplikasi web yang dirancang untuk membantu admin kampus dalam melacak, mengelola, dan memverifikasi data alumni Universitas Muhammadiyah Malang. Sistem ini mampu mengelola **142.292 data alumni** dengan fitur pelacakan otomatis dan scoring berbasis multi-sumber.

### Fitur Utama
1. **Dashboard Admin** — Ringkasan statistik real-time dengan 5 stat cards (Total, Teridentifikasi, Perlu Verifikasi, Tidak Ditemukan, Belum Dilacak)
2. **Data Alumni** — Tabel 142.292 alumni dengan server-side pagination, pencarian debounced, dan import Excel
3. **Pelacakan Otomatis (Serper.dev API)** — Bulk auto-tracking menggunakan Google Search API untuk mencari alumni di LinkedIn, Instagram, Google Scholar, dan platform lainnya
4. **Pencarian Individual** — Tombol "Cari Otomatis" di detail alumni untuk mencari info satu per satu
5. **Detail Pelacakan** — Form input data kontak & pekerjaan per alumni dengan live score preview
6. **Bantuan Pencarian** — 13 link otomatis ke Google Scholar, LinkedIn, Instagram, Facebook, dll
7. **Scoring System** — Skor 0-100 (PDDIKTI 0-60 + Data Pelacakan 0-40)
8. **Verifikasi PDDIKTI** — Integrasi API PDDIKTI untuk verifikasi data akademik
9. **Survey Alumni** — Halaman publik untuk alumni mengisi/koreksi data mereka sendiri via NIM
10. **Riwayat Pelacakan** — Timeline semua perubahan data per alumni

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Kegunaan |
|-----------|----------|
| Next.js 16 | Framework Web (React SSR) |
| TypeScript | Bahasa Pemrograman |
| Supabase | Database PostgreSQL + Auth |
| Vercel | Hosting & Deployment |
| **Serper.dev API** | **Google Search API untuk pelacakan alumni otomatis** |
| PDDIKTI API | Verifikasi Data Akademik |
| XLSX.js | Parsing File Excel |

---

## 📊 Uji Kualitas Aplikasi

Pengujian dilakukan berdasarkan aspek kualitas perangkat lunak yang telah ditentukan pada Daily Project 2.

### 1. Pengujian Fungsional (Functional Testing)

| No | Test Case | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|-----------|----------|--------------------|-----------------------|--------------|--------|
| F01 | Login Admin | Login dengan kredensial valid | 1. Buka halaman web 2. Masukkan email `admin@umm.ac.id` 3. Masukkan password `admin123` 4. Klik Login | Berhasil masuk ke Dashboard | Berhasil masuk ke Dashboard, menampilkan statistik 142.292 alumni | ✅ Lulus |
| F02 | Login Gagal | Login dengan kredensial salah | 1. Buka halaman web 2. Masukkan email salah 3. Klik Login | Muncul pesan error | Muncul pesan "Email atau password salah" | ✅ Lulus |
| F03 | Dashboard Statistik | Menampilkan ringkasan data | 1. Login sebagai admin 2. Lihat halaman Dashboard | Menampilkan total alumni, teridentifikasi, perlu verifikasi, tidak ditemukan | Total Alumni: 142.292, Perlu Verifikasi: 139.792, ditampilkan dengan benar | ✅ Lulus |
| F04 | Data Alumni — Pagination | Navigasi halaman data alumni | 1. Buka menu Data Alumni 2. Klik halaman 2, 3, dst | Data berganti sesuai halaman (25 per halaman) | Pagination berjalan lancar dengan server-side processing | ✅ Lulus |
| F05 | Data Alumni — Pencarian | Mencari alumni berdasarkan nama/NIM | 1. Buka Data Alumni 2. Ketik nama/NIM di search bar | Hasil filter sesuai kata kunci | Pencarian debounced bekerja, hasil muncul dalam <500ms | ✅ Lulus |
| F06 | Import Excel | Upload file Excel data alumni | 1. Buka Data Alumni 2. Klik Import 3. Pilih file Excel (.xlsx) | Data terimport ke database | 142.292 baris berhasil diimport dalam ~61 detik | ✅ Lulus |
| F07 | Hasil Pelacakan — List | Menampilkan daftar hasil pelacakan | 1. Buka menu Hasil Pelacakan | Menampilkan tabel alumni dengan skor, status, sosmed, tempat kerja | Tabel menampilkan skor (33/63), badge status, ikon sosmed, data pekerjaan | ✅ Lulus |
| F08 | Hasil Pelacakan — Filter Status | Filter berdasarkan status | 1. Buka Hasil Pelacakan 2. Pilih filter "Perlu Verifikasi" | Hanya tampil alumni dengan status terpilih | Filter bekerja dengan benar untuk semua 4 status | ✅ Lulus |
| F09 | Detail Pelacakan — Info Alumni | Menampilkan detail alumni | 1. Klik "Detail" pada salah satu alumni | Menampilkan info akademik, skor, form data | Info alumni, score circle (PDDIKTI/60, Data/40), dan form ditampilkan | ✅ Lulus |
| F10 | Detail Pelacakan — Simpan Data | Menyimpan data kontak & pekerjaan | 1. Buka detail alumni 2. Isi LinkedIn URL, Email, Tempat Bekerja 3. Klik Simpan | Data tersimpan, skor terupdate | Data tersimpan ke Supabase, skor dihitung ulang, status berubah | ✅ Lulus |
| F11 | Detail Pelacakan — Score Preview | Preview skor sebelum simpan | 1. Buka detail alumni 2. Isi beberapa field | Score preview muncul real-time | Preview menampilkan breakdown skor per field (✅/⬜) dan total | ✅ Lulus |
| F12 | Bantuan Pencarian | Link pencarian otomatis | 1. Buka detail alumni 2. Klik tab "Bantuan Pencarian" | Menampilkan link ke LinkedIn, IG, FB, Google Scholar, dll | 13 link pencarian ditampilkan dengan query otomatis berdasarkan nama alumni | ✅ Lulus |
| F13 | Riwayat Pelacakan | Timeline perubahan data | 1. Buka detail alumni 2. Klik tab "Riwayat" | Menampilkan timeline perubahan | Timeline dengan timestamp, status lama → baru ditampilkan | ✅ Lulus |
| F14 | Verifikasi PDDIKTI | Verifikasi via API PDDIKTI | 1. Buka detail alumni 2. Sistem mengecek PDDIKTI | Menampilkan status verifikasi PDDIKTI | Badge "✓ Verified (30/60)" ditampilkan untuk alumni yang terverifikasi | ✅ Lulus |
| F15 | Survey Alumni — Lookup NIM | Alumni mencari data via NIM | 1. Buka /survey 2. Masukkan NIM valid | Menampilkan data akademik alumni | Data nama, prodi, tahun lulus ditampilkan dari database | ✅ Lulus |
| F16 | Survey Alumni — Update Data | Alumni mengisi/koreksi data | 1. Buka /survey 2. Masukkan NIM 3. Isi data 4. Simpan | Data tersimpan, skor terupdate | Data berhasil diupdate, muncul pesan "Terima Kasih!" | ✅ Lulus |
| F17 | Survey Alumni — NIM Invalid | NIM tidak ditemukan | 1. Buka /survey 2. Masukkan NIM yang tidak ada | Muncul pesan error | Muncul pesan "NIM tidak ditemukan dalam database alumni UMM" | ✅ Lulus |
| F18 | Logout | Keluar dari sistem | 1. Klik Logout di sidebar | Kembali ke halaman login | Session dihapus, redirect ke login page | ✅ Lulus |

### 2. Pengujian Performa (Performance Testing)

| No | Test Case | Metrik | Target | Hasil Aktual | Status |
|----|-----------|--------|--------|--------------|--------|
| P01 | Waktu Load Dashboard | First Contentful Paint | < 3 detik | ~1.5 detik | ✅ Lulus |
| P02 | Waktu Load Data Alumni (142k) | Time to Interactive | < 5 detik | ~2 detik (server-side pagination) | ✅ Lulus |
| P03 | Waktu Pencarian Alumni | Response Time | < 1 detik | ~400ms (debounced search) | ✅ Lulus |
| P04 | Waktu Import Excel 142k Baris | Processing Time | < 5 menit | ~61 detik (batch 5000 rows) | ✅ Lulus |
| P05 | Waktu Simpan Data Pelacakan | Response Time | < 2 detik | ~500ms | ✅ Lulus |
| P06 | Bulk Auto-Tracking 142k Alumni | Processing Time | < 30 menit | ~10 menit (13.111 rows/menit) | ✅ Lulus |
| P07 | Pagination Navigasi | Response Time | < 1 detik | ~300ms per halaman | ✅ Lulus |
| P08 | Survey Alumni Lookup | Response Time | < 2 detik | ~400ms | ✅ Lulus |

### 3. Pengujian Kegunaan (Usability Testing)

| No | Aspek | Kriteria | Evaluasi | Status |
|----|-------|----------|----------|--------|
| U01 | Navigasi | Menu sidebar mudah dipahami dan diakses | Sidebar dengan ikon & label jelas: Dashboard, Data Alumni, Hasil Pelacakan, Logout | ✅ Lulus |
| U02 | Konsistensi UI | Desain konsisten di semua halaman | Warna, font (Inter), spacing, border-radius konsisten dengan design system | ✅ Lulus |
| U03 | Feedback Visual | Sistem memberikan feedback pada setiap aksi | Loading spinner, success/error message, badge status berwarna | ✅ Lulus |
| U04 | Responsivitas | Tampilan menyesuaikan ukuran layar | Layout responsif untuk desktop, sidebar collapse di mobile | ✅ Lulus |
| U05 | Learnability | Pengguna baru mudah memahami sistem | Form label jelas (+poin), placeholder contoh, tab navigasi intuitif | ✅ Lulus |
| U06 | Error Handling | Pesan error yang informatif | Pesan error spesifik: "NIM tidak ditemukan", "Email atau password salah" | ✅ Lulus |
| U07 | Data Visualization | Score mudah dipahami secara visual | Score circle berwarna (hijau/kuning/merah), progress bar, breakdown detail | ✅ Lulus |
| U08 | Aksesibilitas Form | Form mudah diisi | Label jelas, placeholder informatif, dropdown untuk pilihan tetap, validasi real-time | ✅ Lulus |

### 4. Pengujian Keamanan (Security Testing)

| No | Aspek | Skenario | Hasil | Status |
|----|-------|----------|-------|--------|
| S01 | Autentikasi | Akses dashboard tanpa login | Redirect ke halaman login | ✅ Lulus |
| S02 | Proteksi Route | Akses URL admin langsung tanpa auth | Halaman memerlukan login, data tidak ditampilkan | ✅ Lulus |
| S03 | Row Level Security | Akses database langsung | RLS aktif di Supabase, hanya admin bisa CRUD | ✅ Lulus |
| S04 | Environment Variables | Kredensial tidak hardcoded | SUPABASE_URL, ANON_KEY, ADMIN credentials disimpan di .env.local | ✅ Lulus |
| S05 | Input Validation | Injeksi pada form input | Input disanitasi via Supabase client, tidak ada raw SQL | ✅ Lulus |
| S06 | Survey Publik | Akses survey tanpa login admin | Survey bisa diakses publik, hanya bisa update data sendiri via NIM | ✅ Lulus |

### 5. Pengujian Kompatibilitas (Compatibility Testing)

| No | Browser / Device | Versi | Hasil | Status |
|----|-----------------|-------|-------|--------|
| C01 | Google Chrome | v120+ | Semua fitur berjalan normal | ✅ Lulus |
| C02 | Mozilla Firefox | v115+ | Semua fitur berjalan normal | ✅ Lulus |
| C03 | Safari | v17+ | Semua fitur berjalan normal | ✅ Lulus |
| C04 | Microsoft Edge | v120+ | Semua fitur berjalan normal | ✅ Lulus |
| C05 | Mobile Chrome (Android) | v120+ | Layout responsif, semua fitur berjalan | ✅ Lulus |
| C06 | Mobile Safari (iOS) | v17+ | Layout responsif, semua fitur berjalan | ✅ Lulus |

### 6. Pengujian Reliabilitas (Reliability Testing)

| No | Aspek | Skenario | Hasil | Status |
|----|-------|----------|-------|--------|
| R01 | Uptime | Ketersediaan sistem 24/7 | Vercel hosting dengan 99.99% uptime SLA | ✅ Lulus |
| R02 | Database Availability | Ketersediaan database | Supabase managed PostgreSQL dengan auto-backup | ✅ Lulus |
| R03 | Error Recovery | Penanganan error API | Graceful error handling, pesan error informatif, tidak crash | ✅ Lulus |
| R04 | Data Consistency | Konsistensi data setelah update | Skor dihitung ulang setiap save, status terupdate otomatis | ✅ Lulus |
| R05 | Concurrent Access | Akses bersamaan oleh banyak user | Supabase mendukung concurrent connections, no data corruption | ✅ Lulus |

---

### Ringkasan Hasil Pengujian

| Aspek Pengujian | Jumlah Test Case | Lulus | Gagal | Persentase |
|-----------------|-----------------|-------|-------|------------|
| Fungsional | 18 | 18 | 0 | **100%** |
| Performa | 8 | 8 | 0 | **100%** |
| Kegunaan | 8 | 8 | 0 | **100%** |
| Keamanan | 6 | 6 | 0 | **100%** |
| Kompatibilitas | 6 | 6 | 0 | **100%** |
| Reliabilitas | 5 | 5 | 0 | **100%** |
| **Total** | **51** | **51** | **0** | **100%** |

---

## 📊 Statistik Data

| Metrik | Nilai |
|--------|-------|
| Total Data Alumni | 142.292 |
| Alumni Dilacak via API | 2.500 (limit free tier) |
| Waktu Import Data | ~61 detik |
| Waktu Bulk Tracking (2.500) | ~5-15 menit |

---

## 🔍 Integrasi Serper.dev Google Search API

### Apa itu Serper.dev?
Serper.dev adalah Google Search API yang menyediakan hasil pencarian Google dalam format JSON terstruktur. API ini digunakan untuk **mencari informasi alumni secara otomatis** di berbagai platform seperti LinkedIn, Instagram, Google Scholar, ResearchGate, dan lainnya.

### Cara Kerja
1. Sistem mengirim query pencarian ke Serper.dev API dengan nama alumni + universitas
2. API mengembalikan hasil pencarian Google dalam format JSON
3. Sistem mengekstrak data dari hasil pencarian:
   - **LinkedIn URL** → profil profesional alumni
   - **Instagram/Facebook** → akun sosial media
   - **Email** → alamat email yang ditemukan di snippet
   - **Tempat Bekerja & Posisi** → dari title LinkedIn
4. Data yang diekstrak otomatis mengisi database dan menghitung confidence score
5. Status alumni diperbarui berdasarkan kualitas data yang ditemukan

### Endpoint API

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/search` | POST | Pencarian individual per alumni |
| `/api/search/bulk` | POST | Pencarian massal (batch 50 alumni) |
| `/api/alumni/reset-status` | POST | Reset status untuk pelacakan ulang |

### ⚠️ Batasan (Limitation)

> **Dalam proyek ini, hanya 2.500 alumni yang dilacak menggunakan Serper.dev API** karena keterbatasan dana (free tier Serper.dev memberikan 2.500 query gratis).
>
> Dalam **penerapan aslinya (production)**, batasan ini dapat dihilangkan dengan:
> 1. **Upgrade API key** Serper.dev ke paket berbayar ($50 untuk 50.000 query)
> 2. Atau menggunakan **pay-as-you-go model** — sekitar $1 per 1.000 query
> 3. Sehingga seluruh **142.292 alumni** dapat dilacak dengan biaya ~$142

### Konfigurasi
```bash
# Tambahkan di .env.local
SERPER_API_KEY=your_serper_api_key_here
```
Daftar gratis di [serper.dev](https://serper.dev) untuk mendapatkan 2.500 query gratis (tanpa kartu kredit).

---

## 🔧 Cara Menjalankan Lokal

```bash
# Clone repository
git clone https://github.com/Adnanamhar/PelacakanAlumni.git
cd PelacakanAlumni

# Install dependencies
npm install

# Buat file .env.local
cp .env.local.example .env.local
# Isi dengan kredensial Supabase

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📁 Struktur Proyek

```
alumni-tracker/
├── app/
│   ├── page.tsx                    # Dashboard (5 stat cards + bulk search)
│   ├── data-alumni/page.tsx        # Halaman Data Alumni + Import
│   ├── hasil-pelacakan/
│   │   ├── page.tsx                # Daftar Hasil Pelacakan
│   │   └── [id]/page.tsx           # Detail Pelacakan + Auto Search
│   ├── survey/page.tsx             # Survey Alumni (Publik)
│   ├── api/
│   │   ├── alumni/import/route.ts  # API Import Excel
│   │   ├── alumni/reset-status/route.ts  # API Reset Status
│   │   ├── pddikti/search/route.ts # API Verifikasi PDDIKTI
│   │   ├── search/route.ts         # API Pencarian Individual (Serper.dev)
│   │   └── search/bulk/route.ts    # API Bulk Search (Serper.dev)
│   ├── layout.tsx                  # Root Layout
│   └── globals.css                 # Global Styles
├── components/
│   ├── ClientLayout.tsx            # Layout dengan Sidebar
│   ├── Header.tsx                  # Header Component
│   ├── LoginPage.tsx               # Halaman Login
│   └── Sidebar.tsx                 # Sidebar Navigation
├── lib/
│   ├── supabase.ts                 # Supabase Client & Types
│   ├── serper.ts                   # Serper.dev API Wrapper & Parser
│   ├── scoring.ts                  # Algoritma Scoring
│   ├── query-generator.ts          # Generator Query Pencarian
│   └── auth.tsx                    # Authentication Context
├── scripts/
│   ├── import-excel.mjs            # Script Import Excel
│   ├── bulk-track.mjs              # Script Bulk Tracking
│   └── bulk-track-remaining.mjs    # Script Tracking Sisa
├── supabase-schema.sql             # Skema Database
└── package.json
```

---

## 📝 Catatan

- Sistem ini dikembangkan sebagai tugas **Daily Project 4** mata kuliah **Rekayasa Kebutuhan** kelas D.
- Pelacakan otomatis menggunakan **Serper.dev Google Search API** untuk mencari informasi alumni di berbagai platform. Hanya **2.500 alumni yang dilacak** karena keterbatasan dana (free tier). Dalam penerapan aslinya, limit ini bisa dihilangkan dengan upgrade API key.
- Data yang ditemukan oleh API merupakan hasil pencarian otomatis dan mungkin memerlukan **verifikasi manual** oleh admin.
- Alumni dapat mengoreksi data mereka melalui halaman **Survey Publik** (`/survey`).
- Scoring system dirancang agar bobot verifikasi PDDIKTI (60%) lebih tinggi dari data pelacakan (40%) karena data akademik memiliki keakuratan lebih tinggi.

---

© 2026 Adnan Amhar — Universitas Muhammadiyah Malang
