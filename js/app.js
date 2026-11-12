import { sb, sessao, listarViagens, carregarViagem, urlsAssinados, enviarFicheiro, apagarFicheiro, guardarBilhetesOffline, abrirBilhete, convidar, entradaEspecial, fotoWiki } from './data.js';
import { esc, hhmm, dur, dataLonga, dataCurta, intervalo, noites, hojeEm, agoraMin, toMin, mapsDirLink, mapsPlaceLink, mapsQueryLink, mapsRouteLink, comprimir, ics, descarregar, OFFSETS, offsetTxt, KIND_LABEL } from './util.js';

const $app = document.getElementById('app');
const S = { b: null, tripId: null, trips: null };

// ---------- ícones ----------
const I = {
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
const NAV = [['dia', 'Dia', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'], ['resumo', 'Resumo', '<path d="M4 6h16M4 12h16M4 18h10"/>'],
  ['hoteis', 'Hotéis', '<path d="M3 20V9l9-5 9 5v11"/><path d="M9 20v-6h6v6"/>'], ['transportes', 'Transportes', '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/>'],
  ['mais', 'Mais', '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>']];

function nav(ativo) {
  const id = S.tripId; const hoje = diaDeHoje();
  return `<nav class="nav" aria-label="Navegação principal">${NAV.map(([k, t, p]) => {
    const href = k === 'dia' ? `#/v/${id}/dia/${hoje || ultimoDia() || 1}` : `#/v/${id}/${k}`;
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
const hotelNa = (date) => S.b.hotels.find((h) => h.check_in <= date && date < h.check_out);
const reservasEm = (date) => S.b.bookings.filter((x) => x.depart_date === date);
const bilhetes = (f) => S.b.tickets.filter((t) => Object.entries(f).every(([k, v]) => t[k] === v));
const membro = (id) => S.b.members.find((m) => m.id === id);
const pessoas = () => S.b.members;

// ---------- infra de ecrã ----------
const ehPC = () => matchMedia('(min-width: 1000px)').matches;
function lateral() {
  const b = S.b, id = S.tripId, p = location.hash.replace(/^#\/?/, '').split('/');
  const v = p[2] || 'dia';
  const ativo = ['dia', 'a'].includes(v) ? 'dia' : ['ranking', 'reservas', 'resumo', 'hoteis', 'transportes'].includes(v) ? v : 'mais';
  const diaAtual = Number(sessionStorage.getItem('ultimoDia:' + id)) || diaDeHoje() || 1;
  const rk = b.rankings.find((r) => r.is_primary) || b.rankings[0];
  const it = [['dia', 'Dia', `#/v/${id}/dia/${diaAtual}`], ['resumo', 'Resumo'], ['hoteis', 'Hotéis'], ['transportes', 'Transportes'],
    ...(rk ? [['ranking', 'Ranking', `#/v/${id}/ranking/${rk.id}`]] : []), ...(b.isOwner ? [['reservas', 'Reservas']] : []), ['mais', 'Mais']];
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
}
// aspeto: automático, dia ou noite
const temaAtual = () => localStorage.getItem('tema') || 'auto';
const temaTxt = () => ({ auto: '◐ Aspeto: automático', light: '☀ Aspeto: dia', dark: '☾ Aspeto: noite' })[temaAtual()];
function aplicarTema() { const t = temaAtual(); if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; }
aplicarTema();
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.role = 'status'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
function folha(titulo, corpo, aoGuardar) {
  const w = document.createElement('div'); w.className = 'folha-fundo';
  w.innerHTML = `<div class="folha" role="dialog" aria-modal="true" aria-label="${esc(titulo)}"><div class="folha-top"><h2>${esc(titulo)}</h2><button class="b-ic" data-fechar aria-label="Fechar">✕</button></div><form class="form">${corpo}<div class="form-acoes"><button type="button" class="b-sec" data-fechar>Cancelar</button><button class="b-pri" type="submit">Guardar</button></div></form></div>`;
  document.body.appendChild(w);
  const fechar = () => w.remove();
  w.addEventListener('click', (e) => { if (e.target === w || e.target.closest('[data-fechar]')) fechar(); });
  w.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = e.submitter; btn.disabled = true;
    try { await aoGuardar(Object.fromEntries(new FormData(e.target))); fechar(); } catch (err) { toast(err.message || 'Não foi possível guardar.'); btn.disabled = false; }
  });
  w.querySelector('input,select,textarea')?.focus();
}
const campo = (n, l, v = '', t = 'text', extra = '') => `<label class="campo"><span>${l}</span><input name="${n}" type="${t}" value="${esc(v)}" ${extra}></label>`;
const area = (n, l, v = '') => `<label class="campo"><span>${l}</span><textarea name="${n}" rows="3">${esc(v)}</textarea></label>`;
const escolha = (n, l, ops, v) => `<label class="campo"><span>${l}</span><select name="${n}">${ops.map(([k, t]) => `<option value="${esc(k)}" ${String(k) === String(v ?? '') ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;

async function completarFotos() {
  const b = S.b; if (!b?.isOwner || b.offline || sessionStorage.getItem('fotos:' + S.tripId)) return;
  sessionStorage.setItem('fotos:' + S.tripId, '1');
  const falta = b.activities.filter((a) => a.wiki_title && !b.photos.some((p) => p.activity_id === a.id && p.external_url));
  if (!falta.length) return;
  const cache = {}; const novas = [];
  for (const a of falta) {
    try { cache[a.wiki_title] ??= await fotoWiki(a.wiki_title); } catch { cache[a.wiki_title] = null; }
    const f = cache[a.wiki_title]; if (f) novas.push({ trip_id: S.tripId, activity_id: a.id, external_url: f.url, credit: f.credit, source_url: f.source });
  }
  if (novas.length) { const { error } = await sb.from('activity_photos').insert(novas); if (!error) await recarregar(); }
}
const credito = (p) => p?.credit ? `<a class="credito" href="${esc(p.source_url || '#')}" target="_blank" rel="noopener">Foto: ${esc(p.credit)}</a>` : '';
function fotoDoDia(day) {
  const rk = rankPrincipal(); const acts = atividadesDoDia(day).lista;
  const comFoto = acts.map((a) => ({ a, p: S.b.photos.find((p) => p.activity_id === a.id && p.external_url) })).filter((x) => x.p);
  comFoto.sort((x, y) => (rk.map[x.a.ext_key] || 99) - (rk.map[y.a.ext_key] || 99));
  return comFoto[0]?.p || null;
}

async function recarregar() { S.b = await carregarViagem(S.tripId); router(); }
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
  const ord = [...v].sort((a, b) => ((a.end_date || '') < hoje) - ((b.end_date || '') < hoje) || String(a.start_date).localeCompare(String(b.start_date)));
  render(`<main class="pag">
    <header class="topo"><h1>As nossas viagens</h1><button class="b-ic" data-act="sair" aria-label="Sair">⎋</button></header>
    <div class="lista">${ord.map((t) => `<a class="cartao-viagem ${t.end_date < hoje ? 'passada' : ''}" href="#/v/${t.id}">
      <span class="cv-t">${esc(t.title)}</span><span class="cv-s">${esc(t.subtitle || '')}</span><span class="cv-d">${intervalo(t.start_date, t.end_date)}</span>
      ${t.start_date <= hoje && hoje <= t.end_date ? '<span class="selo">A decorrer</span>' : t.end_date < hoje ? '<span class="selo selo-c">Arquivo</span>' : ''}</a>`).join('') || '<p class="vazio">Ainda não há viagens.</p>'}</div>
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
  const rota = mapsRouteLink(lista.filter((a) => a.kind !== 'transport' && (a.lat != null || a.maps_query)));
  const prev = b.days.find((d) => d.day_number === day.day_number - 1), next = b.days.find((d) => d.day_number === day.day_number + 1);

  const pc = ehPC();
  const sel = selId || atual?.id || lista.find((a) => a.wiki_title)?.id || lista[0]?.id;
  const painel = pc && sel ? `<aside class="detalhe ficha ${selId ? 'aberto' : ''}" aria-label="Ficha da atividade">${await vAtividade(sel, true)}</aside>` : '';
  const bilhete = (a) => {
    if (a._r) return `<a class="bil" href="#/v/${S.tripId}/transportes#r-${a._r.id}"><span class="bil-c"><span class="bil-h">${hhmm(a.start_time) || '—'}</span><span class="bil-d">reserva</span></span><span class="bil-c2"><span class="bil-t">${esc(a.title)}</span><span class="bil-s">${esc(a.short || 'Ver reserva')}</span></span></a>`;
    const pos = rk.map[a.ext_key]; const nb = bilhetes({ activity_id: a.id }).length; const ag2 = a === atual;
    return `<div class="bil-w"><a class="bil ${ag2 ? 'agora' : ''} ${pc && a.id === sel ? 'sel' : ''}" href="#/v/${S.tripId}/a/${a.id}">
      <span class="bil-c"><span class="bil-h">${hhmm(a.start_time) || '—'}</span><span class="bil-d">${dur(a.duration_min)}</span></span>
      <span class="bil-c2">${ag2 ? '<span class="bil-ag">A decorrer</span>' : ''}<span class="bil-t">${esc(a.title)}</span>
      ${a.short ? `<span class="bil-s">${esc(a.short)}</span>` : ''}
      ${a.needs_ticket || nb ? `<span class="bil-tk">${nb}/${pessoas().length} bilhetes</span>` : ''}</span></a>
      ${pos ? `<a class="rk" href="#/v/${S.tripId}/ranking/${rk.r.id}/${a.ext_key}" aria-label="${pos}.º lugar em ${rk.total} no ranking, ver ranking"><span>${I.estrela}${pos} em ${rk.total}</span></a>` : ''}</div>`;
  };

  render(`<main class="dia"><div class="dia-col">
    <div class="foto-dia" style="${foto ? `background-image:url('${esc(foto)}')` : ''}"><div class="vinheta"></div>${credito(fotoExt)}${!day.photo_path && b.isOwner ? `<label class="foto-add">${I.mais} Foto do dia<input type="file" accept="image/*" hidden data-up="foto-dia" data-id="${day.id}"></label>` : ''}</div>
    <header class="cab">
      <div class="cab-l">
        <div class="cab-nav">${prev ? `<a class="b-mini" href="#/v/${S.tripId}/dia/${prev.day_number}" aria-label="Dia anterior">${I.voltar}</a>` : '<span class="b-mini off"></span>'}
        <h1>${esc(day.city || '')}</h1>${next ? `<a class="b-mini" href="#/v/${S.tripId}/dia/${next.day_number}" aria-label="Dia seguinte">${I.seg}</a>` : ''}</div>
        <div class="cab-data">${dataLonga(day.date)}</div>
        <a class="cab-hotel" href="#/v/${S.tripId}/hoteis">${I.cama}${hotel ? esc(hotel.name) : 'Hotel por adicionar'}</a>
      </div>
      ${rota ? `<a class="b-mapa" href="${esc(rota)}" target="_blank" rel="noopener" aria-label="Abrir o mapa do dia">${I.mapa}Mapa</a>` : ''}
    </header>
    <section class="painel">
      <div class="pega" aria-hidden="true"></div>
      ${day.offline ? '' : ''}${b.offline ? '<p class="aviso">Sem rede: a mostrar a última cópia guardada.</p>' : ''}
      ${grupos.length > 1 ? `<div class="opcoes" role="group" aria-label="Opções do dia">${grupos.map((g) => `<button class="op ${g === escolhida ? 'on' : ''}" data-act="opcao" data-dia="${day.id}" data-g="${g}">${esc(labels[g])}</button>`).join('')}</div>
        ${b.isOwner && !b.trip.info?.escolhas?.[day.ext_key] ? `<button class="b-link" data-act="fixar-opcao" data-dia="${day.ext_key}" data-g="${escolhida}">Decidir: ficar com a ${esc(labels[escolhida].split('·')[0].trim())}</button>` : ''}` : ''}
      ${day.intro ? `<details class="intro"><summary>Sobre o dia</summary><p>${esc(day.intro).replace(/\n/g, '<br>')}</p>${day.rain_alt ? `<p class="chuva"><strong>Se chover:</strong> ${esc(day.rain_alt)}</p>` : ''}</details>` : ''}
      <div class="bils">${itens.map(bilhete).join('') || '<p class="vazio">Sem atividades neste dia.</p>'}</div>
    </section></div>${painel}
    ${nav('dia')}</main>`);
}

// ---------- ficha da atividade ----------
async function vAtividade(id, comoPainel = false) {
  const b = S.b; const a = b.activities.find((x) => x.id === id); if (!a) return vDia(1);
  const day = b.days.find((d) => d.id === a.day_id); const rk = rankPrincipal(); const pos = rk.map[a.ext_key];
  const outros = b.rankingItems.filter((i) => (i.activity_ext_keys || []).includes(a.ext_key) && i.ranking_id !== rk.r?.id)
    .map((i) => ({ i, r: b.rankings.find((r) => r.id === i.ranking_id), tot: b.rankingItems.filter((j) => j.ranking_id === i.ranking_id).length }));
  const fotos = b.photos.filter((p) => p.activity_id === a.id).sort((x, y) => (x.external_url ? 1 : 0) - (y.external_url ? 1 : 0));
  const urls = await urlsAssinados('photos', fotos.filter((p) => p.path).map((p) => p.path));
  const tk = bilhetes({ activity_id: a.id }); const rem = b.reminders.filter((r) => r.activity_id === a.id);
  const temLocal = a.lat != null || a.maps_query || a.place_name;
  const html = (`
    <div class="galeria" id="galeria">${fotos.length ? fotos.map((p) => `<div class="g-foto" style="background-image:url('${esc(p.external_url || urls[p.path] || '')}')">${credito(p)}${b.isOwner ? `<button class="g-del" data-act="apagar-foto" data-id="${p.id}" data-path="${esc(p.path || '')}" aria-label="Apagar foto">✕</button>` : ''}</div>`).join('') : '<div class="g-foto g-vazia"></div>'}</div>
    <div class="vinheta-f"></div>
    <div class="ficha-top"><a class="b-ic esc" href="#/v/${S.tripId}/dia/${day?.day_number || 1}" aria-label="Voltar ao dia">${I.voltar}</a>
      <span class="g-n">${fotos.length ? `${fotos.length} foto${fotos.length > 1 ? 's' : ''}` : ''}</span>
      ${b.isOwner ? `<label class="b-ic esc" aria-label="Adicionar foto">${I.mais}<input type="file" accept="image/*" multiple hidden data-up="foto-ativ" data-id="${a.id}"></label>` : ''}</div>
    <section class="ficha-corpo">
      <div class="caixa azul">
        <div class="cx-l1"><span>${dataLonga(day?.date)}${day?.city ? ', ' + esc(day.city) : ''}</span>
          ${pos ? `<a class="rk-chip" href="#/v/${S.tripId}/ranking/${rk.r.id}/${a.ext_key}" aria-label="${pos}.º lugar em ${rk.total} no ranking">${I.estrela}${pos} em ${rk.total}</a>` : ''}</div>
        <h1>${esc(a.title)}</h1>
        <div class="chips">${a.start_time ? `<span class="chip ouro">${hhmm(a.start_time)}</span>` : ''}${a.duration_min ? `<span class="chip">${dur(a.duration_min)}</span>` : ''}${a.place_name ? `<span class="chip">${esc(a.place_name)}</span>` : ''}</div>
        ${temLocal ? `<a class="b-maps" href="${esc(mapsDirLink(a))}" target="_blank" rel="noopener">${I.maps}Ir com o Google Maps</a>
        <a class="b-link claro" href="${esc(mapsPlaceLink(a))}" target="_blank" rel="noopener">Ver o local e fotos no Google Maps</a>` : ''}
        ${outros.length ? `<div class="outros-rk">${outros.map((o) => `<a href="#/v/${S.tripId}/ranking/${o.r.id}/${a.ext_key}">${o.i.position} em ${o.tot} · ${esc(o.r.title)}</a>`).join('')}</div>` : ''}
      </div>
      ${a.description || a.short ? `<div class="caixa"><h2>Sobre a visita</h2><p>${esc(a.description || a.short)}</p></div>` : ''}
      ${(a.how_to || []).length ? `<div class="caixa"><h2>Como ir</h2><ol class="passos">${a.how_to.map((p) => `<li>${esc(p)}</li>`).join('')}</ol></div>` : ''}
      ${(a.meal_options || []).length ? `<div class="caixa"><h2>Opções</h2><ul class="refeicoes">${a.meal_options.map((m) => `<li><a href="${esc(mapsQueryLink(m.q || m.name))}" target="_blank" rel="noopener"><span class="rf-n">${esc(m.name)}</span><span class="rf-t">${esc(m.type || '')}</span></a></li>`).join('')}</ul></div>` : ''}
      ${a.needs_ticket || tk.length || b.isOwner ? `<div class="caixa"><div class="cx-h"><h2>Bilhetes</h2><span class="ok">${tk.length} de ${pessoas().length}</span></div>
        <div class="tk-grid">${pessoas().map((m) => { const t = tk.find((x) => x.member_id === m.id);
          return t ? `<span class="tk-w"><button class="tk" data-act="ver-bilhete" data-path="${esc(t.path)}">${I.qr}${esc(m.display_name)}</button>${b.isOwner ? `<button class="tk-x" data-act="apagar-bilhete" data-id="${t.id}" data-path="${esc(t.path)}" aria-label="Apagar bilhete de ${esc(m.display_name)}">✕</button>` : ''}</span>`
            : b.isOwner ? `<label class="tk tk-falta">${I.mais}${esc(m.display_name)}<input type="file" accept="image/*,application/pdf" hidden data-up="bilhete" data-campo="activity_id" data-id="${a.id}" data-membro="${m.id}"></label>`
            : `<span class="tk tk-falta">${esc(m.display_name)}: sem bilhete</span>`; }).join('')}</div></div>` : ''}
      ${(a.tips || []).length ? `<div class="caixa"><h2>Dicas</h2>${a.tips.map((t) => `<p class="${t.startsWith('⚠') ? 'alerta' : ''}">${esc(t)}</p>`).join('')}</div>` : ''}
      <div class="caixa"><div class="cx-h"><h2>Lembretes</h2>${b.isOwner ? `<button class="b-link" data-act="novo-lembrete" data-campo="activity_id" data-id="${a.id}">Adicionar</button>` : ''}</div>
        <div class="lemb">${rem.map((r) => `<span class="lb">${I.sino}${offsetTxt(r.offset_minutes)}${b.isOwner ? `<button data-act="apagar-lembrete" data-id="${r.id}" aria-label="Apagar lembrete">✕</button>` : ''}</span>`).join('') || '<span class="vazio">Sem lembretes.</span>'}</div>
        ${a.start_time && day ? `<button class="b-sec" data-act="calendario" data-id="${a.id}">Adicionar ao calendário</button>` : ''}</div>
      ${b.isOwner ? `<button class="b-link centro" data-act="editar-ativ" data-id="${a.id}">Editar esta atividade</button>` : ''}
    </section>`);
  if (comoPainel) return html.replace(`aria-label="Voltar ao dia">${I.voltar}`, 'aria-label="Fechar a ficha">✕');
  render(`<main class="ficha">${html}</main>`);
}

// ---------- resumo ----------
function vResumo() {
  const b = S.b; const rk = rankPrincipal(); const info = b.trip.info || {};
  render(`<main class="pag com-nav">
    <header class="cab-pag"><a class="b-ic" href="#/" aria-label="Todas as viagens">${I.voltar}</a><div><h1>${esc(b.trip.title)}</h1><p>${intervalo(b.trip.start_date, b.trip.end_date)}</p></div></header>
    ${b.offline ? '<p class="aviso">Sem rede: a mostrar a última cópia guardada.</p>' : ''}
    ${info.perfil ? `<p class="perfil">${esc(info.perfil)}</p>` : ''}
    ${(info.cidades || []).length ? `<div class="cidades">${info.cidades.map((c) => `<div><strong>${esc(c.cidade)}</strong><span>${c.noites} noite${c.noites > 1 ? 's' : ''} · dias ${esc(c.dias)}</span></div>`).join('')}</div>` : ''}
    <ol class="resumo">${b.days.map((d) => { const h = hotelNa(d.date); const tr = reservasEm(d.date)[0];
      const plan = b.planned.filter((p) => (p.day_numbers || []).includes(d.day_number)).map((p) => p.title);
      const est = atividadesDoDia(d).lista.filter((a) => rk.map[a.ext_key] && rk.map[a.ext_key] <= 5).length;
      return `<li><a href="#/v/${S.tripId}/dia/${d.day_number}"><span class="rs-n">${d.day_number}</span><span class="rs-c">
        <span class="rs-d">${dataCurta(d.date)} · ${esc(d.city || '')}</span><span class="rs-t">${esc(d.title || '')}</span>
        <span class="rs-x">${(d.highlights || []).map(esc).join(' · ')}</span>
        <span class="rs-m">${I.cama}${h ? esc(h.name) : 'Hotel por adicionar'}${tr ? ` · ${KIND_LABEL[tr.kind]} ${esc(hhmm(tr.depart_time))}` : plan[0] ? ` · ${esc(plan[0])}` : ''}</span></span>${est ? `<span class="rs-star">${I.estrela}</span>` : ''}</a></li>`; }).join('')}</ol>
    ${info.nota_restaurantes ? `<p class="nota">${esc(info.nota_restaurantes)}</p>` : ''}
    ${nav('resumo')}</main>`);
}

// ---------- hotéis ----------
function vHoteis() {
  const b = S.b;
  render(`<main class="pag com-nav"><header class="cab-pag"><div><h1>Hotéis</h1><p>${esc(b.trip.title)}</p></div>${b.isOwner ? `<button class="b-pri b-peq" data-act="hotel">${I.mais} Adicionar</button>` : ''}</header>
    <div class="lista">${b.hotels.map((h) => { const ds = b.days.filter((d) => h.check_in <= d.date && d.date < h.check_out); const tk = bilhetes({ hotel_id: h.id });
      return `<article class="caixa"><div class="cx-h"><h2>${esc(h.name)}</h2>${b.isOwner ? `<button class="b-link" data-act="hotel" data-id="${h.id}">Editar</button>` : ''}</div>
        <p class="meta">${dataCurta(h.check_in)} → ${dataCurta(h.check_out)} · ${noites(h.check_in, h.check_out)} noites</p>
        ${h.check_in_time || h.check_out_time ? `<p class="meta">Check-in ${esc(h.check_in_time || '—')} · Check-out ${esc(h.check_out_time || '—')}</p>` : ''}
        ${h.address ? `<a class="b-maps peq" href="${esc(h.maps_url || mapsDirLink({ maps_query: h.address }))}" target="_blank" rel="noopener">${I.maps}${esc(h.address)}</a>` : ''}
        <dl class="dados">${h.booking_code ? `<dt>Reserva</dt><dd>${esc(h.booking_code)}</dd>` : ''}${h.phone ? `<dt>Telefone</dt><dd><a href="tel:${esc(h.phone)}">${esc(h.phone)}</a></dd>` : ''}</dl>
        ${h.notes ? `<p>${esc(h.notes)}</p>` : ''}
        ${documentos(tk, 'hotel_id', h.id)}
        <div class="dias-l">${ds.map((d) => `<a href="#/v/${S.tripId}/dia/${d.day_number}">Dia ${d.day_number}</a>`).join('')}</div></article>`; }).join('') || `<p class="vazio">${b.isOwner ? 'Ainda não adicionaste hotéis. Coloca aqui os que fores reservando.' : 'Ainda não há hotéis.'}</p>`}</div>
    ${nav('hoteis')}</main>`);
}
function documentos(tk, campoId, id) {
  const b = S.b;
  return `<div class="tk-grid">${tk.map((t) => `<span class="tk-w"><button class="tk" data-act="ver-bilhete" data-path="${esc(t.path)}">${I.qr}${esc(membro(t.member_id)?.display_name || t.label || 'Documento')}</button>${b.isOwner ? `<button class="tk-x" data-act="apagar-bilhete" data-id="${t.id}" data-path="${esc(t.path)}" aria-label="Apagar">✕</button>` : ''}</span>`).join('')}
    ${b.isOwner ? `<button class="tk tk-falta" data-act="escolher-membro" data-campo="${campoId}" data-id="${id}">${I.mais}Bilhete ou documento</button>` : ''}</div>`;
}

// ---------- transportes ----------
function vTransportes() {
  const b = S.b; const tips = b.sections.find((s) => s.kind === 'transport_tips');
  render(`<main class="pag com-nav"><header class="cab-pag"><div><h1>Transportes</h1><p>${esc(b.trip.title)}</p></div>${b.isOwner ? `<button class="b-pri b-peq" data-act="reserva">${I.mais} Adicionar</button>` : ''}</header>
    <h2 class="sec">Reservados</h2>
    <div class="lista">${b.bookings.map((x) => { const d = b.days.find((dd) => dd.date === x.depart_date);
      return `<article class="caixa" id="r-${x.id}"><div class="cx-h"><h2>${KIND_LABEL[x.kind]}${x.title ? ': ' + esc(x.title) : ''}</h2>${b.isOwner ? `<button class="b-link" data-act="reserva" data-id="${x.id}">Editar</button>` : ''}</div>
      <p class="rota"><strong>${esc(x.from_place || '')}</strong> ${esc(hhmm(x.depart_time))} → <strong>${esc(x.to_place || '')}</strong> ${esc(hhmm(x.arrive_time))}</p>
      <p class="meta">${dataLonga(x.depart_date)}${[x.carrier, x.number].filter(Boolean).length ? ' · ' + esc([x.carrier, x.number].filter(Boolean).join(' ')) : ''}</p>
      <dl class="dados">${x.booking_code ? `<dt>Reserva</dt><dd>${esc(x.booking_code)}</dd>` : ''}${x.seats ? `<dt>Lugares</dt><dd>${esc(x.seats)}</dd>` : ''}</dl>
      ${x.notes ? `<p>${esc(x.notes)}</p>` : ''}${documentos(bilhetes({ booking_id: x.id }), 'booking_id', x.id)}
      ${d ? `<div class="dias-l"><a href="#/v/${S.tripId}/dia/${d.day_number}">Dia ${d.day_number}</a></div>` : ''}</article>`; }).join('') || `<p class="vazio">${b.isOwner ? 'Coloca aqui voos, comboios e transfers à medida que os fores comprando.' : 'Ainda não há reservas.'}</p>`}</div>
    <h2 class="sec">Trajetos da viagem</h2>
    <div class="lista">${b.planned.map((p) => `<article class="caixa"><h2>${esc(p.title)}</h2><p>${esc(p.payment || '')}</p><p class="meta">${esc(p.duration || '')}${p.price ? ' · ' + esc(p.price) : ''}</p>
      <div class="dias-l">${(p.day_numbers || []).map((n) => `<a href="#/v/${S.tripId}/dia/${n}">Dia ${n}</a>`).join('')}</div></article>`).join('')}</div>
    ${tips ? `<h2 class="sec">${esc(tips.title)}</h2><div class="caixa">${tips.content.map((c) => `<p><strong>${esc(c.t)}.</strong> ${esc(c.d)}</p>`).join('')}</div>` : ''}
    ${nav('transportes')}</main>`);
}

// ---------- mais ----------
function vMais() {
  const b = S.b; const secs = b.sections.filter((s) => s.kind !== 'transport_tips');
  const it = (h, t, s = '') => `<a class="menu-i" href="${h}"><span>${t}</span>${s ? `<small>${s}</small>` : ''}${I.seg}</a>`;
  const feitas = b.prebookings.filter((p) => p.done).length;
  render(`<main class="pag com-nav"><header class="cab-pag"><div><h1>Mais</h1><p>${esc(b.trip.title)}</p></div></header>
    <div class="menu">
      ${b.isOwner ? it(`#/v/${S.tripId}/reservas`, 'Reservas antecipadas', `${feitas} de ${b.prebookings.length} feitas`) : ''}
      ${it(`#/v/${S.tripId}/checklist`, 'Checklist antes da partida')}
      ${b.rankings.map((r) => it(`#/v/${S.tripId}/ranking/${r.id}`, esc(r.title))).join('')}
      ${secs.map((s) => it(`#/v/${S.tripId}/secao/${s.id}`, esc(s.title))).join('')}
      ${it(`#/v/${S.tripId}/participantes`, 'Participantes', `${b.members.length}`)}
      ${it(`#/v/${S.tripId}/exportar`, 'Exportar roteiro (PDF)')}
      <button class="menu-i" data-act="offline"><span>Guardar bilhetes neste telemóvel</span><small>para usar sem rede</small>${I.seg}</button>
      <button class="menu-i" data-act="tema"><span>${temaTxt()}</span><small>tocar para mudar</small>${I.seg}</button>
      ${it('#/instalar', 'Instalar no telemóvel')}
      ${it('#/', 'Todas as viagens')}
      <button class="menu-i" data-act="sair"><span>Sair</span>${I.seg}</button>
    </div>${nav('mais')}</main>`);
}

function vReservas() {
  const b = S.b;
  render(`<main class="pag com-nav"><header class="cab-pag"><a class="b-ic" href="#/v/${S.tripId}/mais" aria-label="Voltar">${I.voltar}</a><div><h1>Reservas antecipadas</h1><p>Por ordem de urgência</p></div></header>
    <ul class="check">${b.prebookings.map((p) => { const a = b.activities.find((x) => x.ext_key === p.activity_ext_key);
      return `<li class="${p.done ? 'feito' : ''}"><label><input type="checkbox" data-act="pre" data-id="${p.id}" ${p.done ? 'checked' : ''} ${b.isOwner ? '' : 'disabled'}><span><strong>${esc(p.title)}</strong>
      <span class="meta">${esc(p.deadline_text || '')}</span>${p.note ? `<span>${esc(p.note)}</span>` : ''}</span></label>
      <div class="pre-l">${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">Reservar</a>` : ''}${a ? `<a href="#/v/${S.tripId}/a/${a.id}">Ver atividade</a>` : ''}
      ${b.isOwner ? `<button class="b-link" data-act="novo-lembrete" data-campo="prebooking_id" data-id="${p.id}">Lembrete</button>` : ''}
      ${b.reminders.filter((r) => r.prebooking_id === p.id).map((r) => `<span class="lb">${I.sino}${offsetTxt(r.offset_minutes)}<button data-act="apagar-lembrete" data-id="${r.id}" aria-label="Apagar">✕</button></span>`).join('')}</div></li>`; }).join('')}</ul>
    ${nav('mais')}</main>`);
}

function vChecklist() {
  const b = S.b; const cats = [...new Set(b.checklist.map((c) => c.category))];
  render(`<main class="pag com-nav"><header class="cab-pag"><a class="b-ic" href="#/v/${S.tripId}/mais" aria-label="Voltar">${I.voltar}</a><div><h1>Checklist</h1><p>Antes da partida</p></div></header>
    ${cats.map((c) => `<h2 class="sec">${esc(c)}</h2><ul class="check">${b.checklist.filter((x) => x.category === c).map((x) => `<li class="${x.done ? 'feito' : ''}"><label><input type="checkbox" data-act="chk" data-id="${x.id}" ${x.done ? 'checked' : ''} ${b.isOwner ? '' : 'disabled'}><span>${esc(x.title)}</span></label></li>`).join('')}</ul>`).join('')}
    ${nav('mais')}</main>`);
}

function vRanking(rid, destaque) {
  const b = S.b; const r = b.rankings.find((x) => x.id === rid) || b.rankings[0]; if (!r) return vMais();
  const items = b.rankingItems.filter((i) => i.ranking_id === r.id);
  render(`<main class="pag com-nav"><header class="cab-pag"><a class="b-ic" href="javascript:history.back()" aria-label="Voltar">${I.voltar}</a><div><h1>Ranking</h1><p>${esc(b.trip.title)}</p></div></header>
    ${b.rankings.length > 1 ? `<div class="opcoes">${b.rankings.map((x) => `<a class="op ${x.id === r.id ? 'on' : ''}" href="#/v/${S.tripId}/ranking/${x.id}">${esc(x.title)}</a>`).join('')}</div>` : `<h2 class="sec">${esc(r.title)}</h2>`}
    <ol class="rank">${items.map((i) => { const a = b.activities.find((x) => (i.activity_ext_keys || []).includes(x.ext_key)); const on = destaque && (i.activity_ext_keys || []).includes(destaque);
      return `<li id="rk-${i.position}" class="${on ? 'on' : ''}"><span class="rk-n">${i.position}</span><span class="rk-c"><strong>${esc(i.title)}</strong>${i.note ? `<span>${esc(i.note)}</span>` : ''}</span>${a ? `<a href="#/v/${S.tripId}/a/${a.id}" aria-label="Ver atividade">${I.seg}</a>` : ''}</li>`; }).join('')}</ol>
    ${nav('mais')}</main>`);
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
  render(`<main class="pag com-nav"><header class="cab-pag"><a class="b-ic" href="#/v/${S.tripId}/mais" aria-label="Voltar">${I.voltar}</a><div><h1>Participantes</h1><p>Quem vê esta viagem</p></div>${b.isOwner ? `<button class="b-pri b-peq" data-act="convidar">${I.mais} Convidar</button>` : ''}</header>
    <ul class="pessoas">${b.members.map((m) => `<li><span class="av">${esc((m.display_name || '?')[0].toUpperCase())}</span><span><strong>${esc(m.display_name)}</strong><small>${m.role === 'owner' ? 'Organiza e edita' : m.user_id ? 'Consulta' : 'Convite enviado'}${b.isOwner && m.email ? ' · ' + esc(m.email) : ''}</small></span>
      ${b.isOwner && m.role !== 'owner' ? `<button class="b-link" data-act="remover-membro" data-id="${m.id}">Remover</button>` : ''}</li>`).join('')}</ul>
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
      <h2>Transportes reservados</h2>${b.bookings.map((x) => `<p><strong>${KIND_LABEL[x.kind]}</strong> · ${dataCurta(x.depart_date)} ${hhmm(x.depart_time)} · ${esc(x.from_place || '')} → ${esc(x.to_place || '')}${x.booking_code ? ' · Reserva ' + esc(x.booking_code) : ''}</p>`).join('') || '<p>—</p>'}</section>` : ''}
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
function fHotel(id) {
  const h = S.b.hotels.find((x) => x.id === id) || {};
  folha(id ? 'Editar hotel' : 'Novo hotel', campo('name', 'Nome', h.name, 'text', 'required') + campo('address', 'Morada', h.address) + campo('maps_url', 'Link do Google Maps (opcional)', h.maps_url, 'url')
    + `<div class="duas">${campo('check_in', 'Check-in', h.check_in, 'date', 'required')}${campo('check_out', 'Check-out', h.check_out, 'date', 'required')}</div>`
    + `<div class="duas">${campo('check_in_time', 'Hora check-in', h.check_in_time, 'time')}${campo('check_out_time', 'Hora check-out', h.check_out_time, 'time')}</div>`
    + campo('booking_code', 'Código de reserva', h.booking_code) + campo('phone', 'Telefone', h.phone, 'tel') + area('notes', 'Notas', h.notes)
    + (id ? '<button type="button" class="b-perigo" data-apagar>Apagar hotel</button>' : ''),
  async (f) => { f.trip_id = S.tripId; for (const k of ['maps_url', 'check_in_time', 'check_out_time']) if (!f[k]) f[k] = null;
    await op(id ? sb.from('hotels').update(f).eq('id', id) : sb.from('hotels').insert(f), 'Hotel guardado.'); });
  ligarApagar('hotels', id, 'Apagar este hotel?');
}
function fReserva(id) {
  const x = S.b.bookings.find((y) => y.id === id) || { kind: 'flight' };
  folha(id ? 'Editar reserva' : 'Nova reserva', escolha('kind', 'Tipo', Object.entries(KIND_LABEL), x.kind) + campo('title', 'Descrição (opcional)', x.title)
    + `<div class="duas">${campo('from_place', 'De', x.from_place, 'text', 'required')}${campo('to_place', 'Para', x.to_place, 'text', 'required')}</div>`
    + `<div class="duas">${campo('depart_date', 'Data de partida', x.depart_date, 'date', 'required')}${campo('depart_time', 'Hora', x.depart_time, 'time')}</div>`
    + `<div class="duas">${campo('arrive_date', 'Data de chegada', x.arrive_date, 'date')}${campo('arrive_time', 'Hora', x.arrive_time, 'time')}</div>`
    + `<div class="duas">${campo('carrier', 'Companhia', x.carrier)}${campo('number', 'N.º (voo, comboio)', x.number)}</div>`
    + campo('booking_code', 'Código de reserva', x.booking_code) + campo('seats', 'Lugares', x.seats) + area('notes', 'Notas', x.notes)
    + (id ? '<button type="button" class="b-perigo" data-apagar>Apagar reserva</button>' : ''),
  async (f) => { f.trip_id = S.tripId; if (!f.arrive_date) f.arrive_date = null; await op(id ? sb.from('bookings').update(f).eq('id', id) : sb.from('bookings').insert(f), 'Reserva guardada.'); });
  ligarApagar('bookings', id, 'Apagar esta reserva e os bilhetes associados?');
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
  folha('Bilhete ou documento', escolha('member_id', 'De quem', [['', 'Do grupo (sem pessoa)'], ...pessoas().map((m) => [m.id, m.display_name])], '')
    + campo('label', 'Descrição (opcional)', '') + '<label class="campo"><span>Ficheiro</span><input type="file" name="ficheiro" accept="image/*,application/pdf" required></label>',
  async () => {
    const form = document.querySelector('.folha form'); const fd = new FormData(form); const file = fd.get('ficheiro');
    await guardarBilhete(file, { [campoId]: id, member_id: fd.get('member_id') || null, label: fd.get('label') || null });
  });
}
async function guardarBilhete(file, extra) {
  const f = file.type.startsWith('image/') ? await comprimir(file, 2000, 0.9) : file;
  const path = await enviarFicheiro('tickets', S.tripId, f, 'bilhetes');
  await op(sb.from('tickets').insert({ trip_id: S.tripId, path, mime: f.type, ...extra }), 'Bilhete guardado.');
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
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  try {
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
    if (a === 'apagar-foto') { if (!confirm('Apagar esta foto?')) return; if (el.dataset.path) await apagarFicheiro('photos', el.dataset.path); return op(sb.from('activity_photos').delete().eq('id', id)); }
    if (a === 'novo-lembrete') return fLembrete(el.dataset.campo, id);
    if (a === 'apagar-lembrete') return op(sb.from('reminders').delete().eq('id', id), 'Lembrete apagado.');
    if (a === 'calendario') { const at = S.b.activities.find((x) => x.id === id); const d = S.b.days.find((x) => x.id === at.day_id);
      const al = S.b.reminders.filter((r) => r.activity_id === id).map((r) => r.offset_minutes);
      return descarregar(ics({ titulo: at.title, data: d.date, hora: hhmm(at.start_time), duracao: at.duration_min || 60, local: at.place_name || at.maps_query || '', alarmes: al.length ? al : [60], tz: tz() }), `${at.title}.ics`); }
    if (a === 'editar-ativ') return fAtividade(id);
    if (a === 'hotel') return fHotel(id);
    if (a === 'reserva') return fReserva(id);
    if (a === 'escolher-membro') return fMembroDoc(el.dataset.campo, id);
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
    if (up === 'foto-ativ') { for (const f of el.files) { const path = await enviarFicheiro('photos', S.tripId, await comprimir(f), 'atividades'); await sb.from('activity_photos').insert({ trip_id: S.tripId, activity_id: el.dataset.id, path }); } return recarregar(); }
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
    setTimeout(completarFotos, 1500);
  }
  const v = parts[2];
  if (!v) { const n = diaDeHoje(); location.replace(n ? `#/v/${id}/dia/${n}` : `#/v/${id}/resumo`); return; }
  const m = {
    dia: () => vDia(Number(parts[3]) || 1),
    a: () => { const at = S.b.activities.find((x) => x.id === parts[3]); const d = at && S.b.days.find((x) => x.id === at.day_id);
      return ehPC() && d ? vDia(d.day_number, at.id) : vAtividade(parts[3]); }, resumo: vResumo, hoteis: vHoteis, transportes: vTransportes, mais: vMais,
    reservas: vReservas, checklist: vChecklist, ranking: () => vRanking(parts[3], parts[4]), secao: () => vSecao(parts[3]), participantes: vParticipantes, exportar: vExportar,
  };
  return (m[v] || vResumo)();
}
window.addEventListener('hashchange', router);
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
