/* sync.js — يقرأ تعديلات لوحة الأدمن من Firebase ويطبّقها على الموقع وصفحة الفاتورة تلقائياً.
   أي خطأ أو لو Firebase مش جاهز → الموقع يشتغل بالقيم الأصلية الموجودة في الملف. */
(function () {
  var C = window.FB_CFG;
  if (!C || !C.projectId || /PASTE|YOUR/i.test(String(C.apiKey) + String(C.projectId))) return;

  var base = 'https://firestore.googleapis.com/v1/projects/' + C.projectId + '/databases/(default)/documents';
  var key = 'key=' + encodeURIComponent(C.apiKey);
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var parse = function (d) {
    try { return JSON.parse(d.fields.json.stringValue); } catch (e) { return null; }
  };
  function rd(path) {
    return fetch(base + '/' + path + '?' + key, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j ? parse(j) : null; })
      .catch(function () { return null; });
  }
  function list(col) {
    return fetch(base + '/' + col + '?pageSize=100&' + key, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) {
        var o = {};
        (j.documents || []).forEach(function (d) {
          var v = parse(d);
          if (v) o[d.name.split('/').pop()] = v;
        });
        return o;
      })
      .catch(function () { return {}; });
  }
  var $ = function (s) { return document.querySelector(s); };

  /* ========== صفحة المتجر ========== */
  function storePage() {
    var T = { iphone: 'phone', samsung: 'phone', watches: 'watch', audio: 'buds', tv: 'tv', ps: 'console', power: 'power' };

    Promise.all([rd('site/config'), rd('site/products')]).then(function (r) {
      var cfg = r[0], pr = r[1];

      if (pr) {
        // منتجات جديدة أضفتها من لوحة الأدمن
        (pr.custom || []).forEach(function (c) {
          if (find(c.id)) return;
          P.push({
            id: c.id, cat: c.cat, n: c.n, t: T[c.cat] || 'phone',
            c: ['#2f8cff', '#0a1f5c'],
            o: c.o.map(function (x) { return { l: x.l, p: +x.p }; })
          });
        });
        // تعديل الاسم والأسعار
        var items = pr.items || {};
        Object.keys(items).forEach(function (id) {
          var p = find(id), o = items[id];
          if (!p) return;
          if (o.n) p.n = o.n;
          (o.o || []).forEach(function (x, i) {
            if (p.o[i] && x && x.p != null && x.p !== '') p.o[i].p = +x.p;
          });
        });
        // إخفاء منتجات
        if (Array.isArray(pr.hidden)) {
          HIDE.length = 0;
          pr.hidden.forEach(function (id) { HIDE.push(id); });
        }
      }

      if (cfg) {
        if (cfg.announce && cfg.announce.length) {
          var a = $('.ann div');
          if (a) a.innerHTML = cfg.announce.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
        }
        if (cfg.about != null) {
          var ab = $('.abt');
          if (ab) ab.innerHTML = esc(cfg.about) + '<span class="hl">' + esc(cfg.aboutHl) + '</span>';
        }
        if (cfg.email) {
          var em = $('a.em[href^="mailto"]');
          if (em) { em.href = 'mailto:' + cfg.email; em.innerHTML = '<span>✉</span>' + esc(cfg.email); }
        }
        if (cfg.phoneText) {
          var ph = $('a.em.ph');
          if (ph) { ph.href = 'tel:' + cfg.phoneText.replace(/[^\d+]/g, ''); ph.innerHTML = '<span>📞</span>' + esc(cfg.phoneText); }
        }
        if (cfg.address) {
          var ad = $('.ad b');
          if (ad) ad.textContent = 'العنوان: ' + cfg.address;
        }
        if (cfg.social) {
          ['ig', 'tt', 'fb'].forEach(function (k) {
            var el = $('.so .' + k);
            if (el && cfg.social[k]) el.href = cfg.social[k];
          });
        }
        if (cfg.hero && cfg.hero.length) {
          var h = cfg.hero.filter(function (x) { return find(x[0]); });
          if (h.length) { HERO.length = 0; h.forEach(function (x) { HERO.push(x); }); }
        }
        if (cfg.reviews) {
          REV.length = 0;
          cfg.reviews.forEach(function (x) { REV.push(x); });
        }
      }

      route();

      // الصور (أكبر حجماً → تتحمّل بعد الباقي)
      list('pimg').then(function (im) {
        var any = false;
        Object.keys(im).forEach(function (id) {
          var d = im[id].d;
          if (!d) return;
          if (id === '_logo') {
            var lg = $('header>a:first-child img');
            if (lg) lg.src = d;
            return;
          }
          var p = find(id);
          if (!p) return;
          p.img = d;
          if (p.gal) p.gal[0] = d;
          any = true;
        });
        if (any) route();
      });
    });
  }

  /* ========== صفحة الفاتورة ========== */
  function invoicePage() {
    Promise.all([rd('site/invoice'), list('inv')]).then(function (r) {
      var cfg = r[0], im = r[1];
      document.querySelectorAll('[data-inv]').forEach(function (el) {
        var v = im[el.getAttribute('data-inv')];
        if (v && v.d) { el.src = v.d; el.style.display = ''; }
      });
      if (cfg) {
        if (cfg.phone) document.querySelectorAll('[data-inv-phone]').forEach(function (e) { e.textContent = cfg.phone; });
        var f = $('.footer-note');
        if (f && (cfg.f1 || cfg.f2)) f.innerHTML = esc(cfg.f1) + '<br>' + esc(cfg.f2);
      }
    });
  }

  function start() {
    if (typeof route === 'function' && typeof P !== 'undefined' && $('#app')) storePage();
    if ($('[data-inv]')) invoicePage();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
