/**
 * ads.js — Pengelola slot iklan AKIOMIDA
 * ---------------------------------------------------------------
 * Tugas:
 *  1. Menyisipkan iklan display 300x250 ke setiap elemen .ad-slot
 *     yang ada di halaman (termasuk slot yang dibuat dinamis,
 *     dipantau lewat MutationObserver).
 *  2. Menandai window.__AKMD_ADS_OK = true di akhir file. Sinyal ini
 *     dibaca oleh akmd-guard (sistem penahan pemblokir iklan pada
 *     halaman utama) sebagai bukti bahwa skrip iklan berhasil
 *     dimuat tanpa diblokir.
 *
 * API:
 *  window.AKMDAds.reload()  -> pindai ulang semua slot di halaman
 *
 * Catatan:
 *  - inject() bersifat idempotent: slot yang sudah berisi iframe
 *    tidak akan diisi ulang.
 */
(function () {
  // ------------------------------------------------------------------
  // WAJIB DICEK PEMILIK SITUS:
  // Kunci di bawah ini harus berasal dari akun jaringan iklan MILIK
  // ANDA sendiri. Jika kunci ini milik pihak lain, seluruh tayangan
  // iklan akiomida.com akan tercatat dan menghasilkan pendapatan
  // untuk akun pihak tersebut.
  // ------------------------------------------------------------------
  var AD_KEY = '0904ad35441041fb9869e5eaf83d8b07';
  var AD_W = 300;
  var AD_H = 250;

  function inject(slot) {
    if (!slot || slot.querySelector('iframe')) return;
    slot.style.cssText = 'display:block!important;text-align:center;margin:16px auto;background:transparent!important';
    var frame = document.createElement('iframe');
    frame.srcdoc =
      '<!DOCTYPE html><html><head><style>body{margin:0;background:transparent}</style></head><body>' +
      '<script>atOptions={key:"' + AD_KEY + '",format:"iframe",height:' + AD_H + ',width:' + AD_W + ',params:{}};<\/script>' +
      '<script src="https://www.highperformanceformat.com/' + AD_KEY + '/invoke.js"><\/script>' +
      '</body></html>';
    frame.width = AD_W;
    frame.height = AD_H;
    frame.frameBorder = '0';
    frame.scrolling = 'no';
    frame.allowTransparency = 'true';
    frame.style.cssText = 'border:none;display:block;margin:auto;background:transparent';
    slot.appendChild(frame);
  }

  function init() {
    var slots = document.querySelectorAll('.ad-slot');
    for (var i = 0; i < slots.length; i++) {
      inject(slots[i]);
    }
  }

  // Slot dinamis yang muncul belakangan tetap terjangkau.
  if (typeof MutationObserver !== 'undefined') {
    var mo = new MutationObserver(function () { init(); });
    function arm() {
      try { mo.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', arm);
    } else {
      arm();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API publik + sinyal sukses muat untuk akmd-guard.
  window.AKMDAds = { reload: init };
  window.__AKMD_ADS_OK = 1;
})();
