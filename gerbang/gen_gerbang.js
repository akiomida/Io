#!/usr/bin/env node
/* ====================================================================
   AKMD GERBANG GENERATOR (G7-G10: manifest integritas + konstanta)
   Menyegarkan manifest gerbang.json + menanam konstanta SHA-384 ke
   index.html (hanya di antara marker __AKGW_SHA — SELALU di script #1,
   TIDAK PERNAH menyentuh script #2 boot yang disegel self-hash).

   Pemakaian:
     node gen_gerbang.js --site <dir> [--patch] [--quiet]
       --site   root situs (repo root di workflow, folder site di lokal)
       --patch  tanam/segarkan konstanta SHA-384 di index.html
       --quiet  hanya cetak error

   Idempoten: dijalankan berulang -> tidak ada perubahan byte.
   Gagal lunak: marker tidak ditemukan / file hilang -> peringatan,
   exit 0 (workflow rotasi TIDAK ikut merah).
   ==================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function argVal(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0 || i + 1 >= process.argv.length) return dflt;
  return process.argv[i + 1];
}
const hasFlag = (n) => process.argv.indexOf('--' + n) >= 0;
const QUIET = hasFlag('quiet');
const say = (m) => { if (!QUIET) console.log(m); };

const SITE = path.resolve(argVal('site', process.cwd()));
const IDX = path.join(SITE, 'index.html');
const MAN = path.join(SITE, 'gerbang.json');

const TARGETS = [
  { key: 'avg',   file: 'assets/js/avg.js',        gate: 'G7' },
  { key: 'media', file: 'media.js',                gate: 'G3' },
  { key: 'roster',file: 'referee/roster.json',     gate: 'G8' },
  { key: 'vault', file: 'referee/vault-status.json', gate: 'G8' },
  { key: 'ledger',file: 'referee/ledger-manifest.json', gate: 'G8' }
];

function sha384(p) {
  const buf = fs.readFileSync(p);
  return { sha384: crypto.createHash('sha384').update(buf).digest('hex'), len: buf.length };
}

const files = {};
for (const t of TARGETS) {
  const p = path.join(SITE, t.file);
  try {
    files[t.file] = Object.assign({ gate: t.gate }, sha384(p));
  } catch (e) {
    console.error('[gen_gerbang] PERINGATAN: file hilang:', t.file);
  }
}

const manifest = {
  v: 1,
  gen: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  files,
  gates: [
    'G1 segel-loader (script #2 self-hash, ada)',
    'G2 sandi terikat domain (media.js, ada)',
    'G3 hash-plaintext WASM (boot, ada)',
    'G4 token avg terikat domain (ada)',
    'G5 slot ECDSA P-256 (ada)',
    'G6 mode terbatas salinan (ada)',
    'G7 integritas avg.js SHA-384 fail-open (baru)',
    'G8 integritas referee JSON SHA-384 fail-open (baru)',
    'G9 tiket sesi HMAC stateless (baru, wasit v3)',
    'G10 telemetri gerbang + manifest ini (baru)'
  ]
};

try {
  fs.writeFileSync(MAN, JSON.stringify(manifest, null, 2) + '\n');
  say('[gen_gerbang] manifest ditulis: ' + MAN);
} catch (e) {
  console.error('[gen_gerbang] GAGAL tulis manifest:', e.message);
  process.exit(1);
}

/* ---- tanam konstanta ke index.html ---- */
if (hasFlag('patch')) {
  let html = '';
  try { html = fs.readFileSync(IDX, 'utf8'); } catch (e) {
    console.error('[gen_gerbang] PERINGATAN: index.html tidak ada, konstanta dilewati');
    process.exit(0);
  }
  const RE = /\/\*__AKGW_SHA:S\*\/[\s\S]*?\/\*__AKGW_SHA:E\*\//;
  if (!RE.test(html)) {
    console.error('[gen_gerbang] PERINGATAN: marker __AKGW_SHA tidak ditemukan (index lama?) - dilewati');
    process.exit(0);
  }
  const line = '/*__AKGW_SHA:S*/SHA.avg="' + (files['assets/js/avg.js'] ? files['assets/js/avg.js'].sha384 : '') + '";' +
    'SHA.ref={"roster":"' + (files['referee/roster.json'] ? files['referee/roster.json'].sha384 : '') + '",' +
    '"vault-status":"' + (files['referee/vault-status.json'] ? files['referee/vault-status.json'].sha384 : '') + '",' +
    '"ledger-manifest":"' + (files['referee/ledger-manifest.json'] ? files['referee/ledger-manifest.json'].sha384 : '') + '"};/*__AKGW_SHA:E*/';
  const out = html.replace(RE, line);
  if (out !== html) {
    fs.writeFileSync(IDX, out);
    say('[gen_gerbang] konstanta SHA-384 ditanam di index.html (script #1)');
  } else {
    say('[gen_gerbang] konstanta sudah terkini (tidak ada perubahan)');
  }
}
process.exit(0);
