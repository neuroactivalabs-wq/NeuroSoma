/* NeuroSoma · Calma y Bienestar · PWA · Neuroactiva Labs */
(function () {
  'use strict';
  const D = window.DATA, CFG = window.CONFIG, ICONS = window.ICONS, NSCode = window.NSCode;
  const app = document.getElementById('app');

  /* ───────── utilidades ───────── */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (n, s = 24) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const mem = {};
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem('ns_' + k); return v === null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem('ns_' + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { delete mem[k]; try { localStorage.removeItem('ns_' + k); } catch (e) {} }
  };
  const primera = t => { const i = t.indexOf('. '); return i < 0 ? t : t.slice(0, i + 1); };
  const resto = t => { const i = t.indexOf('. '); return i < 0 ? '' : t.slice(i + 2).trim(); };
  const paras = t => String(t).split('\n\n').map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const fmt = s => s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + ' s';
  const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  let toastT;
  function toast(msg) {
    const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800);
  }
  async function copyText(txt, okMsg) {
    try { await navigator.clipboard.writeText(txt); toast(okMsg || 'Copiado'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(okMsg || 'Copiado'); } catch (e2) { toast('No pude copiar. Escríbelo a mano: ' + txt); }
      ta.remove();
    }
  }

  /* ───────── contenido ───────── */
  const MODS = D.order.map(k => D.mods[k]);
  const EX = {}; const MODOF = {};
  MODS.forEach(m => m.items.forEach(e => { EX[e.id] = e; MODOF[e.id] = m; }));
  const FREE = new Set(D.free);
  const SECTION = D.sectionBefore;
  const ICON_OF = { 'Icons.bolt': 'bolt', 'Icons.child_care': 'child_care', 'Icons.elderly': 'elderly', 'Icons.local_fire_department': 'local_fire_department', 'Icons.nightlight_round': 'nightlight', 'Icons.school': 'school', 'Icons.self_improvement': 'self_improvement', 'Icons.vibration': 'vibration', 'Icons.volunteer_activism': 'volunteer_activism', 'Icons.waves': 'waves', 'Icons.wb_sunny_outlined': 'wb_sunny', 'Icons.work_outline': 'work' };
  const RECURSOS = [
    { n: 1, title: 'Respira y vuelve al presente', sub: 'Dos respiraciones profundas y nombrar lo que ves.', src: 'img/recurso_1.png' },
    { n: 2, title: 'Relajación muscular paso a paso', sub: 'Aprieta y suelta para soltar la tensión.', src: 'img/recurso_2.png' },
    { n: 3, title: 'Toma distancia de un pensamiento', sub: 'Mira tus pensamientos desde afuera.', src: 'img/recurso_3.png' }
  ];
  const KIT = [
    { n: 1, title: 'Respira: suelta el aire más largo' },
    { n: 2, title: 'Vuelve al presente: 5-4-3-2-1' },
    { n: 3, title: 'Mi plan por si vuelve a temblar' },
    { n: 4, title: 'Mi mochila lista' },
    { n: 5, title: 'Una noche más tranquila' },
    { n: 6, title: '¿Cuándo pedir ayuda?' }
  ];
  const KIT_FREE = new Set(CFG.KIT_LIBRES || []);

  /* ───────── VIP por código ───────── */
  function myId() {
    let id = store.get('id');
    if (!id || typeof id !== 'string' || id.length !== 6) {
      id = ''; const a = new Uint32Array(6); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.floor(Math.random() * 1e9));
      for (let i = 0; i < 6; i++) id += NSCode.AL[a[i] % NSCode.AL.length];
      store.set('id', id);
    }
    return id;
  }
  let vipOK = false;
  const isVip = () => vipOK;
  const locked = id => !vipOK && !FREE.has(id);
  async function checkVip() { const c = store.get('vip'); vipOK = !!c && await NSCode.verify(CFG.PUBLIC_KEY, c, myId()); return vipOK; }
  async function tryUnlock(code) {
    if (!(await NSCode.verify(CFG.PUBLIC_KEY, code, myId()))) return false;
    store.set('vip', NSCode.norm(code)); vipOK = true; return true;
  }

  /* ───────── música ───────── */
  const music = { a: null, on: false, vol: store.get('vol', 50) };
  function musicInit() {
    if (music.a) return;
    music.a = new Audio('audio/calma_1.mp3'); music.a.loop = true; music.a.preload = 'none'; music.a.volume = music.vol / 100;
    music.a.addEventListener('play', () => { music.on = true; refreshMusicBtns(); });
    music.a.addEventListener('pause', () => { music.on = false; refreshMusicBtns(); });
    try { if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: 'Calma 1', artist: 'NeuroSoma · Neuroactiva Labs', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }); } catch (e) {}
  }
  async function musicToggle() {
    musicInit();
    try { if (music.a.paused) await music.a.play(); else music.a.pause(); } catch (e) { toast('No pude reproducir la música. Intenta de nuevo.'); }
  }
  function refreshMusicBtns() { document.querySelectorAll('[data-music]').forEach(b => { b.innerHTML = ic(music.on ? 'music_note' : 'music_off', 26); b.style.color = music.on ? 'var(--dark)' : '#7f98a1'; }); const p = document.getElementById('mplay'); if (p) p.innerHTML = ic(music.on ? 'pause' : 'play_arrow', 34); }
  const musicBtn = () => `<button class="ibtn" data-act="music" data-music aria-label="Música de calma">${ic(music.on ? 'music_note' : 'music_off', 26)}</button>`;
  function openMusic() {
    openModal(`<h3>Música de calma</h3><p class="muted small">Un piano tranquilo para acompañar tus ejercicios. Puedes seguir usando la app mientras suena.</p>
      <div class="row" style="margin:14px 0"><button class="rb" id="mplay" data-act="music" style="width:64px;height:64px" aria-label="Reproducir o pausar">${ic(music.on ? 'pause' : 'play_arrow', 34)}</button>
      <div class="sp"><label for="vol">Volumen</label><input id="vol" type="range" min="0" max="100" value="${music.vol}" style="width:100%;accent-color:#1F7C93"></div></div>
      <button class="btn ghost" data-act="close">Cerrar</button>`);
    const v = document.getElementById('vol'); v.addEventListener('input', () => { music.vol = +v.value; store.set('vol', music.vol); if (music.a) music.a.volume = music.vol / 100; });
  }

  /* ───────── modal ───────── */
  function openModal(html, opts = {}) {
    closeModal();
    const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="sheet">${html}</div>`;
    if (!opts.sticky) m.addEventListener('click', e => { if (e.target === m) closeModal(); });
    document.body.appendChild(m);
    const f = m.querySelector('input,textarea,button'); if (f && !opts.nofocus) f.focus();
  }
  const closeModal = () => { const m = document.getElementById('modal'); if (m) m.remove(); };

  /* ───────── componentes ───────── */
  const wm = (s = 22) => `<span class="wm" style="font-size:${s}px">NEURO<b>SOMA</b></span>`;
  const bar = (title, o = {}) => `<header class="bar">${o.noBack ? '' : `<button class="ibtn" data-act="back" data-def="${o.back || '#/home'}" aria-label="Volver">${ic('arrow_back', 26)}</button>`}<h1>${esc(title)}</h1>${o.actions || ''}${o.noMusic ? '' : musicBtn()}</header>`;
  const btn = (t, act, arg, cls = '') => `<button class="btn ${cls}" data-act="${act}"${arg != null ? ` data-arg="${esc(arg)}"` : ''}>${t}</button>`;
  const more = (inner) => `<details class="more"><summary>Saber más ${ic('expand_more', 22).replace('class="ic"', 'class="ic chev"')}</summary><div class="body">${inner}</div></details>`;
  const footer = () => `<div class="footer">de Neuroactiva Labs</div>`;

  function exCard(e) {
    const id = e.id, lk = locked(id);
    const cuando = (D.whenById[id] || '').split('|').filter(Boolean);
    const what = D.whatById[id] || 'Un ejercicio sencillo, paso a paso, para que te sientas mejor.';
    const extra = `${resto(what) ? `<h4>¿Qué vas a hacer?</h4><p>${esc(what)}</p>` : ''}
      <h4>¿Para qué sirve?</h4><p>${esc(D.whyById[id] || 'Ayuda a que tu cuerpo y tu mente bajen la intensidad.')}</p>
      ${cuando.length ? `<h4>¿Cuándo usarlo?</h4><ul class="dots">${cuando.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      ${D.tipById[id] ? `<div class="tip">${ic('lightbulb', 22)}<div>${esc(D.tipById[id])}</div></div>` : ''}
      <p class="muted small">Dentro del ejercicio, los pasos con tiempo avanzan solos y puedes pausar o saltar con los botones del círculo.</p>`;
    return `<article class="card item ${lk ? 'lock' : ''}">
      <div class="row"><h3 class="sp">${esc(e.title)}</h3>${lk ? ic('lock', 26) : ''}</div>
      <div class="meta">${esc(e.min)} · ${e.steps.length} pasos</div>
      <p>${esc(primera(what))}</p>
      ${more(extra)}
      <div class="foot"><span class="sp"></span><a class="btn sm ${lk ? 'off' : ''}" href="${lk ? '#/vip' : '#/ex/' + id}">${lk ? ic('lock', 20) + 'Con candado' : 'Comenzar'}</a></div></article>`;
  }

  function itemCard(it) {
    const extra = it.extra ? more(paras(it.extra)) : '';
    return `<article class="card item"><div class="row" style="align-items:flex-start"><span class="circ">${ic(it.icon, 27)}</span><div class="sp"><h3>${esc(it.title)}</h3>${it.tag ? `<div class="meta">${esc(it.tag)}</div>` : ''}<p style="margin:2px 0 4px">${esc(it.sub)}</p></div></div>${extra}<div class="foot"><span class="sp"></span><a class="btn sm" href="${it.href}">Entrar</a></div></article>`;
  }

  /* ───────── contactos ───────── */
  const okNum = s => /^[0-9+\-() ]+$/.test(String(s).trim()) && String(s).replace(/\D/g, '').length >= 3;
  const contacts = () => { const c = store.get('contacts'); return Array.isArray(c) && c.length === 6 ? c : ['911', '', '', '', '', '']; };
  const extras = () => { const e = store.get('extras'); return Array.isArray(e) ? e : []; };
  const telHref = n => 'tel:' + String(n).replace(/[^0-9+*#]/g, '');
  function contactCard(label, name, number, icon, edit, del) {
    if (!number) return '';
    return `<div class="soft"><div class="row" style="align-items:flex-start"><span style="color:var(--dark)">${ic(icon, 30)}</span><div class="sp">${label ? `<div class="small k">${esc(label)}</div>` : ''}<div style="font-size:20px;font-weight:600">${esc(name || number)}</div>${name ? `<div>${esc(number)}</div>` : ''}</div></div>
      <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px"><a class="btn sm" href="${telHref(number)}">${ic('call', 22)}Llamar</a>
      <button class="link" data-act="copynum" data-arg="${esc(number)}">${ic('content_copy', 20)}Copiar</button>
      ${edit != null ? `<button class="link" data-act="extra-edit" data-arg="${edit}">${ic('edit', 20)}Editar</button>` : ''}
      ${del != null ? `<button class="link" data-act="extra-del" data-arg="${del}">${ic('delete', 22)}Borrar</button>` : ''}</div></div>`;
  }

  /* ───────── PANTALLAS ───────── */
  const R = {};

  R.welcome = () => ({
    html: `<div class="wrap" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
      <div style="text-align:center"><img src="img/logo.png" alt="Logo NeuroSoma" width="150" height="156" style="height:150px;width:auto"></div>
      <div style="text-align:center;margin:14px 0 6px">${wm(34)}</div>
      <div style="text-align:center;letter-spacing:.25em;color:var(--dark);font-size:15px">CALMA Y BIENESTAR</div>
      <p style="text-align:center;font-size:23px;line-height:1.45;font-weight:500;margin:26px 0 14px">Un espacio para calmarte, dormir mejor y sentirte más tranquilo, a cualquier edad.</p>
      <p style="text-align:center;font-size:19px;line-height:1.6">NeuroSoma te guía paso a paso con ejercicios sencillos de respiración, movimiento y apoyo emocional. Sirven para el miedo, los nervios, el estrés, la tristeza y para cuando algo te asusta, como un temblor.</p>
      <div style="margin:26px 0 8px">
        ${[['touch_app', 'Fácil de usar: toca y sigue las instrucciones.'], ['groups', 'Para adolescentes, adultos, adultos mayores y quienes cuidan a otros.'], ['wifi_off', 'Funciona sin internet una vez abierta. Lo que anotas se queda solo en tu teléfono.']].map(([i, t]) => `<div class="row" style="align-items:flex-start;margin-bottom:16px"><span class="circ" style="background:var(--soft)">${ic(i, 26)}</span><div style="font-size:19px;padding-top:2px">${t}</div></div>`).join('')}
      </div>
      <p class="muted small" style="text-align:center">NeuroSoma ofrece apoyo y bienestar. No hace diagnósticos ni reemplaza a un profesional de la salud.</p>
      ${installBox()}
      <div style="margin-top:14px"><a class="btn" href="#/home" data-act="enter">Entrar</a></div>
      ${footer()}</div>`
  });

  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; document.querySelectorAll('[data-install]').forEach(x => x.hidden = false); });
  window.addEventListener('appinstalled', () => { deferredInstall = null; document.querySelectorAll('[data-install]').forEach(x => x.hidden = true); toast('NeuroSoma quedó instalada'); });
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function installBox() {
    if (standalone() || store.get('noinstall')) return '';
    if (isIOS()) return `<div class="install" data-ios>${ic('add_to_home_screen', 28)}<div class="sp small">Para tenerla como app: toca <b>Compartir</b> y luego <b>Agregar a pantalla de inicio</b>.</div><button class="link" data-act="hideinstall" aria-label="Ocultar">${ic('close', 20)}</button></div>`;
    return `<div class="install" data-install ${deferredInstall ? '' : 'hidden'}>${ic('add_to_home_screen', 28)}<div class="sp small">Instálala en tu teléfono para abrirla como una app, también sin internet.</div><button class="btn sm" data-act="install">Instalar</button></div>`;
  }

  R.home = () => {
    const mods = ms => ms.map(m => ({ icon: ICON_OF[m.icon] || 'spa', title: m.title, sub: primera(m.sub), extra: [resto(m.sub), m.intro].filter(Boolean).join('\n\n'), href: '#/mod/' + D.order[MODS.indexOf(m)], tag: isVip() ? m.items.length + ' ejercicios' : m.items.filter(e => !locked(e.id)).length + ' de ' + m.items.length + ' ejercicios gratis' }));
    const g = k => D.mods[k];
    const cats = [
      { icon: 'spa', title: 'Para calmarte ahora', sub: 'Cuando sientes miedo, nervios o angustia', items: [{ icon: 'air', title: 'Respiración guiada', sub: 'Cinco formas de respirar con un círculo que se mueve contigo.', extra: 'Sirve para calmar los nervios, dormir mejor o concentrarte. Cada ritmo se explica al abrirlo. Si no sabes cuál elegir, empieza por el primero.', href: '#/resp', tag: isVip() ? '5 ritmos' : '2 de 5 ritmos gratis' }, ...mods([g('ansiedad'), g('sismo')])] },
      { icon: 'self_improvement', title: 'Para tu cuerpo y tu descanso', sub: 'Soltar la tensión y dormir mejor', items: mods([g('somaticos'), g('sueno')]) },
      { icon: 'wb_sunny', title: 'Para tu día a día', sub: 'Trabajo, estudio, concentración y enojo', items: mods([g('estres'), g('enfoque'), g('estudio'), g('enojo')]) },
      { icon: 'favorite_border', title: 'Para ti y los tuyos', sub: 'Ánimo, cuidadores, niños y adultos mayores', items: mods([g('animo'), g('cuidadores'), g('ninos'), g('mayores')]) },
      { icon: 'apps', title: 'Tus herramientas', sub: 'Diario, favoritos y ayuda', items: [
        { icon: 'edit_note', title: 'Diario de ánimo', sub: 'Anota con un toque cómo te sientes cada día.', extra: 'Después de unos días verás tu semana en barras. Así notas qué días son más difíciles y qué cosas te hacen bien. Es solo para ti y se guarda en tu teléfono.', href: '#/diario' },
        { icon: 'star_border', title: 'Mis favoritos', sub: 'Tus ejercicios guardados con la estrella.', extra: 'Cuando un ejercicio te ayude mucho, toca la estrella dentro de él y lo encontrarás aquí, sin tener que buscarlo.', href: '#/favoritos' },
        { icon: 'health_and_safety', title: 'Ayuda y contactos', sub: 'Tus tres contactos de confianza y líneas de apoyo.', extra: 'También te explica en qué momentos conviene hablar con un psicólogo o un médico, y qué hacer si estás en peligro.', href: '#/ayuda' }] }
    ];
    return {
      html: `<div class="wrap">
        <div class="row" style="padding-top:calc(6px + env(safe-area-inset-top,0px))">${wm(22)}${isVip() ? '<span class="badge">VIP</span>' : ''}<span class="sp"></span>${musicBtn()}</div>
        <h2 style="font-size:28px;font-weight:600;margin:12px 0 6px">¿Qué necesitas hoy?</h2>
        <p>Elige una sección. Toca "Saber más" para ver de qué trata y "Entrar" cuando decidas.</p>
        <a class="cta" href="#/rescate">${ic('favorite', 36)}<div class="sp"><h2>Siento miedo ahora</h2><p>Si sientes miedo o nervios fuertes, toca aquí. Te guío paso a paso para volver a sentirte a salvo.</p></div>${ic('chevron_right', 28)}</a>
        ${installBox()}
        ${isVip() ? '' : `<div class="soft" style="background:rgba(205,238,245,.6)"><p style="margin-bottom:6px;font-size:16px">Tienes una parte de los ejercicios. Los que tienen candado se abren con NeuroSoma VIP.</p><a class="link" href="#/vip">${ic('lock_open', 20)}Ver NeuroSoma VIP</a></div>`}
        ${itemCard({ icon: 'download', title: 'Recursos', sub: 'Descarga para usar en cualquier momento. Imprime para usar en cualquier lugar.', href: '#/recursos' })}
        ${itemCard({ icon: 'print', title: 'Kit imprimible', sub: 'Seis hojas para imprimir: respiración, plan familiar, mochila, noche tranquila y más.', href: '#/kit', tag: '6 recursos' })}
        ${cats.map((c, i) => `<details class="cat" ${i === 0 ? 'open' : ''}><summary><span class="circ">${ic(c.icon, 27)}</span><div class="sp"><h2>${esc(c.title)}</h2><p>${esc(c.sub)}</p></div>${ic('expand_more', 28).replace('class="ic"', 'class="ic chev"')}</summary><div class="inner">${c.items.map(itemCard).join('')}</div></details>`).join('')}
        ${footer()}</div>`,
      after() { firstRun(); }
    };
  };

  function firstRun() {
    if (store.get('seen')) return;
    store.set('seen', true);
    openModal(`<h3>Bienvenido a NeuroSoma</h3><p>Esta app te ofrece ejercicios sencillos de apoyo y bienestar. No hace diagnósticos ni reemplaza la atención de un profesional de la salud.</p><p>Si estás en peligro o piensas en hacerte daño, llama a emergencias o a una persona de confianza.</p>${btn('Entiendo', 'welcome-ok')}`, { sticky: true });
  }

  R.mod = (key) => {
    const m = D.mods[key]; if (!m) return notFound();
    const libres = m.items.filter(e => !locked(e.id)).length;
    const conGrupos = m.items.some(e => SECTION[e.id]);
    const grupos = [];
    if (conGrupos) m.items.forEach(e => { if (SECTION[e.id] || !grupos.length) grupos.push({ t: SECTION[e.id] || 'Ejercicios', items: [] }); grupos[grupos.length - 1].items.push(e); });
    const extra = [resto(m.sub), m.intro].filter(Boolean).join('\n\n');
    return {
      html: `${bar(m.title)}<div class="wrap">
        <div class="soft" style="padding:18px"><div class="row"><span style="color:var(--dark)">${ic(ICON_OF[m.icon] || 'spa', 30)}</span><h2 class="sp" style="font-size:22px">${esc(m.title)}</h2></div>
        <p style="font-size:19px;margin:10px 0 0">${esc(primera(m.sub))}</p>
        ${isVip() ? '' : `<p class="k" style="font-size:16px;margin:8px 0 0">Tienes ${libres} de ${m.items.length} ejercicios.</p>`}
        ${more(paras(extra))}</div>
        ${conGrupos ? grupos.map((g, i) => `<details class="cat" ${i === 0 ? 'open' : ''} style="background:rgba(228,246,250,.5);border-radius:22px"><summary><div class="sp"><h2 style="font-size:20px;color:var(--dark)">${esc(g.t)}</h2><p>${g.items.length} ${g.items.length === 1 ? 'ejercicio' : 'ejercicios'}</p></div>${ic('expand_more', 28).replace('class="ic"', 'class="ic chev"')}</summary><div class="inner">${g.items.map(exCard).join('')}</div></details>`).join('') : m.items.map(exCard).join('')}
      </div>`
    };
  };

  /* ───── ejercicio ───── */
  let X = null, wake = null;
  async function wakeOn() { try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) {} }
  function wakeOff() { try { wake && wake.release(); } catch (e) {} wake = null; }
  function parseStep(s) {
    let t = s, secs = 0; const m = t.match(/\[(\d+)s\]/);
    if (m) { secs = +m[1]; t = t.replace(m[0], ''); }
    const br = t.includes('[respira]'), wr = t.includes('[escribe]');
    t = t.replace('[respira]', '').replace('[escribe]', '').trim();
    const p = t.split('|');
    return { main: p[0].trim(), detail: p.length > 1 ? p.slice(1).join('|').trim() : '', secs: secs === 0 && br ? 30 : secs, breath: br, write: wr };
  }
  const RC = 2 * Math.PI * 130;
  R.ex = (id) => {
    const ex = EX[id]; if (!ex) return notFound();
    if (locked(id)) return { redirect: '#/vip' };
    X = { ex, i: -1, total: 0, left: 0, paused: false, timer: null, cur: null, tok: 0, fb: store.get('fb_' + id) };
    return { html: exHtml(), after() { wakeOn(); } };
  };
  const isFav = id => (store.get('favs', []) || []).includes(id);
  function favBtn() { return `<button class="ibtn" data-act="fav" data-arg="${X.ex.id}" aria-label="Guardar en favoritos" id="favb">${ic(isFav(X.ex.id) ? 'star' : 'star_border', 26)}</button>`; }
  function sec(t, inner) { return `<section style="margin-bottom:18px"><h4 style="margin:0 0 6px;font-size:17px">${t}</h4>${inner}</section>`; }
  function exHtml() {
    const ex = X.ex, n = ex.steps.length, id = ex.id;
    const head = bar(ex.title, { actions: favBtn() });
    if (X.i < 0) {
      const cuando = (D.whenById[id] || 'Cuando necesites un momento de calma.').split('|').filter(Boolean);
      return `${head}<div class="wrap"><h2 style="font-size:26px;font-weight:600">${esc(ex.title)}</h2><div class="muted" style="margin:6px 0 22px">${esc(ex.min)} · ${n} pasos</div>
        ${sec('¿Qué vas a hacer?', `<p>${esc(D.whatById[id] || 'Un ejercicio sencillo, paso a paso, para que te sientas mejor.')}</p>`)}
        ${sec('¿Para qué sirve?', `<p>${esc(D.whyById[id] || 'Practicarlo con calma ayuda a que tu cuerpo y tu mente bajen la intensidad.')}</p>`)}
        ${sec('¿Cuándo usarlo?', `<ul class="dots">${cuando.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`)}
        ${D.tipById[id] ? `<div class="tip">${ic('lightbulb', 22)}<div>${esc(D.tipById[id])}</div></div>` : ''}
        ${sec('Cómo funciona', '<p>Vas paso a paso. Cuando un paso tiene tiempo, el círculo cuenta solo y pasa al siguiente. Dentro del círculo tienes los botones para pausar o saltar. Los pasos sin tiempo avanzan cuando tocas el botón de listo. Puedes parar cuando quieras: no hay una forma perfecta de hacerlo.</p>')}
        ${btn('Comenzar', 'x-start')}</div>`;
    }
    if (X.i >= n) {
      const faces = ['😣', '😟', '😐', '🙂', '😌'];
      return `${head}<div class="wrap" style="text-align:center;padding-top:30px"><div style="color:var(--cyan)">${ic('check_circle', 76)}</div><h2 style="font-size:26px;font-weight:600;margin:12px 0">Lo hiciste bien</h2>
        <p>Tomarte este momento para ti ya es un paso importante. Fíjate cómo está tu cuerpo ahora comparado con cuando empezaste: notar ese cambio ayuda a que la próxima vez te calmes más rápido.</p>
        <p style="margin-top:22px">¿Cómo te sientes ahora?</p>
        <div class="faces">${faces.map((f, k) => `<button class="face-b ${X.fb === k ? 'on' : ''}" data-act="x-fb" data-arg="${k}" aria-label="Opción ${k + 1} de 5">${f}</button>`).join('')}</div>
        ${X.fb != null ? '<p class="small">Gracias por notarlo. Si hoy no cambió mucho, es normal: con la práctica el efecto se va sintiendo más.</p>' : ''}
        <div style="margin-top:20px">${btn('Terminar', 'x-finish')}<button class="btn ghost" data-act="x-repeat">Repetir el ejercicio</button></div></div>`;
    }
    const d = X.cur, timed = X.total > 0;
    const v = timed ? (1 - X.left / X.total) : (X.i + 1) / n;
    const center = `${d.breath ? `<div id="xlab" style="font-weight:600;color:var(--dark);font-size:16px">Toma aire</div>` : ''}
      ${timed ? `<div class="big" id="xtime">${fmt(X.left)}</div>` : ''}
      ${timed ? `<div class="row" style="gap:10px"><button class="rb" id="xpp" data-act="x-pause" style="width:58px;height:58px" aria-label="Pausar">${ic('pause', 30)}</button><button class="rb s" data-act="x-next" style="width:44px;height:44px" aria-label="Saltar paso">${ic('skip_next', 26)}</button></div>`
        : `<button class="rb" data-act="x-next" style="width:66px;height:66px" aria-label="Listo, siguiente paso">${ic('check', 34)}</button>`}
      <div class="small muted" id="xhint">${timed ? 'Avanza solo al terminar' : 'Toca cuando termines'}</div>`;
    return `${head}<div class="steps-top"><div class="pbar"><i style="width:${(X.i + 1) / n * 100}%"></i></div><div class="small muted" style="margin-top:8px;text-align:center">Paso ${X.i + 1} de ${n}</div></div>
      <div class="wrap"><p class="stepmain">${esc(d.main)}</p>${d.detail ? `<p class="stepdet">${esc(d.detail)}</p>` : ''}
      <div class="stage"><div class="ring"><svg width="268" height="268" viewBox="0 0 268 268"><circle cx="134" cy="134" r="130" fill="none" stroke="#CDEEF5" stroke-width="7"/><circle id="xarc" cx="134" cy="134" r="130" fill="none" stroke="#5CCFE3" stroke-width="7" stroke-linecap="round" stroke-dasharray="${RC}" stroke-dashoffset="${RC * (1 - v)}" style="transition:stroke-dashoffset 1s linear"/></svg>
        ${d.breath ? '<div class="breath" id="xbr"></div><div class="face" style="background:transparent">' + center + '</div>' : '<div class="face">' + center + '</div>'}</div></div>
      ${d.write ? '<textarea rows="3" placeholder="Escribe aquí. Solo tú lo ves y no se guarda." aria-label="Escribe aquí"></textarea>' : ''}
      <div class="row" style="margin-top:14px">${X.i > 0 ? `<button class="link" data-act="x-prev">${ic('arrow_back', 18)}Paso anterior</button>` : ''}<span class="sp"></span>${timed ? '<button class="link" data-act="x-next">Saltar paso</button>' : ''}</div></div>`;
  }
  function exEnter(i) {
    clearInterval(X.timer); const my = ++X.tok;
    const n = X.ex.steps.length;
    if (i >= 0 && i < n) { X.cur = parseStep(X.ex.steps[i]); X.total = X.cur.secs > 0 ? X.cur.secs : (X.cur.breath ? 30 : 0); X.left = X.total; }
    else { X.cur = null; X.total = 0; X.left = 0; }
    X.i = i; X.paused = false;
    app.innerHTML = exHtml(); window.scrollTo(0, 0);
    if (i < 0 || i >= n) return;
    if (X.total > 0) {
      X.timer = setInterval(() => {
        if (X.paused) return;
        X.left--; exTick();
        if (X.left <= 0) { clearInterval(X.timer); vibrate(200); setTimeout(() => { if (X && X.tok === my) exEnter(i + 1); }, 800); }
      }, 1000);
      requestAnimationFrame(() => exTick(true));
    }
  }
  function exTick() {
    const t = document.getElementById('xtime'), a = document.getElementById('xarc'); if (!t || !a) return;
    t.textContent = X.left <= 0 ? '✓' : fmt(X.left);
    a.setAttribute('stroke-dashoffset', RC * (X.left / X.total));
    const lab = document.getElementById('xlab'); if (lab) lab.textContent = ((X.total - X.left) % 10) < 4 ? 'Toma aire' : 'Suelta el aire';
  }
  function exPause() {
    X.paused = !X.paused;
    const b = document.getElementById('xpp'); if (b) { b.innerHTML = ic(X.paused ? 'play_arrow' : 'pause', 30); b.setAttribute('aria-label', X.paused ? 'Continuar' : 'Pausar'); }
    const h = document.getElementById('xhint'); if (h) h.textContent = X.paused ? 'En pausa' : 'Avanza solo al terminar';
    const br = document.getElementById('xbr'); if (br) br.classList.toggle('paused', X.paused);
  }

  /* ───── respiración ───── */
  let B = null;
  R.resp = () => ({
    html: `${bar('Respiración guiada')}<div class="wrap"><div class="soft" style="padding:18px;font-size:17px"><p style="margin:0">Respirar es la forma más rápida de hablarle a tu cuerpo para que se calme. Aquí tienes cinco ritmos y cada uno sirve para algo distinto. Al abrir uno, te explico qué es, para qué sirve y cuándo usarlo, y un círculo te guía: crece cuando tomas aire y se achica cuando lo sueltas. Si no sabes cuál elegir, empieza por el primero.</p></div>
      ${D.patterns.map((p, i) => { const lk = locked('resp' + i); return `<a class="soft row" style="text-decoration:none;color:inherit;padding:16px;${lk ? 'background:rgba(205,238,245,.5)' : ''}" href="${lk ? '#/vip' : '#/resp/' + i}"><div class="sp"><div style="font-weight:600;font-size:17px">${esc(p.title)}</div><div class="muted" style="font-size:15px">${esc(p.desc)}</div></div><span style="color:var(--dark)">${ic(lk ? 'lock' : 'play_arrow', 32)}</span></a>`; }).join('')}</div>`
  });
  R.respS = (i) => {
    const p = D.patterns[+i]; if (!p) return notFound();
    if (locked('resp' + i)) return { redirect: '#/vip' };
    B = { p, tok: 0, running: false, cycles: 0 };
    return {
      html: `${bar(p.title)}<div class="wrap"><div class="soft" style="font-size:15px">${paras(D.breathInfo[+i])}</div>
      <div class="stage" style="min-height:300px;justify-content:center"><div id="bc" style="width:270px;height:270px;border-radius:50%;background:rgba(92,207,227,.24);border:3px solid var(--cyan);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;transform:scale(.667);transition:transform 1s ease-in-out"><div id="blab" style="font-weight:600;color:var(--dark);font-size:21px;text-align:center;padding:0 10px">Toca para comenzar</div><div class="big" id="bcnt" style="font-size:52px"></div></div></div>
      <div style="text-align:center"><button class="rb" id="bgo" data-act="b-toggle" style="width:70px;height:70px" aria-label="Empezar o pausar">${ic('play_arrow', 38)}</button><p class="muted small" style="margin-top:14px" id="bcy">Respiraciones completas: 0</p>
      <p class="muted small">Toca el botón para empezar o pausar. Sigue el círculo: crece cuando tomas aire y se achica cuando lo sueltas.</p></div></div>`,
      after() { wakeOn(); }
    };
  };
  async function bRun() {
    const me = B; if (!me) return; const my = ++me.tok; me.running = true; setBBtn();
    const live = () => B === me && me.tok === my;
    const c = document.getElementById('bc');
    while (live()) {
      for (const ph of me.p.phases) {
        if (!live()) return;
        document.getElementById('blab').textContent = ph.label; vibrate(30);
        if (ph.t != null) { c.style.transition = `transform ${ph.s}s ease-in-out`; c.style.transform = `scale(${0.667 + 0.333 * ph.t})`; }
        for (let s = ph.s; s > 0; s--) { if (!live()) return; document.getElementById('bcnt').textContent = s; await sleep(1000); }
      }
      if (live()) { me.cycles++; const e = document.getElementById('bcy'); if (e) e.textContent = 'Respiraciones completas: ' + me.cycles; }
    }
  }
  function bStop() { B.tok++; B.running = false; const c = document.getElementById('bc'); if (c) { const cur = getComputedStyle(c).transform; c.style.transition = 'none'; c.style.transform = cur; } const l = document.getElementById('blab'); if (l) l.textContent = 'En pausa'; setBBtn(); }
  function setBBtn() { const b = document.getElementById('bgo'); if (b) b.innerHTML = ic(B.running ? 'pause' : 'play_arrow', 38); }

  /* ───── rescate 5-4-3-2-1 ───── */
  let RS = 0;
  R.rescate = () => { RS = 0; return { html: rescHtml() }; };
  function rescHtml() {
    const A = D.anclaje, done = RS >= A.length, st = A[done ? A.length - 1 : RS];
    const v = done ? 1 : (RS + 1) / A.length;
    const circ = `<div class="ring"><svg width="268" height="268" viewBox="0 0 268 268"><circle cx="134" cy="134" r="130" fill="none" stroke="#CDEEF5" stroke-width="7"/><circle cx="134" cy="134" r="130" fill="none" stroke="#5CCFE3" stroke-width="7" stroke-linecap="round" stroke-dasharray="${RC}" stroke-dashoffset="${RC * (1 - v)}"/></svg>
      <div class="face">${done ? `<div style="color:var(--cyan)">${ic('check_circle', 46)}</div><a class="btn sm" href="#/resp/0">Respirar conmigo</a>` : `<div style="font-size:64px;font-weight:300;color:var(--dark);line-height:1">${st.n}</div><button class="rb" data-act="r-next" style="width:60px;height:60px" aria-label="Listo, siguiente">${ic('check', 32)}</button><div class="small muted">Toca cuando termines</div>`}</div></div>`;
    return `${bar('Estás a salvo', { noMusic: false })}<div class="wrap" style="text-align:center">
      ${RS === 0 ? '<div class="soft" style="text-align:left;font-size:15px;line-height:1.6">Respira. Estás a salvo. Este ejercicio se llama 5-4-3-2-1 y sirve para volver al presente cuando sientes miedo o nervios fuertes: usas tus sentidos para recordarle a tu cerebro dónde estás. Dura unos 3 minutos. Ve a tu ritmo y toca el botón del círculo cuando termines cada paso.</div>' : ''}
      ${done ? `<h2 style="font-size:26px;font-weight:600;margin:12px 0">Lo hiciste bien</h2><p>Ahora respira despacio: toma aire por la nariz y suelta el aire más lento de lo que lo tomaste. Si quieres, toca el botón del círculo y te acompaño con una respiración guiada.</p>`
        : `<h2 style="font-size:26px;font-weight:600;margin:12px 0 10px">${esc(st.title)}</h2><p style="font-size:18px">${esc(st.text)}</p><p class="muted" style="font-size:15px;line-height:1.6">${esc(st.detail)}</p>`}
      <div class="stage">${circ}</div></div>`;
  }

  /* ───── recursos ───── */
  const caps = () => `<div class="row" style="gap:14px;align-items:stretch;margin:18px 0 26px"><div class="cap sp" style="transform:rotate(-4deg)">Descarga para usar en cualquier momento</div><div class="cap sp" style="transform:rotate(4deg)">Imprime para usar en cualquier lugar</div></div>`;
  const brandHead = () => `<div class="row" style="gap:12px"><img src="img/logo.png" alt="" width="78" height="81" style="height:78px;width:auto"><div>${wm(22)}<div style="font-size:12px;letter-spacing:.2em;font-weight:700;color:var(--dark)">CALMA Y BIENESTAR</div></div></div>`;
  R.recursos = () => ({
    html: `${bar('Recursos')}<div class="wrap">${brandHead()}<h2 style="font-size:40px;font-weight:700;color:var(--purple);text-align:center;margin:12px 0">Recursos</h2>${caps()}
      ${RECURSOS.map(r => `<a class="rbtn" href="#/r/${r.n}"><div class="sp"><b>RECURSO # ${r.n}</b><span>${esc(r.title)}</span></div>${ic('chevron_right', 32)}</a>`).join('')}
      <a class="rbtn" href="#/kit" style="margin-top:22px"><div class="sp"><b style="font-size:21px">KIT IMPRIMIBLE</b><span>Seis hojas más para descargar e imprimir</span></div>${ic('chevron_right', 32)}</a>
      <div class="footer" style="font-weight:700">CREADO POR NEUROACTIVA LABS</div></div>`
  });
  R.kit = () => ({
    html: `${bar('Kit imprimible', { back: '#/recursos' })}<div class="wrap">${brandHead()}<h2 style="font-size:36px;font-weight:700;color:var(--purple);text-align:center;margin:12px 0">Kit imprimible</h2>${caps()}
      <div class="kgrid">${KIT.map(k => { const lk = !isVip() && !KIT_FREE.has(k.n); return `<a class="kcard" href="${lk ? '#/vip' : '#/k/' + k.n}"><img src="recursos/kit_${k.n}_t.jpg" alt="${esc(k.title)}" loading="lazy" width="360" height="510">${lk ? `<span class="lk">${ic('lock', 20)}</span>` : ''}<div>${k.n}. ${esc(k.title)}</div></a>`; }).join('')}</div>
      ${isVip() ? '' : `<p class="muted small" style="margin-top:14px">Los recursos 1 y 2 son gratis. Los demás se abren con NeuroSoma VIP.</p>`}
      <div class="footer" style="font-weight:700">CREADO POR NEUROACTIVA LABS</div></div>`
  });
  function viewer(title, src, file, back) {
    return {
      html: `${bar(title, { back })}<div class="wrap viewer"><img src="${src}" alt="${esc(title)}">
      <div style="margin:16px 0 8px"><a class="btn" href="${src}" download="${file}">${ic('download', 24)} Descargar</a></div>
      <div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn sm" style="flex:1" data-act="print" data-arg="${src}">${ic('print', 22)}Imprimir</button><button class="btn sm ghost" style="flex:1;border:2px solid var(--mist)" data-act="share" data-arg="${src}|${file}" id="shr">${ic('share', 22)}Compartir</button></div>
      <p class="muted small" style="margin-top:12px">La imagen se guarda en tu teléfono y la puedes usar sin internet. Para imprimir, elige tamaño carta o A4.</p></div>`
    };
  }
  R.r = n => { const r = RECURSOS[+n - 1]; return r ? viewer('Recurso ' + n + ': ' + r.title, r.src, 'NeuroSoma-recurso-' + n + '.png', '#/recursos') : notFound(); };
  R.k = n => { const k = KIT[+n - 1]; if (!k) return notFound(); if (!isVip() && !KIT_FREE.has(k.n)) return { redirect: '#/vip' }; return viewer(k.n + '. ' + k.title, 'recursos/kit_' + n + '.png', 'NeuroSoma-kit-' + n + '.png', '#/kit'); };
  function printImg(src) {
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f); const d = f.contentWindow.document; d.open();
    d.write('<!doctype html><html><head><style>@page{margin:8mm}html,body{margin:0}img{width:100%;max-height:100vh;object-fit:contain;display:block}</style></head><body><img src="' + new URL(src, location.href).href + '"></body></html>'); d.close();
    const im = d.querySelector('img'); const go = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast('Descarga la imagen y imprímela desde tu galería.'); } setTimeout(() => f.remove(), 3000); };
    if (im.complete) go(); else { im.onload = go; im.onerror = () => { toast('No pude preparar la impresión.'); f.remove(); }; }
  }
  async function shareImg(arg) {
    const [src, file] = arg.split('|');
    try { const b = await (await fetch(src)).blob(); const f = new File([b], file, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: 'NeuroSoma' }); else toast('Tu navegador no permite compartir. Usa Descargar.');
    } catch (e) { if (e && e.name !== 'AbortError') toast('No pude compartir. Usa Descargar.'); }
  }

  /* ───── diario / favoritos ───── */
  const FACES = ['😣', '😟', '😐', '🙂', '😌'], NAMES = ['Muy mal', 'Inquieto', 'Normal', 'Bien', 'En calma'];
  const dkey = d => 'mood_' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  R.diario = () => {
    const now = new Date(), week = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); week.push({ v: store.get(dkey(d)), l: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()] }); }
    const today = week[6].v;
    return { html: `${bar('Diario de ánimo', { back: '#/home' })}<div class="wrap"><p style="font-size:16px;line-height:1.6">Este diario te ayuda a darte cuenta de cómo te sientes cada día. Toca la carita que más se parezca a hoy y, después de unos días, verás tu semana en barras: así notas qué días son más difíciles y qué cosas te hacen bien. Es solo para ti y se guarda en tu teléfono.</p>
      <h2 style="font-size:22px;font-weight:300;margin:18px 0 6px">¿Cómo te sientes hoy?</h2>
      <div class="faces">${FACES.map((f, i) => `<div style="text-align:center"><button class="face-b ${today === i ? 'on' : ''}" data-act="mood" data-arg="${i}" aria-label="${NAMES[i]}">${f}</button><div class="small">${NAMES[i]}</div></div>`).join('')}</div>
      <h3 style="font-size:18px;margin:30px 0 4px">Tu última semana</h3><div class="bars">${week.map(w => `<i class="${w.v == null ? 'e' : ''}" style="height:${w.v == null ? 8 : 24 + w.v * 26}px"></i>`).join('')}</div>
      <div class="row" style="justify-content:space-between">${week.map(w => `<span class="small muted" style="width:12%;text-align:center">${w.l}</span>`).join('')}</div>
      <p class="muted small" style="margin-top:10px">Barras más altas = días en que te sentiste mejor.</p></div>` };
  };
  R.favoritos = () => {
    const f = (store.get('favs', []) || []).filter(id => EX[id]);
    return { html: `${bar('Mis favoritos')}<div class="wrap">${f.length ? f.map(id => exCard(EX[id])).join('') : `<div class="soft"><p style="margin:0">Aún no tienes favoritos. Dentro de un ejercicio, toca la estrella de arriba y quedará guardado aquí.</p></div>`}</div>` };
  };

  /* ───── ayuda y contactos ───── */
  R.ayuda = () => {
    const c = contacts(), ex = extras();
    const card = (t, l) => `<div class="soft" style="padding:20px"><h3 style="font-size:19px;margin-bottom:10px">${t}</h3>${l.map(x => `<p style="margin:0 0 6px">•&nbsp; ${x}</p>`).join('')}</div>`;
    return { html: `${bar('Ayuda y contactos')}<div class="wrap">
      <h2 style="font-size:22px;margin-bottom:6px">Tus contactos de apoyo</h2>
      <p style="font-size:17px">Aquí están las personas que elegiste. Toca "Llamar" para abrir el marcador de tu teléfono con el número listo, o "Copiar" para copiarlo. No tienes que pasar por esto solo.</p>
      ${contactCard('EMERGENCIA', 'Línea de emergencia', c[0], 'local_hospital')}${contactCard('FAMILIAR O AMIGO', c[1], c[2], 'favorite')}${contactCard((c[3] || 'CONTACTO PERSONAL').toUpperCase(), c[4], c[5], 'person')}
      <a class="link" href="#/contactos">${ic('edit', 20)}Cambiar mis contactos</a>
      <h2 style="font-size:22px;margin:18px 0 6px">Más líneas de ayuda</h2>
      <p style="font-size:17px">Agrega aquí las líneas de ayuda y de salud mental de tu país o de tu ciudad, el centro de salud de tu zona o un psicólogo de confianza. Tú decides qué guardar, y puedes cambiarlo cuando quieras.</p>
      ${ex.length ? ex.map((e, i) => { const p = e.split('|'); return contactCard('', p[0], p[1] || '', 'support_agent', i, i); }).join('') : '<div class="soft"><p style="margin:0">Aún no agregaste ninguna.</p></div>'}
      <button class="btn sm" data-act="extra-edit" data-arg="">${ic('add', 22)}Agregar contacto o línea</button>
      <div style="height:22px"></div>
      ${card('También puedes acudir a', ['Hospitales y centros de salud de tu zona.', 'Un psicólogo o psiquiatra de tu confianza.'])}
      ${card('Pide ayuda de inmediato si', ['Estás en peligro o piensas en hacerte daño.', 'Sientes que no puedes más.', 'Alguien a tu lado necesita ayuda urgente.'])}
      ${card('Habla con un psicólogo o un médico si', ['El miedo o la angustia duran varios días o semanas y no bajan.', 'No puedes dormir, trabajar, estudiar o cuidar de ti como antes.', 'Tienes pesadillas o recuerdos muy fuertes que vuelven una y otra vez.', 'Tienes crisis de pánico que se repiten.', 'Evitas lugares, personas o cosas por miedo.', 'Te sientes irritable, sin esperanza, o quieres aislarte.', 'Usas alcohol u otras sustancias para calmarte.'])}
      ${card('Mientras tanto, cuídate', ['Retoma poco a poco tus rutinas de comida, descanso y trabajo.', 'Habla de lo que sientes con alguien de confianza.', 'Evita usar alcohol u otras sustancias para calmar el estrés.', 'Limita las noticias y videos que te asustan, pero consulta fuentes oficiales.', 'A los niños, explícales con palabras sencillas y verdaderas.'])}
      ${card('Créditos de música', ['"Calma 1": música original creada para NeuroSoma por Neuroactiva Labs.'])}
      <p class="muted small">NeuroSoma ofrece apoyo y bienestar. No hace diagnósticos ni reemplaza a un profesional de la salud.</p>
      <p class="muted small">Versión ${esc(CFG.VERSION || '')} · Tu ID: ${esc(myId())}</p></div>` };
  };
  R.contactos = () => {
    const c = contacts(); const first = !store.get('contacts');
    const f = (i, label, o = {}) => `<div class="field"><label for="c${i}">${label}</label><input id="c${i}" type="${o.tel ? 'tel' : 'text'}" ${o.tel ? 'inputmode="tel"' : ''} value="${esc(c[i])}" placeholder="${esc(o.ph || '')}" autocomplete="off"></div>`;
    const h = (t, s) => `<div style="margin:16px 0 10px"><div style="font-weight:600;font-size:18px">${t}</div><div class="muted small">${s}</div></div>`;
    return { html: `${bar(first ? 'Tus contactos de apoyo' : 'Cambiar contactos', { back: '#/ayuda' })}<div class="wrap">
      <p class="small">Escribe a quién llamarías si necesitas ayuda. Quedan guardados solo en tu teléfono y los verás siempre en "Ayuda y contactos".</p>
      ${h('1. Emergencia', 'El número de emergencias de tu país (por ejemplo 911, 112 o 123).')}${f(0, 'Número de emergencia de tu país', { tel: 1, ph: 'Ejemplo: 911' })}
      ${h('2. Familiar o amigo', 'Alguien de confianza a quien puedas llamar.')}${f(1, 'Nombre', { ph: 'Ejemplo: Mamá' })}${f(2, 'Número', { tel: 1 })}
      ${h('3. Contacto personalizado', 'Tú eliges: psicólogo, pareja, vecino, médico...')}${f(3, 'Quién es', { ph: 'Ejemplo: Mi psicólogo' })}${f(4, 'Nombre')}${f(5, 'Número', { tel: 1 })}
      <p class="err" id="cerr" hidden></p>
      ${btn('Guardar', 'c-save')}${first ? `<button class="btn ghost" data-act="c-skip">Omitir por ahora</button>` : ''}</div>` };
  };
  function saveContacts() {
    const v = [0, 1, 2, 3, 4, 5].map(i => document.getElementById('c' + i).value.trim());
    const err = document.getElementById('cerr');
    const bad = (v[0] && !okNum(v[0])) || (v[2] && !okNum(v[2])) || (v[5] && !okNum(v[5])) || (v[1] && !v[2]) || (v[4] && !v[5]);
    if (bad) { err.hidden = false; err.textContent = 'Revisa los números: solo pueden tener dígitos, +, -, paréntesis y espacios, y cada nombre necesita su número.'; return; }
    store.set('contacts', v); toast('Contactos guardados'); location.hash = '#/ayuda';
  }
  function extraModal(i) {
    const list = extras(), p = i === '' || i == null ? ['', ''] : (list[+i] || '').split('|');
    openModal(`<h3>${i === '' || i == null ? 'Agregar contacto o línea' : 'Editar contacto'}</h3>
      <div class="field"><label for="en">Nombre</label><input id="en" type="text" value="${esc(p[0])}" placeholder="Ejemplo: Línea de salud mental"></div>
      <div class="field"><label for="et">Número de teléfono</label><input id="et" type="tel" inputmode="tel" value="${esc(p[1] || '')}"></div>
      <p class="err" id="eerr" hidden>Escribe un nombre y un número válido.</p>
      <div class="row" style="gap:10px"><button class="btn ghost" data-act="close">Cancelar</button><button class="btn" data-act="extra-save" data-arg="${i == null ? '' : i}">Guardar</button></div>`);
  }

  /* ───── VIP ───── */
  R.vip = () => {
    const id = myId();
    if (isVip()) return { html: `${bar('NeuroSoma VIP')}<div class="wrap" style="text-align:center"><img src="img/logo.png" alt="" style="height:110px;width:auto;margin-top:10px"><div style="margin:10px 0">${wm(28)}<span class="badge">VIP</span></div><h2 style="font-size:24px;margin:14px 0 8px">Ya tienes NeuroSoma VIP</h2><p>Todos los ejercicios y recursos están abiertos. Gracias por apoyar este proyecto.</p><a class="btn" href="#/home">Ir al inicio</a></div>` };
    const wa = CFG.WA_NUMBER ? `https://wa.me/${CFG.WA_NUMBER}?text=${encodeURIComponent('Hola, quiero activar NeuroSoma VIP (' + (CFG.PRECIO_TXT || '') + ', pago único).\nYa pagué por: (PayPal / Yappy)\nMi ID es: ' + id + '\nTe envío el comprobante 👇')}` : '';
    const paypal = CFG.PAYPAL_URL ? CFG.PAYPAL_URL.replace(/\/$/, '') + (CFG.PAYPAL_MONTO ? '/' + CFG.PAYPAL_MONTO : '') : '';
    return { html: `${bar('NeuroSoma VIP')}<div class="wrap">
      <div style="text-align:center"><img src="img/logo.png" alt="" style="height:100px;width:auto"><div style="margin:8px 0">${wm(26)}</div></div>
      <h2 style="font-size:24px;margin:12px 0">Abre todos los ejercicios</h2>
      <ul class="vip-list">${['Todos los ejercicios y situaciones, sin candados.', 'Un solo pago. Sin suscripción.', 'Funciona sin internet, siempre.', 'Los seis recursos imprimibles del kit.'].map(t => `<li>${ic('check_circle', 24)}<span>${t}</span></li>`).join('')}</ul>
      <div class="soft" style="text-align:center;font-weight:700;font-size:22px;color:var(--dark)">${esc(CFG.PRECIO_TXT || '')} <span class="muted small" style="font-weight:400">pago único</span></div>
      <div class="stepn"><i>1</i><div style="flex:1"><b>Haz tu pago por PayPal o Yappy</b>${paypal ? `<div style="margin-top:8px"><a class="btn sm" href="${esc(paypal)}" target="_blank" rel="noopener">Pagar con PayPal</a></div>` : ''}${CFG.YAPPY ? `<p class="small" style="margin:10px 0 6px"><b>Yappy:</b> ${esc(CFG.YAPPY)}${CFG.YAPPY_NOMBRE ? ' · ' + esc(CFG.YAPPY_NOMBRE) : ''}</p><button class="btn sm ghost" style="border:2px solid var(--mist)" data-act="copyyappy" data-arg="${esc(CFG.YAPPY.replace(/\D/g, ''))}">${ic('content_copy', 20)}Copiar número de Yappy</button>` : ''}</div></div>
      <div class="stepn"><i>2</i><div style="flex:1"><b>Envía tu comprobante y tu ID por WhatsApp</b><br><span class="muted small">Manda la captura del pago. El ID es el código de este teléfono: va en el mensaje. Te devolvemos tu código de activación.</span><div class="codebox" style="margin:8px 0">${esc(id)}</div>
        <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm ghost" style="border:2px solid var(--mist)" data-act="copyid" data-arg="${esc(id)}">${ic('content_copy', 20)}Copiar ID</button>${wa ? `<a class="btn sm" href="${wa}" target="_blank" rel="noopener">Enviar comprobante por WhatsApp</a>` : ''}</div></div></div>
      <div class="stepn"><i>3</i><div style="flex:1"><b>Escribe tu código</b>
        <div class="field" style="margin-top:8px"><label for="vc" class="small" style="font-weight:400">Código de activación (pégalo completo)</label><textarea id="vc" rows="4" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="Pega aquí tu código" style="font-size:14px;word-break:break-all"></textarea></div>
        <p class="err" id="verr" hidden>Ese código no es válido para este teléfono. Revisa que esté bien escrito.</p>${btn('Activar VIP', 'vip-go')}</div></div>
      <p class="muted small">Tu código funciona solo en este teléfono. Si borras los datos del navegador, tu ID se mantiene en este dispositivo y puedes volver a escribir el mismo código.</p></div>` };
  };

  function notFound() { return { html: `${bar('No encontrado')}<div class="wrap"><p>No encontré esa pantalla.</p><a class="btn" href="#/home">Ir al inicio</a></div>` }; }

  /* ───────── enrutador ───────── */
  function cleanup() { if (X) { clearInterval(X.timer); X.tok++; X = null; } if (B) { B.tok++; B = null; } wakeOff(); }
  function route() {
    cleanup(); closeModal();
    let h = location.hash.replace(/^#\/?/, '');
    const [name, arg] = h.split('/');
    const map = { '': () => (store.get('welcomed') ? R.home() : R.welcome()), home: R.home, mod: () => R.mod(arg), ex: () => R.ex(arg), resp: () => (arg != null && arg !== '' ? R.respS(arg) : R.resp()), rescate: R.rescate, recursos: R.recursos, kit: R.kit, r: () => R.r(arg), k: () => R.k(arg), diario: R.diario, favoritos: R.favoritos, ayuda: R.ayuda, contactos: R.contactos, vip: R.vip };
    const fn = map[name]; const res = fn ? fn() : notFound();
    if (res.redirect) { location.replace(res.redirect); return; }
    app.innerHTML = res.html; window.scrollTo(0, 0); refreshMusicBtns();
    const hs = app.querySelector('.bar h1'); document.title = (hs ? hs.textContent + ' · ' : '') + 'NeuroSoma';
    res.after && res.after();
  }
  window.addEventListener('hashchange', route);

  /* ───────── acciones (delegación de eventos) ───────── */
  const A = {
    back(el) { if (history.length > 1 && document.referrer !== '' || history.length > 2) history.back(); else location.hash = el.dataset.def || '#/home'; },
    music: musicToggle, close: closeModal,
    'welcome-ok'() { closeModal(); if (!store.get('contacts')) location.hash = '#/contactos'; },
    enter() { store.set('welcomed', true); },
    install: async () => { if (!deferredInstall) return; deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) {} deferredInstall = null; },
    hideinstall() { store.set('noinstall', true); document.querySelectorAll('.install').forEach(x => x.remove()); },
    'x-start'() { exEnter(0); wakeOn(); }, 'x-next'() { exEnter(X.i + 1); }, 'x-prev'() { exEnter(X.i - 1); }, 'x-pause': exPause,
    'x-repeat'() { exEnter(0); }, 'x-finish'() { history.back(); },
    'x-fb'(el) { X.fb = +el.dataset.arg; store.set('fb_' + X.ex.id, X.fb); app.innerHTML = exHtml(); },
    fav(el) { const id = el.dataset.arg; let f = store.get('favs', []) || []; f = f.includes(id) ? f.filter(x => x !== id) : f.concat(id); store.set('favs', f); el.innerHTML = ic(f.includes(id) ? 'star' : 'star_border', 26); toast(f.includes(id) ? 'Guardado en favoritos' : 'Quitado de favoritos'); },
    'b-toggle'() { B.running ? bStop() : bRun(); },
    'r-next'() { RS++; app.innerHTML = rescHtml(); window.scrollTo(0, 0); },
    print(el) { printImg(el.dataset.arg); }, share(el) { shareImg(el.dataset.arg); },
    mood(el) { store.set(dkey(new Date()), +el.dataset.arg); app.innerHTML = R.diario().html; },
    copynum(el) { copyText(el.dataset.arg, 'Número copiado: ' + el.dataset.arg + '. Márcalo en tu teléfono.'); },
    copyid(el) { copyText(el.dataset.arg, 'ID copiado'); },
    copyyappy(el) { copyText(el.dataset.arg, 'Número de Yappy copiado'); },
    'c-save': saveContacts, 'c-skip'() { store.set('contacts', contacts()); location.hash = '#/home'; },
    'extra-edit'(el) { extraModal(el.dataset.arg); },
    'extra-save'(el) {
      const n = document.getElementById('en').value.trim().replace(/\|/g, '/'), t = document.getElementById('et').value.trim();
      if (!n || !okNum(t)) { document.getElementById('eerr').hidden = false; return; }
      const list = extras(), i = el.dataset.arg; if (i === '') list.push(n + '|' + t); else list[+i] = n + '|' + t;
      store.set('extras', list); closeModal(); route();
    },
    'extra-del'(el) {
      const i = +el.dataset.arg; const nm = (extras()[i] || '').split('|')[0];
      openModal(`<h3>¿Borrar este contacto?</h3><p>${esc(nm)}</p><div class="row" style="gap:10px"><button class="btn ghost" data-act="close">Cancelar</button><button class="btn" data-act="extra-del-ok" data-arg="${i}">Borrar</button></div>`);
    },
    'extra-del-ok'(el) { const l = extras(); l.splice(+el.dataset.arg, 1); store.set('extras', l); closeModal(); route(); },
    async 'vip-go'() {
      const v = document.getElementById('vc').value;
      if (await tryUnlock(v)) { toast('¡Listo! NeuroSoma VIP activado'); vibrate([60, 40, 60]); route(); } else document.getElementById('verr').hidden = false;
    }
  };
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const a = A[el.dataset.act]; if (!a) return;
    if (el.tagName !== 'A' || el.dataset.act === 'enter') { if (el.tagName === 'A') { a(el, e); return; } e.preventDefault(); }
    a(el, e);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ───────── PWA: service worker ───────── */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing; if (!nw) return;
          nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) { const t = document.getElementById('toast'); t.innerHTML = 'Hay una versión nueva. <button class="link" style="color:#9be7f3" id="reload">Actualizar</button>'; t.classList.add('on'); t.style.pointerEvents = 'auto'; document.getElementById('reload').onclick = () => location.reload(); } });
        });
      }).catch(() => {});
    });
  }
  checkVip().then(route, route);
})();
