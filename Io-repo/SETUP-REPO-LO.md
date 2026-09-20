================================================================
 VARIAN: PAKAI REPO `lo` YANG SUDAH ADA (TIDAK PERLU REPO BARU)
================================================================
Ini pengganti LANGKAH 1-2 di README-SETUP.md. Repo `akiomida/lo`
Anda SUDAH berisi situs di root + slot/ + referee/ + workflow
papan — semuanya dipertahankan. Yang kita lakukan hanya:

  [1] sinkronkan file situs ke v12+P24 (sekali),
  [2] tambah 2 file baru (scripts/gen_slots.js + workflow),
  [3] pasang Secret SLOT_PRIV,
  [4] pilih tujuan hosting (Cloudflare Pages atau GitHub Pages),
  [5] tes pertama.

ISI FOLDER lo-repo/ (untuk disalin-tempel ke repo):
  rotasi-slot.yml   -> isi .github/workflows/rotasi-slot.yml
  gen_slots.js      -> isi scripts/gen_slots.js
  SETUP-REPO-LO.md  -> file ini

DISIPLIN RAHASIA (repo Anda PUBLIK — tetap aman selama ini):
  - Secret GitHub terenkripsi & otomatis disensor di log
    Actions, walau repo publik. Kunci aman di Secret.
  - YANG DILARANG KERAS: meng-upload file keys/akmd_slot_priv.jwk
    atau menyalin isinya ke file mana pun di repo. Kunci hanya
    lewat Settings -> Secrets. Kalau sampai ter-commit:
    HENTIKAN, chat saya (kunci harus diganti permanen).

STRUKTUR AKHIR REPO `lo` (target — bandingkan sebelum commit)
--------------------------------------------------------------
  .github/workflows/
    (workflow papan Anda)   BIARKAN - jangan dihapus
    rotasi-slot.yml         BARU   - tempel isi lo-repo/rotasi-slot.yml
  assets/js/
    avg.js                  TIMPA  (1.547 B, v12+P24)
    three.r128a.js          TIMPA/ada
    ads.js                  TIMPA/ada
  slot/
    latest.js               TIMPA dari site/ - selanjutnya OTOMATIS oleh Actions
    s/1242xx.js             OTOMATIS - Actions hapus-pasang tiap rotasi
  referee/ (3 file .json)   TIMPA/ada
  papan/                    BIARKAN - urusan bot papan harian
  scripts/
    gen_slots.js            BARU   - tempel isi lo-repo/gen_slots.js
  index.html                TIMPA  (31.501 B)
  media.js                  TIMPA  (1.206.134 B)
  _headers, robots.txt, sitemap.xml, manifest.webmanifest
                            TIMPA dari site/
  favicon.ico/.svg, icon-192.png, icon-512.png,
  apple-touch-icon.png, akmd-og.png, THIRD-PARTY-NOTICES.txt
                            TIMPA dari site/
  about.html, privacy.html, terms.html, boost.json,
  google*.html, README.md, web.config, htaccess, .nojekyll
                            BIARKAN - tidak ada di kit, jangan dihapus
  keys/                     JANGAN PERNAH ADA di repo
  akit.html, dokumen .txt   JANGAN PERNAH ADA di repo

  Ringkasnya yang Anda kerjakan hanya 3:
  (1) upload isi site/ (timpa), (2) buat scripts/gen_slots.js,
  (3) buat .github/workflows/rotasi-slot.yml.
  Selebihnya: sudah ada (biarkan) atau otomatis (Actions).

LANGKAH 1 — Sinkronkan file situs ke v12+P24 (SEKALI)
  Tujuannya supaya isi repo = paket resmi v12+P24 (otomatisasi
  menyebar dari repo ini).
  1. Buka repo lo -> Add file -> Upload files.
  2. Upload SEMUA isi folder site/ dari kit (folder automation-kit):
       index.html, media.js, _headers, robots.txt, sitemap.xml,
       manifest.webmanifest, favicon.ico, favicon.svg,
       apple-touch-icon.png, icon-192.png, icon-512.png,
       akmd-og.png, THIRD-PARTY-NOTICES.txt,
       folder assets/js  (avg.js, three.r128a.js, ads.js),
       folder slot/      (latest.js + s/*.js — nomor boleh beda),
       folder referee/   (3 file .json)
     -> Commit changes.
     File repo yang TIDAK ada di kit (about.html, privacy.html,
     terms.html, boost.json, google*.html, README.md, dll)
     BIARKAN — jangan dihapus.
  3. Verifikasi (klik file di repo, lihat ukurannya):
       index.html       = 31.501 B
       media.js         = 1.206.134 B
       assets/js/avg.js = 1.547 B
     Kalau cocok = repo sudah v12+P24.
  CATATAN: slot lama yang kedaluwarsa di slot/s/ tidak perlu
  dibersihkan manual — rotasi pertama otomatis menghapusnya.

LANGKAH 2 — Tambah scripts/gen_slots.js
  1. Repo -> Add file -> Create new file.
  2. Ketik nama filenya persis:  scripts/gen_slots.js
     (mengetik "scripts/" otomatis membuat foldernya).
  3. Salin SELURUH isi gen_slots.js dari folder lo-repo/ ->
     tempel ke kolom editor.
  4. Commit changes.

LANGKAH 3 — Tambah workflow (JANGAN lewat upload)
  1. Masuk folder .github/workflows (sudah ada karena workflow
     papan Anda) -> Add file -> Create new file.
  2. Ketik nama filenya:  rotasi-slot.yml
  3. Salin SELURUH isi rotasi-slot.yml dari folder lo-repo/ ->
     tempel -> Commit changes.
  4. PENTING: workflow papan yang sudah ada JANGAN dihapus.
     Dua-duanya hidup damai (workflow rotasi pakai rebase).

LANGKAH 4 — Pasang Secret SLOT_PRIV (WAJIB)
  1. Buka keys/akmd_slot_priv.jwk dari kit -> salin SELURUH isi.
  2. Repo -> Settings -> Secrets and variables -> Actions ->
     tab Secrets -> New repository secret:
       Name : SLOT_PRIV
       Value: (tempel isi kunci)
  3. HAPUS folder keys/ dari perangkat Anda sekarang.

LANGKAH 5 — Pilih tujuan hosting (PILIH SATU)
  [A] akiomida.com di CLOUDFLARE Pages (sesuai rencana semula):
      1. Account ID: dashboard Cloudflare -> salin di kanan layar.
      2. API Token: profil -> My Profile -> API Tokens ->
         Create Token -> templat "Cloudflare Pages - Edit" ->
         Create -> salin (hanya tampil sekali).
      3. Repo -> Settings -> Secrets and variables -> Actions:
         Tab Secrets, tambah 2:
           CLOUDFLARE_ACCOUNT_ID = (dari butir 1)
           CLOUDFLARE_API_TOKEN  = (dari butir 2)
         Tab Variables, tambah 2:
           DEPLOY_CF  = 1
           CF_PROJECT = nama project Pages Anda (persis seperti
                        di URL Workers & Pages, mis. "akiomida")
  [B] akiomida.com di GITHUB Pages (domain custom di Settings ->
      Pages repo ini):
      TIDAK PERLU apa-apa. Setiap commit rotasi otomatis
      memicu deployment GitHub Pages (seperti bot papan Anda).

LANGKAH 6 — Tes pertama
  1. Repo -> Actions -> rotasi-slot -> Run workflow -> Run.
  2. Tunggu 1-2 menit -> centang hijau = SUKSES.
  3. Bukti: muncul commit "rotasi slot otomatis ..." oleh
     akmd-bot, dan (jika jalur [A]) deployment CF Pages baru.

VERIFIKASI DI SITUS
  - Buka https://akiomida.com/slot/latest.js -> angka "cur"
    lebih baru, "exp" ~4 jam ke depan.
  - Banner "Papan skor sementara terbatas" hilang dalam
    <=2 menit (cache slot 120 detik).

SETELAH INI — NOL RUTINITAS
  - Slot terbit & terpasang otomatis 6x/hari
    (07.17 / 11.17 / 15.17 / 19.17 / 23.17 / 03.17 WIB).
  - Mengubah situs di masa depan: upload file baru ke repo ->
    selesai (rotasi berikutnya menyebarkannya ke CF Pages;
    GitHub Pages hidup seketika saat commit).
  - Balik ke manual: Settings -> Actions -> rotasi-slot ->
    Disable dulu, baru upload manual. Jangan dua jalur.

DARURAT
  - Kunci bocor / salah upload kunci ke repo:
    chat saya -> kunci baru (--init --force) + bake ulang NET +
    ganti Secret SLOT_PRIV.
  - Kampanye anti-mod (slot racun --px 1): chat saya ->
    terbitkan racun lewat repo, salinan bajakan kena 3 menit.
