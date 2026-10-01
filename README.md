# Public Dashboard

Folder ini **mandiri** untuk GitHub Pages/static hosting. Tidak membutuhkan PHP, MySQL, login Admin, atau database.

## Update data
1. Jalankan aplikasi lokal seperti biasa.
2. Login ke Admin lokal.
3. Klik **Publish Public Data**.
4. Publisher akan membuat `public-site/data/public-data.json` dan otomatis mengunggahnya ke repository GitHub melalui GitHub API.
5. GitHub Pages akan menampilkan dashboard publik dari JSON tersebut.

## Struktur tampilan
Public dashboard mengikuti logika halaman `public/report.php` lokal: kartu donut TRING, kartu Progres KPI, tampilan khusus KPI cabang, tabel Mulia, kolom tabel sesuai jenis laporan, serta tombol sort hanya untuk metrik yang memang memiliki kolom tersebut.

Database, file upload mentah, credential, token GitHub, dan Admin tidak ikut dipublikasikan.

## GitHub Pages

Untuk repository yang berisi folder ini sebagai root repository, aktifkan **Settings → Pages → Deploy from a branch** dan pilih branch/folder root. Jika `public-site/` berada di dalam repository yang juga berisi backend, jangan jadikan seluruh repository public; buat repository GitHub terpisah dan upload **isi folder `public-site/` saja**.
