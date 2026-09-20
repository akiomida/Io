#!/usr/bin/env node
/* ====================================================================
   AKMD SLOT GENERATOR (P20 "KEKANG" + P21 "RACUN")
   Membuat file slot statis bertanda tangan ECDSA P-256:
     <out>/latest.js   -> pointer terkini (nama tetap, selalu segar)
     <out>/s/<N>.js    -> file per-slot (jendela lookahead)
   Slot N = floor(unix_ms / TTL). TTL default 240 menit.

   Pemakaian:
     node gen_slots.js --init                       # buat pasangan kunci
     node gen_slots.js --out <dir> [--ttl 240]      # terbitkan batch
           [--window 2] [--cap 20] [--px 0|1] [--priv <jwk>]

   Output: file JSONP satu-baris  __AKSL({...});
   Tanda tangan: ECDSA P-256 (ieee-p1363) atas string kanonik:
     v|cur|ttl|gen|exp|cap|px|wl|prev
   prev = SHA-256 hex dari (canon+sig) latest sebelumnya -> rantai audit.

   KUNCI PRIVAT TIDAK BOLEH DI-UPLOAD ke hosting (lihat CARA-DEPLOY).
   ==================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEYS_DIR = path.join(__dirname, 'keys');
const PRIV_DEFAULT = path.join(KEYS_DIR, 'akmd_slot_priv.jwk');

function argVal(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0 || i + 1 >= process.argv.length) return dflt;
  return process.argv[i + 1];
}
const hasFlag = (n) => process.argv.indexOf('--' + n) >= 0;

function b64u(buf) { return Buffer.from(buf).toString('base64url'); }

function initKeys() {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
  if (fs.existsSync(PRIV_DEFAULT) && !hasFlag('force')) {
    console.log('[gen_slots] kunci sudah ada:', PRIV_DEFAULT, '(pakai --force utk ganti)');
    return;
  }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const priv = privateKey.export({ format: 'jwk' });
  const pub = publicKey.export({ format: 'jwk' });
  fs.writeFileSync(PRIV_DEFAULT, JSON.stringify(priv, null, 2), { mode: 0o600 });
  fs.writeFileSync(path.join(KEYS_DIR, 'akmd_slot_pub.jwk'), JSON.stringify(pub, null, 2));
  console.log('[gen_slots] kunci baru dibuat.');
  console.log('  PRIVAT (RAHASIA, JANGAN UPLOAD):', PRIV_DEFAULT);
  console.log('  PUBLIK  (tempel ke NET v12)    :', path.join(KEYS_DIR, 'akmd_slot_pub.jwk'));
  console.log('');
  console.log('PUB JWK untuk NET:');
  console.log(JSON.stringify(pub));
}

function loadPriv(p) {
  const jwk = JSON.parse(fs.readFileSync(p, 'utf8'));
  return crypto.createPrivateKey({ key: jwk, format: 'jwk' });
}

function prevHash(prevLatest) {
  if (!prevLatest) return '';
  const c = [prevLatest.v, prevLatest.cur, prevLatest.ttl, prevLatest.gen, prevLatest.exp,
    prevLatest.cap, prevLatest.px, prevLatest.wl, prevLatest.prev].join('|');
  return crypto.createHash('sha256').update(c + prevLatest.sig).digest('hex');
}

function publish() {
  const out = argVal('out', null);
  if (!out) { console.error('[gen_slots] --out wajib'); process.exit(2); }
  const privPath = argVal('priv', PRIV_DEFAULT);
  const priv = loadPriv(privPath);

  const ttlMin = parseInt(argVal('ttl', '240'), 10);
  const ttlMs = ttlMin * 60000;
  const window = parseInt(argVal('window', '2'), 10);   /* lookahead slot */
  const cap = parseInt(argVal('cap', '20'), 10);        /* menit sesi mode terbatas */
  const px = hasFlag('px') ? (parseInt(argVal('px', '1'), 10) ? 1 : 0) : 0;
  const wl = 1;

  const nowMs = Date.now();
  const cur = Math.floor(nowMs / ttlMs);
  const gen = nowMs;
  const exp = (cur + window + 1) * ttlMs;               /* valid s/d slot terakhir jendela */

  let prev = '';
  const latestPath = path.join(out, 'latest.js');
  try {
    const t = fs.readFileSync(latestPath, 'utf8');
    const m = t.match(/^__AKSL\(([\s\S]*?)\);?\s*$/);
    if (m) prev = prevHash(JSON.parse(m[1]));
  } catch (e) {}

  const payload = { v: 1, cur, ttl: ttlMin, gen, exp, cap, px, wl, prev };
  const canon = [payload.v, payload.cur, payload.ttl, payload.gen, payload.exp,
    payload.cap, payload.px, payload.wl, payload.prev].join('|');
  const sig = b64u(crypto.sign('sha256', Buffer.from(canon, 'utf8'),
    { key: priv, dsaEncoding: 'ieee-p1363' }));
  const full = JSON.stringify(Object.assign({}, payload, { sig }));

  fs.mkdirSync(path.join(out, 's'), { recursive: true });
  const line = '__AKSL(' + full + ');';
  fs.writeFileSync(latestPath, line + '\n');
  for (let i = 0; i <= window; i++) {
    /* tiap file slot memakai payload dgn cur=N (agar client tahu slot mana) */
    const p2 = Object.assign({}, payload, { cur: cur + i });
    const c2 = [p2.v, p2.cur, p2.ttl, p2.gen, p2.exp, p2.cap, p2.px, p2.wl, p2.prev].join('|');
    const s2 = b64u(crypto.sign('sha256', Buffer.from(c2, 'utf8'),
      { key: priv, dsaEncoding: 'ieee-p1363' }));
    fs.writeFileSync(path.join(out, 's', String(cur + i) + '.js'),
      '__AKSL(' + JSON.stringify(Object.assign({}, p2, { sig: s2 })) + ');\n');
  }
  console.log('[gen_slots] terbit: cur=' + cur + ' ttl=' + ttlMin + 'm window=' + window +
    ' cap=' + cap + 'm px=' + px + ' exp=' + new Date(exp).toISOString());
  console.log('  ' + latestPath);
  for (let i = 0; i <= window; i++) console.log('  ' + path.join(out, 's', String(cur + i) + '.js'));
  if (px) console.log('  !! MODE RACUN AKTIF (px=1) — jangan diterbitkan ke publik tanpa sengaja !!');
}

if (hasFlag('init')) initKeys();
else if (hasFlag('out')) publish();
else {
  console.log('Pemakaian:\n' +
    '  node gen_slots.js --init\n' +
    '  node gen_slots.js --out <dir> [--ttl 240] [--window 2] [--cap 20] [--px 1] [--priv <jwk>]');
}
