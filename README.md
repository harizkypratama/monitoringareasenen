# Public Dashboard

Folder ini **mandiri** untuk GitHub Pages/static hosting. Tidak membutuhkan PHP, MySQL, login Admin, atau database.

## Update data
1. Jalankan aplikasi lokal seperti biasa.
2. Login ke Admin lokal.
3. Klik **Publish Public Data**.
4. File `data/public-data.json` akan diperbarui.
5. Upload/push **isi folder `public-site/`** ke repository GitHub public.
6. GitHub Pages akan menampilkan dashboard publik dari JSON tersebut.

Database, file upload mentah, credential, dan Admin tidak ikut dipublikasikan.

## GitHub Pages

Untuk repository yang berisi folder ini sebagai root repository, aktifkan **Settings → Pages → Deploy from a branch** dan pilih branch/folder root. Jika `public-site/` berada di dalam repository yang juga berisi backend, jangan jadikan seluruh repository public; buat repository GitHub terpisah dan upload **isi folder `public-site/` saja**.
