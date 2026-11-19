/* Pimnica Perić — interakcije i jezici (SR / EN / RO)
   Srpski tekst se čita iz same stranice; EN i RO su u i18n.js */
(function () {
  const doc = document.documentElement;
  doc.classList.add('js');

  /* ---------- jezik ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const dict = window.I18N || {};
  const nodes = Array.from(document.querySelectorAll('[data-i]'));
  nodes.forEach(n => { n._sr = n.innerHTML; });
  const attrNodes = Array.from(document.querySelectorAll('[data-i-alt]'));
  attrNodes.forEach(n => { n._srAlt = n.getAttribute('alt'); });

  const langHooks = [];
  window.ppLang = 'sr';
  function setLang(lang) {
    if (!['sr', 'en', 'ro'].includes(lang)) lang = 'sr';
    window.ppLang = lang;
    const idx = lang === 'en' ? 0 : 1;
    nodes.forEach(n => {
      const t = dict[n.dataset.i];
      n.innerHTML = (lang === 'sr' || !t) ? n._sr : t[idx];
    });
    attrNodes.forEach(n => {
      const t = dict[n.dataset.iAlt];
      n.setAttribute('alt', (lang === 'sr' || !t) ? n._srAlt : t[idx]);
    });
    doc.lang = lang === 'sr' ? 'sr-Latn' : lang;
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    store.set('pp-lang', lang);
    langHooks.forEach(fn => fn(lang));
  }
  const tr = (key, sr) => { const t = dict[key]; return (window.ppLang === 'sr' || !t) ? sr : t[window.ppLang === 'en' ? 0 : 1]; };
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  const saved = store.get('pp-lang') || new URLSearchParams(location.search).get('lang');
  if (saved && saved !== 'sr') setLang(saved);

  /* ---------- header ---------- */
  const header = document.querySelector('.site-header');
  const bar = document.querySelector('.mobile-bar');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-solid', y > 60);
    if (bar) bar.classList.toggle('show', y > window.innerHeight * 0.6);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobilni meni ---------- */
  const burger = document.querySelector('.burger');
  if (burger) {
    const close = () => { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ---------- pojavljivanje pri skrolu ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (/[?&]shot\b/.test(location.search)) {
    // režim za snimke ekrana: sve odmah vidljivo
    reveals.forEach(el => { el.style.transition = 'none'; el.classList.add('in'); });
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* ---------- uvod: ukloni ekran kad se vrata otvore ---------- */
  if (doc.classList.contains('intro')) {
    setTimeout(() => {
      doc.classList.remove('intro');
      const s = document.querySelector('.intro-screen'); if (s) s.remove();
    }, 3100);
  }

  /* ---------- linija napretka ---------- */
  const prog = document.createElement('div');
  prog.className = 'progress'; prog.setAttribute('aria-hidden', 'true');
  document.body.appendChild(prog);
  const setProg = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
  };
  window.addEventListener('scroll', setProg, { passive: true });
  window.addEventListener('resize', setProg);
  setProg();

  /* ---------- brojevi koji se odbrojavaju ---------- */
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = Array.from(document.querySelectorAll('.fact b, .hero-facts b')).filter(el => /^\d+/.test(el.textContent.trim()));
  if (counters.length && 'IntersectionObserver' in window && !reduce && !/[?&]shot\b/.test(location.search)) {
    const run = el => {
      const m = el.textContent.trim().match(/^(\d+)(.*)$/);
      const end = +m[1], rest = m[2], start = end > 1000 ? end - 140 : 0, t0 = performance.now(), dur = 1600;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + (end - start) * e) + rest;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { cio.unobserve(e.target); setTimeout(() => run(e.target), doc.classList.contains('intro') ? 2600 : 150); }
    }), { threshold: 0.6 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---------- uživo iz Rajca: temperatura i zalazak sunca ---------- */
  const live = document.querySelector('.live');
  if (live && window.fetch) {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=44.098&longitude=22.548&current=temperature_2m&daily=sunset&timezone=Europe%2FBelgrade&forecast_days=1')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const t = d && d.current && d.current.temperature_2m;
        const ss = d && d.daily && d.daily.sunset && d.daily.sunset[0];
        if (typeof t !== 'number' || !ss) return;
        live.querySelector('[data-live="temp"]').textContent = Math.round(t) + ' °C';
        live.querySelector('[data-live="sunset"]').textContent = ss.slice(11, 16);
        live.hidden = false;
      })
      .catch(() => {});
  }

  /* ---------- godina u vinogradu: označi tekući mesec ---------- */
  const month = document.querySelector('.month[data-m="' + (new Date().getMonth() + 1) + '"]');
  if (month) month.classList.add('now');

  /* ---------- vinski vodič ---------- */
  const finder = document.querySelector('.finder-result');
  if (finder) {
    const W = {
      tamjanika: ['Crna tamjanika', 'vino-tamjanika.jpg', 'tamjanika', 'v.w1.tag', 'Crno · poluslatko'],
      zacinjak: ['Začinjak', 'vino-zacinjak.jpg', 'zacinjak', 'v.red', 'Crveno'],
      cabernet: ['Cabernet Sauvignon', 'vino-cabernet.jpg', 'cabernet', 'v.red', 'Crveno'],
      chardonnay: ['Chardonnay', 'vino-chardonnay.jpg', 'chardonnay', 'v.white', 'Belo'],
      rizling: ['Rizling', 'vino-rizling.jpg', 'rizling', 'v.white', 'Belo'],
      kruska: ['Kruška', 'rakija-kruska.jpg', 'rakije', 'v.rk1.s', 'Domaća rakija od kruške'],
      plamen: ['Rajački plamen', 'rakija-rajacki-plamen.jpg', 'rakije', 'v.rk2.s', 'Domaća komova rakija']
    };
    // [vino, ključ prevoda za objašnjenje, srpski tekst]
    const F = {
      rostilj: [['cabernet', 'v.f.r1', 'Pečenja, jagnjeća rebarca i mešano meso sa žara — njegov teren.'], ['zacinjak', 'v.f.r2', 'Pitko i osvežavajuće, a pravi par crvenom mesu.']],
      divljac: [['cabernet', 'v.f.r3', 'Snažno telo i arome crnog voća prate divljač, pečurke i ovčji sir.']],
      predjela: [['zacinjak', 'v.f.r4', 'Uz pršut, šunku i jela pikantnog ukusa.'], ['rizling', 'v.f.r5', 'Svež i citrusni uz hladna predjela i šunku.'], ['plamen', 'v.f.r6', 'Komovica za početak: uz predjela, meze i kiselu zimnicu.']],
      riba: [['chardonnay', 'v.f.r7', 'Morska i rečna riba sa prelivima.'], ['rizling', 'v.f.r8', 'Kristalno čist uz belu ribu.'], ['kruska', 'v.f.r9', 'Elegantna rakija koja lepo prati rečnu ribu.']],
      belo: [['chardonnay', 'v.f.r10', 'Ćuretina, piletina i svinjski specijaliteti sa prelivima.'], ['rizling', 'v.f.r11', 'Lak i balansiran uz sva jela od belog mesa.'], ['kruska', 'v.f.r12', 'Uz bela mesa sa prelivima, testenine i rižoto.']],
      sir: [['zacinjak', 'v.f.r13', 'Fini masni zreli sirevi.'], ['chardonnay', 'v.f.r14', 'Tvrdi i polutvrdi kačkavalj i kozji sir.'], ['rizling', 'v.f.r15', 'Tvrdi sirevi sa začinskim travama.']],
      slatko: [['tamjanika', 'v.f.r16', 'Štrudle i pite — poluslatka tamjanika je stvorena za njih.'], ['chardonnay', 'v.f.r17', 'Voćni suvi kolači.'], ['rizling', 'v.f.r18', 'Kolač sa suvim voćem.']],
      aperitiv: [['tamjanika', 'v.f.r19', 'Rashlađena, sama u čaši, kao dobrodošlica.'], ['plamen', 'v.f.r20', 'Komovica uz koju se u Krajini počinje svaka trpeza.']]
    };
    let current = 'rostilj';
    const render = () => {
      finder.innerHTML = F[current].map(([w, k, sr]) => {
        const v = W[w];
        return '<a class="pick" href="#' + v[2] + '"><div class="arch"><img src="' + v[1] + '" alt="' + v[0] + '"></div>' +
          '<div><small>' + tr(v[3], v[4]) + '</small><h4>' + tr({ kruska: 'v.rk1.n', rizling: 'v.vr3' }[w] || '', v[0]) + '</h4><p>' + tr(k, sr) + '</p>' +
          '<span class="more">' + tr('v.f.more', 'Više o vinu') + ' →</span></div></a>';
      }).join('');
    };
    document.querySelectorAll('[data-dish]').forEach(b => b.addEventListener('click', () => {
      current = b.dataset.dish;
      document.querySelectorAll('[data-dish]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }));
    langHooks.push(render);
    render();
  }

  /* ---------- godina ---------- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- galerija: filteri + lightbox ---------- */
  const gallery = document.querySelector('.gallery');
  if (gallery) {
    const figs = Array.from(gallery.querySelectorAll('figure'));
    document.querySelectorAll('.filters button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filters button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        const f = btn.dataset.filter;
        figs.forEach(fig => fig.classList.toggle('hide', f !== 'all' && fig.dataset.cat !== f));
      });
    });

    const lb = document.querySelector('.lightbox');
    const lbImg = lb.querySelector('img');
    const lbCap = lb.querySelector('.lb-cap');
    let cur = 0;
    const visible = () => figs.filter(f => !f.classList.contains('hide'));
    const show = i => {
      const v = visible(); if (!v.length) return;
      cur = (i + v.length) % v.length;
      const img = v[cur].querySelector('img');
      lbImg.src = img.src; lbImg.alt = img.alt;
      const cap = v[cur].querySelector('figcaption');
      lbCap.textContent = cap ? cap.textContent : '';
    };
    const open = fig => { show(visible().indexOf(fig)); lb.classList.add('open'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); };
    const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
    figs.forEach(fig => {
      fig.tabIndex = 0;
      fig.addEventListener('click', () => open(fig));
      fig.addEventListener('keydown', e => { if (e.key === 'Enter') open(fig); });
    });
    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-prev').addEventListener('click', () => show(cur - 1));
    lb.querySelector('.lb-next').addEventListener('click', () => show(cur + 1));
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }
})();
