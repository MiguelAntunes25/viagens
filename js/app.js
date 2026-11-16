import { sb, sessao, listarViagens, carregarViagem, urlsAssinados, enviarFicheiro, apagarFicheiro, guardarBilhetesOffline, abrirBilhete, convidar, entradaEspecial, fotosWiki } from './data.js';
import { esc, hhmm, dur, dataLonga, dataCurta, intervalo, noites, hojeEm, agoraMin, toMin, mapsPlaceLink, mapsQueryLink, comprimir, ics, descarregar, OFFSETS, offsetTxt, KIND_LABEL } from './util.js';

const $app = document.getElementById('app');
const S = { b: null, tripId: null, trips: null };

// ---------- ícones ----------
const TSV = {
  aviao: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  comboio: '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/>',
  metro: '<path d="M2 22V12a10 10 0 1 1 20 0v10"/><path d="M15 6.8v1.4a3 2.8 0 1 1-6 0V6.8"/><path d="M10 15h.01"/><path d="M14 15h.01"/><path d="M10 19a4 4 0 0 1-4-4v-3a6 6 0 1 1 12 0v3a4 4 0 0 1-4 4Z"/><path d="m9 19-2 3"/><path d="m16 22-2-3"/>',
  autocarro: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  tram: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
  barco: '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.4 18 21 13l-9-4-9 4 1.6 5"/><path d="M12 9V3"/><path d="M8 5h8"/>',
  taxi: '<path d="M10 2h4"/><path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.6 5H8.4a2 2 0 0 0-1.9 1.3L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/>',
};
const MODOS = { aviao: 'Avião', comboio: 'Comboio', metro: 'Metro', autocarro: 'Autocarro', tram: 'Elétrico', barco: 'Barco', taxi: 'Táxi ou transfer' };
const icT = (m, p = '') => `<span class="ict ${m || 'comboio'} ${p}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TSV[m] || TSV.comboio}</svg></span>`;
const EST_T = { por_comprar: 'Por comprar', pago: 'Pago', compra_no_dia: 'Compra no dia', incluido: 'Incluído' };
const estT = (st) => `<span class="estT ${st || 'por_comprar'}">${EST_T[st] || EST_T.por_comprar}</span>`;
const I = {
  cadeado: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
  roda: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  cidades: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V9l5-3v15M10 21V4l6 3v14M16 21v-9l4 2v7M7.5 11h.01M7.5 14h.01M12.5 9h.01M12.5 12h.01M12.5 15h.01M18 16h.01"/></svg>',
  info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>',
  fotos: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/></svg>',
  ouvir: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  pausa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  parar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  maps: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  mapa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
  cama: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/></svg>',
  estrela: '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z"/></svg>',
  voltar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  seg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  qr: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/></svg>',
  sino: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
  mais: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
};
const LOGO = '<svg width="22" height="22" viewBox="0 0 100 100" aria-hidden="true"><polygon points="16,28 38,20 38,74 16,82" fill="#E3D3B6"/><polygon points="38,20 62,28 62,82 38,74" fill="#CDB993"/><polygon points="62,28 84,20 84,74 62,82" fill="#E3D3B6"/><path d="M22 66 Q 32 50 44 57 T 66 47" fill="none" stroke="#13283A" stroke-width="3" stroke-dasharray="2 4" stroke-linecap="round"/><path d="M70 30 a9 9 0 0 1 9 9 c0 7 -9 15 -9 15 s-9 -8 -9 -15 a9 9 0 0 1 9 -9z" fill="#13283A"/><circle cx="70" cy="39" r="3.2" fill="#E3D3B6"/></svg>';
const NAV = [['resumo', 'Resumo', '<path d="M4 6h16M4 12h16M4 18h10"/>'], ['dia', 'Dia', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'], ['hoteis', 'Hotéis', '<path d="M3 20V9l9-5 9 5v11"/><path d="M9 20v-6h6v6"/>'], ['ranking', 'Rankings', '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>'], ['transportes', 'Transportes', '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/>'], ['mais', 'Mais', '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>']];

function nav(ativo) {
  const id = S.tripId; const hoje = diaDeHoje();
  const nItens = NAV.length - (S.b?.rankings.length ? 0 : 1);
  return `<nav class="nav" style="grid-template-columns:repeat(${nItens},minmax(0,1fr))" aria-label="Navegação principal">${NAV.map(([k, t, p]) => {
    const rkp = S.b?.rankings.find((r) => r.is_primary) || S.b?.rankings[0];
    if (k === 'ranking' && !rkp) return '';
    const href = k === 'dia' ? `#/v/${id}/dia/${hoje || ultimoDia() || 1}` : k === 'ranking' ? `#/v/${id}/ranking` : `#/v/${id}/${k}`;
    return `<a class="nav-b ${k === ativo ? 'on' : ''}" href="${href}" ${k === ativo ? 'aria-current="page"' : ''}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${p}</svg>${t}</a>`;
  }).join('')}</nav>`;
}
const ultimoDia = () => Number(sessionStorage.getItem('ultimoDia:' + S.tripId)) || null;

// ---------- auxiliares da viagem ----------
const tz = () => S.b?.trip?.timezone || 'Europe/Lisbon';
function diaDeHoje() { if (!S.b) return null; const h = hojeEm(tz()); return S.b.days.find((d) => d.date === h)?.day_number || null; }
function rankPrincipal() {
  const b = S.b; const r = b.rankings.find((x) => x.is_primary) || b.rankings[0]; if (!r) return { map: {}, total: 0 };
  const items = b.rankingItems.filter((i) => i.ranking_id === r.id); const map = {};
  items.forEach((i) => (i.activity_ext_keys || []).forEach((k) => { if (!map[k]) map[k] = i.position; }));
  return { r, map, total: items.length };
}
function escolhaOpcao(day) {
  const fix = S.b.trip.info?.escolhas?.[day.ext_key];
  return fix || sessionStorage.getItem('opcao:' + day.id) || null;
}
function atividadesDoDia(day) {
  const todas = S.b.activities.filter((a) => a.day_id === day.id);
  const grupos = [...new Set(todas.map((a) => a.option_group).filter(Boolean))].sort();
  const escolhida = escolhaOpcao(day) || grupos[0] || null;
  const lista = todas.filter((a) => !a.option_group || a.option_group === escolhida);
  return { lista, grupos, escolhida, labels: Object.fromEntries(grupos.map((g) => [g, todas.find((a) => a.option_group === g)?.option_label || 'Opção ' + g])) };
}
const hotelNa = (date) => S.b.hotels.find((h) => h.status === 'pago' && h.check_in <= date && date < h.check_out);
const hotelPendente = (date) => S.b.hotels.find((h) => h.status === 'reservado' && h.check_in <= date && date < h.check_out);
const reservasEm = (date) => S.b.bookings.filter((x) => !x.activity_ext_key && x.depart_date === date);
const fichaT = (a) => S.b.bookings.find((x) => x.activity_ext_key === a.ext_key);
const bilhetes = (f) => S.b.tickets.filter((t) => Object.entries(f).every(([k, v]) => t[k] === v));
const membro = (id) => S.b.members.find((m) => m.id === id);
const pessoas = () => S.b.members;

// ---------- infra de ecrã ----------
const ehPC = () => window.__VISTA ? window.__VISTA === 'pc' : matchMedia('(min-width: 1000px)').matches; // __VISTA: só na pré-visualização
function lateral() {
  const b = S.b, id = S.tripId, p = location.hash.replace(/^#\/?/, '').split('/');
  const v = p[2] || 'resumo';
  const ativo = v === 'a' && p[4] === 'r' ? 'ranking' : ['dia', 'a'].includes(v) ? 'dia' : ['cidades', 'tempo', 'mapa'].includes(v) ? 'resumo' : ['ranking', 'reservas', 'resumo', 'hoteis', 'transportes'].includes(v) ? v : 'mais';
  const diaAtual = Number(sessionStorage.getItem('ultimoDia:' + id)) || diaDeHoje() || 1;
  const rk = b.rankings.find((r) => r.is_primary) || b.rankings[0];
  const it = [['resumo', 'Resumo'], ['dia', 'Dia', `#/v/${id}/dia/${diaAtual}`], ['hoteis', 'Hotéis'],
    ...(rk ? [['ranking', 'Rankings', `#/v/${id}/ranking`]] : []), ['transportes', 'Transportes'], ...(b.isOwner ? [['reservas', 'Reservas']] : []), ['mais', 'Mais']];
  return `<aside class="lateral" aria-label="Navegação">
    <a class="lat-marca" href="#/">${LOGO}<span>Roteiros Miguel</span></a>
    <div><h2>${esc(b.trip.title)}</h2><p>${intervalo(b.trip.start_date, b.trip.end_date)}</p></div>
    <nav class="lat-nav">${it.map(([k, t, h]) => `<a href="${h || `#/v/${id}/${k}`}" ${k === ativo ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
    <div class="lat-dias"><span>Dias</span>${b.days.map((d) => `<a href="#/v/${id}/dia/${d.day_number}" ${ativo === 'dia' && d.day_number === diaAtual ? 'aria-current="date"' : ''}><b>${d.day_number}</b>${esc(d.city || '')}</a>`).join('')}</div>
    <button class="lat-tema" data-act="tema">${temaTxt()}</button></aside>`;
}
function render(html) {
  const naViagem = S.b && /^#\/v\//.test(location.hash);
  document.body.classList.toggle('pc', ehPC() && !!naViagem);
  $app.innerHTML = ehPC() && naViagem ? `<div class="pc-app">${lateral()}<div class="pc-main">${html}</div></div>` : html;
  window.scrollTo(0, 0);
  ajustarTitulos();
  leitorLigar();
  pintarTempo();
  let ent = null; try { ent = sessionStorage.getItem('entrada'); sessionStorage.removeItem('entrada'); } catch {}
  if (ent) document.querySelector('main.dia .dia-col')?.classList.add('entra-' + ent);
}
// ---------- deslizar o dedo no ecrã do dia para mudar de dia (telemóvel) ----------
(() => {
  let x0 = 0, y0 = 0, t0 = 0, ativo = false, horiz = null, col = null;
  const ignora = (el) => el.closest('.galeria, .opcoes, .rk-tabs, .mp-leg, .tk-grid, .lt-barra, input, textarea, select, .folha-fundo, .leaflet-container, .lbx');
  const noDia = () => /^#\/v\/[^/]+\/dia\//.test(location.hash) && !ehPC() && document.querySelector('main.dia');
  const vizinho = (d) => { const n = Number(location.hash.split('/')[4]) || 1; return S.b?.days.find((x) => x.day_number === n + d); };
  document.addEventListener('touchstart', (e) => {
    if (!noDia() || e.touches.length !== 1 || ignora(e.target)) { ativo = false; return; }
    ativo = true; horiz = null; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); col = document.querySelector('main.dia .dia-col');
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!ativo) return; const dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
    if (horiz === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) horiz = Math.abs(dx) > Math.abs(dy) * 1.3;
    if (!horiz) return;
    const temOutro = !!vizinho(dx < 0 ? 1 : -1);
    col.style.transition = 'none'; col.style.transform = `translateX(${temOutro ? dx : dx / 4}px)`; col.style.opacity = String(1 - Math.min(Math.abs(dx) / 900, 0.35));
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (!ativo || !horiz) { ativo = false; return; } ativo = false;
    const dx = e.changedTouches[0].clientX - x0, rapido = Date.now() - t0 < 350;
    const alvo = vizinho(dx < 0 ? 1 : -1);
    if (alvo && (Math.abs(dx) > window.innerWidth * 0.28 || (rapido && Math.abs(dx) > 50))) {
      col.style.transition = 'transform .18s ease-out, opacity .18s'; col.style.transform = `translateX(${dx < 0 ? -window.innerWidth : window.innerWidth}px)`; col.style.opacity = '0';
      try { sessionStorage.setItem('entrada', dx < 0 ? 'dir' : 'esq'); } catch {}
      setTimeout(() => { location.hash = `#/v/${S.tripId}/dia/${alvo.day_number}`; }, 170);
    } else { col.style.transition = 'transform .2s ease-out, opacity .2s'; col.style.transform = ''; col.style.opacity = ''; }
  }, { passive: true });
})();
// o nome das cidades fica sempre numa só linha: a letra encolhe até caber
function ajustarTitulos() {
  document.querySelectorAll('.cab-titulo').forEach(h => {
    h.style.fontSize = '';
    let t = parseFloat(getComputedStyle(h).fontSize);
    while (h.scrollWidth > h.clientWidth + 1 && t > 13) { t -= 1; h.style.fontSize = t + 'px'; }
  });
}
window.addEventListener('resize', ajustarTitulos);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustarTitulos);
// aspeto: automático, dia ou noite
const temaAtual = () => localStorage.getItem('tema') || 'auto';
const temaTxt = () => ({ auto: '◐ Aspeto: automático', light: '☀ Aspeto: dia', dark: '☾ Aspeto: noite' })[temaAtual()];
function aplicarTema() { const t = temaAtual(); if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; }
aplicarTema();
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.role = 'status'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
// Gestão das fotografias de uma atividade (só o dono): acrescentar e apagar, com confirmação
async function gerirFotos(id) {
  const fotos = S.b.photos.filter((p) => p.activity_id === id);
  const urls = await urlsAssinados('photos', fotos.filter((p) => p.path).map((p) => p.path));
  const w = document.createElement('div'); w.className = 'folha-fundo';
  w.innerHTML = `<div class="folha" role="dialog" aria-modal="true" aria-label="Fotografias"><div class="folha-top"><h2>Fotografias</h2><button class="b-ic" data-fechar aria-label="Fechar">✕</button></div>
    ${fotos.length ? `<div class="gf-grelha">${fotos.map((p) => `<figure class="gf-item"><div class="gf-img" style="background-image:url('${esc(p.external_url || urls[p.path] || '')}')"></div>
      <figcaption>${p.external_url ? 'Fotografia livre' : 'Tua'}</figcaption>
      <button class="gf-apagar" data-act="apagar-foto" data-id="${p.id}" data-path="${esc(p.path || '')}">Apagar</button></figure>`).join('')}</div>`
      : '<p class="vazio">Ainda não há fotografias deste local.</p>'}
    <label class="b-pri b-larga gf-add">${I.mais} Adicionar fotografias<input type="file" accept="image/*" multiple hidden data-up="foto-ativ" data-id="${id}"></label></div>`;
  document.body.appendChild(w);
  w.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) w.remove(); });
}
function folha(titulo, corpo, aoGuardar) {
  const w = document.createElement('div'); w.className = 'folha-fundo';
  w.innerHTML = `<div class="folha" role="dialog" aria-modal="true" aria-label="${esc(titulo)}"><div class="folha-top"><h2>${esc(titulo)}</h2><button class="b-ic" data-fechar aria-label="Fechar">✕</button></div><form class="form">${corpo}<div class="form-acoes"><button type="button" class="b-sec" data-fechar>Cancelar</button><button class="b-pri" type="submit">Guardar</button></div></form></div>`;
  document.body.appendChild(w);
  const fechar = () => w.remove();
  // só fecha com Cancelar, ✕ ou Guardar (clicar fora ou selecionar texto não fecha)
  w.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fechar(); });
  w.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = e.submitter; btn.disabled = true;
    try { await aoGuardar(Object.fromEntries(new FormData(e.target))); fechar(); } catch (err) { toast(err.message || 'Não foi possível guardar.'); btn.disabled = false; }
  });
  ligarMoeda(w);
  w.querySelector('input,select,textarea')?.focus();
}
const campo = (n, l, v = '', t = 'text', extra = '') => `<label class="campo"><span>${l}</span><input name="${n}" type="${t}" value="${esc(v)}" ${extra}></label>`;
const area = (n, l, v = '') => `<label class="campo"><span>${l}</span><textarea name="${n}" rows="3">${esc(v)}</textarea></label>`;
const escolha = (n, l, ops, v) => `<label class="campo"><span>${l}</span><select name="${n}">${ops.map(([k, t]) => `<option value="${esc(k)}" ${String(k) === String(v ?? '') ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;

async function completarFotos() {
  const b = S.b; if (!b?.isOwner || b.offline || sessionStorage.getItem('fotos3:' + S.tripId)) return;
  sessionStorage.setItem('fotos3:' + S.tripId, '1');
  const MAX = 10; const cache = {}; const novas = [];
  for (const a of b.activities.filter((x) => x.wiki_title)) {
    const ja = b.photos.filter((p) => p.activity_id === a.id && p.external_url);
    if (ja.length >= MAX) continue;
    try { cache[a.wiki_title] ??= await fotosWiki(a.wiki_title, MAX); } catch { cache[a.wiki_title] = []; }
    const urls = new Set(ja.map((p) => p.external_url));
    for (const f of cache[a.wiki_title]) {
      if (ja.length + novas.filter((n) => n.activity_id === a.id).length >= MAX) break;
      if (!urls.has(f.url)) novas.push({ trip_id: S.tripId, activity_id: a.id, external_url: f.url, credit: f.credit, source_url: f.source, sort_order: 1 });
    }
  }
  if (novas.length) { const { error } = await sb.from('activity_photos').insert(novas); if (!error) await recarregar(); }
}
// ---------- fotografias em ecrã inteiro ----------
async function fotosDe(lista) {
  const urls = await urlsAssinados('photos', lista.filter((p) => p.path && !p.external_url).map((p) => p.path));
  return lista.map((p) => ({ url: p.external_url || urls[p.path], credit: p.credit, source: p.source_url })).filter((x) => x.url);
}
function verFotos(fotos, i = 0, titulo = '') {
  if (!fotos.length) return;
  const w = document.createElement('div'); w.className = 'lbx'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-label', 'Fotografias');
  w.innerHTML = `<div class="lb-top"><span class="lb-t">${esc(titulo)}</span><span class="lb-n"></span><button class="lb-x" aria-label="Fechar">✕</button></div>
    <div class="lb-pista">${fotos.map((f) => `<figure class="lb-f"><img src="${esc(f.url)}" alt="" loading="lazy" decoding="async"></figure>`).join('')}</div>
    <button class="lb-seta ant" aria-label="Fotografia anterior">‹</button><button class="lb-seta seg" aria-label="Fotografia seguinte">›</button>
    <div class="lb-cred"></div>`;
  document.body.appendChild(w); document.body.classList.add('lb-aberto');
  const pista = w.querySelector('.lb-pista');
  const mostra = (k, suave = true) => { i = Math.max(0, Math.min(fotos.length - 1, k)); pista.scrollTo({ left: i * pista.clientWidth, behavior: suave ? 'smooth' : 'auto' });
    w.querySelector('.lb-n').textContent = `${i + 1} / ${fotos.length}`; const f = fotos[i];
    w.querySelector('.lb-cred').innerHTML = f.credit ? (f.source ? `<a href="${esc(f.source)}" target="_blank" rel="noopener">Foto: ${esc(f.credit)}</a>` : `Foto: ${esc(f.credit)}`) : '';
    w.querySelector('.ant').hidden = i === 0; w.querySelector('.seg').hidden = i === fotos.length - 1; };
  pista.addEventListener('scroll', () => { const k = Math.round(pista.scrollLeft / pista.clientWidth); if (k !== i) { i = k; mostra(k, false); } }, { passive: true });
  const fechar = () => { w.remove(); document.body.classList.remove('lb-aberto'); document.removeEventListener('keydown', tecla); };
  const tecla = (e) => { if (e.key === 'Escape') fechar(); if (e.key === 'ArrowRight') mostra(i + 1); if (e.key === 'ArrowLeft') mostra(i - 1); };
  document.addEventListener('keydown', tecla);
  w.addEventListener('click', (e) => { if (e.target.closest('.lb-x')) return fechar(); if (e.target.closest('.ant')) return mostra(i - 1); if (e.target.closest('.seg')) return mostra(i + 1); });
  requestAnimationFrame(() => mostra(i, false));
}
async function fotosDoDiaTodas(day) {
  const acts = atividadesDoDia(day).lista; const lista = [];
  if (day.photo_path) lista.push({ path: day.photo_path });
  acts.forEach((a) => S.b.photos.filter((p) => p.activity_id === a.id).forEach((p) => lista.push(p)));
  const vistos = new Set(); return (await fotosDe(lista)).filter((f) => !vistos.has(f.url) && vistos.add(f.url));
}
const credito = (p) => p?.credit ? `<a class="credito" href="${esc(p.source_url || '#')}" target="_blank" rel="noopener">Foto: ${esc(p.credit)}</a>` : '';
function fotoDoDia(day) {
  const rk = rankPrincipal(); const acts = atividadesDoDia(day).lista;
  const comFoto = acts.map((a) => ({ a, p: S.b.photos.find((p) => p.activity_id === a.id && p.external_url) })).filter((x) => x.p);
  comFoto.sort((x, y) => (rk.map[x.a.ext_key] || 99) - (rk.map[y.a.ext_key] || 99));
  return comFoto[0]?.p || null;
}

async function recarregar() { S.b = await carregarViagem(S.tripId); router(); setTimeout(autoLocais, 800); }
if (window.__ARRANQUE) window.__recarregar = recarregar; // só na pré-visualização
async function op(p, ok) { const { error } = await p; if (error) throw error; if (ok) toast(ok); await recarregar(); }

// ---------- entrar ----------
function vLogin(modo = 'entrar') {
  render(`<main class="login"><div class="login-card">
    <div class="marca">${LOGO}<span>Roteiros Miguel</span></div>
    <h1>${modo === 'nova' ? 'Definir password' : 'Entrar'}</h1>
    ${modo === 'nova' ? '<p class="sub">Escolhe a password para entrares na app.</p>' : ''}
    <form id="f-login" class="form">
      ${modo === 'nova' ? '' : campo('email', 'Email', '', 'email', 'autocomplete="email" required')}
      ${campo('password', 'Password', '', 'password', `autocomplete="${modo === 'nova' ? 'new-password' : 'current-password'}" required minlength="8"`)}
      <button class="b-pri b-larga" type="submit">${modo === 'nova' ? 'Guardar password' : 'Entrar'}</button>
      ${modo === 'nova' ? '' : '<button class="b-link" type="button" data-act="esqueci">Esqueci-me da password</button><button class="b-link" type="button" data-act="criar-conta">Primeiro acesso? Criar conta</button>'}
    </form></div></main>`);
  document.getElementById('f-login').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    const r = modo === 'nova' ? await sb.auth.updateUser({ password: f.password }) : await sb.auth.signInWithPassword({ email: f.email, password: f.password });
    if (r.error) return toast(modo === 'nova' ? 'Não foi possível guardar a password.' : /confirm/i.test(r.error.message) ? 'Falta confirmar o email: abre o email que te enviámos.' : 'Email ou password incorretos.');
    location.hash = '#/'; router();
  });
}

// ---------- lista de viagens ----------
async function vViagens() {
  render('<main class="pag"><p class="carrega">A carregar…</p></main>');
  const v = S.trips = await listarViagens();
  const hoje = new Date().toISOString().slice(0, 10);
  const ord = [...v].sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
  const ativas = ord.filter(viagemAtiva), inativas = ord.filter((t) => !viagemAtiva(t)).reverse();
  const cartao = (t) => `<a class="cartao-viagem ${viagemAtiva(t) ? '' : 'passada'}" href="#/v/${t.id}">
      <span class="cv-t">${esc(t.title)}</span><span class="cv-s">${esc(t.subtitle || '')}</span><span class="cv-d">${intervalo(t.start_date, t.end_date)}</span>
      ${t.start_date <= hoje && hoje <= t.end_date ? '<span class="selo">A decorrer</span>' : viagemAtiva(t) && t.start_date > hoje ? `<span class="selo selo-p">Daqui a ${Math.ceil((new Date(t.start_date) - new Date(hoje)) / 864e5)} dias</span>` : ''}</a>`;
  render(`<main class="pag">
    <header class="topo"><h1>As nossas viagens</h1><button class="b-ic" data-act="sair" aria-label="Sair">⎋</button></header>
    <h2 class="sec vg-t">Ativas <small>${ativas.length}</small></h2>
    <div class="lista">${ativas.map(cartao).join('') || '<p class="vazio">Não há viagens ativas.</p>'}</div>
    ${inativas.length ? `<details class="vg-inat"><summary><span>Inativas</span><small>${inativas.length}</small></summary><div class="lista">${inativas.map(cartao).join('')}</div></details>` : ''}
    <button class="b-sec b-larga" data-act="nova-viagem">${I.mais} Nova viagem</button></main>`);
}

// ---------- ecrã do dia ----------
async function vDia(n, selId) {
  const b = S.b; const day = b.days.find((d) => d.day_number === n) || b.days[0]; if (!day) return vResumo();
  sessionStorage.setItem('ultimoDia:' + S.tripId, day.day_number);
  const { lista, grupos, escolhida, labels } = atividadesDoDia(day);
  const reservas = reservasEm(day.date).map((x) => ({ _r: x, start_time: x.depart_time, title: `${KIND_LABEL[x.kind]}: ${x.from_place || ''} → ${x.to_place || ''}`, short: [x.carrier, x.number].filter(Boolean).join(' ') }));
  const itens = [...lista, ...reservas].sort((a, c) => (toMin(a.start_time) ?? 9999) - (toMin(c.start_time) ?? 9999) || (a.sort_order || 0) - (c.sort_order || 0));
  const hotel = hotelNa(day.date); const rk = rankPrincipal();
  const ehHoje = hojeEm(tz()) === day.date; const ag = agoraMin(tz());
  const atual = ehHoje ? lista.find((a) => { const s = toMin(a.start_time); return s != null && s <= ag && ag < s + (a.duration_min || 30); }) : null;
  let foto = '', fotoExt = null;
  if (day.photo_path) foto = (await urlsAssinados('photos', [day.photo_path]))[day.photo_path] || '';
  else { fotoExt = fotoDoDia(day); foto = fotoExt?.external_url || ''; }
  const rota = lista.some((a) => a.lat != null) ? `#/v/${S.tripId}/mapa/${day.day_number}` : null;
  const prev = b.days.find((d) => d.day_number === day.day_number - 1), next = b.days.find((d) => d.day_number === day.day_number + 1);

  const pc = ehPC();
  const sel = selId || atual?.id || lista.find((a) => a.wiki_title)?.id || lista[0]?.id;
  let painel = '';
  if (pc && sel) { const fp = await vAtividade(sel, true); painel = `<aside class="detalhe ficha ${fp.semFoto ? 'sem-foto' : ''} ${selId ? 'aberto' : ''}" aria-label="Ficha da atividade">${fp.html}</aside>`; }
  const bilhete = (a) => {
    if (a._r) return `<a class="bil" href="#/v/${S.tripId}/transportes#r-${a._r.id}"><span class="bil-c"><span class="bil-h">${hhmm(a.start_time) || '—'}</span><span class="bil-d">reserva</span></span><span class="bil-c2"><span class="bil-t">${esc(a.title)}</span><span class="bil-s">${esc(a.short || 'Ver reserva')}</span></span></a>`;
    const pos = rk.map[a.ext_key]; const nb = bilhetes({ activity_id: a.id }).length; const ag2 = a === atual;
    return `<div class="bil-w"><a class="bil ${ag2 ? 'agora' : ''} ${pc && a.id === sel ? 'sel' : ''}" href="#/v/${S.tripId}/a/${a.id}">
      <span class="bil-c"><span class="bil-h">${hhmm(a.start_time) || '—'}</span><span class="bil-d">${dur(a.duration_min)}</span></span>
      <span class="bil-c2">${ag2 ? '<span class="bil-ag">A decorrer</span>' : ''}<span class="bil-t">${esc(a.title)}</span>
      ${a.short ? `<span class="bil-s">${esc(a.short)}</span>` : ''}
      ${a.transport_mode && fichaT(a) ? `<span class="bil-tr">${icT(a.transport_mode, 'mini')}${estT(fichaT(a).status)}</span>` : a.needs_ticket || nb ? `<span class="bil-tk">${nb}/${pessoas().length} bilhetes</span>` : ''}</span></a>
      ${pos ? `<a class="rk" href="#/v/${S.tripId}/ranking/${rk.r.id}/${a.ext_key}" aria-label="${pos}.º lugar em ${rk.total} no ranking, ver ranking"><span>${I.estrela}${pos} em ${rk.total}</span></a>` : ''}</div>`;
  };

  render(`<main class="dia ${foto ? '' : 'sem-foto'}"><div class="dia-col">
    <div class="foto-dia" data-act="ver-fotos-dia" data-id="${day.id}" style="${foto ? `background-image:url('${esc(foto)}')` : ''}"><div class="vinheta"></div>${credito(fotoExt)}
      ${foto ? `<button class="foto-ver" data-act="ver-fotos-dia" data-id="${day.id}">${I.fotos}Fotos do dia</button>` : ''}${!day.photo_path && b.isOwner ? `<label class="foto-add">${I.mais} Foto do dia<input type="file" accept="image/*" hidden data-up="foto-dia" data-id="${day.id}"></label>` : ''}</div>
    <header class="cab cab3">
      <span class="cab-ndia">Dia ${day.day_number} de ${b.days.length}</span>
      <h1 class="cab-titulo">${esc(day.city || '')}</h1>
      <div class="cab-linha">
        <div class="cab-lado">${prev ? `<a class="b-mini" href="#/v/${S.tripId}/dia/${prev.day_number}" aria-label="Dia anterior">${I.voltar}</a>` : ''}</div>
        <div class="cab-data">${dataLonga(day.date)}</div>
        <div class="cab-lado dir">${next ? `<a class="b-mini" href="#/v/${S.tripId}/dia/${next.day_number}" aria-label="Dia seguinte">${I.seg}</a>` : ''}</div>
      </div>
    </header>
    <section class="painel">
      <div class="pega" aria-hidden="true"></div>
      ${day.offline ? '' : ''}${b.offline ? '<p class="aviso">Sem rede: a mostrar a última cópia guardada.</p>' : ''}
      ${grupos.length > 1 ? `<div class="opcoes" role="group" aria-label="Opções do dia">${grupos.map((g) => `<button class="op ${g === escolhida ? 'on' : ''}" data-act="opcao" data-dia="${day.id}" data-g="${g}">${esc(labels[g])}</button>`).join('')}</div>
        ${b.isOwner && !b.trip.info?.escolhas?.[day.ext_key] ? `<button class="b-link" data-act="fixar-opcao" data-dia="${day.ext_key}" data-g="${escolhida}">Decidir: ficar com a ${esc(labels[escolhida].split('·')[0].trim())}</button>` : ''}` : ''}
      ${extrasDia(day, rota)}
      <div class="bils">${itens.map(bilhete).join('') || '<p class="vazio">Sem atividades neste dia.</p>'}</div>
      ${day.date < b.trip.end_date ? `<a class="dormida ${hotel ? '' : 'sem'}" href="#/v/${S.tripId}/hoteis"><span class="dormida-ic" aria-hidden="true">${I.cama}</span><span class="dormida-t"><small>Dormida</small><strong>${hotel ? esc(hotel.name) : 'Sem hotel reservado'}</strong></span><span class="dormida-s" aria-hidden="true">${I.seg}</span></a>` : ''}
    </section></div>${painel}
    ${nav('dia')}</main>`);
}

// tempo, mapa e "sobre o dia": três mosaicos por baixo do cabeçalho azul
function extrasDia(day, rota) {
  const tHref = `#/v/${S.tripId}/tempo/${day.day_number}/d`;
  const sobre = day.intro ? `<div class="sobre-dia" hidden><p>${esc(day.intro).replace(/\n/g, '<br>')}</p>${day.rain_alt ? `<p class="chuva"><strong>Se chover:</strong> ${esc(day.rain_alt)}</p>` : ''}</div>` : '';
  const bSobre = (cls, conteudo) => day.intro ? `<button class="${cls}" data-act="sobre-dia" aria-expanded="false">${conteudo}</button>` : '';
  return `<div class="dx-a">
      <a class="dx-a-t" href="${tHref}"><span class="tp-tile" data-tempo="${day.date}"><span class="tp-sem">…</span></span><small>Tempo</small></a>
      ${rota ? `<a class="dx-a-t" href="${rota}"><span class="dx-ic">${I.mapa}</span><small>Mapa do dia</small></a>` : ''}
      ${bSobre('dx-a-t', `<span class="dx-ic">${I.info}</span><small>Sobre o dia</small>`)}</div>${sobre}`;
}

// ---------- ficha da atividade ----------
async function vAtividade(id, comoPainel = false, voltar = null) {
  const _at = S.b.activities.find((x) => x.id === id);
  const audioGuia = _at?.guide_audio_path ? (await urlsAssinados('audio', [_at.guide_audio_path]))[_at.guide_audio_path] : null;
  const b = S.b; const a = b.activities.find((x) => x.id === id); if (!a) return vDia(1);
  const day = b.days.find((d) => d.id === a.day_id); const rk = rankPrincipal(); const pos = rk.map[a.ext_key];
  const outros = b.rankingItems.filter((i) => (i.activity_ext_keys || []).includes(a.ext_key) && i.ranking_id !== rk.r?.id)
    .map((i) => ({ i, r: b.rankings.find((r) => r.id === i.ranking_id), tot: b.rankingItems.filter((j) => j.ranking_id === i.ranking_id).length }));
  const fotos = b.photos.filter((p) => p.activity_id === a.id).sort((x, y) => (x.external_url ? 1 : 0) - (y.external_url ? 1 : 0));
  const urls = await urlsAssinados('photos', fotos.filter((p) => p.path).map((p) => p.path));
  const tk = bilhetes({ activity_id: a.id }); const rem = b.reminders.filter((r) => r.activity_id === a.id);
  const temLocal = a.lat != null || a.maps_query || a.place_name;
  const semFoto = !fotos.length;
  const html = (`
    ${semFoto ? '' : `<div class="galeria" id="galeria">${fotos.map((p) => `<div class="g-foto" data-act="ver-fotos-ativ" data-id="${a.id}" data-i="${fotos.indexOf(p)}" style="background-image:url('${esc(p.external_url || urls[p.path] || '')}')">${credito(p)}</div>`).join('')}</div>
    <div class="vinheta-f"></div>`}
    <div class="ficha-top"><a class="b-ic esc" href="${voltar || `#/v/${S.tripId}/dia/${day?.day_number || 1}`}" aria-label="Voltar ao dia">${I.voltar}</a>
      <span class="g-n">${fotos.length ? `${fotos.length} foto${fotos.length > 1 ? 's' : ''}` : ''}</span></div>
    <section class="ficha-corpo">
      <div class="caixa azul">
        <div class="cx-l1"><span>${dataLonga(day?.date)}${day?.city ? ', ' + esc(day.city) : ''}</span>
          ${pos ? `<a class="rk-chip" href="#/v/${S.tripId}/ranking/${rk.r.id}/${a.ext_key}" aria-label="${pos}.º lugar em ${rk.total} no ranking">${I.estrela}${pos} em ${rk.total}</a>` : ''}</div>
        <h1>${esc(a.title)}</h1>
        <div class="chips">${a.start_time ? `<span class="chip ouro">${hhmm(a.start_time)}</span>` : ''}${a.duration_min ? `<span class="chip">${dur(a.duration_min)}</span>` : ''}${a.place_name ? `<span class="chip">${esc(a.place_name)}</span>` : ''}</div>
        ${temLocal ? `<div class="maps-l"><a class="b-maps" href="${esc(mapsPlaceLink(a))}" target="_blank" rel="noopener">${I.maps}Abrir no Google Maps</a>${linguaViagem() ? `<button class="b-local ${a.local_name && !a.local_ok ? 'por-ver' : ''}" data-act="local" data-tab="activities" data-id="${a.id}" aria-label="Nome e morada na língua local" title="Na língua local">文A</button>` : ''}</div>` : ''}
        ${outros.length ? `<div class="outros-rk">${outros.map((o) => `<a href="#/v/${S.tripId}/ranking/${o.r.id}/${a.ext_key}">${o.i.position} em ${o.tot} · ${esc(o.r.title)}</a>`).join('')}</div>` : ''}
      </div>
      ${a.transport_mode && fichaT(a) ? (() => { const f = fichaT(a); return `<div class="caixa tr-cx"><div class="cx-h"><h2>${MODOS[a.transport_mode]}</h2>${estT(f.status)}</div>
        <p class="rota"><strong>${esc(a.from_place || '')}</strong> ${hhmm(a.start_time)} → <strong>${esc(a.to_place || '')}</strong> ${hhmm(a.arrive_time)}</p>
        <p class="meta">${esc([f.carrier, f.number && (a.transport_mode === 'aviao' ? 'Voo ' : '') + f.number, f.terminal].filter(Boolean).join(' · '))}</p>
        <button class="b-sec" data-act="ficha-transporte" data-id="${f.id}">${b.isOwner ? 'Reserva, valores e bilhetes' : 'Ver bilhetes'}</button>
        ${linguaViagem() && a.from_place && elegivelLocal('activities', a) ? `<button class="b-sec tr-local ${a.local_name && !a.local_ok ? 'por-ver' : ''}" data-act="local" data-tab="activities" data-id="${a.id}"><b>文A</b> ${esc(a.from_place)} na língua local</button>` : ''}</div>`; })() : ''}
      ${!a.transport_mode && (fichaT(a) || (b.isOwner && (a.needs_ticket || a.kind === 'visit'))) ? (() => { const f = fichaT(a);
        const val = f?.total_price != null ? dinheiroD(f.total_price, f.currency) : '';
        if (!b.isOwner && !f) return '';
        return `<div class="caixa pr-cx"><div class="cx-h"><h2>Preço</h2>${f ? estT(f.status) : ''}</div>
          ${val ? `<p class="pr-v">${val}${f.deposit && f.status !== 'pago' ? `<small>Sinal pago: ${dinheiro(f.deposit, f.currency)}${convTxt(f.deposit, f.currency) ? ' (' + convTxt(f.deposit, f.currency) + ')' : ''}</small>` : ''}</p>` : `<p class="meta">${f ? 'Sem valor registado.' : 'Ainda sem preço registado.'}</p>`}
          ${f?.vendor_url && f.status === 'por_comprar' ? `<a class="b-sec" href="${esc(f.vendor_url)}" target="_blank" rel="noopener">Comprar</a>` : ''}
          ${b.isOwner ? `<button class="b-sec" data-act="preco-ativ" data-id="${a.id}">${f ? 'Editar preço e pagamento' : 'Registar preço'}</button>` : ''}</div>`; })() : ''}
      ${a.description || a.short ? `<div class="caixa"><h2>Sobre a visita</h2><p>${esc(a.description || a.short)}</p></div>` : ''}
      ${a.guide ? guiaHtml(a.guide, audioGuia, a.title) : ''}
      ${(a.how_to || []).length ? `<div class="caixa"><h2>Como ir</h2><ol class="passos">${a.how_to.map((p) => `<li>${esc(p)}</li>`).join('')}</ol></div>` : ''}
      ${(a.meal_options || []).length ? `<div class="caixa"><h2>Opções</h2><ul class="refeicoes">${a.meal_options.map((m) => `<li><a href="${esc(mapsQueryLink(m.q || m.name))}" target="_blank" rel="noopener"><span class="rf-n">${esc(m.name)}</span><span class="rf-t">${esc(m.type || '')}</span></a></li>`).join('')}</ul></div>` : ''}
      ${a.needs_ticket || tk.length || b.isOwner ? (() => { const tkP = tk.filter((t) => t.member_id && (t.doc_type || 'bilhete') === 'bilhete'); const outros = tk.filter((t) => !tkP.includes(t));
        return `<details class="caixa dobra" ${tk.length ? 'open' : ''}><summary class="cx-h"><h2>Bilhetes e documentos</h2><span class="ok">${tkP.length} de ${pessoas().length}${outros.length ? ` · +${outros.length}` : ''}</span></summary>
        <div class="tk-grid">${pessoas().map((m) => { const t = tkP.find((x) => x.member_id === m.id);
          return t ? `<span class="tk-w"><button class="tk tk-doc bilhete" data-act="ver-bilhete" data-path="${esc(t.path)}">${I.qr}<span class="tk-tx"><b>${esc(m.display_name)}</b><small>${esc(t.label || 'Bilhete')}</small></span></button>${b.isOwner ? `<button class="tk-ed" data-act="editar-doc" data-id="${t.id}" aria-label="Mudar nome">✎</button><button class="tk-x" data-act="apagar-bilhete" data-id="${t.id}" data-path="${esc(t.path)}" aria-label="Apagar bilhete de ${esc(m.display_name)}">✕</button>` : ''}</span>`
            : b.isOwner ? `<label class="tk tk-falta">${I.mais}${esc(m.display_name)}<input type="file" accept="image/*,application/pdf" hidden data-up="bilhete" data-campo="activity_id" data-id="${a.id}" data-membro="${m.id}"></label>`
            : `<span class="tk tk-falta">${esc(m.display_name)}: sem bilhete</span>`; }).join('')}</div>
        ${outros.length || b.isOwner ? `<p class="tk-sub">Outros documentos <small>faturas, comprovativos, reservas…</small></p>${documentos(outros, 'activity_id', a.id)}` : ''}</details>`; })() : ''}
      ${(a.tips || []).length ? `<div class="caixa"><h2>Dicas</h2>${a.tips.map((t) => `<p class="${t.startsWith('⚠') ? 'alerta' : ''}">${esc(t)}</p>`).join('')}</div>` : ''}
      <details class="caixa dobra" ${rem.length ? 'open' : ''}><summary class="cx-h"><h2>Lembretes</h2><span class="ok">${rem.length ? rem.length : 'Nenhum'}</span></summary>
        ${b.isOwner ? `<button class="b-link lemb-add" data-act="novo-lembrete" data-campo="activity_id" data-id="${a.id}">${I.mais} Adicionar lembrete</button>` : ''}
        <div class="lemb">${rem.map((r) => `<span class="lb">${I.sino}${offsetTxt(r.offset_minutes)}${b.isOwner ? `<button data-act="apagar-lembrete" data-id="${r.id}" aria-label="Apagar lembrete">✕</button>` : ''}</span>`).join('') || ''}</div>
        ${a.start_time && day ? `<button class="b-sec" data-act="calendario" data-id="${a.id}">Adicionar ao calendário</button>` : ''}</details>
      ${b.isOwner ? `<div class="ficha-acoes"><button class="b-link" data-act="gerir-fotos" data-id="${a.id}">Fotografias${fotos.length ? ` (${fotos.length})` : ''}</button><span aria-hidden="true">·</span><button class="b-link" data-act="editar-ativ" data-id="${a.id}">Editar esta atividade</button></div>` : ''}
    </section>`);
  if (comoPainel) return { html: html.replace(`aria-label="Voltar ao dia">${I.voltar}`, 'aria-label="Fechar a ficha">✕'), semFoto };
  render(`<main class="ficha ${semFoto ? 'sem-foto' : ''}">${html}</main>`);
}

// ---------- resumo (linha do tempo) ----------
// os imperdíveis no ecrã principal: o ranking escolhido em cartões que deslizam; tocar abre a ficha
function blocoRanking() {
  const b = S.b; if (!b.rankings.length) return '';
  const ord = b.rankings.slice().sort((x, y) => (y.is_primary ? 1 : 0) - (x.is_primary ? 1 : 0) || (x.sort_order || 0) - (y.sort_order || 0));
  let rid = null; try { rid = sessionStorage.getItem('rkResumo:' + S.tripId); } catch {}
  const r = ord.find((x) => x.id === rid) || ord[0];
  const nItens = (x) => b.rankingItems.filter((i) => i.ranking_id === x.id).length;
  const items = b.rankingItems.filter((i) => i.ranking_id === r.id).sort((x, y) => x.position - y.position);
  const linha = (i) => { const acts = b.activities.filter((x) => (i.activity_ext_keys || []).includes(x.ext_key)); const a = acts[0];
    const dias = [...new Map(acts.map((x) => b.days.find((d) => d.id === x.day_id)).filter(Boolean).map((d) => [d.id, d])).values()].sort((x, y) => x.day_number - y.day_number);
    const foto = a && b.photos.find((p) => acts.some((x) => x.id === p.activity_id) && p.external_url);
    const corpo = `<span class="rk-n">${i.position}</span>${foto ? `<span class="rk-foto" style="background-image:url('${esc(foto.external_url)}')"></span>` : ''}<span class="rk-c"><strong>${esc(i.title)}</strong></span>`;
    return `<li>${a ? `<a class="rk-main" href="#/v/${S.tripId}/a/${a.id}/r/${r.id}/resumo">${corpo}</a>` : `<div class="rk-main">${corpo}</div>`}
      <div class="rk-dias">${dias.length ? dias.map((d) => `<a class="rk-dia" href="#/v/${S.tripId}/dia/${d.day_number}">Dia ${d.day_number} · ${dataCurta(d.date)}</a>`).join('') : '<span class="rk-fora">Fora do roteiro</span>'}</div></li>`; };
  return `<section class="rs-rank"><h2 class="sec">Rankings <span class="rs-n">${ord.length}</span></h2>
    <div class="rr-lista-rk" role="tablist" aria-label="Rankings da viagem">${ord.map((x) => `<button class="rr-rk ${x.id === r.id ? 'on' : ''}" role="tab" aria-selected="${x.id === r.id}" data-act="rk-resumo" data-id="${x.id}"><span>${esc(x.title)}</span><b>${nItens(x)}</b></button>`).join('')}</div>
    <ol class="rank rank2 rr-top">${items.slice(0, 5).map(linha).join('')}</ol>
    ${items.length > 5 ? `<a class="b-sec b-larga rr-todos" href="#/v/${S.tripId}/ranking/${r.id}">Ver o ranking completo (${items.length})</a>` : ''}</section>`;
}
// ---------- tempo (Open-Meteo): previsão até 16 dias antes; antes disso, o que aconteceu nos últimos 10 anos nesses dias ----------
// local de cada dia = onde se passa mais tempo (pela duração das atividades), não onde se dorme
function localDoDia(d) {
  const acts = atividadesDoDia(d).lista.filter((a) => a.lat != null && a.lng != null && !a.transport_mode);
  if (!acts.length) { // sem atividades com localização: o hotel dessa noite (ou de onde se sai nesse dia)
    const h = S.b.hotels.find((x) => x.lat != null && x.status !== 'cancelado' && x.check_in <= d.date && d.date <= x.check_out);
    return h ? { lat: +Number(h.lat).toFixed(2), lng: +Number(h.lng).toFixed(2) } : null; }
  const grupos = [];
  acts.forEach((a) => { const w = Math.max(15, a.duration_min || 30);
    const g = grupos.find((x) => Math.hypot(x.lat - a.lat, (x.lng - a.lng) * Math.cos(a.lat * Math.PI / 180)) < 0.25);
    if (g) { g.lat = (g.lat * g.w + a.lat * w) / (g.w + w); g.lng = (g.lng * g.w + a.lng * w) / (g.w + w); g.w += w; } else grupos.push({ lat: a.lat, lng: a.lng, w }); });
  grupos.sort((x, y) => y.w - x.w); return { lat: +grupos[0].lat.toFixed(2), lng: +grupos[0].lng.toFixed(2) };
}
const WMO = (c) => c == null ? 'nuvem' : c === 0 ? 'sol' : c <= 2 ? 'solnuvem' : c === 3 ? 'nuvem' : c <= 48 ? 'nevoeiro' : c <= 67 || (c >= 80 && c <= 82) ? 'chuva' : c <= 77 || c === 85 || c === 86 ? 'neve' : 'trovoada';
const TEMPO_TXT = { sol: 'Sol', solnuvem: 'Sol e nuvens', nuvem: 'Nublado', nevoeiro: 'Nevoeiro', chuva: 'Chuva', neve: 'Neve', trovoada: 'Trovoada' };
// ícones a cores, como nas apps de meteorologia
const SVG_SOL = (cx, cy, r) => `<g stroke="#FFAE1A" stroke-width="3.2" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((g) => { const a = g * Math.PI / 180; return `<line x1="${(cx + Math.cos(a) * (r + 4)).toFixed(1)}" y1="${(cy + Math.sin(a) * (r + 4)).toFixed(1)}" x2="${(cx + Math.cos(a) * (r + 8.5)).toFixed(1)}" y2="${(cy + Math.sin(a) * (r + 8.5)).toFixed(1)}"/>`; }).join('')}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFC93C" stroke="#FFAE1A" stroke-width="2"/>`;
const SVG_NUVEM = (esc_) => `<path d="M19 48h27a10.5 10.5 0 0 0 1.2-20.9A14.5 14.5 0 0 0 19.6 30 9 9 0 0 0 19 48z" fill="${esc_ ? '#AEB9C6' : '#EEF2F6'}" stroke="${esc_ ? '#7F8D9D' : '#AFBBC8'}" stroke-width="2.2" stroke-linejoin="round"/>`;
const TICO = {
  sol: SVG_SOL(32, 32, 12),
  solnuvem: SVG_SOL(23, 23, 9) + SVG_NUVEM(false),
  nuvem: `<path d="M38 22a11 11 0 0 1 19 6 8 8 0 0 1-3 15" fill="#D9E0E8" stroke="#AFBBC8" stroke-width="2"/>` + SVG_NUVEM(false),
  nevoeiro: SVG_NUVEM(false).replace('48z', '48z') + `<g stroke="#9AA7B5" stroke-width="3" stroke-linecap="round"><line x1="12" y1="53" x2="50" y2="53"/><line x1="18" y1="59" x2="44" y2="59"/></g>`,
  chuva: `<g transform="translate(0 -6)">${SVG_NUVEM(true)}</g><g stroke="#2E8BEA" stroke-width="3.4" stroke-linecap="round"><line x1="22" y1="48" x2="19" y2="56"/><line x1="32" y1="48" x2="29" y2="56"/><line x1="42" y1="48" x2="39" y2="56"/></g>`,
  neve: `<g transform="translate(0 -6)">${SVG_NUVEM(false)}</g><g fill="#5DB3F0"><circle cx="21" cy="51" r="2.6"/><circle cx="32" cy="55" r="2.6"/><circle cx="43" cy="51" r="2.6"/></g>`,
  trovoada: `<g transform="translate(0 -6)">${SVG_NUVEM(true)}</g><path d="M33 42l-7 11h6l-3 9 10-13h-6l4-7z" fill="#FFC93C" stroke="#F0A500" stroke-width="1.4" stroke-linejoin="round"/>`,
};
const icGota = (mm) => mm >= 1 ? `<svg class="tp-gota ${mm >= 5 ? 'f' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" fill="#2E8BEA"/></svg>` : '';
const ETQ = { prev: 'Previsão', tend: 'Tendência', hist: 'Histórico' };
const chuvaTxt = (x) => x.tipo === 'hist' ? `choveu em ${x.chuvosos} de ${x.nAnos} anos` : `${x.chuva}% chuva`;
const previsaoEm = (date) => dataLonga(isoMais(date, -15));
const icTempo = (t, cls = '') => `<svg class="tp-ic ${cls}" viewBox="0 0 64 64" aria-hidden="true">${TICO[t] || TICO.nuvem}</svg>`;
const ROSA = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const dirV = (g) => g == null ? '' : ROSA[Math.round(g / 45) % 8];
const hm = (iso) => iso ? String(iso).slice(11, 16) : '—';
const isoMais = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const hojeTempo = () => window.__HOJE_TEMPO || new Date().toISOString().slice(0, 10);
const med = (v) => v.length ? v.reduce((x, y) => x + y, 0) / v.length : null;
async function nomeLocal(L) {
  const k = 'geo:' + L.lat + ',' + L.lng; try { const c = localStorage.getItem(k); if (c) return c; } catch {}
  try { const j = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=pt&lat=${L.lat}&lon=${L.lng}`).then((r) => r.json());
    const a = j.address || {}; const n = a.city || a.town || a.village || a.municipality || ''; if (n) { try { localStorage.setItem(k, n); } catch {} } return n; } catch { return ''; }
}
let _tempoMem = null;
async function tempoDaViagem() {
  const b = S.b; const hoje = hojeTempo(); const limite = isoMais(hoje, 15);
  const chave = 'tempo3:' + S.tripId + ':' + hoje + ':' + (b.trip.start_date <= limite ? new Date().getHours() >> 2 : 'n');
  if (_tempoMem?.chave === chave) return _tempoMem.res;
  try { const c = JSON.parse(localStorage.getItem(chave) || 'null'); if (c) { _tempoMem = { chave, res: c }; return c; } } catch {}
  const locs = {}; let ult = null; b.days.forEach((d) => { const l = localDoDia(d) || ult; ult = l; if (l) (locs[l.lat + ',' + l.lng] = locs[l.lat + ',' + l.lng] || { ...l, dias: [] }).dias.push(d); });
  const res = {};
  await Promise.all(Object.values(locs).map(async (L) => {
    const nome = (await nomeLocal(L)) || '';
    const prev = L.dias.filter((d) => d.date >= hoje && d.date <= limite), norm = L.dias.filter((d) => !prev.includes(d));
    if (prev.length) { try {
      const j = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${L.lat}&longitude=${L.lng}&timezone=auto&start_date=${prev[0].date}&end_date=${prev[prev.length - 1].date}`
        + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset,sunshine_duration'
        + '&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m').then((r) => r.json());
      const D = j.daily || {}, H = j.hourly || {};
      prev.forEach((d) => { const k = (D.time || []).indexOf(d.date); if (k < 0) return;
        const horas = []; (H.time || []).forEach((t, h) => { if (t.startsWith(d.date) && Number(t.slice(11, 13)) >= 7) horas.push({ h: t.slice(11, 16), t: WMO(H.weather_code[h]), temp: Math.round(H.temperature_2m[h]), chuva: H.precipitation_probability[h], vento: Math.round(H.wind_speed_10m[h]) }); });
        const ate = Math.round((new Date(d.date) - new Date(hoje)) / 864e5);
        res[d.date] = { tipo: ate <= 5 ? 'prev' : 'tend', local: nome, t: WMO(D.weather_code[k]), max: Math.round(D.temperature_2m_max[k]), min: Math.round(D.temperature_2m_min[k]), chuva: D.precipitation_probability_max[k],
          mm: D.precipitation_sum[k], vento: Math.round(D.wind_speed_10m_max[k]), rajada: Math.round(D.wind_gusts_10m_max[k]), dir: D.wind_direction_10m_dominant[k], uv: D.uv_index_max[k],
          nascer: hm(D.sunrise[k]), por: hm(D.sunset[k]), sol: D.sunshine_duration[k] != null ? +(D.sunshine_duration[k] / 3600).toFixed(1) : null, horas: ate <= 5 ? horas : [] }; });
    } catch {} }
    if (norm.length) { try {
      const a1 = Number(hoje.slice(0, 4)) - 1, a0 = a1 - 9;
      const j = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${L.lat}&longitude=${L.lng}&timezone=auto&start_date=${a0}-01-01&end_date=${a1}-12-31`
        + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset').then((r) => r.json());
      const T = j.daily || {}; const idx = {}; (T.time || []).forEach((t, k) => { idx[t] = k; });
      norm.forEach((d) => { const md = d.date.slice(5); const anos = [];
        for (let a = a1; a >= a0; a--) { const k = idx[a + '-' + md];
          if (k != null && T.temperature_2m_max[k] != null) anos.push({ ano: a, max: Math.round(T.temperature_2m_max[k]), min: Math.round(T.temperature_2m_min[k]), mm: +(T.precipitation_sum[k] || 0).toFixed(1), vento: Math.round(T.wind_speed_10m_max[k]) }); }
        if (!anos.length) return; const kU = idx[a1 + '-' + md];
        res[d.date] = { tipo: 'hist', local: nome, max: Math.round(med(anos.map((x) => x.max))), min: Math.round(med(anos.map((x) => x.min))),
          chuvosos: anos.filter((x) => x.mm >= 1).length, nAnos: anos.length, vento: Math.round(med(anos.map((x) => x.vento))),
          maxAlto: Math.max(...anos.map((x) => x.max)), maxBaixo: Math.min(...anos.map((x) => x.max)),
          nascer: kU != null ? hm(T.sunrise[kU]) : '—', por: kU != null ? hm(T.sunset[kU]) : '—', anos }; });
    } catch {} }
  }));
  _tempoMem = { chave, res };
  try { localStorage.setItem(chave, JSON.stringify(res)); } catch {}
  return res;
}
// pinta o tempo onde houver lugares marcados com data-tempo (o ecrã aparece logo; o tempo chega depois)
async function pintarTempo() {
  if (!document.querySelector('[data-tempo], [data-tempo-viagem]') || !S.b) return;
  let T = {}; try { T = await tempoDaViagem(); } catch { return; }
  document.querySelectorAll('[data-tempo-viagem]').forEach((el) => { const xs = Object.values(T); el.textContent = xs.length ? `${Math.min(...xs.map((x) => x.min))}° a ${Math.max(...xs.map((x) => x.max))}°` : '—'; });
  document.querySelectorAll('[data-tempo]').forEach((el) => { const x = T[el.dataset.tempo];
    if (!x) { el.innerHTML = el.classList.contains('tp-cartao') ? '<span class="tp-sem">Tempo indisponível</span>' : '<span class="tp-sem">—</span>'; return; }
    if (el.classList.contains('tp-cartao')) el.innerHTML = x.tipo === 'hist'
      ? `<span class="tp-c-t"><b>${x.max}°</b><i>${x.min}°</i></span><span class="tp-c-txt"><b>Histórico deste dia</b><span>Média de ${x.nAnos} anos · ${chuvaTxt(x)}</span><small>Previsão a partir de ${previsaoEm(el.dataset.tempo)}${x.local ? ' · ' + esc(x.local) : ''}</small></span><span class="tp-c-seta">›</span>`
      : `${icTempo(x.t, 'g')}<span class="tp-c-t"><b>${x.max}°</b><i>${x.min}°</i></span>
      <span class="tp-c-txt"><b>${TEMPO_TXT[x.t]}</b><span>${x.chuva}% chuva · vento ${x.vento} km/h</span><small>${ETQ[x.tipo]}${x.tipo === 'tend' ? ' (pouco fiável a esta distância)' : ''}${x.local ? ' · ' + esc(x.local) : ''}</small></span><span class="tp-c-seta">›</span>`;
    else if (el.classList.contains('tp-tile')) el.innerHTML = x.tipo === 'hist' ? `<b>${x.max}°<i>/${x.min}°</i></b><em>chuva ${x.chuvosos}/${x.nAnos} anos</em>` : `${icTempo(x.t)}<b>${x.max}°<i>/${x.min}°</i></b>`;
    else if (el.classList.contains('rs-tempo')) el.innerHTML = x.tipo === 'hist' ? `<b>${x.max}°</b>${x.chuvosos ? `<span class="rs-tg">${icGota(1)}${x.chuvosos}/${x.nAnos}</span>` : ''}` : `${icTempo(x.t)}<b>${x.max}°</b>`;
    else el.innerHTML = `${icTempo(x.t)}<b>${x.max}°</b><span>${x.min}°</span>`; });
}
// ecrã do tempo: a viagem toda, ou um dia em pormenor
async function vTempo(n, origem) {
  const b = S.b; const id = S.tripId; const dia = n ? b.days.find((d) => d.day_number === Number(n)) : null;
  const voltar = dia ? (origem === 'd' ? `#/v/${id}/dia/${dia.day_number}` : `#/v/${id}/tempo`) : `#/v/${id}/resumo`;
  const cab = (t, sub) => `<header class="mp-cab"><a class="b-ic" href="${voltar}" aria-label="Voltar">${I.voltar}</a><div><h1>${t}</h1><p>${sub}</p></div></header>`;
  render(`<main class="pag com-nav tempo-pag">${cab(dia ? 'Tempo · Dia ' + dia.day_number : 'Tempo da viagem', dia ? dataLonga(dia.date) : esc(b.trip.title))}<p class="vazio">A carregar o tempo…</p>${nav(origem === 'd' ? 'dia' : 'resumo')}</main>`);
  let T = {}; try { T = await tempoDaViagem(); } catch {}
  if (!document.querySelector('.tempo-pag')) return;
  const etiqueta = (x) => `<span class="tp-etq ${x.tipo}">${x.tipo === 'hist' ? 'Histórico · não é previsão' : x.tipo === 'tend' ? 'Tendência · pouco fiável a esta distância' : 'Previsão'}</span>`;
  if (!dia) {
    const xs = b.days.map((d) => T[d.date]).filter(Boolean);
    const resumo = xs.length ? `<div class="tp-resumo"><div><small>Temperaturas</small><b>${Math.min(...xs.map((x) => x.min))}° a ${Math.max(...xs.map((x) => x.max))}°</b></div>
      <div><small>Vento médio</small><b>${Math.round(med(xs.map((x) => x.vento)))} km/h</b></div>${xs.some((x) => x.tipo === 'hist') ? `<div><small>Previsão a partir de</small><b>${dataCurta(isoMais(b.days.find((d) => T[d.date]?.tipo === 'hist').date, -15))}</b></div>` : `<div><small>Dias com chuva provável</small><b>${xs.filter((x) => x.chuva >= 50).length} de ${xs.length}</b></div>`}</div>` : '';
    const tipos = new Set(xs.map((x) => x.tipo));
    render(`<main class="pag com-nav tempo-pag">${cab('Tempo da viagem', esc(b.trip.title))}${resumo}
      <p class="tp-expl">${tipos.has('hist') ? '<b>Histórico</b>: o que aconteceu nesse dia nos últimos 10 anos (não é uma previsão). ' : ''}${tipos.has('tend') ? '<b>Tendência</b>: previsão a 6–16 dias, serve só como ideia geral. ' : ''}${tipos.has('prev') ? '<b>Previsão</b>: próximos 5 dias, a mais fiável.' : ''}</p>
      <ol class="tp-lista">${b.days.map((d) => { const x = T[d.date]; return `<li><a href="#/v/${id}/tempo/${d.day_number}">
        <span class="tp-l-dia"><b>Dia ${d.day_number}</b><small>${esc(dataCurta(d.date))}</small><small class="tp-l-loc">${esc(x?.local || d.city || '')}</small></span>
        ${x ? `${x.tipo === 'hist' ? '<span class="tp-l-sem-ic"></span>' : icTempo(x.t, 'm')}<span class="tp-l-t"><b>${x.max}°</b><i>${x.min}°</i></span><span class="tp-l-x"><span>${x.tipo === 'hist' ? 'Histórico' : TEMPO_TXT[x.t]}</span><small>${chuvaTxt(x)} · ${x.vento} km/h</small><em class="tp-mini ${x.tipo}">${ETQ[x.tipo]}</em></span>` : '<span class="tp-sem">Sem dados</span>'}
        <span class="tp-c-seta">›</span></a></li>`; }).join('')}</ol>${nav('resumo')}</main>`);
    return;
  }
  const x = T[dia.date]; const k = b.days.indexOf(dia); const ant = b.days[k - 1], seg = b.days[k + 1];
  const navD = `<div class="tp-navd">${ant ? `<a href="#/v/${id}/tempo/${ant.day_number}${origem === 'd' ? '/d' : ''}">‹ Dia ${ant.day_number}</a>` : '<span></span>'}${seg ? `<a href="#/v/${id}/tempo/${seg.day_number}${origem === 'd' ? '/d' : ''}">Dia ${seg.day_number} ›</a>` : '<span></span>'}</div>`;
  if (!x) { render(`<main class="pag com-nav tempo-pag">${cab('Tempo · Dia ' + dia.day_number, dataLonga(dia.date))}${navD}<p class="vazio">Não foi possível obter o tempo para este dia.</p>${nav(origem === 'd' ? 'dia' : 'resumo')}</main>`); return; }
  const est = (rot, val, sub = '') => `<div class="tp-est"><small>${rot}</small><b>${val}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
  const dirTxt = x.dir != null ? `<span class="tp-dir" style="transform:rotate(${(x.dir + 180) % 360}deg)">↑</span> ${dirV(x.dir)}` : '';
  const stats = x.tipo !== 'hist'
    ? est('Probabilidade de chuva', x.chuva + '%', x.mm ? x.mm.toString().replace('.', ',') + ' mm previstos' : 'sem chuva prevista') + est('Vento', x.vento + ' km/h', dirTxt + (x.rajada && x.tipo === 'prev' ? ` · rajadas ${x.rajada} km/h` : ''))
      + (x.tipo === 'tend' ? '' : est('Índice UV', x.uv != null ? Math.round(x.uv) : '—', x.uv >= 6 ? 'alto' : x.uv >= 3 ? 'moderado' : 'baixo')) + (x.tipo === 'tend' ? '' : est('Horas de sol', x.sol != null ? String(x.sol).replace('.', ',') + ' h' : '—')) + est('Nascer do sol', x.nascer) + est('Pôr do sol', x.por)
    : est('Chuva neste dia', `${x.chuvosos} de ${x.nAnos} anos`, 'com pelo menos 1 mm') + est('Vento', x.vento + ' km/h', 'máximo do dia, média dos anos') + est('Máximas registadas', `${x.maxBaixo}° a ${x.maxAlto}°`, 'a mais baixa e a mais alta')
      + est('Previsão disponível', dataCurta(isoMais(dia.date, -15)), 'tendência; a previsão fiável chega 5 dias antes') + est('Nascer do sol', x.nascer) + est('Pôr do sol', x.por);
  const horas = x.horas?.length ? `<h2 class="sec">Hora a hora</h2><div class="tp-horas">${x.horas.map((h) => `<div class="tp-h"><small>${h.h}</small>${icTempo(h.t)}<b>${h.temp}°</b><span>${h.chuva}%</span><i>${h.vento} km/h</i></div>`).join('')}</div>` : '';
  const anos = x.anos?.length ? `<h2 class="sec">Este dia nos últimos 10 anos</h2><ol class="tp-anos">${x.anos.map((a) => `<li><b>${a.ano}</b><span class="tp-a-t">${a.max}° / ${a.min}°</span><span class="tp-a-c ${a.mm >= 1 ? 'ch' : ''}">${icGota(a.mm)}${a.mm >= 1 ? String(a.mm).replace('.', ',') + ' mm' : 'sem chuva'}</span><span>${a.vento} km/h</span></li>`).join('')}</ol>
    <p class="tp-expl">Valores medidos (reanálise ERA5) para este local. A previsão hora a hora aparece 5 dias antes.</p>` : '';
  render(`<main class="pag com-nav tempo-pag">${cab('Tempo · Dia ' + dia.day_number, dataLonga(dia.date))}${navD}
    <section class="tp-hero ${x.tipo === 'hist' ? 'hist' : x.t}">${x.tipo === 'hist' ? '' : icTempo(x.t, 'xl')}<div><div class="tp-h-t"><b>${x.max}°</b><i>${x.min}°</i></div><p>${x.tipo === 'hist' ? `Média deste dia nos últimos ${x.nAnos} anos` : TEMPO_TXT[x.t]}${x.local ? ' · ' + esc(x.local) : ''}</p>${etiqueta(x)}</div></section>
    <div class="tp-ests">${stats}</div>${horas}${anos}${nav(origem === 'd' ? 'dia' : 'resumo')}</main>`);
}
function vResumo() {
  const b = S.b; const rk = rankPrincipal(); const info = b.trip.info || {};
  const icTr = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/></svg>';
  const dia = (d) => {
    const { lista } = atividadesDoDia(d); const h = hotelNa(d.date);
    // até 3 locais com foto, pelos mais bem classificados no ranking
    const vistos = new Set();
    const locais = lista.map((a) => ({ a, p: b.photos.find((p) => p.activity_id === a.id && (p.external_url || p.path)) }))
      .filter((x) => x.p && !vistos.has(x.a.wiki_title || x.a.id) && vistos.add(x.a.wiki_title || x.a.id))
      .sort((x, y) => (rk.map[x.a.ext_key] || 99) - (rk.map[y.a.ext_key] || 99)).slice(0, 3)
      .sort((x, y) => (toMin(x.a.start_time) ?? 0) - (toMin(y.a.start_time) ?? 0));
    const trs = lista.filter((a) => a.transport_mode); const princ = trs.filter((a) => fichaT(a)?.scope === 'viagem');
    const tr = (princ.length ? princ : trs.slice(0, 2)).map((a) => `${MODOS[a.transport_mode]} ${a.from_place || ''} → ${a.to_place || ''}`).join(' · ')
      || reservasEm(d.date).map((x) => `${KIND_LABEL[x.kind]} ${x.from_place || ''} → ${x.to_place || ''}`).join(' · ');
    const hotel = h ? `<a class="lin ht" href="#/v/${S.tripId}/hoteis"><span class="ic">${I.cama}</span>${esc(h.name)}</a>`
      : d.date >= b.trip.end_date ? `<div class="lin ht"><span class="ic">${I.cama}</span>Regresso a casa</div>`
      : b.isOwner && hotelPendente(d.date) ? `<a class="lin ht falta" href="#/v/${S.tripId}/hoteis"><span class="ic">${I.cama}</span>${esc(hotelPendente(d.date).name)} · pagamento por fazer</a>`
      : `<a class="lin ht falta" href="#/v/${S.tripId}/hoteis"><span class="ic">${I.cama}</span>Sem hotel reservado</a>`;
    const href = `#/v/${S.tripId}/dia/${d.day_number}`;
    return `<li><a class="rs-num" href="${href}" aria-label="Abrir o dia ${d.day_number}"><small>DIA</small><b>${d.day_number}</b></a>
      <article class="rs-card"><a class="rs-tempo" data-tempo="${d.date}" href="#/v/${S.tripId}/tempo/${d.day_number}" aria-label="Tempo do dia ${d.day_number}"></a><a class="rs-cab" href="${href}"><span class="rs-data">${dataCurta(d.date)}</span><h2>${esc(d.city || '')}</h2><span class="rs-tit">${esc(d.title || '')}</span></a>
      ${locais.length ? `<div class="rs-locs">${locais.map((x) => `<a class="rs-loc" href="#/v/${S.tripId}/a/${x.a.id}"><span class="rs-f" style="background-image:url('${esc(x.p.external_url || '')}'), linear-gradient(160deg, #8FA9BC, #C9A98C 55%, #7E5A44)"></span><span>${esc(x.a.title)}</span></a>`).join('')}</div>`
        : (d.highlights || []).length ? `<p class="rs-dest">${(d.highlights || []).map(esc).join(' · ')}</p>` : ''}
      <div class="rs-rod">${tr ? `<div class="lin tr"><span class="ic">${icTr}</span>${esc(tr)}</div>` : ''}${hotel}</div></article></li>`;
  };
  render(`<main class="pag com-nav resumo-pag">
    ${(() => { const cs = cidadesViagem(); const nl = b.activities.filter((a) => a.lat != null && !a.transport_mode).length; const noitesT = cs.reduce((n, c) => n + c.noites, 0);
      return `<header class="rs-bloco"><div class="rs-cabv"><a class="rs-voltar" href="#/" aria-label="Todas as viagens">${I.voltar}</a>
        <div><h1>${esc(b.trip.title)}</h1><p>${intervalo(b.trip.start_date, b.trip.end_date)} · ${b.days.length} dias</p></div></div>
        <nav class="rs-seg"><a href="#/v/${S.tripId}/mapa">${I.mapa}<b>Mapa</b><small>${nl} locais</small></a>
          <a href="#/v/${S.tripId}/cidades">${I.cidades}<b>Cidades</b><small>${cs.length ? `${cs.length} · ${noitesT} noites` : 'por definir'}</small></a>
          <a href="#/v/${S.tripId}/tempo">${icTempo('solnuvem', 'seg')}<b>Tempo</b><small data-tempo-viagem>…</small></a></nav></header>`; })()}
    ${b.offline ? '<p class="aviso">Sem rede: a mostrar a última cópia guardada.</p>' : ''}
    <ol class="rs-linha">${b.days.map(dia).join('')}</ol>
    ${info.nota_restaurantes ? `<p class="nota">${esc(info.nota_restaurantes)}</p>` : ''}
    ${nav('resumo')}</main>`);
}

// ---------- hotéis ----------
function vHoteis() {
  const b = S.b; const hoje = hojeEm(tz());
  const ativos = b.hotels.filter((h) => h.status !== 'cancelado' && (b.isOwner || h.status === 'pago'));
  const cancelados = b.isOwner ? b.hotels.filter((h) => h.status === 'cancelado') : [];
  const noitesV = []; for (let d = b.trip.start_date; d < b.trip.end_date; d = maisDia(d)) noitesV.push(d);
  const cobre = (h, d) => h.check_in <= d && d < h.check_out;
  const estadoNoite = (d) => { const hs = ativos.filter((h) => cobre(h, d)); return !hs.length ? 'sem' : hs.some((h) => h.status === 'pago') ? 'pago' : 'pend'; };
  // cidade de cada noite: a do dia (no dia de viagem, a cidade de destino)
  // cidade de cada noite: pelas cidades e noites do roteiro (ex.: Amesterdão 3, Bruges 3, Bruxelas 1); se faltar, pela cidade do dia
  const porRoteiro = []; (b.trip.info?.cidades || []).forEach((c) => { for (let k = 0; k < (Number(c.noites) || 0); k++) porRoteiro.push(c.cidade); });
  const cidadeNoite = (d) => { const k = noitesV.indexOf(d); if (porRoteiro.length === noitesV.length && k >= 0) return porRoteiro[k];
    return (b.days.find((x) => x.date === d)?.city || '').split('→').pop().trim(); };
  const agrupar = (ns) => { const out = [];
    for (const d of ns) {
      const hs = ativos.filter((h) => cobre(h, d)); const u = out[out.length - 1];
      if (!hs.length) { if (u && !u.hs.length) u.noites.push(d); else out.push({ hs: [], noites: [d] }); continue; }
      if (u && u.hs.length && hs.some((h) => u.hs.includes(h))) { u.noites.push(d); hs.forEach((h) => { if (!u.hs.includes(h)) u.hs.push(h); }); }
      else out.push({ hs: [...hs], noites: [d] });
    }
    out.forEach((sg) => sg.hs.sort((x, y) => String(x.check_in).localeCompare(String(y.check_in)) || String(x.name).localeCompare(String(y.name))));
    return out; };
  const estadas = [];
  for (const d of noitesV) { const c = cidadeNoite(d); const u = estadas[estadas.length - 1];
    if (u && u.cidade === c) u.noites.push(d); else estadas.push({ cidade: c, noites: [d] }); }
  estadas.forEach((e) => { e.segs = agrupar(e.noites); });
  const fimP = { n: Number(b.trip.end_date.slice(8, 10)), m: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(b.trip.end_date.slice(5, 7)) - 1] };
  const cont = { pago: 0, pend: 0, sem: 0 }; noitesV.forEach((d) => cont[estadoNoite(d)]++);
  const MS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'], WS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const p2 = (d) => { const x = new Date(d + 'T12:00:00Z'); return { n: x.getUTCDate(), m: MS[x.getUTCMonth()], s: WS[x.getUTCDay()] }; };
  const dt = (d) => { const x = p2(d); return `${x.s}, ${x.n} ${x.m}`; };
  const estado = (h) => h.status === 'pago' ? '<span class="hy-est pago">Pago</span>' : '<span class="hy-est pend">Por pagar</span>';
  const fotoDe = (d) => { const dia = b.days.find((x) => x.date === d); const p = dia && fotoDoDia(dia); return p?.external_url || ''; };
  const detalhe = (h) => {
    const tk = bilhetes({ hotel_id: h.id }); const pq = porNoiteQuarto(h);
    const dc = h.cancel_by ? Math.round((new Date(h.cancel_by) - new Date(hoje)) / 86400000) : null;
    const canc = h.cancel_by && h.status !== 'pago' ? (dc < 0 ? `<p class="hx-alerta passou">Cancelamento grátis terminou a ${dataCurta(h.cancel_by)}</p>`
      : `<p class="hx-alerta ${dc <= 14 ? 'perto' : ''}">Cancelamento grátis até ${dataCurta(h.cancel_by)}${dc <= 14 ? ` · faltam ${dc} dia${dc === 1 ? '' : 's'}` : ''}</p>`) : '';
    const linha = (t, v) => v ? `<div><dt>${t}</dt><dd>${v}</dd></div>` : '';
    return `<div class="hx-mais">
      ${canc}
      <dl class="hx-dl">${linha('Check-in', dataCurta(h.check_in) + (h.check_in.slice(0, 4) !== b.trip.start_date.slice(0, 4) ? ' ' + h.check_in.slice(0, 4) : '') + (h.check_in_time ? ' · ' + esc(h.check_in_time) : ''))}${linha('Check-out', dataCurta(h.check_out) + (h.check_out.slice(0, 4) !== b.trip.start_date.slice(0, 4) ? ' ' + h.check_out.slice(0, 4) : '') + (h.check_out_time ? ' · ' + esc(h.check_out_time) : ''))}
        ${linha('Noites', noites(h.check_in, h.check_out))}${linha('Regime', esc(regimeTxt(h.board)))}${linha('Quartos', h.rooms || 1)}
        ${linha('Agência', esc(h.agency || ''))}${linha('Reserva', esc(h.booking_code || ''))}${linha('Telefone', h.phone ? `<a href="tel:${esc(h.phone)}">${esc(h.phone)}</a>` : '')}
        ${b.isOwner ? linha('Valor total', dinheiroD(h.total_price, h.currency)) + linha('Sinal', h.deposit != null ? dinheiroD(h.deposit, h.currency) : '') + linha('Falta pagar', faltaPagar(h) != null ? (h.status === 'pago' ? 'Nada · pago' : dinheiroD(faltaPagar(h), h.currency)) : '') + linha('Por noite e quarto', pq != null ? dinheiroD(pq, h.currency) : '') + linha(h.status === 'pago' ? 'Pago a' : 'Pagamento', h.payment_date ? dataCurta(h.payment_date) : '') : ''}</dl>
      ${h.address || linguaViagem() ? `<div class="maps-l">${h.address ? `<a class="b-maps peq" href="${esc(mapsPlaceLink({ maps_url: h.maps_url, maps_query: [h.name, h.address].filter(Boolean).join(', ') }))}" target="_blank" rel="noopener">${I.maps}${esc(h.address)}</a>` : '<span></span>'}${linguaViagem() ? `<button class="b-local ${h.local_name && !h.local_ok ? 'por-ver' : ''}" data-act="local" data-tab="hotels" data-id="${h.id}" aria-label="Nome e morada na língua local" title="Na língua local">文A</button>` : ''}</div>` : ''}
      ${h.notes ? `<p class="hx-notas">${esc(h.notes)}</p>` : ''}
      ${documentos(tk, 'hotel_id', h.id)}
      ${b.isOwner ? `<div class="hx-acoes">${h.status !== 'pago' ? `<button class="b-pri b-peq" data-act="hotel-pago" data-id="${h.id}">✓ Pagamento efetuado</button><button class="b-sec b-peq" data-act="hotel-cancelar" data-id="${h.id}">Cancelar reserva</button>` : ''}<button class="b-link" data-act="hotel" data-id="${h.id}">Editar</button></div>` : ''}
    </div>`;
  };
  const cartao = (h) => { const ft = fotoDe(h.check_in < b.trip.start_date ? b.trip.start_date : h.check_in);
    const mapa = `<a class="hgc-mapa" href="${esc(mapsPlaceLink({ maps_url: h.maps_url, maps_query: [h.name, h.address || h.city].filter(Boolean).join(', ') }))}" target="_blank" rel="noopener" aria-label="Ver ${esc(h.name)} no Google Maps">${I.maps}Mapa</a>`;
    const pago = h.status === 'pago';
    const c1 = b.isOwner && h.total_price != null ? (pago ? `<span class="hgc-c"><small>Total</small>${dinheiroD(h.total_price, h.currency)}</span>` : `<span class="hgc-c"><small>Sinal</small>${dinheiroD(h.deposit || 0, h.currency)}</span>`) : '';
    const c2 = pago ? '<span class="hgc-c hgc-pago"><small>Estado</small>Pago</span>'
      : `<span class="hgc-c hgc-falta"><small>Falta</small>${b.isOwner && faltaPagar(h) != null ? dinheiroD(faltaPagar(h), h.currency) : 'Por pagar'}</span>`;
    return `<details class="hy-card hgc ${pago ? 'pago' : 'pend'}">
      <summary><span class="hgc-tt"><span class="hgc-foto" style="${ft ? `background-image:url('${esc(ft)}')` : ''}" aria-hidden="true"></span>
          <span class="hgc-nm"><span class="hy-nome">${esc(h.name)}</span></span><span class="hgc-seta" aria-hidden="true">${I.seg}</span></span>
        <span class="hgc-gr ${c1 ? '' : 'duas'}">${c1}${c2}${mapa}</span>
      </summary>${detalhe(h)}</details>`; };

  const bloco = (sg, comMarca = true, cidadeE = '') => {
    const n = sg.noites.length, ini = sg.noites[0], fim = maisDia(sg.noites[n - 1]); const x = p2(ini), y = p2(fim);
    const intervalo = x.m === y.m ? `${x.n} a ${y.n} ${y.m}` : `${x.n} ${x.m} a ${y.n} ${y.m}`;
    const marca = comMarca ? `<div class="hy-marca"><span class="hy-ponto"></span><span class="hy-md">${intervalo}</span><span class="hy-mw">${n} noite${n === 1 ? '' : 's'}</span></div>` : '';
    if (!sg.hs.length) {
      const cidade = cidadeE || cidadeNoite(ini);
      return `<li class="hy-bloco semh">${marca}<div class="hy-grupo"><div class="hy-card hy-sem hgc">
        <div class="hy-sum"><span class="hgc-tt"><span class="hgc-foto hgc-foto-sem" aria-hidden="true">${I.cama}</span>
          <span class="hgc-nm"><span class="hy-nome">Sem hotel reservado</span><span class="hgc-sub">${intervalo} · ${n} noite${n === 1 ? '' : 's'}</span></span></span>
          ${b.isOwner ? `<span class="hgc-gr so-mapa"><button class="hgc-add" data-act="hotel-novo" data-in="${ini}" data-out="${fim}" data-cidade="${esc(cidade)}">${I.mais} Adicionar hotel</button></span>` : ''}</div></div></div></li>`;
    }
    const temPago = sg.hs.some((h) => h.status === 'pago');
    return `<li class="hy-bloco ${temPago ? 'pago' : 'pend'}">${marca}<div class="hy-grupo">
      ${sg.hs.map(cartao).join('')}</div></li>`;
  };
  const fora = ativos.filter((h) => !noitesV.some((d) => cobre(h, d)));
  render(`<main class="pag com-nav hoteis-pag">
    <header class="cab-pag"><div><h1>Hotéis</h1><p>${esc(b.trip.title)}</p></div>${b.isOwner ? `<button class="b-pri b-peq" data-act="hotel">${I.mais} Adicionar</button>` : ''}</header>
    <section class="hy-resumo" aria-label="Noites da viagem">
      <div class="hy-r1"><strong>${noitesV.length} noites</strong><span>${p2(b.trip.start_date).n} ${p2(b.trip.start_date).m} → ${fimP.n} ${fimP.m}</span></div>
      <div class="hy-barra">${noitesV.map((d) => { const x = p2(d), e = estadoNoite(d); return `<span class="hy-seg ${e}" title="${dataCurta(d)}"><i></i><small>${x.n}</small></span>`; }).join('')}</div>
      <div class="hy-leg"><span><i class="pago"></i>${cont.pago} paga${cont.pago === 1 ? '' : 's'}</span>${b.isOwner ? `<span><i class="pend"></i>${cont.pend} por pagar</span>` : ''}<span><i class="sem"></i>${cont.sem} sem hotel</span></div>
    </section>
    <h2 class="hy-sec">Estadias</h2>
    <ol class="hc-linha">${estadas.map((e) => { const n = e.noites.length, x = p2(e.noites[0]), y = p2(maisDia(e.noites[n - 1]));
      const iv = x.m === y.m ? `${x.n} a ${y.n} ${y.m}` : `${x.n} ${x.m} a ${y.n} ${y.m}`;
      const st = e.segs.every((sg) => sg.hs.some((h) => h.status === 'pago')) ? 'pago' : e.segs.some((sg) => !sg.hs.length) ? 'semh' : 'pend';
      return `<li class="hc-cidade ${st}"><div class="hc-cab"><span class="hc-ponto" aria-hidden="true"></span><h3>${esc(e.cidade || 'Sem cidade definida')}</h3><span class="hc-iv">${iv} · ${n} noite${n === 1 ? '' : 's'}</span></div>
        <ol class="hc-sub">${e.segs.map((sg) => bloco(sg, e.segs.length > 1, e.cidade)).join('')}</ol></li>`; }).join('')}
      <li class="hc-cidade fim"><div class="hc-cab"><span class="hc-ponto" aria-hidden="true"></span><span class="hc-fim">Fim da viagem · ${fimP.n} ${fimP.m}</span></div></li></ol>
    ${fora.length ? `<h2 class="hy-sec hy-sec-pag">Fora das datas da viagem</h2><div class="hy-grupo">${fora.map((h) => { const n = noites(h.check_in, h.check_out);
      return `<div class="hy-marca hy-marca-fora"><span class="hy-md">${dataCurta(h.check_in)} ${h.check_in.slice(0, 4)} a ${dataCurta(h.check_out)} ${h.check_out.slice(0, 4)}</span><span class="hy-mw">${n} noite${n === 1 ? '' : 's'}</span></div>${cartao(h)}`; }).join('')}</div>` : ''}
    ${b.isOwner && ativos.length ? (() => {
      const dias = (d) => Math.round((new Date(d) - new Date(hoje)) / 86400000);
      const MSx = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const por = ativos.filter((h) => h.status !== 'pago').sort((x, y) => (x.payment_date || '9999').localeCompare(y.payment_date || '9999'));
      const pagos = ativos.filter((h) => h.status === 'pago');
      const linha = (h) => { const d = h.payment_date; const n = d ? dias(d) : null;
        const est = n == null ? '' : n < 0 ? 'passou' : n <= 14 ? 'perto' : '';
        const nota = n == null ? 'sem data' : n < 0 ? `há ${-n} dia${n === -1 ? '' : 's'}` : n === 0 ? 'hoje' : `em ${n} dia${n === 1 ? '' : 's'}`;
        const canc = h.cancel_by ? `Cancela até ${Number(h.cancel_by.slice(8, 10))} ${MSx[Number(h.cancel_by.slice(5, 7)) - 1]}` : 'Sem data de cancelamento';
        return `<li class="hz-l ${est}"><span class="hz-d">${d ? `<b>${Number(d.slice(8, 10))} ${MSx[Number(d.slice(5, 7)) - 1]}</b>` : '<b>—</b>'}<small>${nota}</small></span>
          <span class="hz-m"><strong>${esc(h.name)}</strong><small>${canc}</small></span>
          <span class="hz-v">${faltaPagar(h) != null ? dinheiroD(faltaPagar(h), h.currency) : '—'}</span></li>`; };
      return `<h2 class="hy-sec hy-sec-pag">Pagamentos${por.length ? `<span>${por.length} por fazer</span>` : ''}</h2><section class="hz" aria-label="Pagamentos">
        ${por.length ? `<ol class="hz-lista">${por.map(linha).join('')}</ol>` : '<p class="hz-ok">Todos os hotéis estão pagos.</p>'}
        ${pagos.length ? `<details class="hz-pagos"><summary>Já pagos (${pagos.length})</summary><ul>${pagos.map((h) => `<li><span>${esc(h.name)}</span><span>${h.total_price != null ? dinheiroD(h.total_price, h.currency) : ''}</span></li>`).join('')}</ul></details>` : ''}
      </section>`;
    })() : ''}
    ${cancelados.length ? `<details class="ht-canc"><summary>Reservas canceladas (${cancelados.length})</summary>${cancelados.map((h) => `<div class="ht-canc-i"><span><strong>${esc(h.name)}</strong> · ${dataCurta(h.check_in)} → ${dataCurta(h.check_out)}</span><span><button class="b-link" data-act="hotel" data-id="${h.id}">Ver</button></span></div>`).join('')}</details>` : ''}
    ${nav('hoteis')}</main>`);
}
const maisDia = (d) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
const TIPOS_DOC = [['bilhete', 'Bilhete'], ['embarque', 'Cartão de embarque'], ['reserva', 'Reserva / confirmação'], ['pagamento', 'Comprovativo de pagamento'], ['fatura', 'Fatura'], ['seguro', 'Seguro'], ['outro', 'Outro']];
const tipoDoc = (k) => (TIPOS_DOC.find(([v]) => v === k) || TIPOS_DOC[0])[1];
function documentos(tk, campoId, id) {
  const b = S.b;
  return `<div class="tk-grid">${tk.map((t) => { const quem = membro(t.member_id)?.display_name;
    return `<span class="tk-w"><button class="tk tk-doc ${t.doc_type || 'bilhete'}" data-act="ver-bilhete" data-path="${esc(t.path)}">${I.qr}<span class="tk-tx"><b>${esc(t.label || tipoDoc(t.doc_type))}</b><small>${esc(tipoDoc(t.doc_type))}${quem ? ' · ' + esc(quem) : ''}</small></span></button>${b.isOwner ? `<button class="tk-ed" data-act="editar-doc" data-id="${t.id}" aria-label="Mudar nome">✎</button><button class="tk-x" data-act="apagar-bilhete" data-id="${t.id}" data-path="${esc(t.path)}" aria-label="Apagar">✕</button>` : ''}</span>`; }).join('')}
    ${b.isOwner ? `<button class="tk tk-falta" data-act="escolher-membro" data-campo="${campoId}" data-id="${id}">${I.mais}Juntar documento</button>` : ''}</div>`;
}

// ---------- cidades: noites em cada cidade (do roteiro: info.cidades, por ordem) ----------
const CORES_CID = ['#D9A441', '#5B9BD5', '#5DB38A', '#B77FC0', '#E07B5F', '#4FB3BF', '#C9A227', '#8C9EAF'];
function cidadesViagem() {
  const b = S.b; const lista = b.trip.info?.cidades || []; let k = 0;
  return lista.map((c, i) => { const ini = isoMais(b.trip.start_date, k); k += Number(c.noites) || 0; const fim = isoMais(b.trip.start_date, k);
    return { nome: c.cidade, noites: Number(c.noites) || 0, ini, fim, cor: CORES_CID[i % CORES_CID.length], dias: b.days.filter((d) => d.date >= ini && d.date <= fim) }; });
}
function anelCidades(cs, tam = 168, esp = 18) {
  const r = (tam - esp) / 2, c = 2 * Math.PI * r, tot = cs.reduce((n, x) => n + x.noites, 0) || 1; let a = -90;
  return `<svg class="anel" viewBox="0 0 ${tam} ${tam}" width="${tam}" height="${tam}" aria-hidden="true">${cs.map((x) => { const l = c * x.noites / tot; const o = `<circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="${x.cor}" stroke-width="${esp}" stroke-dasharray="${Math.max(0, l - 3)} ${c - l + 3}" transform="rotate(${a} ${tam / 2} ${tam / 2})"/>`; a += 360 * x.noites / tot; return o; }).join('')}</svg>`;
}
function vCidades() {
  const b = S.b; const cs = cidadesViagem(); const tot = cs.reduce((n, x) => n + x.noites, 0);
  const cartao = (x) => { const h = hotelNa(x.ini);
    return `<article class="cd-c" style="--cor:${x.cor}"><div class="cd-t"><span class="cd-pt"></span><h2>${esc(x.nome)}</h2><span class="cd-n"><b>${x.noites}</b> noite${x.noites === 1 ? '' : 's'}</span></div>
      <p class="cd-dt">${intervalo(x.ini, x.fim)}</p>
      <div class="cd-bar"><i style="width:${tot ? (x.noites / tot) * 100 : 0}%"></i></div>
      ${h ? `<a class="cd-h" href="#/v/${S.tripId}/hoteis">${I.cama}<span>${esc(h.name)}</span></a>` : ''}
      <div class="cd-dias">${x.dias.map((d) => `<a href="#/v/${S.tripId}/dia/${d.day_number}"><small>Dia</small><b>${d.day_number}</b><span>${dataCurta(d.date)}</span></a>`).join('')}</div></article>`; };
  render(`<main class="pag com-nav cd-pag"><header class="mp-cab"><a class="b-ic" href="#/v/${S.tripId}/resumo" aria-label="Voltar">${I.voltar}</a><div><h1>Cidades</h1><p>${esc(b.trip.title)}</p></div></header>
    ${cs.length ? `<section class="cd-topo">${anelCidades(cs)}<div class="cd-meio"><b>${cs.length}</b><span>cidade${cs.length === 1 ? '' : 's'}</span><small>${tot} noites</small></div></section>
      <div class="cd-leg">${cs.map((x) => `<span><i style="background:${x.cor}"></i>${esc(x.nome)} ${x.noites}</span>`).join('')}</div>
      <div class="cd-lista">${cs.map(cartao).join('')}</div>` : '<p class="vazio">O roteiro desta viagem ainda não indica as noites em cada cidade.</p>'}
    ${nav('resumo')}</main>`);
}

// ---------- transportes ----------
function vTransportes() {
  const b = S.b; const tips = b.sections.find((s) => s.kind === 'transport_tips');
  // cada transporte existe uma vez: a deslocação do dia (com a sua ficha) ou uma reserva acrescentada à mão
  const grupos = b.days.map((d) => {
    const { lista } = atividadesDoDia(d);
    const its = lista.filter((a) => a.transport_mode).map((a) => ({ a, f: fichaT(a), h: a.start_time }))
      .concat(reservasEm(d.date).map((x) => ({ f: x, h: x.depart_time, manual: true })))
      .sort((x, y) => (toMin(x.h) ?? 9999) - (toMin(y.h) ?? 9999));
    return { d, its };
  }).filter((g) => g.its.length);
  const orfas = b.bookings.filter((x) => x.kind !== 'activity' && x.activity_ext_key && !b.activities.some((a) => a.ext_key === x.activity_ext_key));
  const nViag = grupos.reduce((n, g) => n + g.its.length, 0), nVoos = grupos.reduce((n, g) => n + g.its.filter((i) => (i.a?.transport_mode || '') === 'aviao' || i.f?.kind === 'flight').length, 0);
  const cartao = (it) => {
    const a = it.a || {}, f = it.f || {}; const m = a.transport_mode || ({ flight: 'aviao', train: 'comboio', bus: 'autocarro', boat: 'barco', transfer: 'taxi', car: 'taxi' })[f.kind] || 'comboio';
    const de = a.from_place || f.from_place || '', para = a.to_place || f.to_place || '';
    const lg = m === 'aviao' && (f.legs || []).length ? f.legs : null;
    const hIni = lg?.[0]?.partida || hhmm(a.start_time || f.depart_time), hFim = lg?.[lg.length - 1]?.chegada || hhmm(a.arrive_time || f.arrive_time);
    const cia = lg ? [...new Set(lg.map((t) => t.companhia).filter(Boolean))].join(' / ') : f.carrier;
    const alvo = f.id ? `data-act="ficha-transporte" data-id="${f.id}"` : '';
    if (f.scope !== 'viagem' && !it.manual) return `<button class="tr-loc" ${alvo}>${icT(m, 'p')}<span class="tr-loc-t"><b>${hIni}</b> ${esc(de)} → ${esc(para)}<small>${esc(f.carrier || MODOS[m])}</small></span>${estT(f.status)}</button>`;
    const ntk = bilhetes({ booking_id: f.id }).length;
    const grelhaT = f.status === 'pago'
      ? `<div class="tr-gr"><span><small>Total</small>${f.total_price != null ? dinheiroD(f.total_price, f.currency) : '—'}</span><span><small>Estado</small><b class="ok">Pago</b></span><span class="tr-bil"><small>Bilhetes</small>${ntk}/${pessoas().length}</span></div>`
      : f.status === 'por_comprar'
        ? `<div class="tr-gr"><span><small>Valor</small>${f.total_price != null ? dinheiroD(f.total_price, f.currency) : '—'}</span><span><small>Estado</small><b class="f">Por comprar</b></span>${f.vendor_url ? `<a class="tr-comprar" href="${esc(f.vendor_url)}" target="_blank" rel="noopener">${I.link || ''}Comprar</a>` : '<span><small>Bilhetes</small>—</span>'}</div>`
        : `<div class="tr-gr um"><span><small>${EST_T[f.status]}</small>${esc(f.notes || '')}</span></div>`;
    const linha2 = m === 'aviao'
      ? `<span class="vt"><span><small>Voo</small><b>${esc(f.number || '—')}</b></span><span><small>Terminal</small><b>${esc(f.terminal || '—')}</b></span>${f.legs?.[0]?.aviao ? `<span><small>Avião</small><b>${esc(f.legs[0].aviao)}</b></span>` : ''}${f.booking_code ? `<span><small>Reserva</small><b>${esc(f.booking_code)}</b></span>` : ''}</span>`
      : f.number || f.booking_code ? `<span class="vt">${f.number ? `<span><small>${m === 'comboio' ? 'Comboio' : 'Número'}</small><b>${esc(f.number)}</b></span>` : ''}${f.booking_code ? `<span><small>Reserva</small><b>${esc(f.booking_code)}</b></span>` : ''}</span>` : `<span class="meta">${esc(MODOS[m])}</span>`;
    return `<article class="tr-pass"><button class="tr-p1" ${alvo}><span class="cid ${a.from_code ? '' : 'nome'}"><b>${esc(a.from_code || de)}</b>${a.from_code ? `<span>${esc(de)}</span>` : ''}<span>${hIni}</span></span>
      <span class="mid">${icT(m)}<span class="tr-tr"></span><span>${esc(cia || '')}</span></span>
      <span class="cid d ${a.to_code ? '' : 'nome'}"><b>${esc(a.to_code || para)}</b>${a.to_code ? `<span>${esc(para)}</span>` : ''}<span>${hFim}</span></span></button>
      <div class="tr-cut"></div>${m === 'aviao' && (f.legs || []).length > 1 ? `<div class="tr-legs"><p class="tr-esc">${esc(escalaTxt(f.legs))}</p>${f.legs.map((t, i) => `<div class="tr-leg"><span class="n">${i + 1}</span><span class="r"><b>${esc(t.de)} ${esc(t.partida)} → ${esc(t.para)} ${esc(t.chegada)}</b><small>${[t.voo, t.companhia, t.terminal ? 'Terminal ' + t.terminal : '', t.aviao].filter(Boolean).map(esc).join(' · ')}</small></span></div>`).join('')}</div><div class="tr-p2">${f.booking_code ? `<span class="vt"><span><small>Reserva</small><b>${esc(f.booking_code)}</b></span></span>` : '<span></span>'}${estT(f.status)}</div>` : `<div class="tr-p2">${linha2}${estT(f.status)}</div>`}${grelhaT}</article>`;
  };
  render(`<main class="pag com-nav tr-pag"><header class="cab-pag"><div><h1>Transportes</h1><p>${esc(b.trip.title)} · ${nViag} trajetos${nVoos ? ` · ${nVoos} voo${nVoos > 1 ? 's' : ''}` : ''}</p></div>${b.isOwner ? `<button class="b-pri b-peq" data-act="reserva">${I.mais} Adicionar</button>` : ''}</header>
    ${grupos.map(({ d, its }) => `<section class="tr-bloco"><a class="tr-dia" href="#/v/${S.tripId}/dia/${d.day_number}"><span class="num">${d.day_number}</span><span class="dt"><b>Dia ${d.day_number} · ${dataLonga(d.date)}</b><small>${esc(d.city || '')}</small></span>${I.seg}</a>
      <div class="tr-itens">${its.map(cartao).join('')}</div></section>`).join('') || `<p class="vazio">Ainda não há transportes nesta viagem.</p>`}
    ${b.isOwner && orfas.length ? `<h2 class="sec">Já não estão no roteiro</h2><div class="tr-itens">${orfas.map((f) => `<button class="tr-loc" data-act="ficha-transporte" data-id="${f.id}">${icT('comboio', 'p')}<span class="tr-loc-t">${esc([f.from_place, f.to_place].filter(Boolean).join(' → ') || f.carrier || 'Transporte')}<small>Tem dados teus: decide se apagas</small></span>${estT(f.status)}</button>`).join('')}</div>` : ''}
    ${tips ? (() => { const gs = []; tips.content.forEach((c) => { const g = c.g || 'Geral'; let x = gs.find((y) => y.g === g); if (!x) gs.push(x = { g, it: [] }); x.it.push(c); });
      return `<h2 class="sec tr-dicas-t">${esc(tips.title)}</h2><div class="tr-dicas">${gs.map((x) => `<details class="caixa dobra"><summary class="cx-h"><h2>${esc(x.g)}</h2><span class="ok" aria-label="${x.it.length} dicas">${x.it.length}</span></summary>
        <ul class="dicas-l">${x.it.map((c) => `<li><strong>${esc(c.t)}</strong><span>${esc(c.d)}</span></li>`).join('')}</ul></details>`).join('')}</div>`; })() : ''}
    ${nav('transportes')}</main>`);
}
// ficha de um transporte: o que se vê e, para o dono, o que se preenche
// voos com escala: cada trecho tem partida, chegada, n.º de voo, companhia, terminal e avião
const CAMPOS_TRECHO = ['de', 'para', 'data', 'partida', 'chegada', 'voo', 'companhia', 'terminal', 'aviao'];
function trechosVoo(f, a, day) {
  if (Array.isArray(f.legs) && f.legs.length) return f.legs;
  return [{ de: a.from_code || a.from_place || '', para: a.to_code || a.to_place || '', data: day?.date || '', partida: hhmm(a.start_time) || '', chegada: hhmm(a.arrive_time) || '', voo: f.number || '', companhia: f.carrier || '', terminal: f.terminal || '', aviao: '' }];
}
const formTrecho = (t, i) => `<fieldset class="trecho" data-i="${i}"><legend>Voo ${i + 1}${i ? `<button type="button" class="trecho-x" data-tirar-trecho aria-label="Tirar este voo">✕</button>` : ''}</legend>
  <div class="duas">${campo(`t${i}_de`, 'De (aeroporto)', t.de, 'text', 'placeholder="LIS"')}${campo(`t${i}_para`, 'Para (aeroporto)', t.para, 'text', 'placeholder="AMS"')}</div>
  <div class="tres">${campo(`t${i}_data`, 'Data', t.data, 'date')}${campo(`t${i}_partida`, 'Partida', t.partida, 'time')}${campo(`t${i}_chegada`, 'Chegada', t.chegada, 'time')}</div>
  <div class="duas">${campo(`t${i}_voo`, 'N.º do voo', t.voo, 'text', 'placeholder="TP 662"')}${campo(`t${i}_companhia`, 'Companhia aérea', t.companhia)}</div>
  <div class="duas">${campo(`t${i}_terminal`, 'Terminal de partida', t.terminal)}${campo(`t${i}_aviao`, 'Avião (modelo)', t.aviao, 'text', 'placeholder="Airbus A320"')}</div></fieldset>`;
function lerTrechos(v) {
  const out = []; for (let i = 0; i < 6; i++) { if (!(`t${i}_de` in v)) continue; const t = {}; CAMPOS_TRECHO.forEach((k) => { t[k] = (v[`t${i}_${k}`] || '').trim(); delete v[`t${i}_${k}`]; }); if (Object.values(t).some(Boolean)) out.push(t); }
  return out;
}
const escalaTxt = (legs) => legs.length > 1 ? `${legs.length - 1} escala${legs.length > 2 ? 's' : ''}: ${legs.slice(0, -1).map((t) => t.para).join(', ')}` : 'Direto';

function fichaTransporte(id) {
  const b = S.b; const f = b.bookings.find((x) => x.id === id); if (!f) return;
  const a = b.activities.find((x) => x.ext_key === f.activity_ext_key) || {};
  const day = b.days.find((d) => d.id === a.day_id);
  const m = a.transport_mode || 'comboio';
  const titulo = `${MODOS[m] || 'Transporte'} ${a.from_place || f.from_place || ''} → ${a.to_place || f.to_place || ''}`;
  const tk = bilhetes({ booking_id: f.id });
  if (!b.isOwner) {
    const w = document.createElement('div'); w.className = 'folha-fundo';
    w.innerHTML = `<div class="folha" role="dialog" aria-modal="true" aria-label="${esc(titulo)}"><div class="folha-top"><h2>${esc(titulo)}</h2><button class="b-ic" data-fechar aria-label="Fechar">✕</button></div>
      <dl class="dados">${day ? `<dt>Dia</dt><dd>Dia ${day.day_number} · ${dataLonga(day.date)}</dd>` : ''}<dt>Hora</dt><dd>${hhmm(a.start_time)}${a.arrive_time ? ' → ' + hhmm(a.arrive_time) : ''}</dd>${m === 'aviao' && (f.legs || []).length ? `<dt>Voos</dt><dd>${f.legs.map((t) => `${esc(t.voo)} · ${esc(t.de)} ${esc(t.partida)} → ${esc(t.para)} ${esc(t.chegada)}${t.companhia ? ' · ' + esc(t.companhia) : ''}${t.terminal ? ' · T ' + esc(t.terminal) : ''}${t.aviao ? ' · ' + esc(t.aviao) : ''}`).join('<br>')}</dd>` : ''}${f.carrier ? `<dt>${m === 'aviao' ? 'Companhia aérea' : 'Empresa'}</dt><dd>${esc(f.carrier)}</dd>` : ''}${f.number ? `<dt>${m === 'aviao' ? 'Voo' : 'Número'}</dt><dd>${esc(f.number)}</dd>` : ''}${f.terminal ? `<dt>Terminal</dt><dd>${esc(f.terminal)}</dd>` : ''}${f.booking_code ? `<dt>N.º de reserva</dt><dd>${esc(f.booking_code)}</dd>` : ''}${f.vendor ? `<dt>Empresa vendedora</dt><dd>${esc(f.vendor)}</dd>` : ''}<dt>Estado</dt><dd>${EST_T[f.status]}</dd>${f.total_price != null ? `<dt>Valor</dt><dd>${dinheiroD(f.total_price, f.currency)}</dd>` : ''}</dl>
      ${f.notes ? `<p>${esc(f.notes)}</p>` : ''}${documentos(tk, 'booking_id', f.id)}</div>`;
    document.body.appendChild(w); w.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) w.remove(); }); return;
  }
  folha(titulo,
    `${day ? `<p class="meta">Dia ${day.day_number} · ${dataLonga(day.date)} · ${hhmm(a.start_time)}${a.arrive_time ? ' → ' + hhmm(a.arrive_time) : ''}</p>` : ''}`
    + escolha('status', 'Estado', Object.entries(EST_T), f.status)
    + (m === 'aviao'
      ? `<p class="form-sec">Voos</p><div class="trechos">${trechosVoo(f, a, day).map(formTrecho).join('')}</div><button type="button" class="b-sec b-larga trecho-mais" data-mais-trecho>${I.mais} Acrescentar voo (escala)</button><p class="form-sec">Reserva e pagamento</p>` + campo('booking_code', 'N.º de reserva', f.booking_code)
      : `<div class="duas">${campo('carrier', 'Empresa', f.carrier)}${campo('number', 'N.º (comboio, linha)', f.number)}</div>` + campo('booking_code', 'N.º de reserva', f.booking_code))
    + campo('vendor', 'Empresa vendedora', f.vendor, 'text', `placeholder="${m === 'aviao' ? 'ex.: TAP, eDreams, agência de viagens' : 'ex.: NS, SNCB, Trainline'}"`)
    + campoValor('total_price', 'Valor total', f.total_price) + campo('payment_date', 'Data de pagamento', f.payment_date, 'date')
    + campo('vendor_url', 'Ligação para a empresa vendedora', f.vendor_url, 'url', 'placeholder="https://"') + (m === 'aviao' ? '' : campo('seats', 'Lugares', f.seats)) + area('notes', 'Notas', f.notes)
    + `<div class="campo"><span>Bilhetes e documentos</span>${documentos(tk, 'booking_id', f.id)}</div>`
    + (!f.activity_ext_key || !a.id ? '<button type="button" class="b-perigo" data-apagar>Apagar este transporte</button>' : ''),
  async (v) => { v.total_price = v.total_price === '' ? null : Number(v.total_price); v.deposit = null; if (!v.payment_date) v.payment_date = null;
    if (m === 'aviao') { const legs = lerTrechos(v); v.legs = legs; if (legs.length) { v.carrier = legs[0].companhia || null; v.number = legs.map((t) => t.voo).filter(Boolean).join(' + ') || null; v.terminal = legs[0].terminal || null; } }
    v.paid_at = v.status === 'pago' ? (f.paid_at || new Date().toISOString()) : null;
    v.currency = 'EUR'; await op(sb.from('bookings').update(v).eq('id', id), 'Transporte guardado.'); });
  ligarApagar('bookings', id, 'Apagar este transporte e os bilhetes associados?');
  if (m === 'aviao') { const form = document.querySelector('.folha form'); const cx = form.querySelector('.trechos');
    form.querySelector('[data-mais-trecho]').addEventListener('click', () => { const ns = [...cx.querySelectorAll('.trecho')].map((x) => Number(x.dataset.i)); const i = ns.length ? Math.max(...ns) + 1 : 0; if (i > 5) return;
      const ant = cx.querySelector('.trecho:last-of-type'); const prev = ant ? { de: ant.querySelector(`[name$="_para"]`).value, data: ant.querySelector(`[name$="_data"]`).value, companhia: ant.querySelector(`[name$="_companhia"]`).value } : {};
      cx.insertAdjacentHTML('beforeend', formTrecho({ de: prev.de || '', para: '', data: prev.data || '', partida: '', chegada: '', voo: '', companhia: prev.companhia || '', terminal: '', aviao: '' }, i)); });
    cx.addEventListener('click', (e) => { if (e.target.closest('[data-tirar-trecho]')) e.target.closest('.trecho').remove(); }); }
}

// preço de uma visita, excursão ou entrada (na moeda em que se paga; por omissão, a moeda do país)
function fichaPreco(actId) {
  const b = S.b; const a = b.activities.find((x) => x.id === actId); if (!a) return;
  const f = fichaT(a) || {};
  folha('Preço · ' + a.title,
    escolha('status', 'Estado', Object.entries(EST_T), f.status || 'por_comprar')
    + campoValor('total_price', 'Valor total', f.total_price) + campoValor('deposit', 'Sinal pago', f.deposit) + campo('payment_date', 'Data de pagamento', f.payment_date, 'date')
    + `<div class="duas">${campo('carrier', 'Empresa / bilheteira', f.carrier)}${campo('booking_code', 'N.º de reserva', f.booking_code)}</div>`
    + campo('vendor_url', 'Ligação para comprar', f.vendor_url, 'url', 'placeholder="https://"') + area('notes', 'Notas', f.notes),
  async (v) => { ['total_price', 'deposit'].forEach((k) => { v[k] = v[k] === '' ? null : Number(v[k]); }); if (!v.payment_date) v.payment_date = null;
    v.paid_at = v.status === 'pago' ? (f.paid_at || new Date().toISOString()) : null; v.currency = 'EUR';
    if (f.id) await op(sb.from('bookings').update(v).eq('id', f.id), 'Preço guardado.');
    else await op(sb.from('bookings').insert({ ...v, trip_id: S.tripId, kind: 'activity', scope: 'local', title: a.title, activity_ext_key: a.ext_key }), 'Preço guardado.'); });
}

// ---------- mapa (só pontos; cada ponto abre o Google Maps no local) ----------
const CORES_DIA = ['#2F6DB5', '#D9822B', '#2E8B57', '#8E44AD', '#C0392B', '#16A085', '#B7950B', '#D35400', '#5D6D7E', '#E84393', '#00838F', '#6D4C41'];
const corDia = (n) => CORES_DIA[(n - 1) % CORES_DIA.length];
function carregarLeaflet() {
  if (window.L) return Promise.resolve();
  if (!document.querySelector('link[data-leaflet]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.leaflet = '1'; l.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(l); }
  return new Promise((ok, falha) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; sc.onload = ok; sc.onerror = falha; document.head.appendChild(sc); });
}
async function vMapa(n) {
  const b = S.b; const umDia = n ? b.days.find((d) => d.day_number === Number(n)) : null;
  const dias = umDia ? [umDia] : b.days;
  const pontos = [];
  dias.forEach((d) => { const vistos = new Set();
    atividadesDoDia(d).lista.filter((a) => a.lat != null && a.lng != null && !a.transport_mode && ['visit', 'walk', 'free'].includes(a.kind))
      .forEach((a) => { const k = a.lat.toFixed(4) + ',' + a.lng.toFixed(4); if (vistos.has(k)) return; vistos.add(k); pontos.push({ a, d }); }); });
  const hoteis = b.hotels.filter((h) => h.lat != null && h.status !== 'cancelado' && (b.isOwner || h.status === 'pago') && dias.some((d) => h.check_in <= d.date && d.date < h.check_out));
  const voltar = umDia ? `#/v/${S.tripId}/dia/${umDia.day_number}` : `#/v/${S.tripId}/resumo`;
  render(`<main class="mapa-pag ${umDia ? 'um-dia' : ''}"><header class="mp-cab"><a class="b-ic" href="${voltar}" aria-label="Voltar">${I.voltar}</a>
      <div><h1>${umDia ? `Mapa do dia ${umDia.day_number}` : 'Mapa da viagem'}</h1><p>${umDia ? `${esc(umDia.city || '')} · ${dataLonga(umDia.date)}` : `${esc(b.trip.title)} · ${pontos.length} locais`}</p></div></header>
    ${!umDia ? `<div class="mp-leg" role="group" aria-label="Mostrar dias">${b.days.filter((d) => pontos.some((p) => p.d.id === d.id)).map((d) => `<button class="mp-chip on" data-act="mapa-dia" data-n="${d.day_number}" aria-pressed="true"><span style="background:${corDia(d.day_number)}"></span>Dia ${d.day_number}</button>`).join('')}</div>` : ''}
    <div id="mapa" class="mp-mapa" aria-label="Mapa"></div>
    ${pontos.length ? '' : '<p class="vazio mp-vazio">Ainda não há locais com localização.</p>'}
    ${nav(umDia ? 'dia' : 'resumo')}</main>`);
  try { await carregarLeaflet(); } catch { document.getElementById('mapa').innerHTML = '<p class="vazio">Não foi possível carregar o mapa. Verifica a ligação à rede.</p>'; return; }
  const L = window.L; const el = document.getElementById('mapa'); if (!el) return;
  const mapa = L.map(el, { zoomControl: true, attributionControl: true });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>' }).addTo(mapa);
  const grupos = {}; const todos = [];
  pontos.forEach(({ a, d }, i) => {
    const cor = corDia(d.day_number); const rot = umDia ? i + 1 : d.day_number;
    const m = L.marker([a.lat, a.lng], { icon: L.divIcon({ className: 'mp-pin', html: `<span style="background:${cor}">${rot}</span>`, iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14] }), title: a.title })
      .bindPopup(`<div class="mp-pop"><b>${esc(a.title)}</b><small>Dia ${d.day_number}${a.start_time ? ' · ' + hhmm(a.start_time) : ''}</small>
        <a class="mp-gm" href="${esc(mapsPlaceLink(a))}" target="_blank" rel="noopener">Abrir no Google Maps</a><a class="mp-fi" href="#/v/${S.tripId}/a/${a.id}">Ver a ficha</a></div>`);
    (grupos[d.day_number] = grupos[d.day_number] || L.layerGroup().addTo(mapa)).addLayer(m); todos.push([a.lat, a.lng]);
  });
  hoteis.forEach((h) => { const m = L.marker([h.lat, h.lng], { icon: L.divIcon({ className: 'mp-pin mp-hotel', html: `<span>${I.cama}</span>`, iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14] }), title: h.name })
    .bindPopup(`<div class="mp-pop"><b>${esc(h.name)}</b><small>Hotel · ${dataCurta(h.check_in)} → ${dataCurta(h.check_out)}</small><a class="mp-gm" href="${esc(mapsPlaceLink({ maps_url: h.maps_url, maps_query: [h.name, h.address || h.city].filter(Boolean).join(', ') }))}" target="_blank" rel="noopener">Abrir no Google Maps</a></div>`).addTo(mapa); todos.push([h.lat, h.lng]); });
  if (todos.length) mapa.fitBounds(todos, { padding: [36, 36], maxZoom: 15 }); else mapa.setView([50.85, 4.35], 6);
  S.mapa = { mapa, grupos };
  setTimeout(() => mapa.invalidateSize(), 60);
}
// localização de um hotel a partir da morada (OpenStreetMap), para o mostrar no mapa
async function geocodificar(q) {
  try { const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=pt&q=${encodeURIComponent(q)}`); const j = await r.json();
    return j?.[0] ? { lat: Number(j[0].lat), lng: Number(j[0].lon) } : null; } catch { return null; }
}

// ---------- mais ----------
function vMais() {
  const b = S.b; const secs = b.sections.filter((s) => s.kind !== 'transport_tips');
  const it = (h, t, s = '') => `<a class="menu-i" href="${h}"><span>${t}</span>${s ? `<small>${s}</small>` : ''}${I.seg}</a>`;
  render(`<main class="pag com-nav"><header class="cab-pag"><div><h1>Mais</h1><p>${esc(b.trip.title)}</p></div></header>
    <div class="menu">
      ${b.isOwner ? (() => { const r = itensReserva().filter((x) => x.tipo !== 'info'); return it(`#/v/${S.tripId}/reservas`, 'Reservas antecipadas', `${r.filter((x) => x.feito).length} de ${r.length} feitas`); })() : ''}
      ${it(`#/v/${S.tripId}/checklist`, 'Checklist antes da partida')}
      ${secs.map((s) => it(`#/v/${S.tripId}/secao/${s.id}`, esc(s.title))).join('')}
      ${it(`#/v/${S.tripId}/exportar`, 'Exportar roteiro (PDF)')}
    </div>
    <div class="menu"><a class="menu-i menu-def" href="#/v/${S.tripId}/definicoes">${I.roda}<span>Definições</span><small>viagem, telemóvel e conta</small>${I.seg}</a></div>${nav('mais')}</main>`);
}
// ---------- fichas dos viajantes: dados pessoais, só para o dono, com palavra-passe ----------
// Nunca são guardadas no telemóvel (nem na cópia para usar sem rede): leem-se do servidor só depois de desbloquear.
let FICHAS_ATE = 0; let FICHAS_VER = false;
const mascara = (v) => !v ? '—' : FICHAS_VER ? esc(v) : '•••• ' + esc(String(v).slice(-3));
const dataPT = (d) => d ? d.split('-').reverse().join('/') : '—';
// verificação em dois passos (código de 6 dígitos de uma app de autenticação)
async function fatorTotp() { try { const { data } = await sb.auth.mfa.listFactors(); return (data?.totp || []).find((f) => f.status === 'verified') || null; } catch { return null; } }
const temDoisPassos = async () => !!(await fatorTotp());
async function fDoisPassos() {
  const f = await fatorTotp();
  if (f) return folha('Verificação em dois passos', '<p class="meta">Está <b>ativa</b>. Para a desligar, escreve um código da app de autenticação.</p>' + campo('codigo', 'Código', '', 'text', 'inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required'),
    async (v) => { const r = await sb.auth.mfa.challengeAndVerify({ factorId: f.id, code: v.codigo.trim() }); if (r.error) throw new Error('Código errado.');
      const u = await sb.auth.mfa.unenroll({ factorId: f.id }); if (u.error) throw new Error('Não foi possível desligar.'); toast('Verificação em dois passos desligada.'); router(); });
  try { const { data } = await sb.auth.mfa.listFactors(); for (const x of (data?.all || []).filter((x) => x.status !== 'verified')) await sb.auth.mfa.unenroll({ factorId: x.id }); } catch {}
  const { data: en, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Roteiros Miguel ' + new Date().toISOString().slice(0, 10) });
  if (error || !en) { toast('Não foi possível iniciar a ativação.'); return; }
  folha('Ativar verificação em dois passos', `<ol class="dp-passos"><li>Instala no telemóvel uma app de autenticação (Google Authenticator, Microsoft Authenticator ou a das palavras-passe do iPhone).</li>
      <li>Na app, escolhe adicionar conta e lê este código QR:</li></ol>
    <div class="dp-qr"><img src="${en.totp.qr_code}" alt="Código QR para a app de autenticação"></div>
    <p class="meta">Se não conseguires ler o QR, escreve esta chave na app: <code class="dp-chave">${esc(en.totp.secret)}</code> <button type="button" class="fx-cp" data-act="copiar" data-v="${esc(en.totp.secret)}">⧉</button></p>
    <ol class="dp-passos" start="3"><li>Escreve o código de 6 dígitos que a app mostra:</li></ol>` + campo('codigo', 'Código', '', 'text', 'inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required'),
  async (v) => { const r = await sb.auth.mfa.challengeAndVerify({ factorId: en.id, code: v.codigo.trim() }); if (r.error) throw new Error('Código errado. Confirma a hora do telemóvel e tenta de novo.');
    toast('Verificação em dois passos ativada.'); router(); });
}

async function vFichas(fid) {
  const b = S.b; if (!b.isOwner) { location.hash = `#/v/${S.tripId}/participantes`; return; }
  const mb = fid && b.members.find((m) => m.ficha_id === fid);
  const cab = `<header class="cab-pag"><a class="b-ic" href="#/v/${S.tripId}/participantes" aria-label="Voltar">${I.voltar}</a><div><h1>${fid ? 'Ficha' + (mb ? ' · ' + esc(mb.display_name) : '') : 'Fichas dos viajantes'}</h1><p>Informação pessoal · só tu tens acesso</p></div></header>`;
  if (Date.now() > FICHAS_ATE) {
    render(`<main class="pag com-nav">${cab}<section class="fx-lock"><span class="fx-ic">${I.cadeado}</span><h2>Informação protegida</h2><p>Para ver os documentos e contactos dos viajantes, confirma que és tu.</p>
      <form class="form" data-desbloquear><label class="campo"><span>Palavra-passe</span><input type="password" name="password" autocomplete="current-password" required></label>
        ${await temDoisPassos() ? '<label class="campo"><span>Código da app de autenticação</span><input name="codigo" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="6 dígitos" required></label>' : '<p class="fx-2p">A verificação em dois passos está desligada. <a href="#/v/' + S.tripId + '/definicoes">Ativar nas Definições</a></p>'}
        <button class="b-pri b-larga" type="submit">Desbloquear</button></form>
      <p class="meta">Fica desbloqueado durante 5 minutos neste ecrã. Nada disto é guardado no telemóvel.</p></section>${nav('mais')}</main>`);
    document.querySelector('[data-desbloquear]').addEventListener('submit', async (e) => { e.preventDefault(); const btn = e.submitter; btn.disabled = true;
      const fd = new FormData(e.target); const { data: { user } } = await sb.auth.getUser(); const { error } = await sb.auth.signInWithPassword({ email: user?.email, password: fd.get('password') });
      if (error) { toast('Palavra-passe errada.'); btn.disabled = false; return; }
      const fator = await fatorTotp(); if (fator) { const r = await sb.auth.mfa.challengeAndVerify({ factorId: fator.id, code: String(fd.get('codigo') || '').trim() }); if (r.error) { toast('Código errado ou expirado.'); btn.disabled = false; return; } }
      FICHAS_ATE = Date.now() + 5 * 60e3; vFichas(fid); });
    return;
  }
  const { data: fs0, error } = await sb.from('fichas_pessoais').select('*').order('ordem'); const fs = fid ? (fs0 || []).filter((f) => f.id === fid) : fs0;
  if (error) { toast('Não foi possível ler as fichas.'); return; }
  const fim = b.trip.end_date; const seisM = isoMais(fim, 183);
  const aviso = (v) => !v ? '' : v < b.trip.start_date ? `<span class="fx-av mau">Caduca antes da viagem</span>` : v < fim ? `<span class="fx-av mau">Caduca durante a viagem</span>` : v < seisM ? `<span class="fx-av meio">Menos de 6 meses de validade após a viagem</span>` : `<span class="fx-av ok">Válido para esta viagem</span>`;
  const lin = (rot, val, copia) => `<div class="fx-l"><dt>${rot}</dt><dd>${val}${copia && FICHAS_VER ? `<button class="fx-cp" data-act="copiar" data-v="${esc(copia)}" aria-label="Copiar">⧉</button>` : ''}</dd></div>`;
  const cartao = (f) => `<article class="fx-c"><div class="fx-t"><h2>${esc(f.nome)}</h2><button class="b-ic" data-act="ficha-editar" data-id="${f.id}" aria-label="Editar">✎</button></div><dl>
    ${lin('Data de nascimento', dataPT(f.data_nascimento))}
    ${lin('Cartão de Cidadão / BI', mascara(f.doc_identificacao), f.doc_identificacao)}
    ${lin('Passaporte', `${mascara(f.passaporte)}${f.passaporte_validade ? ` <small>válido até ${dataPT(f.passaporte_validade)}</small>` : ''}`, f.passaporte)}
    ${f.passaporte_validade ? `<div class="fx-l"><dt></dt><dd>${aviso(f.passaporte_validade)}</dd></div>` : ''}
    ${lin('Email', (f.emails || []).map((e) => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join('<br>') || '—')}
    ${lin('Telefone', f.telefone ? `<a href="tel:${esc(f.telefone)}">${esc(f.telefone)}</a>` : '—')}
    ${lin('Contacto de emergência', f.emergencia_nome ? `${esc(f.emergencia_nome)}${f.emergencia_tel ? ` · <a href="tel:${esc(f.emergencia_tel)}">${esc(f.emergencia_tel)}</a>` : ''}` : '—')}
    ${f.notas ? lin('Notas', esc(f.notas)) : ''}</dl></article>`;
  render(`<main class="pag com-nav fx-pag">${cab}
    <div class="fx-barra"><button class="b-sec" data-act="fichas-ver">${FICHAS_VER ? 'Esconder números' : 'Mostrar números'}</button><button class="b-sec" data-act="fichas-bloquear">${I.cadeado} Bloquear</button></div>
    <div class="fx-lista">${(fs || []).map(cartao).join('') || '<p class="vazio">Ainda não há fichas.</p>'}</div>
    ${fid ? '' : `<button class="b-pri b-larga" data-act="ficha-editar">${I.mais} Nova ficha</button>`}${nav('mais')}</main>`);
  S.fichas = fs || []; S.fichaAtual = fid || null;
}
function fFicha(id) {
  const f = (S.fichas || []).find((x) => x.id === id) || { emails: [] };
  folha(id ? 'Editar ficha' : 'Nova ficha', campo('nome', 'Nome completo', f.nome, 'text', 'required')
    + `<div class="duas">${campo('data_nascimento', 'Data de nascimento', f.data_nascimento, 'date')}${campo('doc_identificacao', 'Cartão de Cidadão / BI', f.doc_identificacao)}</div>`
    + `<div class="duas">${campo('passaporte', 'N.º do passaporte', f.passaporte)}${campo('passaporte_validade', 'Validade do passaporte', f.passaporte_validade, 'date')}</div>`
    + area('emails', 'Emails (um por linha)', (f.emails || []).join('\n')) + campo('telefone', 'Telefone', f.telefone, 'tel')
    + `<div class="duas">${campo('emergencia_nome', 'Contacto de emergência', f.emergencia_nome)}${campo('emergencia_tel', 'Telefone de emergência', f.emergencia_tel, 'tel')}</div>`
    + area('notas', 'Notas', f.notas) + (id ? '<button type="button" class="b-perigo" data-apagar>Apagar esta ficha</button>' : ''),
  async (v) => { if (Date.now() > FICHAS_ATE) throw new Error('O acesso expirou. Volta a desbloquear.');
    v.emails = String(v.emails || '').split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean); ['data_nascimento', 'passaporte_validade'].forEach((k) => { if (!v[k]) v[k] = null; }); v.updated_at = new Date().toISOString();
    const r = id ? await sb.from('fichas_pessoais').update(v).eq('id', id) : await sb.from('fichas_pessoais').insert({ ...v, ordem: (S.fichas || []).length + 1 });
    if (r.error) throw new Error('Não foi possível guardar.'); toast('Ficha guardada.'); FICHAS_ATE = Date.now() + 5 * 60e3; vFichas(S.fichaAtual); });
  const bt = document.querySelector('.folha [data-apagar]'); if (bt) bt.addEventListener('click', async () => { if (!confirm('Apagar esta ficha?')) return; await sb.from('fichas_pessoais').delete().eq('id', id); document.querySelector('.folha-fundo')?.remove(); toast('Ficha apagada.'); location.hash = `#/v/${S.tripId}/participantes`; });
}

// ---------- nome e morada na língua local (para mostrar ao taxista) ----------
const LINGUAS = [['', 'Nenhuma (não mostrar)'], ['ja', 'Japonês'], ['th', 'Tailandês'], ['zh', 'Chinês'], ['ko', 'Coreano'], ['vi', 'Vietnamita'], ['hi', 'Hindi'], ['ar', 'Árabe'], ['ru', 'Russo'], ['el', 'Grego'], ['tr', 'Turco'], ['nl', 'Neerlandês'], ['fr', 'Francês'], ['de', 'Alemão'], ['it', 'Italiano'], ['es', 'Espanhol'], ['cs', 'Checo'], ['pl', 'Polaco'], ['hu', 'Húngaro'], ['id', 'Indonésio']];
const FRASE_TAXI = { ja: 'この住所までお願いします。', th: 'กรุณาพาไปที่อยู่นี้', zh: '请带我去这个地址。', ko: '이 주소로 가 주세요.', vi: 'Làm ơn đưa tôi đến địa chỉ này.', hi: 'कृपया मुझे इस पते पर ले चलिए।', ar: 'من فضلك خذني إلى هذا العنوان.', ru: 'Пожалуйста, отвезите меня по этому адресу.', el: 'Παρακαλώ, πηγαίνετέ με σε αυτή τη διεύθυνση.', tr: 'Lütfen beni bu adrese götürün.', nl: 'Wilt u mij naar dit adres brengen, alstublieft?', fr: "Pouvez-vous m'emmener à cette adresse, s'il vous plaît ?", de: 'Bitte bringen Sie mich zu dieser Adresse.', it: 'Mi porti a questo indirizzo, per favore.', es: 'Lléveme a esta dirección, por favor.', cs: 'Prosím, odvezte mě na tuto adresu.', pl: 'Proszę mnie zawieźć pod ten adres.', hu: 'Kérem, vigyen el erre a címre.', id: 'Tolong antar saya ke alamat ini.' };
const linguaViagem = () => S.b?.trip?.info?.lingua || '';
const localDe = (tab, id) => (tab === 'hotels' ? S.b.hotels : S.b.activities).find((x) => x.id === id);
async function buscarLocal(tab, id, acao = 'local') {
  const { data, error } = await sb.functions.invoke('narrar', { body: { acao, tabela: tab, id, lingua: linguaViagem() } });
  if (error || data?.erro) throw new Error(data?.erro || 'Não foi possível contactar o Google.');
  Object.assign(localDe(tab, id), data); return data;
}
async function vLocal(tab, id) {
  const x = localDe(tab, id); if (!x) return; const L = linguaViagem() || x.local_lang;
  const nomeLat = tab === 'hotels' ? x.name : (x.place_name || x.title); const moradaLat = tab === 'hotels' ? [x.address, x.city].filter(Boolean).join(', ') : '';
  const tel = x.local_phone || (tab === 'hotels' ? x.phone : '');
  document.querySelector('.tx-fundo')?.remove();
  const w = document.createElement('div'); w.className = 'tx-fundo';
  w.innerHTML = `<div class="tx" role="dialog" aria-modal="true" aria-label="Na língua local"><button class="b-ic tx-x" data-fechar aria-label="Fechar">✕</button>
    ${x.local_name ? `<div class="tx-corpo" lang="${esc(L)}" dir="${L === 'ar' ? 'rtl' : 'auto'}">
      <h1 class="tx-nome">${esc(x.local_name)}</h1>${x.local_address ? `<p class="tx-morada">${esc(x.local_address)}</p>` : ''}
      ${tel ? `<a class="tx-tel" href="tel:${esc(tel)}">☎ ${esc(tel)}</a>` : ''}
      ${FRASE_TAXI[L] ? `<p class="tx-frase">${FRASE_TAXI[L]}</p>` : ''}</div>
      ${verificacaoLocal(tab, x)}
      <div class="tx-lat"><b>${esc(nomeLat || '')}</b>${moradaLat ? `<span>${esc(moradaLat)}</span>` : ''}${x.local_ok ? '<em class="tx-ok">✓ Confirmado por ti</em>' : ''}<small>Mostra este ecrã ao taxista${tel ? ' · no Japão, o telefone serve para o GPS do táxi' : ''}</small></div>
      <div class="tx-ac">${x.local_audio_path ? `<button class="b-sec" data-ouvir>🔊 Ouvir</button><audio data-som preload="none"></audio>` : ''}
        ${S.b.isOwner ? `<button class="b-sec" data-corrigir>Corrigir</button><button class="b-sec" data-buscar>Atualizar do Google</button>` : ''}</div>`
    : `<div class="tx-vazio"><h2>${esc(nomeLat || '')}</h2><p>Ainda não há o nome e a morada em ${esc((LINGUAS.find(([k]) => k === L) || [, 'língua local'])[1].toLowerCase())}.</p>
      ${S.b.isOwner ? '<button class="b-pri b-larga" data-buscar>Ir buscar ao Google Maps</button><button class="b-sec b-larga" data-corrigir>Escrever à mão</button>' : '<p class="meta">Pede ao organizador da viagem para os preencher.</p>'}</div>`}</div>`;
  document.body.appendChild(w);
  w.addEventListener('click', async (e) => {
    if (e.target.closest('[data-fechar]') || e.target === w) return w.remove();
    if (e.target.closest('[data-ouvir]')) { const au = w.querySelector('[data-som]'); if (!au.src) { const u = (await urlsAssinados('audio', [x.local_audio_path]))[x.local_audio_path]; if (!u) return toast('Áudio indisponível sem rede.'); au.src = u; } au.currentTime = 0; au.play(); return; }
    if (e.target.closest('[data-confirmar]')) { const r = await sb.from(tab).update({ local_ok: true }).eq('id', id); if (r.error) return toast('Não foi possível guardar.'); x.local_ok = true; toast('Confirmado.'); return vLocal(tab, id); }
    if (e.target.closest('[data-buscar]')) { const bt = e.target.closest('[data-buscar]'); bt.disabled = true; bt.textContent = 'A procurar…';
      try { await buscarLocal(tab, id); vLocal(tab, id); } catch (err) { toast(err.message); bt.disabled = false; bt.textContent = 'Tentar outra vez'; } return; }
    if (e.target.closest('[data-corrigir]')) { w.remove(); folha('Na língua local', campo('local_name', 'Nome', x.local_name) + area('local_address', 'Morada', x.local_address) + campo('local_phone', 'Telefone', tel, 'tel'),
      async (v) => { const r = await sb.from(tab).update({ local_name: v.local_name || null, local_address: v.local_address || null, local_phone: v.local_phone || null, local_lang: L }).eq('id', id); if (r.error) throw new Error('Não foi possível guardar.');
        Object.assign(x, v); try { await buscarLocal(tab, id, 'local-audio'); } catch {} setTimeout(() => vLocal(tab, id), 50); }); }
  });
}
// confirmar que o local encontrado pelo Google é mesmo o que queremos
const distKm = (a1, o1, a2, o2) => { const r = Math.PI / 180, d1 = (a2 - a1) * r, d2 = (o2 - o1) * r; const h = Math.sin(d1 / 2) ** 2 + Math.cos(a1 * r) * Math.cos(a2 * r) * Math.sin(d2 / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
const digitos = (t) => String(t || '').replace(/\D/g, '').slice(-8);
function verificacaoLocal(tab, x) {
  if (x.local_ok || !x.local_place_id || !S.b.isOwner) return '';
  const sinais = [];
  if (x.lat != null && x.local_lat != null) { const km = distKm(x.lat, x.lng, x.local_lat, x.local_lng);
    sinais.push(km <= 0.3 ? `<li class="bom">Fica a ${Math.round(km * 1000)} m do local que tens registado</li>` : `<li class="mau">⚠ Fica a ${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km do local que tens registado</li>`); }
  const telMeu = tab === 'hotels' ? x.phone : null;
  if (telMeu && x.local_phone) sinais.push(digitos(telMeu) === digitos(x.local_phone) ? '<li class="bom">O telefone é o mesmo da tua reserva</li>' : '<li class="mau">⚠ O telefone é diferente do da tua reserva</li>');
  const gm = `https://www.google.com/maps/search/?api=1&query=${x.local_lat},${x.local_lng}&query_place_id=${encodeURIComponent(x.local_place_id)}`;
  return `<div class="tx-ver"><p class="tx-ver-t">Confirma que é o sítio certo</p>
    <p>O Google encontrou: <b>${esc(x.local_nome_lat || '—')}</b>${x.local_morada_lat ? `<br><span>${esc(x.local_morada_lat)}</span>` : ''}</p>
    ${sinais.length ? `<ul>${sinais.join('')}</ul>` : ''}
    <div class="tx-ver-ac"><a class="b-sec" href="${gm}" target="_blank" rel="noopener">Ver no Google Maps</a><button class="b-pri" data-confirmar>✓ Está certo</button><button class="b-sec" data-corrigir>Não é este</button></div></div>`;
}
// texto de pesquisa (igual ao da função no servidor): quando muda, o nome local é atualizado
function consultaLocal(tab, x) {
  if (tab === 'hotels') return [x.name, x.address, x.city].filter(Boolean).join(', ');
  if (x.transport_mode) return x.from_place ? [x.from_place, x.transport_mode === 'aviao' ? 'aeroporto' : x.transport_mode === 'comboio' ? 'estação' : ''].filter(Boolean).join(' ') : '';
  return [x.place_name || x.title, x.maps_query && x.maps_query !== x.place_name ? x.maps_query : ''].filter(Boolean).join(', ');
}
function elegivelLocal(tab, x) {
  if (tab === 'hotels') return x.status !== 'cancelado';
  if (x.transport_mode) return !!x.from_place && ['aviao', 'comboio', 'autocarro', 'barco'].includes(x.transport_mode);
  return ['visit', 'walk', 'meal'].includes(x.kind) && !!(x.place_name || x.lat != null);
}
const faltaLocal = (tab, x) => elegivelLocal(tab, x) && (!x.local_name || x.local_lang !== linguaViagem() || (x.local_query && x.local_query !== consultaLocal(tab, x)));
// sempre que a viagem carrega ou algo é guardado: preenche, em fundo, o que for novo ou tiver mudado
const LOCAL_FALHOU = new Set(); let localAOcorrer = false;
async function autoLocais() {
  const b = S.b; if (!b?.isOwner || !linguaViagem() || localAOcorrer || b.offline || !navigator.onLine) return;
  const alvos = [...b.hotels.map((h) => ['hotels', h]), ...b.activities.map((a) => ['activities', a])].filter(([t, x]) => faltaLocal(t, x) && !LOCAL_FALHOU.has(x.id + consultaLocal(t, x)));
  if (!alvos.length) return; localAOcorrer = true; let n = 0;
  try { for (const [t, x] of alvos) { if (S.b !== b) break; try { await buscarLocal(t, x.id); n++; } catch { LOCAL_FALHOU.add(x.id + consultaLocal(t, x)); } } }
  finally { localAOcorrer = false; }
  if (n) toast(`Nome na língua local atualizado em ${n} ${n === 1 ? 'local' : 'locais'}. Confirma no botão 文A.`);
}
async function preencherLocais() {
  const b = S.b; const alvos = [...b.hotels.map((h) => ['hotels', h]), ...b.activities.map((a) => ['activities', a])].filter(([t, x]) => faltaLocal(t, x));
  if (!alvos.length) return toast('Já está tudo preenchido.');
  let ok = 0, falha = 0; for (const [i, [tab, x]] of alvos.entries()) { toast(`A preencher ${i + 1} de ${alvos.length}…`); try { await buscarLocal(tab, x.id); ok++; } catch { falha++; } }
  toast(`${ok} preenchidos${falha ? ` · ${falha} não encontrados` : ''}. Confirma cada um no botão 文A.`); router();
}

// estado da viagem: ativa ou inativa (escolhido pelo dono; sem escolha, fica inativa quando termina)
const viagemAtiva = (t) => { const e = t.info?.estado; if (e === 'ativa') return true; if (e === 'inativa') return false; return !(t.end_date && t.end_date < new Date().toISOString().slice(0, 10)); };
function vDefinicoes() {
  setTimeout(async () => { const el = document.querySelector('[data-dp]'); if (!el) return; const on = await temDoisPassos(); el.textContent = on ? 'Ativa' : 'Desligada'; el.classList.toggle('on', on); });
  const b = S.b; const t = b.trip; const ativa = viagemAtiva(t);
  const it = (h, t2, s = '') => `<a class="menu-i" href="${h}"><span>${t2}</span>${s ? `<small>${s}</small>` : ''}${I.seg}</a>`;
  render(`<main class="pag com-nav"><header class="cab-pag"><a class="b-ic" href="#/v/${S.tripId}/mais" aria-label="Voltar">${I.voltar}</a><div><h1>Definições</h1><p>${esc(t.title)}</p></div></header>
    <h2 class="sec def-t">Desta viagem</h2>
    <div class="menu">
      ${b.isOwner ? `<button class="menu-i" data-act="estado-viagem"><span>Estado da viagem</span><small class="est-v ${ativa ? 'on' : ''}">${ativa ? 'Ativa' : 'Inativa'}</small>${I.seg}</button>` : `<div class="menu-i"><span>Estado da viagem</span><small>${ativa ? 'Ativa' : 'Inativa'}</small></div>`}
      ${b.isOwner ? `<button class="menu-i" data-act="cambio"><span>Moeda do país</span><small>${esc((MOEDAS.find(([k]) => k === (t.local_currency || 'EUR')) || [, 'Euro'])[1])}</small>${I.seg}</button>` : ''}
      ${b.isOwner ? `<button class="menu-i" data-act="lingua"><span>Língua local</span><small>${esc((LINGUAS.find(([k]) => k === (t.info?.lingua || '')) || LINGUAS[0])[1].replace(' (não mostrar)', ''))}</small>${I.seg}</button>` : ''}
      ${it(`#/v/${S.tripId}/participantes`, 'Participantes', `${b.members.length}`)}
    </div>
    <h2 class="sec def-t">Desta app e deste telemóvel</h2>
    <div class="menu">
      <button class="menu-i" data-act="tema"><span>${temaTxt()}</span><small>tocar para mudar</small>${I.seg}</button>
      <button class="menu-i" data-act="offline"><span>Guardar bilhetes neste telemóvel</span><small>para usar sem rede</small>${I.seg}</button>
      ${it('#/instalar', 'Instalar no telemóvel')}
      <button class="menu-i" data-act="dois-passos"><span>${I.cadeado}Verificação em dois passos</span><small class="est-v" data-dp>…</small>${I.seg}</button>
      <button class="menu-i" data-act="mudar-pw"><span>${I.cadeado}Mudar palavra-passe</span><small>a mesma da entrada na app</small>${I.seg}</button>
      <button class="menu-i" data-act="sair"><span>Sair</span>${I.seg}</button>
    </div>${nav('mais')}</main>`);
}

// reservas antecipadas: voos, hotéis de cada cidade e o que o roteiro manda reservar, por data
function itensReserva() {
  const b = S.b; const out = [];
  b.activities.filter((a) => a.transport_mode === 'aviao').forEach((a) => { const f = fichaT(a); const d = b.days.find((x) => x.id === a.day_id);
    const feito = !!f && ['pago', 'incluido'].includes(f.status);
    out.push({ tipo: 'voo', titulo: `Voo ${a.from_place || ''} → ${a.to_place || ''}`, sub: d ? `Dia ${d.day_number} · ${dataLonga(d.date)}` : '', para: d?.date, quando: null, quandoTxt: 'Quanto antes',
      feito, estado: feito ? 'Comprado' : 'Por comprar', alvo: f ? `data-act="ficha-transporte" data-id="${f.id}"` : '', acao: f ? 'Dados do voo' : '' }); });
  cidadesViagem().forEach((c) => { const hs = b.hotels.filter((h) => h.status !== 'cancelado' && h.check_in < c.fim && c.ini < h.check_out);
    let n = 0; for (let k = 0; k < c.noites; k++) { const d = isoMais(c.ini, k); if (hs.some((h) => h.check_in <= d && d < h.check_out)) n++; }
    const feito = c.noites > 0 && n === c.noites, pago = feito && hs.every((h) => h.status === 'pago');
    out.push({ tipo: 'hotel', titulo: `Hotel em ${c.nome}`, sub: `${c.noites} noite${c.noites === 1 ? '' : 's'} · ${intervalo(c.ini, c.fim)}${hs.length ? ' · ' + hs.map((h) => h.name).join(', ') : ''}`, para: c.ini, quando: null, quandoTxt: 'Quanto antes',
      feito, estado: feito ? (pago ? 'Pago' : 'Reservado') : n ? `${n} de ${c.noites} noites` : 'Por reservar',
      alvo: feito ? `href="#/v/${S.tripId}/hoteis"` : `data-act="hotel-reservar" data-ini="${c.ini}" data-fim="${c.fim}" data-cidade="${esc(c.nome)}"`, acao: feito ? 'Ver hotéis' : 'Registar hotel' }); });
  b.prebookings.filter((p) => !(!p.activity_ext_key && /^(voos?|hot[eé]is?)\b/i.test(p.title))).forEach((p) => {
    const a = b.activities.find((x) => x.ext_key === p.activity_ext_key); const d = a && b.days.find((x) => x.id === a.day_id);
    const naoPreciso = /não é preciso|nao e preciso/i.test(p.deadline_text || '');
    out.push({ tipo: naoPreciso ? 'info' : a?.transport_mode ? 'comboio' : 'bilhete', titulo: p.title, sub: d ? `Dia ${d.day_number} · ${dataLonga(d.date)}` : '', para: d?.date,
      quando: p.deadline_at ? p.deadline_at.slice(0, 10) : null, quandoTxt: p.deadline_text || 'Quanto antes', feito: p.done, pre: p, a, nota: p.note, link: p.link }); });
  const chave = (x) => x.tipo === 'info' ? '9999' : x.quando || '0000';
  return out.sort((x, y) => chave(x).localeCompare(chave(y)) || String(x.para || '').localeCompare(String(y.para || '')));
}
function vReservas() {
  const b = S.b; const hoje = new Date().toISOString().slice(0, 10); const todos = itensReserva();
  const porFazer = todos.filter((x) => !x.feito && x.tipo !== 'info'), feitos = todos.filter((x) => x.feito), info = todos.filter((x) => x.tipo === 'info' && !x.feito);
  const total = porFazer.length + feitos.length; const pct = total ? Math.round(feitos.length / total * 100) : 0;
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MES3 = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const grupo = (x) => x.quando ? `${MESES[Number(x.quando.slice(5, 7)) - 1]} ${x.quando.slice(0, 4)}` : 'Quanto antes';
  const ico = (t) => t === 'voo' ? icT('aviao') : t === 'comboio' ? icT('comboio') : t === 'hotel' ? `<span class="ict hotel">${I.cama}</span>` : `<span class="ict bil">${I.qr}</span>`;
  const estado = (x) => { if (x.feito) return `<span class="ra-e ok">${x.estado || 'Feita'}</span>`;
    if (x.estado) return `<span class="ra-e por">${x.estado}</span>`;
    if (x.quando && x.quando > hoje) { const n = Math.ceil((new Date(x.quando) - new Date(hoje)) / 864e5); return `<span class="ra-e abre">${n === 1 ? 'Amanhã' : `Daqui a ${n} dias`}</span>`; }
    return `<span class="ra-e ja">Já pode reservar</span>`; };
  const cartao = (x) => {
    const dt = x.quando ? `<b>${Number(x.quando.slice(8, 10))}</b><small>${MES3[Number(x.quando.slice(5, 7)) - 1]}</small>` : `<b class="ja">JÁ</b>`;
    const lembr = x.pre ? b.reminders.filter((r) => r.prebooking_id === x.pre.id) : [];
    return `<li class="ra-c ${x.feito ? 'feito' : ''} ${x.tipo}">
      <div class="ra-dt">${dt}</div>
      <div class="ra-corpo"><div class="ra-l1">${ico(x.tipo)}<div class="ra-tx">${estado(x)}<strong>${esc(x.titulo)}</strong>${x.sub ? `<span>${esc(x.sub)}</span>` : ''}</div></div>
        ${x.quandoTxt && x.quando ? `<p class="ra-q">${esc(x.quandoTxt)}</p>` : ''}${x.nota ? `<p class="ra-n">${esc(x.nota)}</p>` : ''}
        <div class="ra-ac">${x.link && !x.feito ? `<a class="ra-b pri" href="${esc(x.link)}" target="_blank" rel="noopener">Reservar</a>` : ''}
          ${x.alvo && b.isOwner ? (x.alvo.startsWith('href') ? `<a class="ra-b" ${x.alvo}>${x.acao}</a>` : `<button class="ra-b ${x.feito ? '' : 'pri'}" ${x.alvo}>${x.acao}</button>`) : ''}
          ${x.a ? `<a class="ra-b" href="#/v/${S.tripId}/a/${x.a.id}">Ver atividade</a>` : ''}
          ${x.pre && b.isOwner ? `<button class="ra-b ${x.feito ? 'ok' : ''}" data-act="pre-feito" data-id="${x.pre.id}">${x.feito ? '✓ Feita' : 'Marcar como feita'}</button>` : ''}
          ${x.pre && b.isOwner && !x.feito ? `<button class="ra-b" data-act="novo-lembrete" data-campo="prebooking_id" data-id="${x.pre.id}">${I.sino}Lembrete</button>` : ''}
          ${lembr.map((r) => `<span class="lb">${I.sino}${offsetTxt(r.offset_minutes)}<button data-act="apagar-lembrete" data-id="${r.id}" aria-label="Apagar">✕</button></span>`).join('')}</div></div></li>`; };
  let ult = ''; const linhas = porFazer.map((x) => { const g = grupo(x); const cab = g !== ult ? `<li class="ra-mes">${g}</li>` : ''; ult = g; return cab + cartao(x); }).join('');
  const prox = porFazer.find((x) => x.quando && x.quando > hoje);
  render(`<main class="pag com-nav ra-pag"><header class="cab-pag"><a class="b-ic" href="#/v/${S.tripId}/mais" aria-label="Voltar">${I.voltar}</a><div><h1>Reservas antecipadas</h1><p>${esc(b.trip.title)}</p></div></header>
    <section class="ra-topo"><div class="ra-num"><b>${feitos.length}</b><span>de ${total} feitas</span></div><div class="ra-bar"><i style="width:${pct}%"></i></div>
      <p>${porFazer.length ? `${porFazer.filter((x) => !x.quando || x.quando <= hoje).length} para tratar já${prox ? ` · a seguir: <b>${esc(prox.titulo)}</b> (${dataCurta(prox.quando)})` : ''}` : 'Está tudo reservado.'}</p></section>
    <div class="ra-sep por"><span>!</span><h2>Por fazer</h2><small>${porFazer.length}</small></div>
    <ol class="ra-lista">${linhas || '<li class="vazio">Nada por reservar.</li>'}</ol>
    ${info.length ? `<h2 class="sec ra-info-t">Não é preciso reservar</h2><ul class="ra-info">${info.map((x) => `<li><strong>${esc(x.titulo)}</strong>${x.nota ? `<span>${esc(x.nota)}</span>` : ''}</li>`).join('')}</ul>` : ''}
    <section class="ra-feitas"><div class="ra-sep"><span>${I.check || '✓'}</span><h2>Já feitas</h2><small>${feitos.length}</small></div>
      ${feitos.length ? `<ol class="ra-lista">${feitos.map(cartao).join('')}</ol>` : '<p class="ra-vz">Ainda não há reservas feitas. Quando marcares uma como feita, ou registares um hotel ou um voo pago, aparece aqui.</p>'}</section>
    ${nav('mais')}</main>`);
}

function vChecklist() {
  const b = S.b; const cats = [...new Set(b.checklist.map((c) => c.category))];
  render(`<main class="pag com-nav"><header class="cab-pag"><a class="b-ic" href="#/v/${S.tripId}/mais" aria-label="Voltar">${I.voltar}</a><div><h1>Checklist</h1><p>Antes da partida</p></div></header>
    ${cats.map((c) => `<h2 class="sec">${esc(c)}</h2><ul class="check">${b.checklist.filter((x) => x.category === c).map((x) => `<li class="${x.done ? 'feito' : ''}"><label><input type="checkbox" data-act="chk" data-id="${x.id}" ${x.done ? 'checked' : ''} ${b.isOwner ? '' : 'disabled'}><span>${esc(x.title)}</span></label></li>`).join('')}</ul>`).join('')}
    ${nav('mais')}</main>`);
}

const rankingsOrd = () => S.b.rankings.slice().sort((x, y) => (y.is_primary ? 1 : 0) - (x.is_primary ? 1 : 0) || (x.sort_order || 0) - (y.sort_order || 0));
// capas: uma por ranking, com descrição, n.º de locais e os três primeiros
function vRankings() {
  const b = S.b; const ord = rankingsOrd(); if (ord.length === 1) return vRanking(ord[0].id);
  const capa = (r) => { const its = b.rankingItems.filter((i) => i.ranking_id === r.id).sort((x, y) => x.position - y.position);
    const p1 = its.map((i) => b.photos.find((p) => p.external_url && b.activities.some((a) => a.id === p.activity_id && (i.activity_ext_keys || []).includes(a.ext_key)))).find(Boolean);
    return `<a class="rk-capa" href="#/v/${S.tripId}/ranking/${r.id}" style="${p1 ? `background-image:url('${esc(p1.external_url)}')` : ''}"><span class="q">${its.length}</span>
      <b>${esc(r.title)}</b>${r.description ? `<span class="ds">${esc(r.description)}</span>` : ''}<span class="tops">${its.slice(0, 3).map((i) => `${i.position}. ${esc(i.title)}`).join(' · ')}</span></a>`; };
  render(`<main class="pag com-nav"><header class="cab-pag"><div><h1>Rankings</h1><p>${esc(b.trip.title)} · ${ord.length} rankings</p></div></header>
    <div class="rk-capas">${ord.map(capa).join('') || '<p class="vazio">Esta viagem ainda não tem rankings.</p>'}</div>${nav('ranking')}</main>`);
}
async function vRanking(rid, destaque) {
  const b = S.b; const r = b.rankings.find((x) => x.id === rid) || b.rankings.find((x) => x.is_primary) || b.rankings[0]; if (!r) return vMais();
  const items = b.rankingItems.filter((i) => i.ranking_id === r.id).sort((x, y) => x.position - y.position);
  const pc = ehPC();
  // a atividade de cada item (se estiver no roteiro) e os dias em que se visita
  const info = (i) => {
    const acts = b.activities.filter((x) => (i.activity_ext_keys || []).includes(x.ext_key));
    const dias = [...new Map(acts.map((x) => b.days.find((d) => d.id === x.day_id)).filter(Boolean).map((d) => [d.id, d])).values()].sort((x, y) => x.day_number - y.day_number);
    const a = acts[0];
    const foto = a && b.photos.find((p) => acts.some((x) => x.id === p.activity_id) && p.external_url);
    return { a, dias, foto };
  };
  const sel = destaque ? b.activities.find((x) => x.ext_key === destaque) : null;
  let painel = '';
  if (pc && sel) { const fp = await vAtividade(sel.id, true, `#/v/${S.tripId}/ranking/${r.id}`); painel = `<aside class="detalhe ficha aberto ${fp.semFoto ? 'sem-foto' : ''}" aria-label="Ficha da atividade">${fp.html}</aside>`; }
  const varios = b.rankings.length > 1;
  const lista = `<header class="cab-pag">${varios ? `<a class="b-ic" href="#/v/${S.tripId}/ranking" aria-label="Todos os rankings">${I.voltar}</a>` : ''}<div><h1>${esc(r.title)}</h1><p>${r.description ? esc(r.description) + ' · ' : ''}${items.length} locais</p></div></header>
    <ol class="rank rank2">${items.map((i) => { const { a, dias, foto } = info(i); const on = destaque && (i.activity_ext_keys || []).includes(destaque);
      const corpo = `<span class="rk-n">${i.position}</span>${foto ? `<span class="rk-foto" style="background-image:url('${esc(foto.external_url)}')"></span>` : ''}<span class="rk-c"><strong>${esc(i.title)}</strong>${i.note ? `<span>${esc(i.note)}</span>` : ''}</span>`;
      return `<li id="rk-${i.position}" class="${on ? 'on' : ''}">${a ? `<a class="rk-main" href="#/v/${S.tripId}/a/${a.id}/r/${r.id}">${corpo}</a>` : `<div class="rk-main">${corpo}</div>`}
        <div class="rk-dias">${dias.length ? dias.map((d) => `<a class="rk-dia" href="#/v/${S.tripId}/dia/${d.day_number}" aria-label="Ir para o dia ${d.day_number}">Dia ${d.day_number} · ${dataCurta(d.date)}</a>`).join('') : '<span class="rk-fora">Fora do roteiro</span>'}</div></li>`; }).join('')}</ol>`;
  render(pc && painel ? `<main class="dia rk-duo"><div class="dia-col"><div class="pag">${lista}</div></div>${painel}</main>` : `<main class="pag com-nav">${lista}${nav('ranking')}</main>`);
  document.querySelector('.rank li.on')?.scrollIntoView({ block: 'center' });
}

function vSecao(id) {
  const s = S.b.sections.find((x) => x.id === id); if (!s) return vMais();
  const corpo = s.kind === 'cuts' ? `<ol class="rank">${s.content.map((c) => `<li><span class="rk-n">${c.p}</span><span class="rk-c"><strong>${esc(c.t)}</strong><span>${esc(c.d)}</span></span></li>`).join('')}</ol>`
    : s.kind === 'budget' ? `<div class="caixa"><dl class="dados larga">${s.content.map((c) => `<dt>${esc(c.t)}</dt><dd>${esc(c.v)}</dd>`).join('')}</dl></div>`
    : `<div class="caixa">${s.content.map((c) => `<p>${c.t ? `<strong>${esc(c.t)}.</strong> ` : ''}${esc(c.d || c.v || '')}</p>`).join('')}</div>`;
  render(`<main class="pag com-nav"><header class="cab-pag"><a class="b-ic" href="#/v/${S.tripId}/mais" aria-label="Voltar">${I.voltar}</a><div><h1>${esc(s.title)}</h1></div></header>${corpo}${nav('mais')}</main>`);
}

function vParticipantes() {
  const b = S.b;
  const estado = (m) => m.role === 'owner' ? 'Organiza e edita' : m.user_id ? 'Consulta na app' : m.email ? 'Convite enviado' : 'Viaja · sem acesso à app';
  render(`<main class="pag com-nav"><header class="cab-pag"><a class="b-ic" href="#/v/${S.tripId}/mais" aria-label="Voltar">${I.voltar}</a><div><h1>Participantes</h1><p>Quem viaja e quem vê a viagem</p></div>${b.isOwner ? `<button class="b-pri b-peq" data-act="convidar">${I.mais} Convidar</button>` : ''}</header>
    <ul class="pessoas">${b.members.map((m) => `<li><span class="av">${esc((m.display_name || '?')[0].toUpperCase())}</span><span class="pp-n"><strong>${esc(m.display_name)}</strong><small>${estado(m)}</small></span>
      ${b.isOwner ? (m.ficha_id ? `<a class="pp-ficha" href="#/v/${S.tripId}/ficha/${m.ficha_id}">${I.cadeado}Ficha</a>` : `<button class="pp-ficha nova" data-act="ficha-membro" data-id="${m.id}">${I.mais}Ficha</button>`) : ''}
      ${b.isOwner && m.role !== 'owner' ? `<button class="b-link" data-act="remover-membro" data-id="${m.id}">Remover</button>` : ''}</li>`).join('')}</ul>
    ${b.isOwner ? `<button class="b-sec b-larga" data-act="viajante-novo">${I.mais} Acrescentar viajante (sem acesso à app)</button>
      <p class="meta pp-nota">${I.cadeado} As fichas (documentos, contactos e emergência) só abrem para ti, depois de confirmares a tua palavra-passe.</p>` : ''}
    ${nav('mais')}</main>`);
}

function vExportar() {
  const b = S.b;
  render(`<main class="pag com-nav sem-imprimir"><header class="cab-pag"><a class="b-ic" href="#/v/${S.tripId}/mais" aria-label="Voltar">${I.voltar}</a><div><h1>Exportar roteiro</h1><p>PDF sem bilhetes</p></div></header>
    <form id="f-exp" class="caixa form"><p>Escolhe o que incluir e depois "Guardar como PDF" na janela de impressão.</p>
      <fieldset class="dias-sel">${b.days.map((d) => `<label><input type="checkbox" name="d" value="${d.day_number}" checked> Dia ${d.day_number}</label>`).join('')}</fieldset>
      <label><input type="checkbox" name="hoteis" checked> Hotéis e transportes reservados</label>
      <label><input type="checkbox" name="extra" checked> Ranking, dicas e checklist</label>
      <button class="b-pri b-larga">Gerar PDF</button></form>${nav('mais')}</main>`);
  document.getElementById('f-exp').addEventListener('submit', (e) => {
    e.preventDefault(); const f = new FormData(e.target); imprimir(f.getAll('d').map(Number), f.has('hoteis'), f.has('extra'));
  });
}
function imprimir(dias, hoteis, extra) {
  const b = S.b; const rk = rankPrincipal();
  const html = `<div class="impressao"><h1>${esc(b.trip.title)}</h1><p>${intervalo(b.trip.start_date, b.trip.end_date)}${b.trip.info?.perfil ? ' · ' + esc(b.trip.info.perfil) : ''}</p>
    ${b.days.filter((d) => dias.includes(d.day_number)).map((d) => { const { lista, labels, escolhida } = atividadesDoDia(d); const h = hotelNa(d.date);
      return `<section><h2>Dia ${d.day_number} · ${dataLonga(d.date)} · ${esc(d.city || '')}</h2><p><em>${esc(d.title || '')}</em>${h ? ' · Dormida: ' + esc(h.name) : ''}${escolhida ? ' · ' + esc(labels[escolhida]) : ''}</p>${d.intro ? `<p>${esc(d.intro)}</p>` : ''}
      <table>${lista.map((a) => `<tr><td>${hhmm(a.start_time)}</td><td><strong>${esc(a.title)}</strong>${rk.map[a.ext_key] ? ` (${rk.map[a.ext_key]} em ${rk.total})` : ''}${a.short ? ' · ' + esc(a.short) : ''}${a.description ? `<br>${esc(a.description)}` : ''}${(a.meal_options || []).length ? `<br>Opções: ${a.meal_options.map((m) => esc(m.name)).join(', ')}` : ''}${(a.tips || []).map((t) => `<br>• ${esc(t)}`).join('')}</td><td>${dur(a.duration_min)}</td></tr>`).join('')}</table>
      ${d.rain_alt ? `<p><strong>Se chover:</strong> ${esc(d.rain_alt)}</p>` : ''}</section>`; }).join('')}
    ${hoteis ? `<section><h2>Hotéis</h2>${b.hotels.map((h) => `<p><strong>${esc(h.name)}</strong> · ${dataCurta(h.check_in)} → ${dataCurta(h.check_out)}${h.address ? ' · ' + esc(h.address) : ''}${h.booking_code ? ' · Reserva ' + esc(h.booking_code) : ''}</p>`).join('') || '<p>—</p>'}
      <h2>Transportes reservados</h2>${b.bookings.filter((x) => x.kind !== 'activity').map((x) => `<p><strong>${KIND_LABEL[x.kind]}</strong> · ${dataCurta(x.depart_date)} ${hhmm(x.depart_time)} · ${esc(x.from_place || '')} → ${esc(x.to_place || '')}${x.booking_code ? ' · Reserva ' + esc(x.booking_code) : ''}</p>`).join('') || '<p>—</p>'}</section>` : ''}
    ${extra ? `<section><h2>Ranking</h2><ol>${b.rankingItems.filter((i) => i.ranking_id === rk.r?.id).map((i) => `<li>${esc(i.title)}${i.note ? ' · ' + esc(i.note) : ''}</li>`).join('')}</ol>
      ${b.sections.map((s) => `<h2>${esc(s.title)}</h2>${s.content.map((c) => `<p>${c.t ? `<strong>${esc(c.t)}</strong> · ` : ''}${esc(c.d || c.v || '')}</p>`).join('')}`).join('')}
      <h2>Checklist</h2><ul>${b.checklist.map((c) => `<li>${c.done ? '☑' : '☐'} ${esc(c.title)}</li>`).join('')}</ul></section>` : ''}</div>`;
  const w = document.createElement('div'); w.innerHTML = html; document.body.appendChild(w); document.body.classList.add('a-imprimir');
  setTimeout(() => { window.print(); w.remove(); document.body.classList.remove('a-imprimir'); }, 200);
}

function vInstalar() {
  render(`<main class="pag"><header class="cab-pag"><a class="b-ic" href="javascript:history.back()" aria-label="Voltar">${I.voltar}</a><div><h1>Instalar no telemóvel</h1></div></header>
    <div class="caixa"><h2>iPhone</h2><ol class="passos"><li>Abre esta página no Safari.</li><li>Toca no botão Partilhar (quadrado com seta para cima).</li><li>Escolhe "Adicionar ao ecrã principal" e confirma.</li><li>Abre a app a partir do novo ícone; é assim que funcionará como app.</li></ol></div>
    <div class="caixa"><h2>Android</h2><ol class="passos"><li>Abre esta página no Chrome.</li><li>Toca no menu ⋮ e escolhe "Instalar app" ou "Adicionar ao ecrã principal".</li></ol></div></main>`);
}

// ---------- formulários ----------
const REGIMES = [['', '—'], ['so_alojamento', 'Só alojamento'], ['pequeno_almoco', 'Pequeno-almoço'], ['meia_pensao', 'Meia pensão'], ['pensao_completa', 'Pensão completa'], ['tudo_incluido', 'Tudo incluído']];
const regimeTxt = (k) => REGIMES.find(([v]) => v === k)?.[1] || '';
const dinheiro = (v, moeda = 'EUR') => v == null || v === '' ? '' : new Intl.NumberFormat('pt-PT', { style: 'currency', currency: moeda || 'EUR', currencyDisplay: 'narrowSymbol' }).format(Number(v));
// ---------- moeda local e câmbio (definido por viagem em Mais → Moeda e câmbio) ----------
const MOEDAS = [['EUR', 'Euro (€)'], ['JPY', 'Iene japonês (¥)'], ['GBP', 'Libra (£)'], ['USD', 'Dólar americano ($)'], ['CHF', 'Franco suíço'], ['CZK', 'Coroa checa'], ['DKK', 'Coroa dinamarquesa'], ['SEK', 'Coroa sueca'], ['NOK', 'Coroa norueguesa'], ['PLN', 'Zlóti polaco'], ['HUF', 'Forint húngaro'], ['TRY', 'Lira turca'], ['CAD', 'Dólar canadiano'], ['AUD', 'Dólar australiano'], ['BRL', 'Real brasileiro'], ['MXN', 'Peso mexicano'], ['THB', 'Baht tailandês'], ['CNY', 'Yuan chinês'], ['KRW', 'Won sul-coreano'], ['INR', 'Rupia indiana'], ['ZAR', 'Rand sul-africano'], ['MAD', 'Dirham marroquino'], ['ISK', 'Coroa islandesa']];
const moedasForm = (atual) => { const loc = S.b?.trip?.local_currency; const base = MOEDAS.filter(([k]) => ['EUR', loc, atual].includes(k));
  return [...base, ...MOEDAS.filter((m) => !base.includes(m))]; };
const cambio = () => { const t = S.b?.trip; const c = t?.info?.cambio; const loc = t?.local_currency;
  if (!loc || loc === 'EUR') return null;
  let taxa = Number(c?.taxa) || null;
  try { const m = JSON.parse(localStorage.getItem('cambio:' + loc) || 'null'); if (c?.auto !== false && m?.taxa) taxa = m.taxa; } catch {}
  return taxa ? { loc, taxa } : null; };
// converte entre euros e a moeda local da viagem; devolve o texto "≈ …" ou ''
function convTxt(v, moeda) {
  const c = cambio(); if (!c || v == null || v === '') return '';
  const m = moeda || 'EUR';
  if (m === 'EUR') return '≈ ' + dinheiro(Number(v) * c.taxa, c.loc);
  if (m === c.loc) return '≈ ' + dinheiro(Number(v) / c.taxa, 'EUR');
  return '';
}
// campo de valor: sempre em euros; se a viagem tiver outra moeda, ao lado um campo na moeda local ligado ao de euros
const campoValor = (n, l, v) => { const c = cambio(); const eur = campo(n, l + (c ? ' (€)' : ''), v ?? '', 'number', 'step="0.01" min="0" inputmode="decimal"');
  return c ? `<div class="duas val-par">${eur}<label class="campo"><span>${l} (${c.loc})</span><input type="number" min="0" step="any" inputmode="decimal" data-loc-for="${n}"></label></div>` : eur; };
function ligarMoeda(raiz) {
  const c = cambio(); if (!c) return; const casas = ['JPY', 'KRW', 'HUF', 'ISK'].includes(c.loc) ? 0 : 2;
  raiz.querySelectorAll('[data-loc-for]').forEach((loc) => { const eur = raiz.querySelector(`[name="${loc.dataset.locFor}"]`); if (!eur) return;
    const deEur = () => { loc.value = eur.value === '' ? '' : (Number(eur.value) * c.taxa).toFixed(casas); };
    deEur(); eur.addEventListener('input', (e) => { if (e.isTrusted) deEur(); });
    loc.addEventListener('input', () => { eur.value = loc.value === '' ? '' : (Number(loc.value) / c.taxa).toFixed(2); eur.dispatchEvent(new Event('input', { bubbles: true })); }); });
}
// para os detalhes: valor na moeda em que foi registado e, por baixo, o convertido
const dinheiroD = (v, moeda) => { const t = dinheiro(v, moeda); const c = convTxt(v, moeda); return t && c ? `${t}<small class="conv">${c}</small>` : t; };
async function atualizarCambio() {
  const t = S.b?.trip; const c = t?.info?.cambio; const loc = t?.local_currency;
  if (c?.auto === false || !loc || loc === 'EUR') return;
  const hoje = new Date().toISOString().slice(0, 10);
  try { const m = JSON.parse(localStorage.getItem('cambio:' + loc) || 'null'); if (m?.data === hoje) return; } catch {}
  try {
    const r = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${loc}`); const j = await r.json(); const taxa = j?.rates?.[loc];
    if (!taxa) return;
    try { localStorage.setItem('cambio:' + loc, JSON.stringify({ taxa, data: hoje })); } catch {}
    if (S.b.isOwner && Number(c?.taxa) !== taxa) { const info = { ...(t.info || {}), cambio: { ...(c || {}), auto: true, taxa, data: j.date || hoje } }; await sb.from('trips').update({ info }).eq('id', t.id); t.info = info; }
  } catch { /* sem rede: fica a última taxa guardada */ }
}
function fCambio() {
  const t = S.b.trip; const c = t.info?.cambio || {};
  folha('Moeda do país',
    `<p class="meta">A app trabalha sempre em euros. Se a moeda do país for outra, nos hotéis, transportes e atrações podes escrever o preço em euros ou na moeda local (o outro valor é calculado) e vês os dois valores lado a lado.</p>`
    + escolha('local_currency', 'Moeda do país', MOEDAS, t.local_currency || 'EUR')
    + escolha('auto', 'Taxa de câmbio', [['1', 'Automática (Banco Central Europeu, atualizada todos os dias)'], ['0', 'Manual']], c.auto === false ? '0' : '1')
    + campo('taxa', '1 € vale (na moeda do país)', c.taxa ?? '', 'number', 'step="0.0001" min="0" inputmode="decimal"')
    + (c.data && c.taxa ? `<p class="meta">Última taxa: 1 € = ${c.taxa} · ${dataCurta(c.data)}</p>` : ''),
  async (f) => { const info = { ...(t.info || {}), cambio: { auto: f.auto === '1', taxa: f.taxa === '' ? null : Number(f.taxa), data: c.data || null } };
    await op(sb.from('trips').update({ local_currency: f.local_currency, info }).eq('id', t.id), 'Moeda guardada.');
    try { localStorage.removeItem('cambio:' + f.local_currency); } catch {} atualizarCambio().then(() => router()); });
}
const faltaPagar = (h) => h.status === 'pago' ? 0 : h.total_price == null || h.total_price === '' ? null : Math.max(0, Number(h.total_price) - (Number(h.deposit) || 0));
const porNoiteQuarto = (h) => { const n = h.check_in && h.check_out ? noites(h.check_in, h.check_out) : 0; const q = Number(h.rooms) || 1;
  return h.total_price && n > 0 ? Number(h.total_price) / n / q : null; };
function fHotel(id, pre = {}) {
  const h = S.b.hotels.find((x) => x.id === id) || { rooms: 1, currency: 'EUR', status: 'reservado', ...pre };
  folha(id ? 'Editar hotel' : 'Novo hotel',
    campo('name', 'Nome', h.name, 'text', 'required') + campo('city', 'Cidade', h.city, 'text', 'required')
    + campo('address', 'Morada', h.address) + campo('maps_url', 'Link do Google Maps (opcional)', h.maps_url, 'url')
    + `<div class="duas">${campo('check_in', 'Check-in', h.check_in, 'date', 'required')}${campo('check_out', 'Check-out', h.check_out, 'date', 'required')}</div>`
    + `<div class="duas">${campo('check_in_time', 'Hora check-in', h.check_in_time, 'time')}${campo('check_out_time', 'Hora check-out', h.check_out_time, 'time')}</div>`
    + `<div class="duas">${escolha('board', 'Regime', REGIMES, h.board || '')}${campo('rooms', 'N.º de quartos', h.rooms ?? 1, 'number', 'min="1" step="1" required')}</div>`
    + campoValor('total_price', 'Valor total', h.total_price) + campoValor('deposit', 'Sinal pago', h.deposit)
    + '<div class="calculo" id="calc-noite" aria-live="polite"></div>'
    + `<div class="duas">${campo('payment_date', 'Data de pagamento', h.payment_date, 'date')}${campo('cancel_by', 'Cancelamento grátis até', h.cancel_by, 'date')}</div>`
    + campo('agency', 'Agência / plataforma', h.agency, 'text', 'placeholder="Ex.: Booking, direto no hotel"')
    + escolha('status', 'Estado da reserva', [['reservado', 'Reservado, pagamento por fazer'], ['pago', 'Pago (conta nos dias da viagem)'], ['cancelado', 'Cancelado']], h.status || 'reservado')
    + `<div class="duas">${campo('booking_code', 'Código de reserva', h.booking_code)}${campo('phone', 'Telefone', h.phone, 'tel')}</div>` + area('notes', 'Notas', h.notes)
    + (id ? '<button type="button" class="b-perigo" data-apagar>Apagar hotel</button>' : ''),
  async (f) => { f.trip_id = S.tripId; f.currency = 'EUR';
    { const ant = S.b.hotels.find((x) => x.id === id);
      if (f.address && (!ant || ant.address !== f.address || ant.city !== f.city || ant.lat == null)) { const g = await geocodificar([f.address, f.city].filter(Boolean).join(', ')) || await geocodificar([f.name, f.city].filter(Boolean).join(', ')); f.lat = g?.lat ?? null; f.lng = g?.lng ?? null; }
      else if (!f.address && (!ant || ant.lat == null)) { const g = f.name ? await geocodificar([f.name, f.city].filter(Boolean).join(', ')) : null; f.lat = g?.lat ?? null; f.lng = g?.lng ?? null; } }
    for (const k of ['maps_url', 'check_in_time', 'check_out_time', 'board', 'payment_date', 'cancel_by', 'total_price', 'agency', 'city', 'deposit']) if (!f[k]) f[k] = null;
    if (f.deposit != null) f.deposit = Number(f.deposit);
    if (f.deposit != null && f.total_price != null && f.deposit > f.total_price) throw new Error('O sinal não pode ser maior do que o valor total.');
    f.rooms = Number(f.rooms) || 1; if (f.status === 'pago' && !(S.b.hotels.find((x) => x.id === id) || {}).paid_at) f.paid_at = new Date().toISOString(); if (f.total_price != null) f.total_price = Number(f.total_price);
    if (f.check_out <= f.check_in) throw new Error('O check-out tem de ser depois do check-in.');
    if (f.status !== 'cancelado') { const outra = S.b.hotels.find((x) => x.id !== id && x.status !== 'cancelado' && x.check_in < f.check_out && f.check_in < x.check_out && (x.check_in !== f.check_in || x.check_out !== f.check_out));
      if (outra) throw new Error(`Esta reserva sobrepõe-se a ${outra.name} (${dataCurta(outra.check_in)} → ${dataCurta(outra.check_out)}). Reservas para as mesmas noites têm de ter o mesmo check-in e check-out.`); }
    if (f.status === 'pago' && S.b.hotels.some((x) => x.id !== id && x.status === 'pago' && x.check_in < f.check_out && f.check_in < x.check_out))
      throw new Error('Já há uma reserva paga para algumas destas noites. Só pode haver uma paga por noite: cancela a outra primeiro.');
    await op(id ? sb.from('hotels').update(f).eq('id', id) : sb.from('hotels').insert(f), 'Hotel guardado.'); });
  const form = document.querySelector('.folha form'); const out = document.getElementById('calc-noite');
  const calc = () => { const v = Object.fromEntries(new FormData(form)); const p = porNoiteQuarto(v); const n = v.check_in && v.check_out ? noites(v.check_in, v.check_out) : 0;
    const fp = faltaPagar(v);
    out.innerHTML = (p != null ? `<span>Valor por noite e por quarto</span><strong>${dinheiroD(p, 'EUR')}</strong><small>${n} noite${n === 1 ? '' : 's'} × ${Number(v.rooms) || 1} quarto${Number(v.rooms) > 1 ? 's' : ''}</small>` : '<span>Valor por noite e por quarto</span><small>Preenche as datas, os quartos e o valor total.</small>')
      + (fp != null ? `<span class="calc-l2">${v.status === 'pago' ? 'Pago na totalidade' : 'Falta pagar'}</span><strong class="calc-l2">${dinheiroD(fp, 'EUR')}</strong>` : ''); };
  form.addEventListener('input', calc); calc();
  ligarDatas(form, 'check_in', 'check_out', 1);
  ligarApagar('hotels', id, 'Apagar este hotel?');
}
function fReserva(id) {
  const x = S.b.bookings.find((y) => y.id === id) || { kind: 'flight' };
  folha(id ? 'Editar reserva' : 'Nova reserva', escolha('kind', 'Tipo', Object.entries(KIND_LABEL), x.kind) + campo('title', 'Descrição (opcional)', x.title)
    + `<div class="duas">${campo('from_place', 'De', x.from_place, 'text', 'required')}${campo('to_place', 'Para', x.to_place, 'text', 'required')}</div>`
    + `<div class="duas">${campo('depart_date', 'Data de partida', x.depart_date, 'date', 'required')}${campo('depart_time', 'Hora', x.depart_time, 'time')}</div>`
    + `<div class="duas">${campo('arrive_date', 'Data de chegada', x.arrive_date, 'date')}${campo('arrive_time', 'Hora', x.arrive_time, 'time')}</div>`
    + `<div class="duas">${campo('carrier', 'Companhia aérea / empresa', x.carrier)}${campo('number', 'N.º (voo, comboio)', x.number)}</div>`
    + `<div class="duas">${campo('booking_code', 'N.º de reserva', x.booking_code)}${campo('vendor', 'Empresa vendedora', x.vendor)}</div>` + area('notes', 'Notas', x.notes)
    + (id ? '<button type="button" class="b-perigo" data-apagar>Apagar reserva</button>' : ''),
  async (f) => { f.trip_id = S.tripId; if (!f.arrive_date) f.arrive_date = null; await op(id ? sb.from('bookings').update(f).eq('id', id) : sb.from('bookings').insert(f), 'Reserva guardada.'); });
  ligarDatas(document.querySelector('.folha form'), 'depart_date', 'arrive_date', 0);
  ligarApagar('bookings', id, 'Apagar esta reserva e os bilhetes associados?');
}
// a data final abre no mês da data inicial: mínimo = data inicial, e se estiver vazia ou antes, passa para o dia seguinte
function ligarDatas(form, campoIni, campoFim, diasDepois = 0) {
  const ini = form.querySelector(`[name="${campoIni}"]`), fim = form.querySelector(`[name="${campoFim}"]`); if (!ini || !fim) return;
  const acertar = () => { if (!ini.value) return; const m = diasDepois ? maisDia(ini.value) : ini.value; fim.min = m;
    if (!fim.value || fim.value < m) fim.value = m; fim.dispatchEvent(new Event('input', { bubbles: true })); };
  ini.addEventListener('change', acertar); if (ini.value) fim.min = diasDepois ? maisDia(ini.value) : ini.value;
}
function ligarApagar(tabela, id, pergunta) {
  if (!id) return;
  document.querySelector('[data-apagar]')?.addEventListener('click', async () => {
    if (!confirm(pergunta)) return; document.querySelector('.folha-fundo')?.remove();
    await op(sb.from(tabela).delete().eq('id', id), 'Apagado.');
  });
}
function fAtividade(id) {
  const a = S.b.activities.find((x) => x.id === id);
  folha('Editar atividade', campo('title', 'Nome', a.title, 'text', 'required') + `<div class="duas">${campo('start_time', 'Hora', hhmm(a.start_time), 'time')}${campo('duration_min', 'Duração (min)', a.duration_min ?? '', 'number', 'min="0"')}</div>`
    + area('description', 'Descrição', a.description) + campo('maps', 'Corrigir local: link do Google Maps', '', 'url', 'placeholder="Colar link (opcional)"')
    + '<p class="nota">O que alterares aqui fica marcado como teu: em atualizações do roteiro pergunto-te antes de mudar.</p>',
  async (f) => {
    const mf = new Set(a.manual_fields || []); const up = {};
    if (f.title !== a.title) { up.title = f.title; mf.add('title'); }
    if (f.start_time !== hhmm(a.start_time)) { up.start_time = f.start_time || null; mf.add('start_time'); }
    if (String(f.duration_min) !== String(a.duration_min ?? '')) { up.duration_min = f.duration_min ? Number(f.duration_min) : null; mf.add('duration_min'); }
    if ((f.description || '') !== (a.description || '')) { up.description = f.description; mf.add('description'); }
    if (f.maps) { const m = f.maps.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/); Object.assign(up, m ? { lat: +m[1], lng: +m[2], place_id: null, maps_query: null } : { lat: null, lng: null, place_id: null, maps_query: f.maps }); mf.add('place'); }
    up.manual_fields = [...mf];
    await op(sb.from('activities').update(up).eq('id', id), 'Atividade atualizada.');
  });
}
function fLembrete(campoId, id) {
  folha('Novo lembrete', escolha('offset_minutes', 'Quando', OFFSETS, 1440)
    + (campoId === 'prebooking_id' ? '' : escolha('audience', 'Para quem', [['all', 'Todos os participantes'], ['owner', 'Só eu']], 'all')),
  async (f) => op(sb.from('reminders').insert({ trip_id: S.tripId, [campoId]: id, offset_minutes: Number(f.offset_minutes), audience: campoId === 'prebooking_id' ? 'owner' : f.audience }), 'Lembrete guardado.'));
}
function fMembroDoc(campoId, id) {
  folha('Juntar documento', escolha('doc_type', 'Tipo de documento', TIPOS_DOC, 'bilhete')
    + campo('label', 'Nome', '', 'text', 'placeholder="ex.: Fatura do hotel, Bilhete do Miguel"')
    + escolha('member_id', 'De quem', [['', 'Do grupo (sem pessoa)'], ...pessoas().map((m) => [m.id, m.display_name])], '')
    + '<label class="campo"><span>Ficheiro</span><input type="file" name="ficheiro" accept="image/*,application/pdf" required></label>',
  async () => {
    const form = document.querySelector('.folha form'); const fd = new FormData(form); const file = fd.get('ficheiro');
    const nome = (fd.get('label') || '').trim() || (file?.name || '').replace(/\.[^.]+$/, '');
    await guardarBilhete(file, { [campoId]: id, member_id: fd.get('member_id') || null, label: nome || null, doc_type: fd.get('doc_type') || 'bilhete' });
  });
}
function fEditarDoc(id) {
  const t = S.b.tickets.find((x) => x.id === id); if (!t) return;
  folha('Documento', escolha('doc_type', 'Tipo de documento', TIPOS_DOC, t.doc_type || 'bilhete') + campo('label', 'Nome', t.label || '')
    + escolha('member_id', 'De quem', [['', 'Do grupo (sem pessoa)'], ...pessoas().map((m) => [m.id, m.display_name])], t.member_id || ''),
  async (v) => op(sb.from('tickets').update({ doc_type: v.doc_type, label: v.label.trim() || null, member_id: v.member_id || null }).eq('id', id), 'Documento guardado.'));
}
async function guardarBilhete(file, extra) {
  const f = file.type.startsWith('image/') ? await comprimir(file, 2000, 0.9) : file;
  const path = await enviarFicheiro('tickets', S.tripId, f, 'bilhetes');
  await op(sb.from('tickets').insert({ trip_id: S.tripId, path, mime: f.type, ...extra }), 'Documento guardado.');
}
function fConvidar() {
  folha('Convidar participante', campo('display_name', 'Nome', '', 'text', 'required') + campo('email', 'Email', '', 'email', 'required')
    + '<p class="nota">A pessoa recebe um email para definir a password e passa a ver esta viagem (só consulta).</p>',
  async (f) => { const r = await convidar(S.tripId, f.email, f.display_name); toast(r.invited ? 'Convite enviado.' : 'Adicionado: já tinha conta.'); await recarregar(); });
}
function fNovaViagem() {
  folha('Nova viagem', campo('title', 'Nome da viagem', '', 'text', 'required') + campo('subtitle', 'Cidades (opcional)', '')
    + `<div class="duas">${campo('start_date', 'Início', '', 'date', 'required')}${campo('end_date', 'Fim', '', 'date', 'required')}</div>`,
  async (f) => { const { data, error } = await sb.from('trips').insert(f).select().single(); if (error) throw error; location.hash = `#/v/${data.id}/resumo`; });
}

// ---------- ações ----------

// ---------- Guia do local: texto completo + narração com a voz do aparelho ----------
function guiaBlocos(txt) {
  return String(txt).split(/\n\s*\n|\n(?=## )/).map((x) => x.trim()).filter(Boolean)
    .flatMap((x) => x.startsWith('## ') ? (() => { const [t, ...r] = x.split('\n'); return [{ t: 'h', s: t.slice(3).trim() }, ...(r.join(' ').trim() ? [{ t: 'p', s: r.join(' ').trim() }] : [])]; })() : [{ t: 'p', s: x.replace(/\n/g, ' ') }]);
}
function guiaHtml(txt, audio = null, titulo = '') {
  const bl = guiaBlocos(txt); const corte = Math.min(bl.length, bl[0]?.t === 'h' ? 2 : 1);
  const min = Math.max(1, Math.round(String(txt).split(/\s+/).length / 150));
  const el = (x, i) => x.t === 'h' ? `<h3 data-gi="${i}">${esc(x.s)}</h3>` : `<p data-gi="${i}">${esc(x.s)}</p>`;
  const podeOuvir = 'speechSynthesis' in window;
  return `<div class="caixa guia" id="guia">
    <div class="cx-h"><h2>Guia do local</h2><span class="guia-min">${min} min a ouvir</span></div>
    ${audio ? `<div class="leitor" data-titulo="${esc(titulo)}">
      <button class="lt-play" data-act="aud-play" aria-label="Ouvir o guia">${I.ouvir}</button>
      <div class="lt-meio"><div class="lt-tit">Ouvir o guia</div>
        <input class="lt-barra" type="range" min="0" max="1000" value="0" step="1" aria-label="Posição no áudio">
        <div class="lt-tempos"><span class="lt-at">0:00</span><span class="lt-tot">–:–</span></div></div>
      <button class="lt-vel" data-act="aud-vel" aria-label="Velocidade">1×</button>
      <audio id="guia-audio" preload="metadata" src="${esc(audio)}"></audio></div>`
    : `<div class="guia-ctl"><button class="b-ouvir" data-act="guia-ouvir">${I.ouvir}<span>Ouvir o guia</span></button><button class="b-parar" data-act="guia-parar" hidden aria-label="Parar">${I.parar}</button></div>`}
    <div class="guia-txt">${bl.slice(0, corte).map((x, i) => el(x, i)).join('')}
      ${bl.length > corte ? `<div class="guia-mais" hidden>${bl.slice(corte).map((x, i) => el(x, i + corte)).join('')}</div>` : ''}</div>
    ${bl.length > corte ? `<button class="b-link guia-ler" data-act="guia-ler">Ler tudo</button>` : ''}</div>`;
}
const VOZ = { i: 0, fila: [], tok: 0, estado: 'parado' };
function vozPT() {
  const v = speechSynthesis.getVoices();
  return v.find((x) => /pt[-_]PT/i.test(x.lang)) || v.find((x) => /^pt/i.test(x.lang)) || null;
}
function guiaUI() {
  const b = document.querySelector('.b-ouvir'); if (!b) return;
  const st = VOZ.estado;
  b.innerHTML = st === 'a-ler' ? `${I.pausa}<span>Pausa</span>` : `${I.ouvir}<span>${st === 'pausa' ? 'Continuar' : 'Ouvir o guia'}</span>`;
  b.classList.toggle('on', st === 'a-ler');
  document.querySelector('.b-parar').hidden = st === 'parado';
  document.querySelectorAll('.guia [data-gi]').forEach((e) => e.classList.toggle('a-ler', st !== 'parado' && Number(e.dataset.gi) === VOZ.i));
}
function guiaAbrir(abrir = true) {
  const m = document.querySelector('.guia-mais'), l = document.querySelector('.guia-ler'); if (!m) return;
  m.hidden = !abrir; if (l) l.textContent = abrir ? 'Mostrar menos' : 'Ler tudo';
}
function guiaFalar() {
  const tok = ++VOZ.tok;
  if (VOZ.i >= VOZ.fila.length) { VOZ.estado = 'parado'; VOZ.i = 0; return guiaUI(); }
  const u = new SpeechSynthesisUtterance(VOZ.fila[VOZ.i]);
  u.lang = 'pt-PT'; const v = vozPT(); if (v) u.voice = v; u.rate = 1;
  u.onend = () => { if (tok !== VOZ.tok || VOZ.estado !== 'a-ler') return; VOZ.i++; guiaFalar(); };
  u.onerror = u.onend;
  VOZ.estado = 'a-ler'; guiaUI();
  const alvo = document.querySelector(`.guia [data-gi="${VOZ.i}"]`);
  if (alvo) { if (alvo.closest('.guia-mais')?.hidden) guiaAbrir(true); const r = alvo.getBoundingClientRect(); if (r.top < 80 || r.bottom > innerHeight - 100) alvo.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  speechSynthesis.speak(u);
}
function guiaParar(reset = true) { VOZ.tok++; try { speechSynthesis.cancel(); } catch {} VOZ.estado = reset ? 'parado' : 'pausa'; if (reset) VOZ.i = 0; guiaUI(); }
window.addEventListener('hashchange', () => { if (VOZ.estado !== 'parado') guiaParar(); });
// ---------- Leitor do áudio do guia (voz natural gravada) ----------
const mmss = (t) => isFinite(t) ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}` : '–:–';
function leitorLigar() {
  const au = document.getElementById('guia-audio'); if (!au || au._lig) return; au._lig = true;
  const L = au.closest('.leitor'), barra = L.querySelector('.lt-barra');
  const pinta = () => { const p = au.duration ? au.currentTime / au.duration : 0; barra.value = Math.round(p * 1000); barra.style.setProperty('--p', (p * 100) + '%');
    L.querySelector('.lt-at').textContent = mmss(au.currentTime); L.querySelector('.lt-tot').textContent = mmss(au.duration); };
  const estado = () => { const on = !au.paused; L.classList.toggle('on', on);
    L.querySelector('.lt-play').innerHTML = on ? I.pausa : I.ouvir; L.querySelector('.lt-play').setAttribute('aria-label', on ? 'Pausa' : 'Ouvir o guia');
    L.querySelector('.lt-tit').textContent = on ? 'A ouvir o guia' : (au.currentTime > 0 && !au.ended ? 'Em pausa' : 'Ouvir o guia'); };
  au.addEventListener('loadedmetadata', () => { pinta(); const m = document.querySelector('.guia-min'); if (m && isFinite(au.duration)) m.textContent = `${Math.max(1, Math.round(au.duration / 60))} min a ouvir`; }); au.addEventListener('timeupdate', pinta);
  au.addEventListener('play', estado); au.addEventListener('pause', estado); au.addEventListener('ended', () => { au.currentTime = 0; estado(); pinta(); });
  au.addEventListener('error', () => { L.querySelector('.lt-tit').textContent = 'Não foi possível carregar o áudio'; });
  barra.addEventListener('input', () => { if (au.duration) au.currentTime = (barra.value / 1000) * au.duration; pinta(); });
  if ('mediaSession' in navigator) au.addEventListener('play', () => { try { navigator.mediaSession.metadata = new MediaMetadata({ title: L.dataset.titulo || 'Guia', artist: 'Roteiros Miguel' }); } catch {} });
}
window.addEventListener('hashchange', () => { const au = document.getElementById('guia-audio'); if (au) au.pause(); });
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  try {
    if (a === 'aud-play') { const au = document.getElementById('guia-audio'); leitorLigar(); if (au.paused) { if (VOZ.estado !== 'parado') guiaParar(); await au.play().catch(() => toast('Não foi possível tocar o áudio.')); } else au.pause(); return; }
    if (a === 'aud-vel') { const au = document.getElementById('guia-audio'); const seq = [1, 1.25, 1.5, 0.85]; const n = seq[(seq.indexOf(au.playbackRate) + 1) % seq.length] || 1; au.playbackRate = n; el.textContent = String(n).replace('.', ',') + '×'; return; }
    if (a === 'guia-ler') { return guiaAbrir(document.querySelector('.guia-mais').hidden); }
    if (a === 'guia-parar') return guiaParar(true);
    if (a === 'guia-ouvir') {
      if (!('speechSynthesis' in window)) return toast('Este ecrã não tem voz disponível. Abre a app no Safari ou no Chrome para ouvir o guia.');
      if (VOZ.estado === 'a-ler') return guiaParar(false);
      if (VOZ.estado === 'parado') { VOZ.fila = [...document.querySelectorAll('.guia [data-gi]')].map((x) => x.textContent); VOZ.i = 0; }
      return guiaFalar();
    }
    if (a === 'sair') { await sb.auth.signOut(); const t = localStorage.getItem('tema'); localStorage.clear(); if (t) localStorage.setItem('tema', t); location.hash = '#/login'; return; }
    if (a === 'esqueci') { const email = document.querySelector('[name=email]').value; if (!email) return toast('Escreve primeiro o teu email.');
      await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); return toast('Enviámos um email para definires nova password.'); }
    if (a === 'criar-conta') { const email = document.querySelector('[name=email]').value, password = document.querySelector('[name=password]').value;
      if (!email || password.length < 8) return toast('Escreve o email e uma password com pelo menos 8 caracteres.');
      const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
      return toast(error ? error.message : 'Conta criada. Confirma o email que te enviámos e depois entra.'); }
    if (a === 'tema') { const seq = { auto: 'light', light: 'dark', dark: 'auto' }; localStorage.setItem('tema', seq[temaAtual()]); aplicarTema(); return router(); }
    if (a === 'nova-viagem') return fNovaViagem();
    if (a === 'opcao') { sessionStorage.setItem('opcao:' + el.dataset.dia, el.dataset.g); return router(); }
    if (a === 'fixar-opcao') { const info = { ...(S.b.trip.info || {}) }; info.escolhas = { ...(info.escolhas || {}), [el.dataset.dia]: el.dataset.g };
      return op(sb.from('trips').update({ info }).eq('id', S.tripId), 'Opção escolhida.'); }
    if (a === 'ver-bilhete') { const u = await abrirBilhete(el.dataset.path); return u ? window.open(u, '_blank') : toast('Bilhete indisponível sem rede. Usa "Guardar bilhetes neste telemóvel".'); }
    if (a === 'apagar-bilhete') { if (!confirm('Apagar este bilhete?')) return; await apagarFicheiro('tickets', el.dataset.path); return op(sb.from('tickets').delete().eq('id', id), 'Bilhete apagado.'); }
    if (a === 'gerir-fotos') { return gerirFotos(id); }
    if (a === 'apagar-foto') { if (!confirm('Apagar esta fotografia? Não é possível desfazer.')) return; document.querySelector('.folha-fundo')?.remove(); if (el.dataset.path) await apagarFicheiro('photos', el.dataset.path); return op(sb.from('activity_photos').delete().eq('id', id), 'Fotografia apagada.'); }
    if (a === 'novo-lembrete') return fLembrete(el.dataset.campo, id);
    if (a === 'apagar-lembrete') return op(sb.from('reminders').delete().eq('id', id), 'Lembrete apagado.');
    if (a === 'calendario') { const at = S.b.activities.find((x) => x.id === id); const d = S.b.days.find((x) => x.id === at.day_id);
      const al = S.b.reminders.filter((r) => r.activity_id === id).map((r) => r.offset_minutes);
      return descarregar(ics({ titulo: at.title, data: d.date, hora: hhmm(at.start_time), duracao: at.duration_min || 60, local: at.place_name || at.maps_query || '', alarmes: al.length ? al : [60], tz: tz() }), `${at.title}.ics`); }
    if (a === 'editar-ativ') return fAtividade(id);
    if (a === 'hotel') return fHotel(id);
    if (a === 'hotel-novo') return fHotel(null, { check_in: el.dataset.in, check_out: el.dataset.out, city: el.dataset.cidade || null });
    if (a === 'hotel-pago') { const h = S.b.hotels.find((x) => x.id === id);
      const outra = S.b.hotels.find((x) => x.id !== id && x.status === 'pago' && x.check_in < h.check_out && h.check_in < x.check_out);
      if (outra) { if (!confirm(`Já há uma reserva paga para estas noites: ${outra.name} (${dataCurta(outra.check_in)} → ${dataCurta(outra.check_out)}).\n\nSó pode haver uma reserva paga por noite. Queres marcar ${outra.name} como cancelada e ${h.name} como paga?`)) return;
        const { error } = await sb.from('hotels').update({ status: 'cancelado' }).eq('id', outra.id); if (error) throw error; }
      else if (!confirm(`Confirmar o pagamento de ${h.name}? O hotel passa a constar nos dias da viagem.`)) return;
      return op(sb.from('hotels').update({ status: 'pago', paid_at: new Date().toISOString(), payment_date: h.payment_date || hojeEm(tz()) }).eq('id', id), 'Pagamento registado. O hotel já aparece nos dias.'); }
    if (a === 'hotel-cancelar') { if (!confirm('Marcar esta reserva como cancelada? Fica guardada em "Reservas canceladas".')) return;
      return op(sb.from('hotels').update({ status: 'cancelado' }).eq('id', id), 'Reserva marcada como cancelada.'); }
    if (a === 'reserva') return fReserva(id);
    if (a === 'ficha-transporte') return fichaTransporte(id);
    if (a === 'preco-ativ') return fichaPreco(id);
    if (a === 'ficha-editar') return fFicha(id);
    if (a === 'ficha-membro') { // criar a ficha de um participante: pede a palavra-passe antes, se preciso
      const m = S.b.members.find((x) => x.id === id);
      const criar = () => folha('Nova ficha · ' + m.display_name, campo('nome', 'Nome completo', '', 'text', 'required'), async (v) => {
        const r = await sb.from('fichas_pessoais').insert({ nome: v.nome.trim(), ordem: 99 }).select('id').single(); if (r.error || !r.data) throw new Error('Não foi possível criar a ficha.');
        await sb.from('trip_members').update({ ficha_id: r.data.id }).eq('id', m.id); m.ficha_id = r.data.id; location.hash = `#/v/${S.tripId}/ficha/${r.data.id}`; });
      if (Date.now() > FICHAS_ATE) { location.hash = `#/v/${S.tripId}/fichas`; toast('Desbloqueia primeiro com a tua palavra-passe.'); return; }
      return criar(); }
    if (a === 'viajante-novo') return folha('Acrescentar viajante', '<p class="meta">Para quem viaja mas não vai usar a app. Conta para os bilhetes de cada pessoa e pode ter ficha.</p>' + campo('display_name', 'Nome (como aparece na app)', '', 'text', 'required'),
      async (v) => op(sb.from('trip_members').insert({ trip_id: S.tripId, display_name: v.display_name.trim(), role: 'viewer', sort_order: S.b.members.length + 1 }), 'Viajante acrescentado.'));
    if (a === 'dois-passos') return fDoisPassos();
    if (a === 'local') return vLocal(el.dataset.tab, id);
    if (a === 'lingua') return folha('Língua local', '<p class="meta">Nos hotéis, atrações, aeroportos e estações aparece um pequeno botão 文A com o nome, a morada e o telefone na língua local, para mostrar ao taxista. Os dados vêm do Google Maps e atualizam-se sozinhos quando acrescentas ou mudas um local.</p>' + escolha('lingua', 'Língua do país', LINGUAS, linguaViagem()),
      async (v) => { const t = S.b.trip; const info = { ...(t.info || {}), lingua: v.lingua || null }; await op(sb.from('trips').update({ info }).eq('id', t.id), v.lingua ? 'Língua guardada. A preencher hotéis, atrações e estações em fundo…' : 'Língua guardada.'); });
    if (a === 'mudar-pw') return folha('Mudar palavra-passe', '<p class="meta">É a palavra-passe com que entras na app e que desbloqueia as fichas dos viajantes.</p>' + campo('p1', 'Nova palavra-passe', '', 'password', 'required minlength="8" autocomplete="new-password"') + campo('p2', 'Repetir a nova palavra-passe', '', 'password', 'required minlength="8" autocomplete="new-password"'),
      async (v) => { if (v.p1 !== v.p2) throw new Error('As palavras-passe não são iguais.'); const { error } = await sb.auth.updateUser({ password: v.p1 }); if (error) throw new Error(error.message || 'Não foi possível mudar.'); toast('Palavra-passe mudada.'); });
    if (a === 'fichas-ver') { FICHAS_VER = !FICHAS_VER; return vFichas(); }
    if (a === 'fichas-bloquear') { FICHAS_ATE = 0; FICHAS_VER = false; S.fichas = []; return vFichas(); }
    if (a === 'copiar') { try { await navigator.clipboard.writeText(el.dataset.v); toast('Copiado.'); } catch { toast('Não foi possível copiar.'); } return; }
    if (a === 'estado-viagem') { const t = S.b.trip; const nova = viagemAtiva(t) ? 'inativa' : 'ativa';
      if (nova === 'inativa' && !confirm('Marcar esta viagem como inativa? Passa para "Viagens inativas" na lista de viagens.')) return;
      const info = { ...(t.info || {}), estado: nova }; return op(sb.from('trips').update({ info }).eq('id', t.id), nova === 'ativa' ? 'Viagem marcada como ativa.' : 'Viagem marcada como inativa.'); }
    if (a === 'sobre-dia') { const box = document.querySelector('.sobre-dia'); if (box) { box.hidden = !box.hidden; el.setAttribute('aria-expanded', String(!box.hidden)); el.classList.toggle('on', !box.hidden); } return; }
    if (a === 'cambio') return fCambio();
    if (a === 'ver-fotos-dia') { if (e.target.closest('.foto-add, .credito')) return; const d = S.b.days.find((x) => x.id === id); return verFotos(await fotosDoDiaTodas(d), 0, `Dia ${d.day_number} · ${d.city || ''}`); }
    if (a === 'ver-fotos-ativ') { if (e.target.closest('.credito')) return; const at = S.b.activities.find((x) => x.id === id);
      const ord = S.b.photos.filter((p) => p.activity_id === id).sort((x, y) => (x.external_url ? 1 : 0) - (y.external_url ? 1 : 0));
      return verFotos(await fotosDe(ord), Number(el.dataset.i) || 0, at?.title || ''); }
    if (a === 'rk-resumo') { try { sessionStorage.setItem('rkResumo:' + S.tripId, id); } catch {} const sc = window.scrollY; vResumo(); window.scrollTo(0, sc); return; }
    if (a === 'mapa-dia') { const g = S.mapa?.grupos?.[el.dataset.n]; if (!g) return; const on = el.getAttribute('aria-pressed') === 'true';
      el.setAttribute('aria-pressed', String(!on)); el.classList.toggle('on', !on); if (on) S.mapa.mapa.removeLayer(g); else g.addTo(S.mapa.mapa); return; }
    if (a === 'escolher-membro') return fMembroDoc(el.dataset.campo, id);
    if (a === 'editar-doc') return fEditarDoc(id);
    if (a === 'pre-feito') { const p = S.b.prebookings.find((x) => x.id === id); return op(sb.from('prebookings').update({ done: !p.done, done_at: !p.done ? new Date().toISOString() : null }).eq('id', id), !p.done ? 'Marcada como feita.' : 'Marcada como por fazer.'); }
    if (a === 'hotel-reservar') return fHotel(null, { check_in: el.dataset.ini, check_out: el.dataset.fim, city: el.dataset.cidade });
    if (a === 'convidar') return fConvidar();
    if (a === 'remover-membro') { if (!confirm('Remover esta pessoa da viagem?')) return; return op(sb.from('trip_members').delete().eq('id', id), 'Removido.'); }
    if (a === 'offline') { toast('A guardar bilhetes…'); const n = await guardarBilhetesOffline(S.b.tickets); return toast(`${n} bilhete${n === 1 ? '' : 's'} guardado${n === 1 ? '' : 's'} neste telemóvel.`); }
  } catch (err) { toast(err.message || 'Ocorreu um erro.'); }
});
document.addEventListener('change', async (e) => {
  const el = e.target;
  try {
    if (el.dataset.act === 'pre') return op(sb.from('prebookings').update({ done: el.checked, done_at: el.checked ? new Date().toISOString() : null }).eq('id', el.dataset.id));
    if (el.dataset.act === 'chk') return op(sb.from('checklist_items').update({ done: el.checked }).eq('id', el.dataset.id));
    const up = el.dataset.up; if (!up || !el.files?.length) return;
    toast('A enviar…');
    if (up === 'bilhete') return guardarBilhete(el.files[0], { [el.dataset.campo]: el.dataset.id, member_id: el.dataset.membro });
    if (up === 'foto-ativ') { document.querySelector('.folha-fundo')?.remove(); for (const f of el.files) { const path = await enviarFicheiro('photos', S.tripId, await comprimir(f), 'atividades'); await sb.from('activity_photos').insert({ trip_id: S.tripId, activity_id: el.dataset.id, path }); } return recarregar(); }
    if (up === 'foto-dia') { const path = await enviarFicheiro('photos', S.tripId, await comprimir(el.files[0]), 'dias'); return op(sb.from('days').update({ photo_path: path }).eq('id', el.dataset.id), 'Foto guardada.'); }
  } catch (err) { toast(err.message || 'Não foi possível enviar.'); }
});

// ---------- router ----------
async function router() {
  const s = await sessao();
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (entradaEspecial && s && !sessionStorage.getItem('pw-ok')) { sessionStorage.setItem('pw-ok', '1'); return vLogin('nova'); }
  if (!s) return vLogin();
  if (parts[0] === 'login') { location.hash = '#/'; return; }
  if (parts[0] === 'instalar') return vInstalar();
  if (parts[0] !== 'v') return vViagens();
  const id = parts[1];
  if (S.tripId !== id || !S.b) {
    render('<main class="pag"><p class="carrega">A carregar a viagem…</p></main>');
    S.tripId = id;
    try { S.b = await carregarViagem(id); } catch { S.b = null; toast('Não foi possível abrir esta viagem.'); return vViagens(); }
    setTimeout(autoLocais, 1500);
    atualizarCambio();
    setTimeout(completarFotos, 1500);
  }
  const v = parts[2];
  if (!v) { try { history.replaceState(null, '', `#/v/${id}/resumo`); } catch { /* pré-visualização */ } return vResumo(); }
  const m = {
    dia: () => vDia(Number(parts[3]) || 1),
    a: () => { const at = S.b.activities.find((x) => x.id === parts[3]); const d = at && S.b.days.find((x) => x.id === at.day_id);
      if (at && parts[4] === 'r') return ehPC() ? vRanking(parts[5], at.ext_key) : vAtividade(parts[3], false, parts[6] === 'resumo' ? `#/v/${id}/resumo` : `#/v/${id}/ranking/${parts[5]}/${at.ext_key}`);
      return ehPC() && d ? vDia(d.day_number, at.id) : vAtividade(parts[3]); }, resumo: vResumo, hoteis: vHoteis, transportes: vTransportes, mais: vMais,
    mapa: () => vMapa(parts[3]), fichas: () => vFichas(), ficha: () => vFichas(parts[3]), definicoes: () => vDefinicoes(), cidades: () => vCidades(), tempo: () => vTempo(parts[3], parts[4]), reservas: vReservas, checklist: vChecklist, ranking: () => parts[3] ? vRanking(parts[3], parts[4]) : vRankings(), secao: () => vSecao(parts[3]), participantes: vParticipantes, exportar: vExportar,
  };
  return (m[v] || vResumo)();
}
// ao abrir a app começa sempre em "As nossas viagens" (um recarregar a meio da utilização mantém o ecrã)
(function entrada() {
  let aberta = false; try { aberta = !!sessionStorage.getItem('app-aberta'); sessionStorage.setItem('app-aberta', '1'); } catch {}
  if (!aberta && /^#\/v\//.test(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search + '#/'); } catch { location.hash = '#/'; } }
})();
window.addEventListener('hashchange', () => { if (!/\/fichas?(\/|$)/.test(location.hash)) { S.fichas = []; FICHAS_VER = false; } router(); });
matchMedia('(min-width: 1000px)').addEventListener('change', () => router());
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => router());
sb.auth.onAuthStateChange((ev) => { if (ev === 'PASSWORD_RECOVERY') vLogin('nova'); });
// atualizar o "agora" no ecrã do dia a cada minuto
setInterval(() => { if (/\/dia\//.test(location.hash) && !document.querySelector('.folha-fundo')) router(); }, 60000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
router();

// animação de arranque: uma vez por sessão, no mínimo até ao nome aparecer
(function arranque() {
  const el = document.getElementById('arranque'); if (!el) return;
  if (sessionStorage.getItem('arranque-visto')) { el.remove(); return; }
  sessionStorage.setItem('arranque-visto', '1');
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => { el.classList.add('sair'); setTimeout(() => el.remove(), 600); }, reduzido ? 900 : 4000);
})();
