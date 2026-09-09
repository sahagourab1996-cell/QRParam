/* ============================================================
   PARAMA JEWELLERY MUSEUM — interaction layer
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ══════════════════════════════════════════════════════════
     1. BRILLIANT-CUT GEM  (built from real 3D-transformed facets)
     ══════════════════════════════════════════════════════════ */
  function buildGem(host) {
    if (!host) return;

    var SIDES   = 8,
        R       = 74,                                   // girdle circumradius
        STEP    = 360 / SIDES,
        RAD     = Math.PI / 180,
        half    = (180 / SIDES) * RAD,                  // 22.5deg
        apothem = R * Math.cos(half),                   // dist. face-plane -> axis
        edge    = 2 * R * Math.sin(half),               // girdle facet width
        PAV     = 88,                                   // pavilion depth
        CROWN   = 30,                                   // crown height
        TABLE_R = R * 0.5,
        tableAp = TABLE_R * Math.cos(half),
        frag    = document.createDocumentFragment();

    // slant lengths + lean angles that make the facets meet exactly
    var pavSlant  = Math.hypot(apothem, PAV),
        pavLean   = Math.asin(apothem / pavSlant) / RAD,
        crownRun  = apothem - tableAp,
        crownSlant= Math.hypot(crownRun, CROWN),
        crownLean = Math.asin(crownRun / crownSlant) / RAD;

    function facet(cls, css) {
      var d = document.createElement('div');
      d.className = cls;
      for (var k in css) d.style[k] = css[k];
      frag.appendChild(d);
      return d;
    }

    for (var i = 0; i < SIDES; i++) {
      var spin = i * STEP,
          alt  = i % 2 ? ' alt' : '';

      // ── pavilion: triangle, apex converging on the axis below
      facet('facet' + alt, {
        width:  edge + 'px',
        height: pavSlant + 'px',
        marginLeft: (-edge / 2) + 'px',
        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
        webkitClipPath: 'polygon(0 0, 100% 0, 50% 100%)',
        transformOrigin: '50% 0',
        transform: 'rotateY(' + spin + 'deg) translateZ(' + apothem + 'px) rotateX(' + (-pavLean) + 'deg)'
      });

      // ── crown: trapezoid leaning inward to the table
      facet('facet' + (i % 2 ? '' : ' alt'), {
        width:  edge + 'px',
        height: crownSlant + 'px',
        marginLeft: (-edge / 2) + 'px',
        marginTop:  (-crownSlant) + 'px',
        clipPath: 'polygon(25% 0, 75% 0, 100% 100%, 0 100%)',
        webkitClipPath: 'polygon(25% 0, 75% 0, 100% 100%, 0 100%)',
        transformOrigin: '50% 100%',
        transform: 'rotateY(' + spin + 'deg) translateZ(' + apothem + 'px) rotateX(' + crownLean + 'deg)'
      });

      // ── girdle: the bright band around the widest point
      facet('girdle', {
        width:  edge + 'px',
        height: '5px',
        marginLeft: (-edge / 2) + 'px',
        marginTop:  '-2.5px',
        transform: 'rotateY(' + spin + 'deg) translateZ(' + apothem + 'px)'
      });
    }

    // ── table: flat octagon capping the crown
    var pts = [];
    for (var t = 0; t < SIDES; t++) {
      var a = (t * STEP + STEP / 2) * RAD;
      pts.push((50 + 50 * Math.cos(a)).toFixed(2) + '% ' + (50 + 50 * Math.sin(a)).toFixed(2) + '%');
    }
    facet('table', {
      width:  (TABLE_R * 2) + 'px',
      height: (TABLE_R * 2) + 'px',
      marginLeft: -TABLE_R + 'px',
      marginTop:  -TABLE_R + 'px',
      clipPath: 'polygon(' + pts.join(',') + ')',
      webkitClipPath: 'polygon(' + pts.join(',') + ')',
      transform: 'translateY(' + (-CROWN) + 'px) rotateX(90deg)'
    });

    host.appendChild(frag);
  }

  buildGem(document.getElementById('gem'));

  /* ══════════════════════════════════════════════════════════
     2. 3D WORDMARK — stagger each letter's lift
     ══════════════════════════════════════════════════════════ */
  var letters = document.querySelectorAll('.wordmark span');
  Array.prototype.forEach.call(letters, function (el, i) {
    el.style.setProperty('--d', i);
  });

  /* ══════════════════════════════════════════════════════════
     3. PARALLAX DEPTH — push elements onto their own Z planes
     ══════════════════════════════════════════════════════════ */
  Array.prototype.forEach.call(document.querySelectorAll('[data-depth]'), function (el) {
    el.style.setProperty('--z', el.dataset.depth + 'px');
  });

  /* ══════════════════════════════════════════════════════════
     4. GOLD DUST — drifting particle field
     ══════════════════════════════════════════════════════════ */
  (function dust() {
    var cv = document.getElementById('dust');
    if (!cv || reduced) return;

    var ctx = cv.getContext('2d'),
        dpr = Math.min(window.devicePixelRatio || 1, 2),
        w = 0, h = 0, motes = [], raf = null;

    function seed() {
      var count = Math.round(Math.min(110, (w * h) / 14000));
      motes = [];
      for (var i = 0; i < count; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.7 + 0.4,
          vy: -(Math.random() * 0.28 + 0.06),
          vx: (Math.random() - 0.5) * 0.14,
          a: Math.random() * 0.6 + 0.15,
          tw: Math.random() * Math.PI * 2,
          ts: Math.random() * 0.035 + 0.008
        });
      }
    }

    function resize() {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width  = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx;
        m.y += m.vy;
        m.tw += m.ts;

        if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;

        var alpha = m.a * (0.55 + 0.45 * Math.sin(m.tw));
        var g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
        g.addColorStop(0, 'rgba(255,236,182,' + alpha + ')');
        g.addColorStop(0.4, 'rgba(212,175,55,' + (alpha * 0.45) + ')');
        g.addColorStop(1, 'rgba(212,175,55,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) frame();
    });

    resize();
    frame();
  })();

  /* ══════════════════════════════════════════════════════════
     5. CARD TILT — the whole card turns toward the pointer
     ══════════════════════════════════════════════════════════ */
  (function tilt() {
    var card = document.getElementById('card');
    if (!card || reduced || !fine) return;

    var MAX = 9,
        tx = 0, ty = 0,   // target
        cx = 0, cy = 0,   // current
        raf = null;

    function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      card.style.transform = 'rotateX(' + (cy * MAX).toFixed(3) + 'deg) rotateY(' + (cx * MAX).toFixed(3) + 'deg)';
      if (Math.abs(tx - cx) > 0.0004 || Math.abs(ty - cy) > 0.0004) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }

    window.addEventListener('pointermove', function (e) {
      tx =  (e.clientX / window.innerWidth  - 0.5) * 2;
      ty = -(e.clientY / window.innerHeight - 0.5) * 2;
      kick();

      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    window.addEventListener('pointerleave', function () { tx = ty = 0; kick(); });
    window.addEventListener('blur',        function () { tx = ty = 0; kick(); });
  })();

  /* ══════════════════════════════════════════════════════════
     6. QR OVERLAY
     ══════════════════════════════════════════════════════════ */
  (function qr() {
    var modal = document.getElementById('qrModal'),
        open  = document.getElementById('qrBtn'),
        close = document.getElementById('qrClose');
    if (!modal || !open || !close) return;

    function show() { modal.classList.add('open');  close.focus(); }
    function hide() { modal.classList.remove('open'); open.focus(); }

    open.addEventListener('click', show);
    close.addEventListener('click', hide);
    modal.addEventListener('click', function (e) { if (e.target === modal) hide(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) hide();
    });
  })();

  /* ══════════════════════════════════════════════════════════
     7. CURTAIN UP
     ══════════════════════════════════════════════════════════ */
  function ready() {
    document.body.classList.add('ready');
  }

  if (document.readyState === 'complete') {
    setTimeout(ready, 200);
  } else {
    window.addEventListener('load', function () { setTimeout(ready, 450); });
    // never let a slow asset trap the visitor behind the loader
    setTimeout(ready, 3500);
  }
})();
