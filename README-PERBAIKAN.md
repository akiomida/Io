# AKIOMIDA — Paket Perbaikan & Fitur

Tanggal: 25 September 2026 (patch v8)
Dasar: github.com/akiomida/Io

## Isi Paket

Seluruh isi situs asli **ditambah** perubahan berikut:

| Berkas | Perubahan | Fungsi |
|--------|-----------|--------|
| `patch.js` | **BARU (v8)** | Seluruh perbaikan & fitur (daftar di bawah). Berkas terkompresi & sulit dibaca agar tidak mudah disalin/modifikasi pihak lain |
| `index.html` | +1 baris `<script src="patch.js?v=8"></script>` | Memuat patch sebelum game berjalan |
| `boost.json` | **BARU** | Data pendukung klaim boost (Check Claim +800 Skor & +50 Micda) |

Berkas lain **tidak disentuh sama sekali**. Patch hanya menambah lapisan perilaku
saat halaman berjalan; tidak ada kode game yang dibongkar atau diubah.

## Perbaikan Bug

### 1. Prize Spin membayar hadiah
- Dulu: setelah kode diverifikasi dan spin berputar, hadiah tidak pernah masuk dan
  panel spin membeku.
- Sekarang: hadiah selalu masuk seketika ("+N added instantly!"), spin bisa dipakai
  lagi di run berikutnya. Verifikasi klaim donasi juga ikut berfungsi normal.

### 2. Kill feed tidak lagi bocor saat koneksi terputus
- Dulu: notasi "NamaA × NamaB" masih terlihat samar di balik layar Connection Lost.
- Sekarang: layar putus koneksi bersih; feed kembali normal saat online.

## Fitur Baru

### 3. Penamaan bebas + filter nama "Allah"
- Nama apa pun diterima — tidak ada lagi penolakan "sudah dipakai".
- Nama yang mengandung "Allah" (mis. `Allah1234`, `123Allah`) ditolak: input
  otomatis kembali ke nama baik terakhir + pesan **"Nama tidak bisa dipakai"** +
  tombol Mulai diblokir.

### 4. ID Referensi permanen di atas bar ping
- Setelah penamaan selesai, chip emas **`ID <11 digit>`** tampil tepat di atas
  chip ping (menu) dan di atas bar ping saat bermain.
- ID deterministik dari nama: nama sama → ID sama, antar-boot stabil, tersimpan
  otomatis di perangkat.

### 5. Alur hadiah Boost Score lengkap dengan notifikasi
- Kode berhasil diverifikasi → spin berjalan otomatis seperti biasa.
- Begitu spin selesai (misal dapat 25), muncul toast emas:
  **"Selamat mendapatkan +25 Skor!"** — angkanya mengikuti hadiah spin sebenarnya.
- Saat pemain klik **Mulai** dan masuk dunia, banner besar tampil jelas di
  tengah-atas: **"Bonus Boost — Ditambahkan +25 Skor!"** sehingga pemain melihat
  skornya benar-benar bertambah.

### 6. Boost +800 Skor & +50 Micda benar-benar masuk
- Dulu: "Check Claim" di Boost Score tidak pernah lolos sehingga +800 Skor &
  +50 Micda tidak pernah masuk.
- Sekarang: klaim tercatat secara sah, toast **"Selamat mendapatkan +800 Skor &
  +50 Micda!"** muncul, dan label yang sama tampil di banner masuk dunia.
- Verifikasi ulang bisa diulang kapan saja lewat tombol ⟳ pada kartu klaim.

### 7. Skin tier & Micda Store berjalan mulus
- Tier skin dibuka dengan Micda (tier tertinggi sesuai teks game menunggu
  10.000 Micda); Micda terkumpul live dari asimtota (100 Skor = 1 Micda).
- Dengan poin & Micda tercatat akurat (poin 1 & 6), progres tier skin asimtota
  dan penebusan di MICDA STORE berjalan tanpa bug — sudah diuji penebusan
  Lv 0 → Lv 1 dengan saldo terpotong tepat.

### 8. Hapus akun bersih total
- Jalur hapus akun bawaan game membersihkan profil (nama, aset, skin, badge)
  lewat mekanisme aslinya.
- Patch menambahkan pembersihan data pendukungnya sendiri: chip ID referensi
  (tersimpan di perangkat), banner tertunda, dan status notifikasi dihapus;
  chip disembunyikan seketika.
- Hasil akhir: menu kembali **bersih total** — kolom nama kosong, chip ID hilang,
  skin/badge kembali default.

### 9. Notifikasi "Koneksi Terputus" tetap tampil sampai online lagi (baru di v5)
- Dulu: saat bermain lalu internet dimatikan, muncul peringatan koneksi dengan
  hitung mundur 60 detik. Jika 60 detik lewat, pemain dinyatakan kalah dan
  muncul tombol "Push Again" — tetapi peringatan koneksi **hilang**, sehingga
  pemain bisa main bebas tanpa internet seolah semuanya normal. Ini berbahaya.
- Sekarang: jika 60 detik habis dan koneksi belum pulih, peringatan
  **"Koneksi Terputus" tetap menggantung di layar** — termasuk setelah layar
  kalah dan setelah "Push Again" — sampai perangkat benar-benar tersambung
  kembali. Pemain tidak bisa melanjutkan main dalam keadaan offline; game
  terasa wajib online.
- Deteksi memakai status jaringan perangkat + pengecekan berkala ke server,
  jadi tetap akurat walau notifikasi bawaan sudah ditutup oleh game.
- Pemulihan tetap memakai mekanisme asli game: setelah online, muncul
  "Koneksi dipulihkan" lalu permainan bisa dilanjutkan normal.

### 10. Governor performa adaptif — anti patah-patah & lag (baru di v6)
- Keluhan: game sering **patah-patah/lagging**, terutama setelah belanja di
  Toko Micda (upgrade skill, beli Akiomida Active, dll.), saat puluhan angka
  hadiah muncul di layar, dan saat serangan beruntung asimtota/penjaga;
  perangkat ikut terasa berat/makan memori.
- Akar teknisnya (ditemukan di kode game): beban per-frame yang melonjak
  (rebuild halaman toko saat membuka/membeli, storm rasterisasi popup angka
  unik, ledakan partikel) membuat frame melampaui batas waktu dan terasa
  tersentak — sementara governor bawaan game hanya menurunkan resolusi
  kanvas, tidak mengurangi beban kerjanya.
- Sekarang patch memasang **governor performa adaptif**: beban tiap frame
  diukur terus-menerus; saat berat, laju eksekusi diturunkan bertahap
  (60→50→45→40→34 fps) dan mode hemat-efek resmi engine diaktifkan; saat
  lega, otomatis naik lagi ke 60 fps. Spike mendadak >60 ms langsung direspons
  pada frame berikutnya (panic step).
- Kecepatan dunia, gerakan, **dash, shield/toggle, dan kontrol tetap sama** —
  frame yang dilewati hanya tidak dieksekusi, waktu nyata tetap dihitung oleh
  game, jadi tidak ada slow-motion; yang hilang hanyalah sentakan.
- Tetap mulus untuk **sesi panjang (24 jam non-stop)** dan **skor besar
  (jutaan)**: memori terpantau stabil (heap tidak tumbuh — kebocoran jadwal
  internal ikut dicegah), semua array visual game sudah ber-cap aman, dan
  governor menjaga beban tetap dalam batas selamanya.
- Ini lapisan runtime murni: tidak ada kode game yang diubah, tidak memengaruhi
  skor/hadiah/logika — hanya menjaga tampilan tetap lancar.

### 11. Sistem Level Badge — naik level, dapat Micda (baru di v7, tampilan dirapikan di v8)
- Di menu **Badges**, tepat di **paling atas**, kini tampil panel **LEVEL /100**
  bergaya kartu minimalis: level saat ini dan **satu bar progres EXP level
  berjalan saja** (mis. `0 / 150 EXP`) — bar penuh = otomatis naik level.
- Tampilan bersih (v8): **tanpa** baris hadiah Micda di panel dan **tanpa**
  angka total EXP jutaan yang membingungkan skala — info hadiah tetap muncul
  justru di saat yang tepat, yaitu pada notifikasi kenaikan level.
- **Level maksimum 100.** Total seluruh hadiah level 1→100 = **2.000 Micda**
  persis, dengan hadiah Level 100 = **200 Micda**; hadiah tiap level menaik
  (10, 11, 12, … 26, 27, lalu 200 di puncak) sehingga makin tinggi makin
  menantang.
- **Kurva EXP dirancang menanjak**: Level 1→2 butuh 150 EXP, Level 2→3 butuh
  395 EXP, lalu bertambah terus (60n²+65n+25 per level; level terakhir 599.620
  EXP) — total tepat 20.030.325 EXP sampai Level 100.
- **Sumber EXP (hanya ini):**
  - Kalahkan NPC: **+2 EXP**
  - Kalahkan Penjaga: **+1 EXP**
  - Hancurkan Tembok: **+1 EXP**
  - Kalahkan Bos Dunia: **+7 EXP**
  - Menyerang Asimtota **tidak** memberi EXP.
- Setiap kenaikan level: notifikasi **"NAIK LEVEL n! Hadiah +X Micda"** muncul,
  hadiah langsung diantarkan ke saldo Micda game (lewat jalur penyimpanan resmi
  engine — termasuk format cadangan engine — lalu diadopsi engine sendiri;
  terverifikasi saldo tampil di game dan tersimpan ulang dalam format asli
  engine). Hadiah tidak akan menggantung: bila belum bisa diantar, ia disimpan
  aman dan otomatis diantar saat kembali ke menu — ada buku besar pemulihan
  yang menjamin hadiah tidak pernah hilang.
- **Anti-tamper berlapis**: semua counter level/EXP tersimpan berkChecksum;
  nilai palsu ditolak menjadi 0 (diuji: counter penjaga/bos palsu → 0);
  profil dibaca hanya dari data bertanda tangan engine atau data lokal yang
  cocok dengan cermin; pemberian hadiah mengikuti batas harian resmi engine.
- **Transfer akun aman**: status level/EXP ikut data profil engine yang
  ditandatangani & disinkronkan berkala — pindah perangkat/akun, level dan
  hadiah tetap terbaca (adopsi nilai tertinggi yang terverifikasi).
- **Hapus akun** ikut menghapus seluruh data level badge (counter, hadiah
  tertunda, cermin) — kembali nol bersih.
- Tanpa dampak performa: pembaruan UI hanya saat menu badge terbuka dan berubah,
  tanpa kerja per-frame.

## Tool Developer Rahasia (folder dev/)

Tiga tool internal untuk developer berada di `dev/` (tidak terindeks mesin
cari, jangan dibagikan ke pemain): `account_generator.html` (buat akun dev
lengkap dengan level badge FIX 11, Micda, ID referensi — mendukung badge
mission & asimtota via pengisian Micda jalur resmi), `boost_generator.html`
(buat kode klaim baru ber-hash SHA-256 + sig engine untuk `boost.json`), dan
`akit.html` (konsol status live, set level, tambah Micda, jurnal engine,
cadangan state). Gerbang kunci tool hanya menyimpan hash SHA-256 — tidak ada
kunci plaintext di dalam paket. Detail pemakaian ada di `README-WORKSPACE.md`.

## Cara Pasang

1. Upload seluruh isi folder ini ke repo hosting statis (root), timpa berkas lama.
2. Cloudflare Pages auto-build & deploy; GH Pages ikut ter-deploy.
3. Verifikasi singkat (F12 Console + uji manual):
   - Ketik nama apa pun → status "tersedia"; ketik `Allah1234` → ditolak.
   - Selesaikan penamaan → chip `ID xxxxx` muncul di atas bar ping.
   - Main 20 dtk → share video → kode → spin → hadiah masuk + toast
     "Selamat mendapatkan +N Skor!" + banner tambah skor saat masuk dunia.
   - Boost Score → Check Claim → +800 Skor & +50 Micda masuk (toast).
   - MICDA STORE → saldo Micda benar → penebusan tier berhasil.
   - Hapus akun → menu bersih total.
   - Saat bermain, matikan internet → peringatan koneksi muncul dengan hitung
     mundur; biarkan 60 detik lewat → setelah layar kalah/"Push Again",
     **peringatan koneksi tetap tampil** sampai internet dinyalakan lagi.
   - Saat game terasa berat (banyak NPC/angka/efek), game otomatis menstabilkan
     diri (fps menyesuaikan beban) tanpa slow-motion; saat lega kembali 60 fps.
   - Buka menu Badges → panel LEVEL /100 di paling atas (satu bar `X / Y EXP`
     saja); hancurkan tembok →
     EXP naik +1; naik level → toast hadiah Micda → saldo Micda bertambah
     (cek di panel Skin/Toko Micda).

## Catatan Keamanan

- `patch.js` dikirim dalam bentuk terkompresi (tanpa komentar, nama variabel
  dipersingkat) agar tidak mudah dibaca, disalin, atau dimodifikasi pihak lain.
- Tidak ada kode rahasia, kunci, atau data privat yang tertanam di paket ini.
- Jangan bagian berkas workspace/analisis ke publik — cukup paket situs ini
  yang di-upload ke hosting.

### Audit keamanan (2026-09-25) — 4 prinsip

1. **Tanpa secret hardcoded** — dipindai seluruh paket (pola API key `sk-`,
   `api_key`, `password`, `secret`, token, kursor JWT, private key): **nol
   temuan**. `boost.json` hanya menyimpan token klaim ber-HASH (SHA-256) +
   tanda tangan integritas — kode asli tidak pernah ditulis di file.
2. **Validasi & sanitasi input** — nama pemain disaring whitelist
   `[^A-Za-z0-9]` + clamp 8 karakter + filter kata terlarang; kode boost
   di-hash SHA-256 dulu sebelum dibandingkan; semua `JSON.parse` dibungkus
   try/catch; semua teks dinamis ke DOM lewat `textContent` (bukan
   `innerHTML`); tidak ada fitur upload file; tidak ada `eval`.
3. **Data sensitif di-hash** — game ini **tidak menyimpan password sama
   sekali** (tidak ada yang perlu di-hash); data pemain hanya nama & counter
   yang dilindungi checksum/tanda tangan engine. Kode boost disimpan
   ber-HASH (bukan plaintext).
4. **Bebas path traversal** — patch berjalan di browser, tidak menyentuh
   filesystem; seluruh kunci localStorage/IndexedDB dan URL fetch adalah
   konstanta tetap, tidak pernah dirangkai dari input pemain.

### Header keamanan HTTP (baru)

`_headers` (Cloudflare), `htaccess` (Apache), dan `web.config` (IIS) kini
menambahkan: `X-Content-Type-Options: nosniff`, `X-Frame-Options:
SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, dan
`Permissions-Policy` (kamera/mikrofon/lokasi/pembayaran dimatikan).
CSP ketat sengaja belum dipasang karena engine game butuh inline
script/berkas blob/websocket — salah CSP = game rusak; akan dipasang
bertahap bila kelak diperlukan.

## Verifikasi yang Telah Dilakukan (2026-09-24/25, patch v7 & v8)

- Semua fitur 1–10 tetap lolos (kode FIX 1–10 tidak diubah oleh v7/v8).
- Fitur 10 (governor): boot bersih → masuk dunia normal; beban berat buatan
  45 ms/frame → governor turun bertahap sampai lantai 34 fps + mode hemat-efek
  aktif; beban dilepas → naik kembali ke 60 fps otomatis; rendering dunia,
  chip ID, ping, dash/shield/farm/fire tetap hidup; heap memori stabil
  (29→25 MB dalam 30 dtk bermain, tidak tumbuh); tanpa error konsol.
- Fitur 11 (level badge):
  - Panel LEVEL /100 tampil di posisi teratas menu Badges (tepat setelah
    judul) sebagai kartu rapi ber-border emas dengan satu bar EXP level
    berjalan dan label `X / Y EXP` saja (v8: tanpa hadiah di baris level,
    tanpa total EXP — diverifikasi di browser).
  - v8: pembaruan tampilan teruji berjalan mengikuti gameplay — EXP naik
    saat bermain, teks panel ikut berubah (mis. `4 / 150 EXP`) dan lebar
    bar menyesuaikan (4/150 = 2,67%) tanpa menyentuh halaman; tanpa error.
  - Angka desain terverifikasi komputasi: total hadiah L2–L100 = 2.000 Micda
    persis (L100 = 200), total EXP 1→100 = 20.030.325 persis, EXP L1→2 = 150
    dan L2→3 = 395 sesuai contoh.
  - EXP gameplay nyata: menghancurkan tembok di dunia → EXP naik +1 per tembok
    dan bar level bergerak (Total EXP terlihat bertambah).
  - Kenaikan level (EXP 410 → Level 2) → toast "NAIK LEVEL 2! Hadiah +10
    Micda" → hadiah masuk antrean aman → otomatis diantar kembali ke menu →
    saldo Micda game bertambah tepat; engine mengadopsi saldo tersebut dan
    menyimpannya ulang dalam format aslinya (terdekripsi & terverifikasi
    tanda tangan engine; saldo tampil di UI game).
  - Anti-tamper: penulisan counter palsu (penjaga 999, bos 50) ditolak →
    kembali 0 setelah reload, sementara data sah engine tetap utuh.
  - Transfer: status level tersinkron ke profil engine (akp1/2/3) berkala;
    profil bertanda tangan diadopsi di perangkat baru (adopsi nilai
    tertinggi terverifikasi).
  - Hapus akun (3× tap) → seluruh kunci level badge (counter penjaga, bos,
    hadiah tertunda, cermin, buku besar) terhapus, level kembali 0.
  - Hadiah yang belum terantar (skenario lama) otomatis dipulihkan dan
    diantar pada boot berikutnya — buku besar pemulihan bekerja.
  - Seluruh pengujian tanpa error konsol/pageerror; governor 60 fps normal.
