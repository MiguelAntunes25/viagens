import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// guardar se o link de entrada é um convite ou uma recuperação de password (antes de a biblioteca limpar o endereço)
const h = location.hash;
export const entradaEspecial = /type=(invite|recovery|signup)/.test(h) ? (h.match(/type=(\w+)/) || [])[1] : null;

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const CACHE_KEY = (id) => `viagem:${id}`;

export async function sessao() { const { data } = await sb.auth.getSession(); return data.session; }

export async function listarViagens() {
  try {
    const { data, error } = await sb.from('trips').select('id,title,subtitle,start_date,end_date,info,cover_photo_path').order('start_date');
    if (error) throw error;
    localStorage.setItem('viagens', JSON.stringify(data));
    return data;
  } catch (e) {
    const c = localStorage.getItem('viagens'); if (c) return JSON.parse(c); throw e;
  }
}

export async function carregarViagem(id) {
  const q = (t, sel = '*') => sb.from(t).select(sel).eq('trip_id', id);
  try {
    const [trip, members, days, acts, ranks, items, planned, sections, pre, check, hotels, bookings, tickets, photos, rem] = await Promise.all([
      sb.from('trips').select('*').eq('id', id).single(),
      q('trip_members').order('sort_order'), q('days').order('day_number'), q('activities').order('start_time', { nullsFirst: false }).order('sort_order'),
      q('rankings').order('sort_order'), q('ranking_items').order('position'), q('planned_transports').order('sort_order'),
      q('trip_sections').order('sort_order'), q('prebookings').order('sort_order'), q('checklist_items').order('sort_order'),
      q('hotels').order('check_in'), q('bookings').order('depart_date').order('depart_time'), q('tickets'), q('activity_photos').order('created_at'), q('reminders'),
    ]);
    for (const r of [trip, members, days, acts, ranks, items, planned, sections, pre, check, hotels, bookings, tickets, photos, rem]) if (r.error) throw r.error;
    const { data: { user } } = await sb.auth.getUser();
    const b = {
      trip: trip.data, members: members.data, days: days.data, activities: acts.data, rankings: ranks.data, rankingItems: items.data,
      planned: planned.data, sections: sections.data, prebookings: pre.data, checklist: check.data, hotels: hotels.data,
      bookings: bookings.data, tickets: tickets.data, photos: photos.data, reminders: rem.data, userId: user?.id, offline: false,
    };
    b.isOwner = b.trip.created_by === b.userId || b.members.some((m) => m.user_id === b.userId && m.role === 'owner');
    localStorage.setItem(CACHE_KEY(id), JSON.stringify(b));
    return b;
  } catch (e) {
    const c = localStorage.getItem(CACHE_KEY(id));
    if (c) { const b = JSON.parse(c); b.offline = true; return b; }
    throw e;
  }
}

// ficheiros privados: links temporários
const urlCache = new Map();
export async function urlsAssinados(bucket, paths) {
  const falta = paths.filter((p) => p && !urlCache.has(bucket + p));
  if (falta.length) {
    const { data } = await sb.storage.from(bucket).createSignedUrls(falta, 3600).catch(() => ({ data: null }));
    (data || []).forEach((d) => d.signedUrl && urlCache.set(bucket + d.path, d.signedUrl));
  }
  return Object.fromEntries(paths.map((p) => [p, urlCache.get(bucket + p)]));
}

export async function enviarFicheiro(bucket, tripId, file, pasta) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${tripId}/${pasta}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}
export async function apagarFicheiro(bucket, path) { await sb.storage.from(bucket).remove([path]); }

// bilhetes guardados no telemóvel para usar sem rede
const CACHE_BILHETES = 'bilhetes-v1';
export async function guardarBilhetesOffline(tickets) {
  const c = await caches.open(CACHE_BILHETES); let n = 0;
  const urls = await urlsAssinados('tickets', tickets.map((t) => t.path));
  for (const t of tickets) {
    try { const r = await fetch(urls[t.path]); if (r.ok) { await c.put(`/__bilhete__/${t.path}`, r); n++; } } catch { /* sem rede */ }
  }
  return n;
}
export async function abrirBilhete(path) {
  try {
    const u = (await urlsAssinados('tickets', [path]))[path];
    if (u && navigator.onLine) return u;
  } catch { /* tenta a cópia local */ }
  const c = await caches.open(CACHE_BILHETES); const r = await c.match(`/__bilhete__/${path}`);
  return r ? URL.createObjectURL(await r.blob()) : null;
}

// fotos livres da Wikimedia Commons (a partir do artigo da Wikipédia de cada local)
const semHtml = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
export async function fotoWiki(titulo) {
  const k = 'wiki:' + titulo;
  try { const c = localStorage.getItem(k); if (c) return JSON.parse(c); } catch { /* sem cache */ }
  const r1 = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=name&titles=${encodeURIComponent(titulo)}`).then((r) => r.json());
  const nome = Object.values(r1?.query?.pages || {})[0]?.pageimage;
  let res = null;
  if (nome) {
    const r2 = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&titles=${encodeURIComponent('File:' + nome)}`).then((r) => r.json());
    const p = Object.values(r2?.query?.pages || {})[0]; const ii = p?.imageinfo?.[0];
    const lic = ii?.extmetadata?.LicenseShortName?.value || '';
    // só imagens alojadas na Commons e com licença livre (exclui imagens "fair use" da Wikipédia)
    if (ii && p.missing === undefined && lic && !/fair use|non-free/i.test(lic)) {
      res = { url: ii.thumburl || ii.url, credit: `${semHtml(ii.extmetadata?.Artist?.value) || 'Autor na Wikimedia Commons'} · ${lic}`, source: ii.descriptionurl };
    }
  }
  try { localStorage.setItem(k, JSON.stringify(res)); } catch { /* cheio */ }
  return res;
}

export async function convidar(trip_id, email, display_name) {
  const { data, error } = await sb.functions.invoke('convidar', {
    body: { trip_id, email, display_name, redirect_to: location.origin + location.pathname },
  });
  if (error) throw new Error((await error.context?.json?.().catch(() => null))?.error || error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}
