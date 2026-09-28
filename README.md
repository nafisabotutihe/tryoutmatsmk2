# CBT Try Out TKA Matematika SMK - SMK Negeri 2 Gorontalo

Aplikasi Computer-Based Testing (CBT) Try Out TKA Matematika SMK Negeri 2 Gorontalo berbasis React + TypeScript + Vite dan Tailwind CSS. Aplikasi ini siap dipublikasikan ke GitHub dan dideploy secara gratis (Vercel, Netlify, atau GitHub Pages), dengan integrasi sinkronisasi otomatis ke Google Spreadsheet serta sistem keamanan anti-kecurangan modern.

---

## 🌟 Fitur Utama

1. **Integrasi Google Spreadsheet & Apps Script Otomatis**:
   - Jawaban siswa, nilai, durasi, dan log pelanggaran langsung terkirim ke Google Spreadsheet saat tombol selesai ditekan.
   - Menggunakan `LockService.getScriptLock()` untuk menangani **300+ siswa yang mengumpulkan bersamaan** tanpa tabrakan baris (*concurrency-safe*).
   - Dilengkapi *offline queue buffer* dengan *exponential backoff & jitter* agar data tidak pernah hilang meski sinyal HP siswa sempat terputus.

2. **Daftar Peserta Otomatis Sesuai Rombel & Validasi Anti-Duplikasi**:
   - Memuat 294 siswa resmi SMK Negeri 2 Gorontalo pada 11 Rombel:
     - `12-APHP-1`, `12-APHP-2`
     - `12-BUSANA`
     - `12-CANTIK-1`, `12-CANTIK-2`
     - `12-DKV-1`, `12-DKV-2`
     - `12-HOTEL-1`, `12-HOTEL-2`, `12-HOTEL-3`
     - `12-KULINER`
   - Memilih Rombel akan langsung memfilter nama siswa, dan otomatis menampilkan NISN, NIPD, serta Jenis Kelamin.
   - Validasi ketat mencegah siswa yang sama mengumpulkan lembar jawaban dua kali (mencegah duplikasi data).

3. **Kesesuaian 100% dengan Soal CBT HTML Asli**:
   - 25 Soal lengkap dengan stimulus gambar, grafik SVG koordinat, tabel jari-jari planet, dan diagram batang praktikum kimia.
   - Mendukung 3 tipe soal:
     - **Pilihan Ganda (PG)**: 1 jawaban benar.
     - **Pilihan Ganda Kompleks (MCMA)**: Jawaban benar lebih dari satu (checkbox).
     - **Tabel Benar / Salah (BS)**: Matriks pernyataan dengan evaluasi Benar/Salah.

4. **UI Ramah Layar Handphone (Mobile-First)**:
   - Tombol pilihan dengan area sentuh nyaman (min. 48px).
   - Header *sticky* dengan timer hitung mundur 90 menit dan tombol Layar Penuh.
   - *Drawer / Modal Grid* 25 nomor soal untuk navigasi cepat (Status Hijau = Terjawab, Kuning = Ragu-ragu, Abu-abu = Belum dijawab).

5. **Kerahasiaan Jawaban & Nilai Siswa**:
   - Siswa **TIDAK BISA** melihat kunci jawaban maupun skor akhir setelah selesai.
   - Siswa menerima bukti tanda terima digital resmi tanpa bocoran jawaban, sehingga tidak dapat disebarkan ke siswa lain.
   - Skor dan kunci hanya dapat diakses oleh Pengawas melalui Dashboard Admin.

6. **Sistem Keamanan Anti-Kecurangan Modern**:
   - **Mode Layar Penuh (Fullscreen Enforcement)**: Otomatis meminta fullscreen dan memperingatkan saat siswa keluar.
   - **Deteksi Pindah Tab & Buka Aplikasi Lain**: Mendeteksi `visibilitychange` dan `window.blur`.
   - **Deteksi Percobaan Rekam Layar / Split Screen**: Mendeteksi perubahan ukuran layar mendadak dan shortcut perekaman.
   - **Watermark Dinamis Anti-Foto Layar**: Layar dihiasi watermark transparan Nama & NISN siswa secara diagonal untuk mencegah siswa memfoto layar dengan HP lain.
   - **Blokir Pintasan Terlarang**: Mencegah klik kanan, salin/tempel (copy/paste), F12, Inspect Element, dan PrintScreen.
   - Setiap pelanggaran dilaporkan secara *real-time* ke Pengawas dan Google Spreadsheet.

7. **Dashboard Pengawas & Monitoring Real-Time**:
   - Login Pengawas dengan PIN (Default: `admin123`).
   - Kartu statistik langsung: Total Siswa, Sedang Mengerjakan, Sudah Selesai, Belum Mulai, Total Pelanggaran, Rerata Nilai.
   - Tabel monitoring *progress bar* setiap siswa secara *live*.
   - Log aktivitas setiap perangkat peserta.
   - Fitur Reset / Izinkan Ujian Ulang jika ada siswa yang mengalami kendala teknis.
   - Ekspor Rekap Nilai ke format CSV / Excel sekali klik.

---

## 🚀 Panduan Setup Google Spreadsheet & Apps Script (3 Menit)

Agar hasil ujian langsung tersimpan ke Google Spreadsheet:

1. Buka [Google Sheets](https://sheets.google.com) baru di akun Google Drive Anda.
2. Beri judul spreadsheet: **CBT TKA Matematika SMKN 2 Gorontalo**.
3. Klik menu **Ekstensi (Extensions)** &rarr; **Apps Script**.
4. Hapus seluruh kode bawaan yang ada di editor Apps Script, lalu *Paste* kode yang ada di aplikasi (dapat disalin melalui tombol **"Panduan Apps Script"** di dalam aplikasi, atau dari file `src/services/appsScriptTemplate.ts`).
5. Klik ikon **Simpan (Save / Ctrl+S)**.
6. Klik tombol biru **Terapkan (Deploy)** di pojok kanan atas &rarr; pilih **Penerapan Baru (New deployment)**.
7. Pilih jenis: **Aplikasi Web (Web app)**:
   - **Deskripsi**: `CBT Handler Gorontalo`
   - **Jalankan sebagai (Execute as)**: `Saya (Me)`
   - **Yang memiliki akses (Who has access)**: `Siapa saja (Anyone)` *(Wajib agar siswa dapat mengirim data tanpa perlu login akun Google)*
8. Klik **Terapkan (Deploy)** &rarr; Klik **Beri Akses (Authorize)** &rarr; Pilih akun Google &rarr; Klik **Lanjutan (Advanced)** &rarr; Klik **Buka CBT (tidak aman)** &rarr; Klik **Izinkan**.
9. Salin **URL Aplikasi Web** (URL yang berakhiran `/exec`).
10. Web App URL telah disematkan secara default pada aplikasi:
    ```
    https://script.google.com/macros/s/AKfycbyFz9xjxSMvACuVcUkyJic7EaNleZkG2eSSKVDXtUNFM05KgmXHe88RV94sisJ5aNuK8g/exec
    ```
    Pengawas juga dapat mengganti atau menguji koneksi kapan saja melalui Dashboard Pengawas (PIN: `MATEMATIKA123`).

Spreadsheet Anda akan otomatis memiliki 3 sheet:
- `HASIL_UJIAN`: Rekapitulasi nilai, jawaban, durasi, dan rincian pelanggaran.
- `LOG_PELANGGARAN`: Audit trail pelanggaran siswa dengan timestamp.
- `MONITORING_REALTIME`: Status progres langsung peserta ujian.

---

## 💻 Cara Menjalankan Aplikasi Secara Lokal & Publikasi ke GitHub

### 1. Menjalankan di Komputer Lokal
```bash
# Install seluruh dependensi
npm install

# Jalankan server pengembangan lokal
npm run dev
```
Buka browser pada alamat `http://localhost:3000`.

### 2. Mempublikasikan ke GitHub & Vercel / GitHub Pages
```bash
# Inisialisasi Git (jika belum)
git init
git add .
git commit -m "feat: CBT Try Out TKA Matematika SMKN 2 Gorontalo"

# Push ke repositori GitHub Anda
git branch -M main
git remote add origin https://github.com/USERNAME/cbt-tka-smkn2-gorontalo.git
git push -u origin main
```
Aplikasi dapat dideploy secara gratis ke **Vercel** atau **Netlify** cukup dengan menghubungkan repositori GitHub tersebut.

---

## 🔒 Hak Akses & PIN Pengawas
- **Default PIN Pengawas**: `MATEMATIKA123` (dapat diubah langsung melalui Dashboard Pengawas atau local storage).
