/* ====================================================================
   WASIT SERVER v3 (protokol 3) — CLOUDFLARE WORKER / PAGES FUNCTIONS
   Pasangan wasit_server.js (Node) & deno_wasit.js — protokol SAMA.

   BARU v3 (tiket sesi stateless + telemetri gerbang — G9/G10):
   - GET  /api/wasit/ticket?u=<uid> -> tiket sesi HMAC-SHA256 STATELESS:
     tk = b64u(payload) + "." + b64u(HMAC(WASIT_SECRET, "tk1|"+payload))
     payload = "t1|uid|iat|exp|domain". TANPA KV, TANPA tulisan, TANPA
     antrean — biaya per tiket = mikrodetik CPU, 1 tiket per sesi.
     Gagal/fail: klien lanjut TANPA tiket (fail-open, game tetap hidup).
   - POST /api/wasit menerima header X-AK-Ticket:
       tiket valid   -> L.tk = waktu (jejak sesi terverifikasi)
       tiket busuk   -> flag ledger "tiket-busuk" (bukti pemalsuan)
       tanpa tiket   -> lolos biasa (rollout aman, tanpa penalti)
   - ev k='gw' -> flag "gw:<why>" (telemetri integritas dari klien,
     diselipkan ke batch reguler — NOL request ekstra)
   - GET /api/wasit/ping -> v:3

   WARISAN v2.1 (tetap berlaku):
   - GET  /api/wasit/map?akid= / POST /api/wasit/map (ikatan + adopsi)
   - GET  /api/akmd/ks (garam rotasi harian P17)
   - Penjaga banjir >60 POST/menit/pid = 429 tanpa tulis KV
   - Rem tulis: batch dingin tidak menulis KV (hemat 1.000 tulis/hari)
   - Memo cache isolate 15 dtk; WASIT_SAMPLE katup tekanan
   - GET /api/wasit/top (snapshot), /api/wasit/dump (admin),
     scheduled() cron menyegarkan 'snap:top'

   Deploymen (Pages): buat folder functions/api/ di project Pages,
   salin file ini menjadi functions/api/wasit.js, lalu di dashboard:
     - Bind KV namespace  ->  nama binding: WASIT_KV
     - Variable           ->  WASIT_SECRET (string acak panjang, WAJIB)
     - Opsional           ->  WASIT_ADMIN (kunci ?key= audit)
     - Opsional           ->  WASIT_WRITE_MS (rem tulis, ms; default 600000)
     - Opsional           ->  WASIT_TICKET_TTL (ms; default 1800000 = 30 mnt,
                                  maks 3600000) — masa hidup tiket sesi
     - Opsional           ->  SLOT_TTL (ms; default 14400000, samakan gen_slots)
   URL: https://akiomida.com/api/wasit  (sama-origin)
   ==================================================================== */
const PID_RE = /^[A-Za-z0-9]{10,24}$/;
const AKID_RE = /^[A-Za-z0-9_-]{16,64}$/;
const BOUND = 40, TTL = 1800e3, GAPMS = 9e4;
const RLMAX = 60, RLWIN = 60000;
const CAPS = { b: 4e7, e: 4e7, g: 6000, d: 99991231, jumpB: 600, jumpE: 20000 };
const ORIGIN_RE = /^https?:\/\/([a-z0-9-]+\.)*akiomida\.com(:\d+)?$|^https?:\/\/localhost(:\d+)?$|^https?:\/\/127\.0\.0\.1(:\d+)?$/i;
const MEMO_MS = 15000;
const DAY = 86400e3;
function fnv(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }

const enc = new TextEncoder();
async function hmac(secret, s) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(s));
  let bin = '';
  const b = new Uint8Array(sig);
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const now = () => Date.now();
const finite = (v) => typeof v === 'number' && isFinite(v);

/* ---- G9: tiket sesi stateless ---- */
const TKRE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
function b64uDecode(s) {
  const b = atob(String(s).replace(/-/g, '+').replace(/_/g, '/'));
  const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return new TextDecoder().decode(u);
}
async function ticketOK(SECRET, tk, host, srvNow) {
  try {
    if (!SECRET || !tk || !TKRE.test(tk)) return false;
    const i = tk.indexOf('.');
    const pb = tk.slice(0, i), sg = tk.slice(i + 1);
    const good = await hmac(SECRET, 'tk1|' + pb);
    if (sg !== good) return false;
    const p = b64uDecode(pb).split('|');
    if (p[0] !== 't1' || !p[1]) return false;
    if (!+p[3] || +p[3] < srvNow) return false;          /* kedaluwarsa */
    if (p[4] && host && p[4] !== host) return false;      /* tiket lintas domain */
    return true;
  } catch (e) { return false; }
}

function emptyL(pid) {
  return { v: 2, pid, hi: 0, last: 0, beats: 0, sessions: 0, lastBeat: 0, bye: 0, lps: 0, tk: 0,
    net: { n: 0, ms: 0 }, stall: { n: 0, ms: 0 }, gaps: [], peak: { b: 0, e: 0 }, st: null,
    econ: [], flags: [], rl: [] };
}
function migrate(L) {
  if (!L || typeof L !== 'object') return null;
  if (L.v !== 1 && L.v !== 2) return null;
  if (L.v === 1) { L.v = 2; L.rl = []; L.lps = 0; }
  if (!Array.isArray(L.rl)) L.rl = [];
  if (typeof L.lps !== 'number') L.lps = 0;
  if (typeof L.tk !== 'number') L.tk = 0;
  return L;
}
function flag(L, why) {
  L.flags.push({ t: now(), why: String(why).slice(0, 140) });
  if (L.flags.length > 50) L.flags = L.flags.slice(-50);
}
const pushE = (L, e) => { L.econ.push(e); if (L.econ.length > 60) L.econ = L.econ.slice(-60); };

/* ---- memo cache per-isolate: hemat KV.get ---- */
const MEMO = new Map();
function memoGet(k) {
  const m = MEMO.get(k);
  if (m && now() - m.at < MEMO_MS) return m.L;
  if (m) MEMO.delete(k);
  return null;
}
function memoSet(k, L) {
  if (MEMO.size > 4000) MEMO.clear();
  MEMO.set(k, { L, at: now() });
}

function handleEv(L, ev, srvNow) {
  const k = String((ev && ev.k) || '');
  const pl = (ev && ev.pl && typeof ev.pl === 'object') ? ev.pl : {};
  if (k === 'hello') { L.hi++; L.sessions++; return; }
  if (k === 'beat') {
    L.beats++;
    if (L.lastBeat > 0) {
      const gap = srvNow - L.lastBeat;
      if (gap > GAPMS) { L.net.n++; L.net.ms += gap;
        L.gaps.push({ t: srvNow, ms: gap }); if (L.gaps.length > 20) L.gaps = L.gaps.slice(-20); }
    }
    L.lastBeat = srvNow; return;
  }
  if (k === 'gw') { flag(L, 'gw:' + String((pl && pl.w) || '?').slice(0, 48)); return; }
  if (k === 'econ') {
    if (pl.py && !('b' in pl)) { L.pays = (L.pays || 0) + ((0 | pl.py) || 0);
      pushE(L, { t: srvNow, py: (0 | pl.py) || 0 }); return; }
    const jedaPanjang = srvNow - (L.lps || 0) > 26 * 3600e3;
    const d = +pl.d, b = +pl.b, e = +pl.e, g = +pl.g, py = (0 | pl.py) || 0;
    if (![d, b, e, g].every(finite)) { flag(L, 'econ non-angka'); return; }
    const D = Math.floor(d), B = Math.floor(b), E = Math.floor(e), G = Math.floor(g);
    if (B < 0 || E < 0 || G < 0 || D < 0) { flag(L, 'econ negatif'); return; }
    if (B > CAPS.b || E > CAPS.e || G > CAPS.g || D > CAPS.d) { flag(L, 'econ melebihi cap'); return; }
    if (B > E) { flag(L, 'saldo>total (b>e)'); return; }
    if (py > 0) L.pays = (L.pays || 0) + py;
    if (L.st) {
      const zeroGen = (L.st.b === 0 && L.st.e === 0 && L.st.g === 0);
      if (zeroGen) {
        const pk = L.peak || { b: 0, e: 0 };
        if ((pk.b > 0 || pk.e > 0) && (B > pk.b + 6000 || E > pk.e + 6000))
          flag(L, 'pasca-nol melebihi puncak b:' + B + ' e:' + E);
      } else if (jedaPanjang) {
        flag(L, 'resume jeda panjang');
      } else {
        if (E < L.st.e) flag(L, 'total menang turun e:' + E + '<' + L.st.e);
        if (D < L.st.d) flag(L, 'hari mundur d:' + D + '<' + L.st.d);
        const db = B - L.st.b, de = E - L.st.e;
        if (Math.abs(db) > CAPS.jumpB) flag(L, 'lompatan saldo ' + db);
        if (Math.abs(de) > CAPS.jumpE) flag(L, 'lompatan total ' + de);
        if (py > 0 && db > 0) flag(L, 'bayar + saldo naik serentak');
      }
    }
    L.st = { d: D, b: B, e: E, g: G };
    L.peak = { b: Math.max((L.peak && L.peak.b) || 0, B), e: Math.max((L.peak && L.peak.e) || 0, E) };
    pushE(L, { t: srvNow, d: D, b: B, e: E, g: G, py, f: L.flags.length, first: pl.first ? 1 : 0 });
    return;
  }
  if (k === 'sync') {
    const n = (0 | pl.n) || 0, ms = (0 | pl.ms) || 0;
    const dn = n - L.stall.n, dm = ms - L.stall.ms;
    if (dn > 0 || dm > 0) { L.stall = { n: Math.max(n, L.stall.n), ms: Math.max(ms, L.stall.ms) };
      L.net.n += Math.max(0, dn); L.net.ms += Math.max(0, dm); }
    return;
  }
  if (k === 'bye') { L.bye = (L.bye || 0) + 1; return; }
}

function cors(request, H) {
  const o = request.headers.get('Origin') || '';
  if (ORIGIN_RE.test(o)) { H['Access-Control-Allow-Origin'] = o; H['Vary'] = 'Origin'; }
}

/* muat ledger (memo -> KV) dengan migrasi v1->v2 */
async function loadL(KV, pid) {
  const key = 'pid:' + pid;
  let L = memoGet(key);
  if (L) return L;
  let raw = null;
  try { raw = await KV.get(key); } catch (e) { raw = null; }
  if (raw) { try { L = migrate(JSON.parse(raw)); } catch (e) { L = null; } }
  if (!L) L = emptyL(pid);
  memoSet(key, L);
  return L;
}
async function saveL(KV, L) {
  L.lps = now();
  try { await KV.put('pid:' + L.pid, JSON.stringify(L)); } catch (e) {}
  memoSet('pid:' + L.pid, L);
}

/* ---- snapshot papan (memo panas + snap sebelumnya; 0 pindai berat) ---- */
async function buildSnap(KV) {
  const rows = Object.create(null);
  let prev = null;
  try { prev = JSON.parse((await KV.get('snap:top')) || 'null'); } catch (e) { prev = null; }
  if (prev && Array.isArray(prev.rows))
    for (const r of prev.rows) if (r && r.pid) rows[r.pid] = { pid: r.pid, b: r.b | 0, e: r.e | 0, g: r.g | 0, d: r.d | 0, t: r.t || 0 };
  for (const k of MEMO.keys()) {
    if (k.indexOf('pid:') !== 0) continue;
    const w = MEMO.get(k); const L = w && w.L; if (!L || !L.st) continue;
    const rec = rows[L.pid] || { pid: L.pid, b: 0, e: 0, g: 0, d: 0, t: 0 };
    rec.b = L.st.b | 0; rec.e = L.st.e | 0; rec.g = L.st.g | 0; rec.d = L.st.d | 0;
    rec.t = Math.max(rec.t, L.lps || now()); rows[L.pid] = rec;
  }
  const t0 = now();
  const R = Object.keys(rows).map((x) => rows[x]).filter((r) => t0 - (r.t || 0) < 7 * DAY);
  R.sort((a, b) => (b.e - a.e) || (b.b - a.b));
  const snap = { v: 1, t: t0, n: Math.min(50, R.length), rows: R.slice(0, 50) };
  try { await KV.put('snap:top', JSON.stringify(snap)); } catch (e) {}
  return snap;
}

async function quotaPaths(request, url, KV, SECRET, ADMIN, H, srvNow, env) {
  if (request.method === 'GET' && url.pathname === '/api/wasit/top') {
    let raw = null;
    try { raw = KV ? await KV.get('snap:top') : null; } catch (e) { raw = null; }
    const H2 = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=120' };
    return new Response(raw || JSON.stringify({ v: 1, t: 0, n: 0, rows: [] }), { headers: H2 });
  }
  if (request.method === 'GET' && url.pathname === '/api/wasit/dump') {
    if (!ADMIN || url.searchParams.get('key') !== ADMIN)
      return new Response(JSON.stringify({ ok: 0, why: 'admin' }), { status: 403, headers: H });
    const MAXR = Math.max(100, parseInt((env && env.WASIT_DUMP_MAX) || '2000', 10) || 2000);
    const rows = [];
    let cur = undefined, read = 0, complete = false;
    for (;;) {
      const page = await KV.list({ prefix: 'pid:', cursor: cur });
      for (const k of page.keys) {
        if (read >= MAXR) break;
        try { rows.push(JSON.parse(await KV.get(k.name))); } catch (e) {}
        read++;
      }
      if (page.list_complete || read >= MAXR) { complete = !!page.list_complete && read < MAXR + 1; break; }
      cur = page.cursor;
    }
    return new Response(JSON.stringify({ ok: 1, t: srvNow, n: rows.length, read, complete, rows }), { headers: H });
  }
  return null;
}
export default {
  async scheduled(event, env, ctx) {
    const KV = env && env.WASIT_KV;
    if (!KV) return;
    try { await buildSnap(KV); } catch (e) {}
  },
  async fetch(request, env, ctx) {
    const H = { 'Content-Type': 'application/json; charset=utf-8' };
    cors(request, H);
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      H['Access-Control-Allow-Methods'] = 'GET,POST';
      H['Access-Control-Allow-Headers'] = 'Content-Type, X-AK-Ticket';
      H['Access-Control-Max-Age'] = '600';
      return new Response(null, { status: 204, headers: H });
    }
    const KV = env.WASIT_KV;
    const SECRET = env.WASIT_SECRET || '';
    const ADMIN = env.WASIT_ADMIN || '';
    const WRITE_MS = Math.max(parseInt(env.WASIT_WRITE_MIN || '60000', 10) || 60000, parseInt(env.WASIT_WRITE_MS || '600000', 10) || 600000);
    const SLOT_TTL = Math.max(60000, parseInt(env.SLOT_TTL || '14400000', 10) || 14400000);
    const TK_TTL = Math.min(3600000, Math.max(300000, parseInt(env.WASIT_TICKET_TTL || '1800000', 10) || 1800000));
    const qp = await quotaPaths(request, url, KV, SECRET, ADMIN, H, now(), env);
    if (qp) return qp;

    if (request.method === 'GET' && url.pathname === '/api/wasit/ping') {
      return new Response(JSON.stringify({ ok: 'wasit', v: 3, ts: now() }), { headers: H });
    }
    if (request.method === 'GET' && url.pathname === '/api/wasit/ticket') {
      const H2 = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
      if (!SECRET) return new Response(JSON.stringify({ ok: 0, why: 'belum-dikonfigurasi' }), { status: 500, headers: H2 });
      const u = url.searchParams.get('u') || '';
      if (!AKID_RE.test(u)) return new Response(JSON.stringify({ ok: 0, why: 'uid' }), { status: 400, headers: H2 });
      const srvNow = now(), exp = srvNow + TK_TTL;
      const payload = 't1|' + u + '|' + srvNow + '|' + exp + '|' + url.hostname;
      const pb = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const tk = pb + '.' + (await hmac(SECRET, 'tk1|' + pb));
      return new Response(JSON.stringify({ ok: 1, tk, exp }), { headers: H2 });
    }
    if (request.method === 'GET' && url.pathname === '/api/akmd/ks') {
      if (!SECRET) return new Response(JSON.stringify({ ok: 0, why: 'belum-dikonfigurasi' }), { status: 500, headers: H });
      const H2 = { 'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=86400' };
      return new Response(JSON.stringify({ ok: 1, k: await hmac(SECRET, 'akmd-ks-1'),
        pr: await hmac(SECRET, 'akmd-ks-0'), rot: 86400 }), { headers: H2 });
    }
    if (request.method === 'GET' && url.pathname === '/api/wasit/map') {
      if (!KV) return new Response(JSON.stringify({ ok: 0, why: 'belum-dikonfigurasi' }), { status: 500, headers: H });
      const akid = url.searchParams.get('akid') || '';
      if (!AKID_RE.test(akid)) return new Response(JSON.stringify({ ok: 0, why: 'akid' }), { status: 400, headers: H });
      let rec = null;
      try { const raw = await KV.get('map:' + akid); if (raw) rec = JSON.parse(raw); } catch (e) { rec = null; }
      if (!rec || !rec.pid) return new Response(JSON.stringify({ ok: 1, akid, pid: null, snap: null }), { headers: H });
      /* snap segar dari ledger pid terikat */
      const L = await loadL(KV, rec.pid);
      const snap = L.st ? { d: L.st.d, b: L.st.b, e: L.st.e, g: L.st.g } : null;
      return new Response(JSON.stringify({ ok: 1, akid, pid: rec.pid, snap }), { headers: H });
    }
    if (request.method === 'POST' && url.pathname === '/api/wasit/map') {
      if (!KV || !SECRET) return new Response(JSON.stringify({ ok: 0, why: 'belum-dikonfigurasi' }), { status: 500, headers: H });
      let j = null;
      try { j = await request.json(); } catch (e) {}
      const akid = String((j && j.akid) || ''), pid = String((j && j.pid) || '');
      if (!AKID_RE.test(akid) || !PID_RE.test(pid))
        return new Response(JSON.stringify({ ok: 0, why: 'format' }), { status: 400, headers: H });
      const srvNow = now();
      /* penjaga banjir per-akid (catatan di rekam map) */
      let rec = null;
      try { const raw = await KV.get('map:' + akid); if (raw) rec = JSON.parse(raw); } catch (e) { rec = null; }
      if (rec) {
        if (!Array.isArray(rec.rl)) rec.rl = [];
        while (rec.rl.length && srvNow - rec.rl[0] > RLWIN) rec.rl.shift();
        if (rec.rl.length >= RLMAX)
          return new Response(JSON.stringify({ ok: 0, why: 'banjir' }), { status: 429, headers: H });
        rec.rl.push(srvNow);
      } else {
        rec = { pid: null, snap: null, rl: [srvNow] };
      }
      const L = await loadL(KV, pid);
      const snap = L.st ? { d: L.st.d, b: L.st.b, e: L.st.e, g: L.st.g } : null;

      if (j.adopt) {
        if (!rec.pid) return new Response(JSON.stringify({ ok: 0, why: 'tak-terikat' }), { status: 400, headers: H });
        if (rec.pid === pid)
          return new Response(JSON.stringify({ ok: 1, adopt: true, sv: snap, ts: srvNow }), { headers: H });
        const oL = await loadL(KV, rec.pid);
        const oSt = oL.st;
        if (!oSt || !(oSt.b > 0 || oSt.e > 0))
          return new Response(JSON.stringify({ ok: 0, why: 'kosong' }), { status: 400, headers: H });
        const nZero = !L.st || (L.st.b === 0 && L.st.e === 0 && L.st.g === 0);
        if (!nZero)
          return new Response(JSON.stringify({ ok: 0, why: 'tidak-kosong' }), { status: 400, headers: H });
        L.st = { d: oSt.d, b: oSt.b, e: oSt.e, g: oSt.g };
        L.peak = { b: Math.max((L.peak && L.peak.b) || 0, oSt.b), e: Math.max((L.peak && L.peak.e) || 0, oSt.e) };
        flag(L, 'dompet diamankan dari ' + rec.pid);
        await saveL(KV, L);
        flag(oL, 'dompet dipindah ke ' + pid);
        await saveL(KV, oL);
        rec.pid = pid; rec.snap = L.st;
        try { await KV.put('map:' + akid, JSON.stringify(rec)); } catch (e) {}
        return new Response(JSON.stringify({ ok: 1, adopt: true, sv: L.st, ts: srvNow }), { headers: H });
      }
      /* ikat (bind) — hanya mengisi bila masih kosong */
      if (!rec.pid) {
        rec.pid = pid; rec.snap = snap;
        try { await KV.put('map:' + akid, JSON.stringify(rec)); } catch (e) {}
      }
      return new Response(JSON.stringify({ ok: 1, akid, pid: rec.pid, snap: rec.snap, ts: srvNow }), { headers: H });
    }
    if (request.method === 'GET' && url.pathname === '/api/wasit/audit') {
      if (ADMIN && url.searchParams.get('key') !== ADMIN) {
        return new Response(JSON.stringify({ ok: 0, why: 'admin' }), { status: 403, headers: H });
      }
      const pid = url.searchParams.get('pid') || '';
      if (pid) {
        if (!PID_RE.test(pid)) return new Response(JSON.stringify({ ok: 0 }), { status: 400, headers: H });
        const raw = KV ? await KV.get('pid:' + pid) : null;
        return new Response(raw || JSON.stringify(emptyL(pid)), { headers: H });
      }
      const list = [];
      if (KV) {
        const page = await KV.list({ prefix: 'pid:' });
        for (const key of page.keys) {
          try { const j = JSON.parse(await KV.get(key.name));
            if (j && (j.v === 1 || j.v === 2)) list.push({ pid: j.pid, v: j.v, hi: j.hi, last: j.last,
              beats: j.beats, pays: j.pays || 0, tk: j.tk || 0, flags: (j.flags || []).length,
              net: j.net, stall: j.stall, st: j.st, rl: (j.rl || []).length });
          } catch (e) {}
        }
      }
      return new Response(JSON.stringify({ ok: 1, pids: list }), { headers: H });
    }
    if (request.method === 'POST' && (url.pathname === '/api/wasit' || url.pathname === '/api/wasit/')) {
      if (!KV || !SECRET) return new Response(JSON.stringify({ ok: 0, why: 'belum-dikonfigurasi' }), { status: 500, headers: H });
      let j = null;
      try { j = await request.json(); } catch (e) {}
      if (!j || j.v !== 1 || !Array.isArray(j.ev) || !j.ev.length || j.ev.length > BOUND) {
        return new Response(JSON.stringify({ ok: 0, why: 'format' }), { status: 400, headers: H });
      }
      const pid = String((j.ev[0] && j.ev[0].pid) || '');
      if (!PID_RE.test(pid)) return new Response(JSON.stringify({ ok: 0, why: 'pid' }), { status: 400, headers: H });
      const sid = String((j.ev[0] && j.ev[0].sid) || '').slice(0, 24);
      const srvNow = now();
      const SAMPLE = Math.max(0, Math.min(100, parseInt(env.WASIT_SAMPLE == null ? '100' : env.WASIT_SAMPLE, 10) || 0));
      if (SAMPLE < 100 && (fnv(pid + '|' + Math.floor(srvNow / DAY)) % 100) >= SAMPLE)
        return new Response(JSON.stringify({ ok: 1, tok: await hmac(SECRET, pid + '|' + sid + '|' + (srvNow + TTL)),
          ttl: TTL / 1000, sv: null, fl: 0, ts: srvNow, sm: 1 }), { headers: H });
      const L = await loadL(KV, pid);
      /* penjaga banjir: 60 POST/menit/pid -> 429 TANPA menulis apa pun */
      while (L.rl.length && srvNow - L.rl[0] > RLWIN) L.rl.shift();
      if (L.rl.length >= RLMAX)
        return new Response(JSON.stringify({ ok: 0, why: 'banjir' }), { status: 429, headers: H });
      L.rl.push(srvNow);
      const fl0 = L.flags.length;
      /* G9: tiket sesi — valid = jejak, busuk = flag, absen = lolos (fail-open) */
      const TKT = request.headers.get('X-AK-Ticket') || '';
      let tv = 0;
      if (TKT) {
        if (await ticketOK(SECRET, TKT, url.hostname, srvNow)) { L.tk = srvNow; tv = 1; }
        else flag(L, 'tiket-busuk');
      }
      for (const ev of j.ev) {
        if (String((ev && ev.pid) || '') !== pid) { flag(L, 'pid campur dalam batch'); continue; }
        handleEv(L, ev, srvNow);
      }
      /* cek slot (P20, lembut) */
      const sl = j.ev[0] && typeof j.ev[0].sl === 'number' ? j.ev[0].sl : null;
      if (sl !== null && sl < Math.floor(srvNow / SLOT_TTL) - 1) flag(L, 'slot basi');
      L.last = srvNow;
      /* rem tulis: batch "dingin" (tanpa econ/bye/flag baru & belum lewat WRITE_MS)
         = TIDAK menulis KV -> kuota 1.000 tulis/hari terjaga */
      const material = srvNow - (L.lps || 0) >= WRITE_MS ||
        j.ev.some((e2) => e2 && (e2.k === 'econ' || e2.k === 'bye')) ||
        L.flags.length > fl0;
      if (material) await saveL(KV, L);
      return new Response(JSON.stringify({ ok: 1, tok: await hmac(SECRET, pid + '|' + sid + '|' + (srvNow + TTL)),
        ttl: TTL / 1000, sv: L.st, fl: L.flags.length, ts: srvNow, tv }), { headers: H });
    }
    return new Response(JSON.stringify({ ok: 0 }), { status: 404, headers: H });
  }
};
