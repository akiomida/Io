# SETUP GERBANG + TIKET + NPC v13+P27 — v12+P24 → v13 → v13+P27 (G7-G10, P25 EMOTI, P26 SEPI, P27 KAMUFLASE)

Panduan klik-per-klik memasang **10 gerbang** (6 sudah hidup + 4 baru),
**tiket sesi wasit**, **peningkatan anti-nampak-bot** (emoji NPC +
balas dendam + beku saat internet mati), dan **P27 KAMUFLASE**
(anti-reverse-engineering: simbol tanpa identitas + 9.864 string
tersandika + penyimpanan opak beramplop). Semua gerbang baru sifatnya
**fail-open**: gagal atau dilewati = game TETAP hidup normal.

---

## PETA 10 GERBANG

| # | Gerbang | Status | Penjelasan singkat |
|---|---------|--------|--------------------|
| G1 | Segel loader | SUDAH HIDUP | Script boot di-hash ke kunci dekripsi. Edit satu byte = game tak terdekrip. |
| G2 | Sandi terikat domain | SUDAH HIDUP | media.js tersandi hanya terbuka di domain resmi. |
| G3 | Hash plaintext WASM | SUDAH HIDUP | Hasil dekripsi diverifikasi hash WASM sebelum tampil. |
| G4 | Token avg terikat domain | SUDAH HIDUP | avg.js hanya bermakna di domain resmi. |
| G5 | Slot ECDSA P-256 | SUDAH HIDUP | slot/latest.js ditandatangani, ada exp/poison/jendela. |
| G6 | Mode terbatas salinan | SUDAH HIDUP | Mirror = dompet/papan mati + batas waktu. |
| G7 | Integritas avg.js | **BARU** | SHA-384 saat fetch; mismatch = telemetri, game jalan terus. |
| G8 | Integritas referee JSON | **BARU** | 3 file referee/ diverifikasi SHA-384; mismatch = telemetri. |
| G9 | Tiket sesi HMAC | **BARU** | 1 GET per ~30 menit/sesi, stateless (tanpa KV/antrean). POST wasit dibawa X-AK-Ticket; tiket busuk = flag; tanpa tiket = lolos. |
| G10 | Telemetri + manifest | **BARU** | Flag integritas diselipkan ke batch wasit (nol request ekstra) + gerbang.json. |

### Baru di v13 — NPC makin manusiawi (P25 EMOTI + P26 SEPI)

1. **Emoji NPC sesuai kondisi** (bukan spam): marah saat ditembak 😠😤,
   takut saat melarikan diri 😱, kaget saat sekutunya tumbang 😲,
   gloat saat pemain tumbang 😈😆, berburu 🎯, dash 💨, makan 😋,
   idle sesekali 👀🤔😴. Rem anti-spam: jeda global 2,1–4,7 dtk +
   jeda per-NPC 7–21 dtk + hanya di dekat pemain + maks 3 gelembung.
2. **Balas dendam**: rival bergengsi (grudge ~30-50% populasi) yang
   ditembak dan selamat akan MENGEJAR penembak (ve/huntT) walau
   sedikit lebih kecil — menambah rasa "pemain kesal".
3. **Internet mati = dunia BEKU TOTAL** (memakai bendera beku bawaan
   engine, `je.frz`): overlay "Connection Lost" premium (blur, ikon
   melayang, tombol bernapas) + probe gagal 2x langsung memutus tanpa
   menunggu kalibrasi. Internet kembali = dunia lanjut + mercy.
4. Uji browser nyata: boot, main aktif 26 dtk (tembak-tembakan),
   offline beku + pulih — **nol pageerror**.

### Baru di v13+P27 — KAMUFLASE (jawaban laporan pembobol)

Laporan: nama fungsi (McGet/McAdd/McSt/AkE/AkD/TRbuild) cukup untuk
menebak peran; string UI ("biaya 50 Micda", "accounts below 50",
format AKM-/AKT1|) menuntun alur; pola klasik baca → localStorage →
encrypt → reload tinggal diikuti. Jawaban P27:

1. **Simbol tanpa identitas**: 13 nama sidik jari diganti sentinel +
   mangle toplevel seluruh inti — Mc*/Ak*/TR* tidak lagi ada.
2. **9.864 string tersandika**: tabel XOR-12B unik per-build, dekrip
   saat dipakai — "biaya 50 Micda"/"below 50" dsb. tak lagi dibaca
   grepe.
3. **Sidik jari anti-tamper dihitung ulang** dari teks final (DX &
   _WB) sehingga penjaga inti tetap sah pasca-mangle.
4. **Penyimpanan opak beramplop**: shim localStorage — kunci virtual
   → alias fisik `z…`, isi beramplop `k2.` + RC4 + MAC, kunci lama
   jadi UMPAN mati, tombstone anti-zombie, shim dibekukan (anti
   penimpaan oleh penjaga inti). Pola klasik tidak lagi mengikuti
   alur yang sama.
5. Uji: **sim 62/62 PASS, e2e browser nyata 8/8 PASS** (koin 5→10
   = ekonomi sah, 50+ kunci fisik z* beramplop, tanpa nama game di
   penyimpanan, emote P25 utuh). Residu disengaja: prosa HTML yang
   memang tampil ke pemain & format publik AKM- (validasi input).

---

## FILE YANG DIKIRIM (folder `site/` kit = paket upload)

1. `index.html` — 38.816 B (gerbang G7-G10 + shim P27 + segel baru).
2. `media.js` — 1.433.954 B (payload v13+P27, terenkrip ulang).
3. `assets/js/avg.js` — 1.627 B (mp 18 entri + F0 inti P27).
4. `gerbang.json` — manifest audit (sha385/len 5 file).
5. `gerbang/gen_gerbang.js` — generator manifest (idempoten; di repo
   taruh di `scripts/`).
6. `gerbang/worker-v3.js` — worker wasit v3 (tiket + gw).

## LANGKAH 1 — Upload statis (repo `Io` root)

Commit 5 file: `index.html`, `media.js`, `assets/js/avg.js`,
`gerbang.json` (semua dari `site/`), plus `gen_gerbang.js` (dari
folder `gerbang/` kit → taruh di `scripts/gen_gerbang.js` repo).
CF Pages auto-build & deploy (paket penuh), GH Pages ikut.

⚠️ TIGA file inti (index.html + media.js + avg.js) adalah PASANGAN
SATU GENERASI — jangan campur dengan versi lama.

## LANGKAH 2 — Pasang worker v3

1. Dashboard Cloudflare → Workers → worker wasit (route `/api/*`) → Edit code.
2. Salin seluruh isi `gerbang/worker-v3.js` (kit), timpa kode lama.
3. (Opsional) `WASIT_TICKET_TTL` = `1800000`.
4. Save & Deploy. TANPA secret baru — tiket memakai `WASIT_SECRET` lama.

## LANGKAH 3 — Verifikasi hidup

```bash
curl https://akiomida.com/api/wasit/ping        # -> {"ok":"wasit","v":3,...}
curl "https://akiomida.com/api/wasit/ticket?u=TestUid1234567890"
curl -s https://akiomida.com/gerbang.json | head -5
```

Browser (F12 → Console): `window.__AKGW_SHA.avg` ada; mainkan ~1 menit —
NPC sesekali memunculkan gelembung emoji; matikan internet → dunia beku
+ overlay Connection Lost; nyalakan lagi → dunia lanjut.

## LANGKAH 4 — OPSIONAL: workflow + gerbang

Ganti `.github/workflows/rotasi-slot.yml` dengan
`rotasi-slot-plus-gerbang.yml` (1 langkah baru, gagal lunak, tetap hijau).

## ROLLBACK

- Statik: kembalikan index.html/media.js/assets/js/avg.js versi lama
  → CF rebuild (Pages -> Deployments -> Rollback juga bisa instan).
- Worker: timpa lagi kode v2 → ping kembali `v:2`.
- Ledger KV tidak berubah format (v2) — aman bolak-balik.
- P27 fail-open: browser lama tanpa getter = tanpa shim, tanpa efek.
