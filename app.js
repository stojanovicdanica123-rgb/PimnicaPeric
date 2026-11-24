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
  const heroArch = document.querySelector('.hero-arch');
  const onScroll = () => {
    const y = window.scrollY;
    // na početnoj header ostaje providan dok traje hero sa lukom
    const solidAt = heroArch && heroArch.offsetHeight > innerHeight * 1.2 ? heroArch.offsetHeight - 90 : 60;
    if (header) header.classList.toggle('is-solid', y > solidAt);
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
      tamjanika: ['Crna tamjanika', 'vino-tamjanika.png', 'tamjanika', 'v.w1.tag', 'Crno · poluslatko', '#7a1424'],
      zacinjak: ['Začinjak', 'vino-zacinjak.png', 'zacinjak', 'v.red', 'Crveno', '#6e1020'],
      cabernet: ['Cabernet Sauvignon', 'vino-cabernet.png', 'cabernet', 'v.red', 'Crveno', '#5e0f1b'],
      chardonnay: ['Chardonnay', 'vino-chardonnay.png', 'chardonnay', 'v.white', 'Belo', '#b8963a'],
      rizling: ['Rizling', 'vino-rizling.png', 'rizling', 'v.white', 'Belo', '#c2ad4c'],
      kruska: ['Kruška', 'rakija-kruska.png', 'rakije', 'v.rk1.s', 'Domaća rakija od kruške', '#c9b98f'],
      plamen: ['Rajački plamen', 'rakija-rajacki-plamen.png', 'rakije', 'v.rk2.s', 'Domaća komova rakija', '#c9b98f']
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
        return '<a class="pick" href="#' + v[2] + '"><div class="niche lit" style="--wc:' + v[5] + '"><img src="' + v[1] + '" alt="' + v[0] + '"></div>' +
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

  /* =========================================================
     V3 — luk, niše, horizontalni skrol, animacije
     ========================================================= */
  const shot = /[?&]shot\b/.test(location.search);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const ticks = [];   // funkcije koje se zovu pri skrolu / promeni veličine (jednom po frejmu)
  let queued = false;
  const tick = () => { queued = false; ticks.forEach(fn => fn()); };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', () => { ticks.forEach(fn => fn.measure && fn.measure()); queue(); });

  /* ---------- hero kroz kameni luk ---------- */
  if (heroArch) {
    const stage = heroArch.querySelector('.ha-stage');
    const media = heroArch.querySelector('.ha-media');
    const slotBox = heroArch.querySelector('.ha-slot');
    const slot = slotBox.querySelector('.ha-open') || slotBox;   // slike staju u otvor kamenog luka
    const pinMQ = matchMedia('(min-width: 961px)');
    let R = null;
    const measure = () => {
      media.style.cssText = '';
      const s = stage.getBoundingClientRect(), r = slot.getBoundingClientRect();
      R = { t: r.top - s.top, l: r.left - s.left, w: r.width, h: r.height, sw: s.width, sh: s.height };
    };
    const frame = () => {
      if (!R) measure();
      let p = 0;
      if (pinMQ.matches && !reduce) {
        const dist = heroArch.offsetHeight - innerHeight;
        p = dist > 0 ? clamp((scrollY - heroArch.offsetTop) / (dist * .82), 0, 1) : 0;
      }
      const e = ease(p), k = 1 - e, rad = R.w / 2 * k;
      // vrh, levo, širina i visina (ne donja ivica) — pa slika ostaje u otvoru luka i kad se hero kasnije produži
      media.style.top = (R.t * k) + 'px';
      media.style.left = (R.l * k) + 'px';
      media.style.width = (R.w + (R.sw - R.w) * e) + 'px';
      media.style.height = (R.h + (R.sh - R.h) * e) + 'px';
      media.style.right = 'auto'; media.style.bottom = 'auto';
      media.style.borderRadius = rad + 'px ' + rad + 'px ' + (4 * k) + 'px ' + (4 * k) + 'px';
      stage.style.setProperty('--p', e.toFixed(4));
    };
    frame.measure = () => { R = null; };
    ticks.push(frame);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { R = null; queue(); });
    window.addEventListener('load', () => { R = null; queue(); });
    if ('ResizeObserver' in window) new ResizeObserver(() => { R = null; queue(); }).observe(stage);
    frame();

    // vrata: posle prvog otvaranja prate skrol — na vrhu se zatvore, nadole se ponovo otvore
    const doors = heroArch.querySelector('.ha-doors');
    let armed = false;
    const doorTick = () => {
      if (!doors.classList.contains('door-live')) return;
      const T = Math.max(140, innerHeight * .22);
      if (!armed && scrollY > T * .6) armed = true;
      const d = armed ? clamp(scrollY / T, 0, 1) : 1;
      doors.style.setProperty('--door', d.toFixed(3));
    };
    const lastLeaf = doors.querySelector('.leaf.r');
    if (lastLeaf && !shot) {
      lastLeaf.addEventListener('animationend', () => {
        // preuzmi otvoren položaj bez prelaza, inače bi se krila zatvorila i ponovo otvorila
        doors.style.setProperty('--door', '1');
        doors.classList.add('door-live', 'door-snap');
        void doors.offsetWidth;
        doorTick();
        requestAnimationFrame(() => requestAnimationFrame(() => doors.classList.remove('door-snap')));
      });
      ticks.push(doorTick);
    }

    // smena slika kroz luk
    const slides = Array.from(heroArch.querySelectorAll('.ha-slide'));
    const caps = [['h.s1', 'Pimnica noću'], ['h.s2', 'Čaša ispred crvenih vrata'], ['h.s3', 'Jesen pod lozom'], ['h.s4', 'Trpeza domaćina']];
    const capEl = heroArch.querySelector('.ha-cap-txt'), countEl = heroArch.querySelector('.ha-count'), barEl = heroArch.querySelector('.ha-bar');
    const DUR = 6500;
    let cur = 0, timer = null;
    const setCap = () => {
      capEl.textContent = tr(caps[cur][0], caps[cur][1]);
      countEl.innerHTML = '<b>0' + (cur + 1) + '</b> / 0' + slides.length;
    };
    const go = n => {
      slides[cur].classList.remove('on');
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add('on');
      setCap();
      barEl.classList.remove('run'); void barEl.offsetWidth; barEl.classList.add('run');
    };
    barEl.style.setProperty('--dur', DUR + 'ms');
    setCap();
    langHooks.push(setCap);
    if (!shot && slides.length > 1) {
      const start = () => { barEl.classList.add('run'); timer = setInterval(() => go(cur + 1), DUR); };
      setTimeout(start, doc.classList.contains('intro') ? 2600 : 600);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { clearInterval(timer); barEl.classList.remove('run'); }
        else { clearInterval(timer); go(cur); timer = setInterval(() => go(cur + 1), DUR); }
      });
    }
  }

  /* ---------- niše: svetlo se pali kad uđu u kadar ---------- */
  const niches = Array.from(document.querySelectorAll('.niche:not(.lit)'));
  if (shot || reduce || !('IntersectionObserver' in window)) niches.forEach(n => n.classList.add('lit'));
  else {
    const nio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('lit'); nio.unobserve(e.target); }
    }), { threshold: .35 });
    niches.forEach(n => nio.observe(n));
  }

  /* ---------- vina: horizontalni skrol ---------- */
  const wh = document.querySelector('.wine-h');
  if (wh) {
    const track = wh.querySelector('.wh-track');
    const panels = Array.from(wh.querySelectorAll('.wpanel'));
    const navA = Array.from(wh.querySelectorAll('.wh-nav a'));
    const countB = wh.querySelector('.wh-count b');
    const pinMQ = matchMedia('(min-width: 961px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)');
    let D = 0, vw = 0, active = -1, BT = 0, BB = 0;
    const measure = () => {
      vw = document.documentElement.clientWidth;
      wh.style.setProperty('--vw', vw + 'px');
      if (pinMQ.matches) {
        D = Math.max(0, track.scrollWidth - vw);
        const cs = getComputedStyle(wh); BT = parseFloat(cs.borderTopWidth) || 0; BB = parseFloat(cs.borderBottomWidth) || 0;   // grede gore i dole
        wh.style.height = (innerHeight + D + BT + BB) + 'px';
      } else {
        D = 0; wh.style.height = ''; track.style.transform = '';
        panels.forEach(p => { p.querySelector('.wp-media').style.transform = ''; p.querySelector('.wp-body').style.opacity = ''; });
      }
    };
    const setActive = i => {
      if (i === active) return;
      active = i;
      navA.forEach((a, j) => a.classList.toggle('on', j === i));
      if (countB) countB.textContent = '0' + (i + 1);
      wh.style.setProperty('--wc-active', panels[i].style.getPropertyValue('--wc'));
    };
    const frame = () => {
      if (!pinMQ.matches || !D) {
        // složen prikaz: aktivno je vino najbliže sredini ekrana
        let best = 0, bd = Infinity;
        panels.forEach((p, i) => { const r = p.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - innerHeight / 2); if (d < bd) { bd = d; best = i; } });
        setActive(best);
        return;
      }
      const p = clamp((scrollY - wh.offsetTop - BT) / D, 0, 1);
      track.style.transform = 'translate3d(' + (-p * D).toFixed(1) + 'px,0,0)';
      wh.style.setProperty('--hp', p.toFixed(4));
      panels.forEach((pn, i) => {
        const off = i * vw - p * D;             // pomeraj panela od leve ivice
        const k = off / vw;                     // -1..0..1
        pn.querySelector('.wp-media').style.transform = 'translate3d(' + (k * -vw * .16).toFixed(1) + 'px,0,0)';
        pn.querySelector('.wp-body').style.opacity = clamp(1 - Math.abs(k) * 1.6, 0, 1).toFixed(3);
      });
      setActive(clamp(Math.round(p * (panels.length - 1)), 0, panels.length - 1));
    };
    frame.measure = () => { measure(); };
    measure(); ticks.push(frame); frame();
    window.addEventListener('load', () => { measure(); frame(); });

    // sidra (#tamjanika …) vode na pravo mesto u vodoravnom nizu
    const goTo = (id, smooth) => {
      const i = panels.findIndex(p => p.id === id);
      if (i < 0) return false;
      const top = pinMQ.matches && D ? wh.offsetTop + BT + D * i / (panels.length - 1) : panels[i].getBoundingClientRect().top + scrollY - 70;
      window.scrollTo({ top: Math.round(top) + 1, behavior: smooth ? 'smooth' : 'auto' });
      return true;
    };
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      if (goTo(a.getAttribute('href').slice(1), true)) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); }
    });
    if (location.hash) {
      const id = location.hash.slice(1);
      if (panels.some(p => p.id === id)) {
        doc.style.scrollBehavior = 'auto';
        const jump = () => { measure(); goTo(id, false); frame(); };
        requestAnimationFrame(jump); window.addEventListener('load', () => setTimeout(jump, 30));
        setTimeout(() => { doc.style.scrollBehavior = ''; }, 800);
      }
    }
  }

  /* ---------- planer smeštaja: koliko vas dolazi ---------- */
  const planner = document.querySelector('.planner');
  if (planner) {
    const rooms = Array.from(document.querySelectorAll('.room[data-room]')).map(el => ({
      el, n: +el.dataset.room, cap: +el.dataset.cap, own: +el.dataset.own
    }));
    const MAX = rooms.reduce((a, r) => a + r.cap, 0);
    rooms.forEach(r => { const b = document.createElement('span'); b.className = 'room-badge'; r.el.appendChild(b); r.badge = b; });
    // svi rasporedi soba, unapred
    const combos = [];
    for (let m = 1; m < 1 << rooms.length; m++) {
      const set = rooms.filter((_, i) => m & (1 << i));
      combos.push({ set, cap: set.reduce((a, r) => a + r.cap, 0), own: set.reduce((a, r) => a + r.own, 0) });
    }
    // najmanje soba → najmanje praznih kreveta → više soba sa svojim kupatilom → niži brojevi soba
    const best = n => combos.filter(c => c.cap >= n).sort((a, b) =>
      a.set.length - b.set.length || (a.cap - n) - (b.cap - n) || b.own - a.own ||
      (a.set.map(r => r.n).join() < b.set.map(r => r.n).join() ? -1 : 1))[0];
    const num = planner.querySelector('.pl-num');
    const seats = planner.querySelector('.pl-seats');
    const result = planner.querySelector('.pl-result');
    const roomsOut = planner.querySelector('.pl-rooms');
    const sumOut = planner.querySelector('.pl-sum');
    const [minus, plus] = planner.querySelectorAll('.pl-btn');
    for (let i = 0; i < MAX; i++) { const s = document.createElement('i'); s.style.setProperty('--k', i); seats.appendChild(s); }
    const seatEls = Array.from(seats.children);
    let n = 2, touched = false;
    const render = () => {
      const c = best(n);
      num.textContent = n;
      minus.disabled = n <= 1; plus.disabled = n >= MAX;
      minus.setAttribute('aria-label', tr('st.p.less', 'Manje gostiju'));
      plus.setAttribute('aria-label', tr('st.p.more', 'Više gostiju'));
      const name = r => r.el.querySelector('h3').textContent.trim();
      roomsOut.innerHTML = c.set.map(name).join('<span class="plus">+</span>');
      sumOut.textContent = c.cap + ' ' + tr('st.p.beds', 'mesta ukupno') + (c.own ? ' · ' + tr('st.p.own', 'sopstveno kupatilo') : '');
      // mesta: popunjena po sobama, sa razmakom između soba
      let k = 0;
      seatEls.forEach(s => s.classList.remove('on', 'gap'));
      c.set.forEach((r, j) => { for (let i = 0; i < r.cap; i++, k++) { if (i === 0 && j > 0) seatEls[k].classList.add('gap'); if (k < n) seatEls[k].classList.add('on'); } });
      rooms.forEach(r => {
        const inSet = c.set.includes(r);
        r.el.classList.toggle('match', touched && inSet);
        r.el.classList.toggle('dim', touched && !inSet && (c.set.length > 1 || r.cap < n));
        r.badge.textContent = tr('st.p.badge', 'Predlog');
      });
      result.classList.remove('swap'); void result.offsetWidth; result.classList.add('swap');
    };
    const step = d => {
      const v = clamp(n + d, 1, MAX);
      if (v === n) return;
      n = v; touched = true;
      num.classList.remove('bump'); void num.offsetWidth; num.classList.add('bump');
      render();
    };
    minus.addEventListener('click', () => step(-1));
    plus.addEventListener('click', () => step(1));
    planner.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { if (e.target.closest('.pl-stepper')) { e.preventDefault(); step(1); } }
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { if (e.target.closest('.pl-stepper')) { e.preventDefault(); step(-1); } }
    });
    langHooks.push(render);
    render();
  }

  /* ---------- jelovnik: fotografija jela prati izabranu stavku ---------- */
  const mcard = document.querySelector('.menu-card');
  if (mcard) {
    const items = Array.from(mcard.querySelectorAll('.mc-item'));
    const pics = Array.from(document.querySelectorAll('.menu-pics img'));
    const cap = document.querySelector('.menu-photo-cap');
    let cur = 0;
    const show = i => {
      if (i === cur && cap.querySelector('.mp-name').textContent) return;
      cur = i;
      items.forEach((it, j) => it.classList.toggle('on', j === i));
      pics.forEach((p, j) => p.classList.toggle('on', j === i));
      cap.querySelector('.mp-num').textContent = items[i].querySelector('.mc-n').textContent;
      cap.querySelector('.mp-name').textContent = items[i].querySelector('h4').textContent;
      cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
    };
    items.forEach((it, i) => {
      it.addEventListener('mouseenter', () => show(i));
      it.addEventListener('focus', () => show(i));
      it.addEventListener('click', () => show(i));
    });
    langHooks.push(() => { cap.querySelector('.mp-name').textContent = items[cur].querySelector('h4').textContent; });
  }

  /* ---------- naslovi: reči izranjaju ---------- */
  const splitWords = el => {
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    };
    walk(el);
    el.querySelectorAll('.w > span').forEach((s, i) => s.style.setProperty('--wi', i));
    el.classList.add('wsplit');
  };
  const heads = Array.from(document.querySelectorAll('main h2')).filter(h => h.closest('.reveal'));
  if (!reduce) {
    heads.forEach(splitWords);
    langHooks.push(() => heads.forEach(h => { if (!h.querySelector('.w')) splitWords(h); }));
  }

  /* ---------- slike se otkrivaju odozdo ---------- */
  const rimgs = Array.from(document.querySelectorAll('main .arch, main .img-card')).filter(el => !el.closest('.hero') && !el.classList.contains('menu-pics') && el.querySelector('img'));
  if (!shot && !reduce && 'IntersectionObserver' in window) {
    rimgs.forEach(el => el.classList.add('rimg'));
    const rio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('shown'); rio.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: .12 });
    rimgs.forEach(el => rio.observe(el));
  }

  /* ---------- paralaks ---------- */
  if (!reduce) {
    const px = Array.from(document.querySelectorAll('img[data-parallax]')).map(el => ({ el, box: el.parentElement, s: +el.dataset.parallax || .15 }));
    const ph = document.querySelector('.page-hero > .hero-media');   // u kamenom luku fotografija miruje
    const phc = document.querySelector('.page-hero .hero-content');
    const pframe = () => {
      px.forEach(({ el, box, s }) => {
        const r = box.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        const k = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight / 2 + r.height / 2); // -1..1
        el.style.transform = 'translate3d(0,' + (k * s * -r.height).toFixed(1) + 'px,0)';
      });
      if (ph && scrollY < innerHeight * 1.2) {
        ph.style.transform = 'translate3d(0,' + (scrollY * .35).toFixed(1) + 'px,0)';
        if (phc) { phc.style.opacity = clamp(1 - scrollY / (innerHeight * .65), 0, 1).toFixed(3); phc.style.transform = 'translate3d(0,' + (scrollY * .12).toFixed(1) + 'px,0)'; }
      }
    };
    ticks.push(pframe); pframe();
  }

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
