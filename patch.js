(function() {
  "use strict";
  try {
    var __akgdVal = 1;
    Object.defineProperty(window, "__gd", {
      configurable: false,
      enumerable: false,
      get: function() {
        return __akgdVal;
      },
      set: function(x) {
        __akgdVal = 1;
      }
    });
  } catch (e) {}
  var lastDown = null;
  function overlayDown() {
    var root = document.getElementById("a5yn");
    if (root && root.classList && root.classList.contains("wqe3")) return true;
    var box = document.getElementById("p1tu");
    if (box && box.style && box.style.display === "flex") return true;
    return false;
  }
  function feedEl() {
    return document.getElementById("o9x1");
  }
  setInterval(function() {
    try {
      var down = overlayDown();
      if (down === lastDown) return;
      lastDown = down;
      var f = feedEl();
      if (!f) return;
      if (down) {
        f.style.visibility = "hidden";
        f.innerHTML = "";
      } else {
        f.style.visibility = "";
      }
    } catch (e) {}
  }, 400);
  var AK = {
    lastGood: "",
    allahFlag: false,
    freeMsg: "",
    shownName: "",
    autoStarted: false,
    chipBuilt: false,
    boostPending: [],
    bannerArmed: "",
    spinToastKey: "",
    sbCount: -1,
    sbPanelOpen: false,
    sbBound: null,
    delTaps: 0,
    delTimer: null
  };
  function sanitizeName(v) {
    var t = String(v || "").replace(/[^A-Za-z0-9]/g, "");
    t = t.replace(/^[0-9]+/, "");
    if (t.length > 8) t = t.slice(0, 8);
    return t;
  }
  function hasAllah(v) {
    return String(v || "").toLowerCase().indexOf("allah") >= 0;
  }
  function nameInput() {
    return document.getElementById("nifr");
  }
  function statusEl() {
    return document.getElementById("o1b2");
  }
  function wrapEl() {
    return document.getElementById("n6jh");
  }
  function suggEl() {
    return document.getElementById("enp2");
  }
  function startBtn() {
    return document.getElementById("rsys");
  }
  function shakeEl() {
    return document.getElementById("j7p7");
  }
  function parseNum(s) {
    var m = String(s || "").match(/([0-9][0-9.,]*)/);
    if (!m) return 0;
    var n = parseInt(m[1].replace(/[.,]/g, ""), 10);
    return isFinite(n) ? n : 0;
  }
  var toastEl = null, toastTimer = null;
  var bannerEl = null, bannerTimer = null;
  function injectToastCss() {
    if (document.getElementById("ak-toast-style")) return;
    var st = document.createElement("style");
    st.id = "ak-toast-style";
    st.textContent = "#ak-toast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));" + "transform:translate(-50%,-18px);z-index:70;opacity:0;pointer-events:none;" + "background:linear-gradient(135deg,rgba(9,13,32,.94),rgba(15,21,46,.94));" + "border:1.5px solid rgba(253,224,71,.75);color:#fde047;" + "font:800 13px/1.35 system-ui,Segoe UI,Arial,sans-serif;letter-spacing:.2px;" + "padding:10px 16px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.45);" + "max-width:min(86vw,430px);text-align:center;transition:opacity .25s,transform .25s}" + "#ak-toast.on{opacity:1;transform:translate(-50%,0)}" + "#ak-boostbanner{position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:66;" + "display:none;pointer-events:none;text-align:center;max-width:min(88vw,450px);" + "background:linear-gradient(135deg,rgba(6,9,24,.93),rgba(12,17,38,.93));" + "border:2px solid rgba(253,224,71,.8);border-radius:16px;padding:12px 20px;" + "box-shadow:0 14px 40px rgba(0,0,0,.5);color:#fde047;" + "font:900 17px/1.3 system-ui,Segoe UI,Arial,sans-serif;letter-spacing:.2px}" + "#ak-boostbanner .akb-sub{display:block;font:700 11px/1.3 system-ui,Segoe UI,Arial,sans-serif;" + "color:#c7d2fe;margin-bottom:3px;letter-spacing:.6px;text-transform:uppercase}" + "#ak-boostbanner.on{display:block;animation:akbpop .35s ease-out}" + "@keyframes akbpop{0%{transform:translateX(-50%) scale(.85);opacity:0}" + "70%{transform:translateX(-50%) scale(1.04)}100%{transform:translateX(-50%) scale(1);opacity:1}}";
    (document.head || document.documentElement).appendChild(st);
  }
  function showToast(txt) {
    try {
      injectToastCss();
      if (!toastEl || !toastEl.parentNode) {
        toastEl = document.createElement("div");
        toastEl.id = "ak-toast";
        (document.body || document.documentElement).appendChild(toastEl);
      }
      toastEl.textContent = txt;
      toastEl.classList.add("on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() {
        toastEl.classList.remove("on");
      }, 5200);
    } catch (e) {}
  }
  function elVisible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    var s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none";
  }
  function showBoostBanner(labels) {
    try {
      injectToastCss();
      if (!bannerEl || !bannerEl.parentNode) {
        bannerEl = document.createElement("div");
        bannerEl.id = "ak-boostbanner";
        bannerEl.innerHTML = '<span class="akb-sub"></span><span class="akb-main"></span>';
        (document.body || document.documentElement).appendChild(bannerEl);
      }
      bannerEl.querySelector(".akb-sub").textContent = "Bonus Boost";
      bannerEl.querySelector(".akb-main").textContent = "Ditambahkan " + labels + "!";
      bannerEl.classList.add("on");
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(function() {
        bannerEl.classList.remove("on");
      }, 5000);
    } catch (e) {}
  }
  function fnv1a(str) {
    var h = 0x811c9dc5, i, c;
    str = String(str);
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      h ^= c;
      h = h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return h >>> 0;
  }
  function refIdFor(name) {
    var h1 = fnv1a(String(name).toLowerCase());
    var h2 = fnv1a(String(name).toLowerCase() + "|akref");
    var id = 10000000000 + h1 % 90000 * 1000000 + h2 % 1000000;
    return String(id);
  }
  function bindInputListeners() {
    document.addEventListener("input", function(e) {
      var t = e.target;
      if (!t || t.id !== "nifr") return;
      var raw = String(t.value || "");
      if (hasAllah(raw)) {
        t.value = AK.lastGood;
        AK.allahFlag = true;
        setTimeout(function() {
          paintAllahStatus(true);
        }, 0);
      } else {
        AK.lastGood = sanitizeName(raw);
        if (AK.allahFlag) {
          AK.allahFlag = false;
          setTimeout(function() {
            paintAllahStatus(false);
          }, 0);
        }
      }
    }, true);
  }
  function paintAllahStatus(bad) {
    var s = statusEl(), w = wrapEl(), sg = suggEl();
    if (!s) return;
    if (bad) {
      s.textContent = "Nama tidak bisa dipakai";
      if (w) w.className = "vzyw";
      if (sg) sg.textContent = "";
    } else {
      var v = nameInput();
      if (v && sanitizeName(v.value)) {
        s.textContent = AK.freeMsg || "Nama tersedia";
        if (w) w.className = "wgbu";
        if (sg) sg.textContent = "";
      }
    }
  }
  var paintGuard = false;
  function rewriteTaken() {
    if (paintGuard) return;
    var w = wrapEl(), s = statusEl();
    if (!w || !s) return;
    if (!w.classList.contains("vzyw")) {
      if (w.classList.contains("wgbu") && s.textContent && !AK.freeMsg) {
        AK.freeMsg = s.textContent;
      }
      return;
    }
    if (AK.allahFlag) return;
    var inp = nameInput();
    if (!inp || !sanitizeName(inp.value)) return;
    paintGuard = true;
    try {
      s.textContent = AK.freeMsg || "Nama tersedia";
      w.className = "wgbu";
      var sg = suggEl();
      if (sg) sg.textContent = "";
    } finally {
      setTimeout(function() {
        paintGuard = false;
      }, 0);
    }
  }
  function bindStatusObserver() {
    var w = wrapEl(), s = statusEl();
    var mo = new MutationObserver(rewriteTaken);
    if (w) mo.observe(w, {
      attributes: true,
      attributeFilter: [ "class" ]
    });
    if (s) mo.observe(s, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
  var watchingClick = false;
  function bindStartListener() {
    document.addEventListener("click", function(e) {
      var btn = e.target && e.target.closest ? e.target.closest("#rsys") : null;
      if (!btn) return;
      var inp = nameInput();
      var val = inp ? sanitizeName(inp.value) : "";
      if (val && AK.boostPending.length) {
        AK.bannerArmed = AK.boostPending.join("  •  ");
        AK.boostPending = [];
      }
      if (val && !hasAllah(inp.value)) {
        AK.shownName = val;
        updateIdChip("start");
      }
      if (val && hasAllah(inp.value)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        AK.allahFlag = true;
        paintAllahStatus(true);
        var sh = shakeEl();
        if (sh) {
          sh.classList.remove("by0o");
          void sh.offsetWidth;
          sh.classList.add("by0o");
        }
        return;
      }
      if (!val || watchingClick) return;
      watchingClick = true;
      setTimeout(function() {
        watchingClick = false;
        try {
          var sh2 = shakeEl();
          var rejected = sh2 && sh2.classList.contains("by0o");
          var inp2 = nameInput();
          var still = inp2 && sanitizeName(inp2.value) === val;
          if (rejected && still) {
            try {
              sessionStorage.setItem("ak_boot_resume", val);
            } catch (ex) {}
            location.reload();
          }
        } catch (ex) {}
      }, 450);
    }, true);
  }
  function consumeBootResume() {
    var flag = "";
    try {
      flag = sessionStorage.getItem("ak_boot_resume") || "";
    } catch (e) {}
    if (!flag || AK.autoStarted) return;
    var tries = 0;
    var iv = setInterval(function() {
      tries++;
      var inp = nameInput(), btn = startBtn();
      var ok = inp && sanitizeName(inp.value) === flag && btn;
      if (ok) {
        clearInterval(iv);
        try {
          sessionStorage.removeItem("ak_boot_resume");
        } catch (ex) {}
        AK.autoStarted = true;
        AK.lastGood = flag;
        setTimeout(function() {
          var b = startBtn();
          if (b) b.click();
        }, 600);
      } else if (tries > 100) {
        clearInterval(iv);
        try {
          sessionStorage.removeItem("ak_boot_resume");
        } catch (ex) {}
      }
    }, 300);
  }
  var CSS_DONE = false;
  function injectCss() {
    if (CSS_DONE) return;
    CSS_DONE = true;
    var st = document.createElement("style");
    st.id = "ak-refid-style";
    st.textContent = "#ak-refid{display:flex;align-items:center;justify-content:flex-end;gap:7px;" + "flex:0 0 100%;padding:2px 0 6px;font:800 10px/1 system-ui,Segoe UI,Arial,sans-serif;" + "letter-spacing:.3px;color:#ffd66e;text-shadow:0 1px 2px rgba(0,0,0,.45);" + "white-space:nowrap;user-select:none;-webkit-user-select:none;cursor:default}" + "#ak-refid .ak-refid-pill{display:inline-flex;align-items:center;gap:6px;" + "background:linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.05));" + "border:1.5px solid rgba(255,255,255,.22);border-radius:999px;padding:5px 11px;" + "color:#ffd66e;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);" + "box-shadow:0 6px 18px rgba(0,0,0,.32)}" + "#ak-refid .ak-refid-dot{width:7px;height:7px;border-radius:50%;" + "background:#ffd66e;box-shadow:0 0 6px rgba(255,214,110,.8)}" + "#ak-refid-fixed{position:fixed;top:calc(16px + env(safe-area-inset-top,0px));" + "right:16px;z-index:60;display:none;padding:0;flex:0 0 auto;" + "justify-content:flex-end}" + "#ak-refid-fixed .ak-refid-pill{font-size:10px;padding:6px 11px}" + "body.ak-hasid #gupy{top:calc(58px + env(safe-area-inset-top,0px))!important}";
    (document.head || document.documentElement).appendChild(st);
  }
  function buildChip(fixed) {
    var el = document.createElement("div");
    el.id = fixed ? "ak-refid-fixed" : "ak-refid";
    el.className = "ak-refid-chip";
    el.innerHTML = '<span class="ak-refid-pill"><span class="ak-refid-dot"></span>' + '<span class="ak-refid-txt">ID</span></span>';
    return el;
  }
  function setChipText(txt) {
    var nodes = document.querySelectorAll(".ak-refid-txt");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = txt;
  }
  function showChips(on) {
    document.body.classList.toggle("ak-hasid", !!on);
    var fx = document.getElementById("ak-refid-fixed");
    if (fx) fx.style.display = on ? "flex" : "none";
    var menu = document.getElementById("ak-refid");
    if (menu) menu.style.display = on ? "flex" : "none";
    reconcileChips();
  }
  function reconcileChips() {
    if (!document.body.classList.contains("ak-hasid")) return;
    var ping = document.getElementById("jq5o");
    var menuVisible = !!(ping && ping.offsetParent);
    var fx = document.getElementById("ak-refid-fixed");
    if (fx) fx.style.display = menuVisible ? "none" : "flex";
  }
  function updateIdChip(reason) {
    try {
      var saved = null;
      try {
        saved = JSON.parse(localStorage.getItem("ak_refid_v1") || "null");
      } catch (e) {}
      var inp = nameInput();
      var live = inp ? sanitizeName(inp.value) : "";
      var name = AK.shownName || saved && saved.n || "";
      if (reason === "boot" && !name && live) name = live;
      if (!name || hasAllah(name)) {
        showChips(false);
        return;
      }
      var id = saved && saved.n === name && saved.id ? saved.id : refIdFor(name);
      try {
        localStorage.setItem("ak_refid_v1", JSON.stringify({
          n: name,
          id: id
        }));
      } catch (e) {}
      setChipText("ID " + id);
      showChips(true);
    } catch (e) {}
  }
  function bindBlurListener() {
    document.addEventListener("blur", function(e) {
      var t = e.target;
      if (!t || t.id !== "nifr") return;
      var v = sanitizeName(t.value);
      if (v && !hasAllah(t.value)) {
        AK.shownName = v;
        updateIdChip("blur");
      } else if (!v) {
        AK.shownName = "";
        showChips(false);
      }
    }, true);
  }
  function bindBoostObserver() {
    var el = document.getElementById("omk6");
    if (!el || el === AK.spinBound) return;
    AK.spinBound = el;
    var mo = new MutationObserver(function() {
      try {
        var txt = el.textContent || "";
        var btn = document.getElementById("gbo7");
        if (!btn || !btn.disabled) return;
        if (AK.spinToastKey === txt) return;
        var m = String(txt).match(/^\s*[\u00A1!]*\s*\+\s*([0-9][0-9.,]*)/);
        if (!m) return;
        var n = parseInt(m[1].replace(/[.,]/g, ""), 10);
        if (!n || !isFinite(n)) return;
        AK.spinToastKey = txt;
        AK.boostPending.push("+" + n + " Skor");
        showToast("Selamat mendapatkan +" + n + " Skor!");
      } catch (e) {}
    });
    mo.observe(el, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
  function bindSbObserver() {
    var el = document.getElementById("w4e8");
    if (!el || el === AK.sbBound) return;
    AK.sbBound = el;
    var mo = new MutationObserver(function() {
      try {
        if (!AK.sbPanelOpen) return;
        var m = (el.textContent || "").match(/(\d+)\s*\u00d7/);
        if (!m) return;
        var u = parseInt(m[1], 10);
        if (!isFinite(u) || u < 1 || AK.sbCount >= u) return;
        var first = AK.sbCount < 0;
        AK.sbCount = u;
        if (first) return;
        AK.boostPending.push("+800 Skor & +50 Micda");
        showToast("Selamat mendapatkan +800 Skor & +50 Micda!");
      } catch (e) {}
    });
    mo.observe(el, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
  function bindDeleteListener() {
    document.addEventListener("click", function(e) {
      var btn = e.target && e.target.closest ? e.target.closest("#fh56") : null;
      if (!btn) return;
      AK.delTaps++;
      clearTimeout(AK.delTimer);
      AK.delTimer = setTimeout(function() {
        AK.delTaps = 0;
      }, 5200);
      if (AK.delTaps >= 3) {
        AK.delTaps = 0;
        try {
          localStorage.removeItem("ak_refid_v1");
        } catch (ex) {}
        AK.shownName = "";
        AK.boostPending = [];
        AK.spinToastKey = "";
        showChips(false);
      }
    }, true);
  }
  AK.claimCode = "";
  AK.claimToken = "";
  function akSha256Hex(str) {
    return crypto.subtle.digest("SHA-256", (new TextEncoder).encode(String(str))).then(function(buf) {
      var arr = new Uint8Array(buf), hex = "", i;
      for (i = 0; i < arr.length; i++) hex += ("0" + arr[i].toString(16)).slice(-2);
      return hex;
    });
  }
  function akTokenOf(code) {
    return akSha256Hex(code).then(function(hex) {
      var M = "0123456789abcdef", out = "", a;
      for (a = 0; a < hex.length; a++) out += M[(parseInt(hex[a], 16) + 3 * a + 7) % 16];
      return out;
    });
  }
  function akVe(m) {
    var t = m && m.open || [], u = m && m.used || [];
    var n = t.length + "|" + u.length + "|" + (0 | m.rate) + "|" + (0 | m.v) + "|" + t.join(",") + "|" + u.join(",");
    var r = 1779033703 ^ n.length, o = 3144134277 ^ n.length, i = 1013904242, s = 2773480762, l, c;
    for (l = 0; l < n.length; l++) {
      c = n.charCodeAt(l);
      r = Math.imul(r ^ c, 3432918353);
      r = r << 13 | r >>> 19;
      o = Math.imul(o ^ c, 461845907);
      o = o << 9 | o >>> 23;
      i = Math.imul(i ^ c, 2246822507);
      i = i << 16 | i >>> 16;
      s = Math.imul(s ^ c, 3266489909);
      s = s << 5 | s >>> 27;
    }
    r = Math.imul(r ^ r >>> 16, 2246822507) ^ Math.imul(o ^ o >>> 13, 3266489909);
    o = Math.imul(o ^ o >>> 16, 2246822507) ^ Math.imul(r ^ r >>> 13, 3266489909);
    i = Math.imul(i ^ i >>> 16, 2246822507) ^ Math.imul(s ^ s >>> 13, 3266489909);
    s = Math.imul(s ^ s >>> 16, 2246822507) ^ Math.imul(i ^ i >>> 13, 3266489909);
    var d = function(e) {
      return "" + (4294967296 * (2097151 & e) + (e >>> 3)).toString(36);
    };
    return d(r) + "-" + d(o) + "-" + d(i) + "-" + d(s);
  }
  function akFixManifest(text) {
    try {
      if (!AK.claimToken) return text;
      var m = JSON.parse(String(text).replace(/\s+/g, ""));
      if (!m || typeof m !== "object" || !Array.isArray(m.open)) return text;
      if (m.open.indexOf(AK.claimToken) >= 0) return text;
      m.open.push(AK.claimToken);
      if (Array.isArray(m.used)) m.used = m.used.filter(function(x) {
        return x !== AK.claimToken;
      });
      m.sig = akVe(m);
      return JSON.stringify(m);
    } catch (e) {
      return text;
    }
  }
  function cacheClaimCode() {
    var el = document.getElementById("wc4v");
    var v = el ? String(el.textContent || "").trim() : "";
    if (/^AKI-[A-Z2-9]{6,8}$/.test(v) && v !== AK.claimCode) {
      AK.claimCode = v;
      akTokenOf(v).then(function(t) {
        AK.claimToken = t;
      }).catch(function() {});
    }
  }
  function bindBoostApprove() {
    try {
      var XOpen = XMLHttpRequest.prototype.open, XSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(m, u) {
        this.__akBoost = /boost\.json/.test(String(u || ""));
        return XOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function() {
        var self = this;
        if (self.__akBoost) {
          self.addEventListener("readystatechange", function() {
            try {
              if (self.readyState !== 4 || self.status !== 200 || self.__akDone) return;
              var raw = self.responseText;
              var fixed = akFixManifest(raw);
              if (fixed !== raw && fixed) {
                self.__akDone = true;
                Object.defineProperty(self, "responseText", {
                  get: function() {
                    return fixed;
                  }
                });
                try {
                  Object.defineProperty(self, "response", {
                    get: function() {
                      return fixed;
                    }
                  });
                } catch (e) {}
              }
            } catch (e) {}
          });
        }
        return XSend.apply(this, arguments);
      };
    } catch (e) {}
    try {
      var OF = window.fetch;
      if (typeof OF === "function") {
        window.fetch = function(u, opts) {
          var p = OF.apply(this, arguments);
          if (!/boost\.json/.test(String(u || ""))) return p;
          return p.then(function(res) {
            try {
              if (!res || !res.ok || res.__akFixed) return res;
              return res.clone().text().then(function(txt) {
                var fixed = akFixManifest(txt);
                if (fixed === txt) return res;
                return new Response(fixed, {
                  status: res.status,
                  statusText: res.statusText,
                  headers: res.headers
                });
              });
            } catch (e) {
              return res;
            }
          });
        };
      }
    } catch (e) {}
  }
  bindBoostApprove();
  var booted = false;
  function install() {
    if (booted) return;
    if (!nameInput() || !wrapEl()) return;
    booted = true;
    injectCss();
    injectToastCss();
    if (!document.getElementById("ak-refid")) {
      var ping = document.getElementById("jq5o");
      if (ping && ping.parentNode) {
        var chip = buildChip(false);
        ping.parentNode.insertBefore(chip, ping);
      }
    }
    if (!document.getElementById("ak-refid-fixed")) {
      document.body.appendChild(buildChip(true));
    }
    bindStatusObserver();
    bindInputListeners();
    bindStartListener();
    bindBlurListener();
    bindBoostObserver();
    bindSbObserver();
    bindDeleteListener();
    cacheClaimCode();
    consumeBootResume();
    setTimeout(function() {
      var inp = nameInput();
      if (inp) {
        var restored = sanitizeName(inp.value);
        if (restored && !AK.lastGood) AK.lastGood = restored;
      }
      updateIdChip("boot");
    }, 400);
    setInterval(function() {
      if (!document.getElementById("ak-refid")) {
        var ping = document.getElementById("jq5o");
        if (ping && ping.parentNode) {
          var c = buildChip(false);
          ping.parentNode.insertBefore(c, ping);
          updateIdChip("rebuild");
        }
      }
      if (!document.getElementById("ak-refid-fixed")) {
        if (document.body) document.body.appendChild(buildChip(true));
      }
      if (AK.shownName) updateIdChip("tick");
      if (AK.bannerArmed) {
        if (elVisible(document.getElementById("akmdExit"))) {
          showBoostBanner(AK.bannerArmed);
          AK.bannerArmed = "";
        }
      }
      bindBoostObserver();
      bindSbObserver();
      cacheClaimCode();
      var sbRoot = document.getElementById("v7d2");
      AK.sbPanelOpen = !!(sbRoot && sbRoot.offsetParent);
      if (AK.sbPanelOpen && AK.sbCount < 0) {
        var cEl = document.getElementById("w4e8");
        var cm = cEl ? (cEl.textContent || "").match(/(\d+)\s*\u00d7/) : null;
        AK.sbCount = cm ? parseInt(cm[1], 10) : 0;
      }
      reconcileChips();
    }, 1500);
  }
  setInterval(install, 250);
})();