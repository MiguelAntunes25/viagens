export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const hhmm = (t) => (t ? String(t).slice(0, 5) : '');

export function dur(min) {
  if (!min && min !== 0) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const parse = (d) => { const [y, m, dd] = String(d).slice(0, 10).split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd)); };

export function dataLonga(d) { if (!d) return ''; const x = parse(d); return `${DIAS[x.getUTCDay()]}, ${x.getUTCDate()} de ${MESES[x.getUTCMonth()]}`; }
export function dataCurta(d) { if (!d) return ''; const x = parse(d); return `${DIAS_CURTOS[x.getUTCDay()]}, ${x.getUTCDate()} ${MESES[x.getUTCMonth()].slice(0, 3)}`; }
export function intervalo(a, b) {
  if (!a) return '';
  const x = parse(a), y = b ? parse(b) : null;
  if (!y) return `${x.getUTCDate()} de ${MESES[x.getUTCMonth()]} de ${x.getUTCFullYear()}`;
  if (x.getUTCMonth() === y.getUTCMonth()) return `${x.getUTCDate()} a ${y.getUTCDate()} de ${MESES[y.getUTCMonth()]} de ${y.getUTCFullYear()}`;
  return `${x.getUTCDate()} de ${MESES[x.getUTCMonth()]} a ${y.getUTCDate()} de ${MESES[y.getUTCMonth()]} de ${y.getUTCFullYear()}`;
}
export const noites = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);

// "hoje" e "agora" no fuso horário da viagem
export function hojeEm(tz) { return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'Europe/Lisbon' }).format(new Date()); }
export function agoraMin(tz) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz || 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const [h, m] = p.split(':').map(Number); return h * 60 + m;
}
export const toMin = (t) => { if (!t) return null; const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };

// Google Maps
export function mapsDirLink(a) {
  const p = new URLSearchParams({ api: '1' });
  if (a.lat != null && a.lng != null) p.set('destination', `${a.lat},${a.lng}`);
  else p.set('destination', a.maps_query || a.place_name || a.address || a.title || '');
  if (a.place_id) p.set('destination_place_id', a.place_id);
  return `https://www.google.com/maps/dir/?${p}`;
}
export function mapsPlaceLink(a) {
  if (a.maps_url) return a.maps_url;
  const p = new URLSearchParams({ api: '1' });
  p.set('query', a.lat != null ? `${a.lat},${a.lng}` : (a.maps_query || a.place_name || a.address || a.title || ''));
  if (a.place_id) p.set('query_place_id', a.place_id);
  return `https://www.google.com/maps/search/?${p}`;
}
export function mapsQueryLink(q) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`; }
export function mapsRouteLink(stops) {
  const pts = stops.filter((s) => (s.lat != null && s.lng != null) || s.maps_query);
  if (!pts.length) return null;
  const val = (s) => (s.lat != null ? `${s.lat},${s.lng}` : s.maps_query);
  const p = new URLSearchParams({ api: '1', travelmode: 'walking' });
  const dest = pts[pts.length - 1];
  p.set('destination', val(dest)); if (dest.place_id) p.set('destination_place_id', dest.place_id);
  if (pts.length > 1) { const o = pts[0]; p.set('origin', val(o)); if (o.place_id) p.set('origin_place_id', o.place_id); }
  const mid = pts.slice(1, -1).slice(0, 9);
  if (mid.length) { p.set('waypoints', mid.map(val).join('|')); if (mid.every((m) => m.place_id)) p.set('waypoint_place_ids', mid.map((m) => m.place_id).join('|')); }
  return `https://www.google.com/maps/dir/?${p}`;
}

// reduzir fotos antes de enviar
export async function comprimir(file, max = 1600, q = 0.82) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  const img = await createImageBitmap(file).catch(() => null);
  if (!img) return file;
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', q));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
}

// ficheiro de calendário (.ics) com alarme
export function ics({ titulo, data, hora, duracao = 60, local = '', alarmes = [60], tz = 'Europe/Lisbon' }) {
  const d = String(data).replace(/-/g, ''); const h = (hora || '09:00').slice(0, 5).replace(':', '') + '00';
  const fim = new Date(Date.UTC(+data.slice(0, 4), +data.slice(5, 7) - 1, +data.slice(8, 10), +h.slice(0, 2), +h.slice(2, 4) + duracao));
  const f = (x) => `${x.getUTCFullYear()}${String(x.getUTCMonth() + 1).padStart(2, '0')}${String(x.getUTCDate()).padStart(2, '0')}T${String(x.getUTCHours()).padStart(2, '0')}${String(x.getUTCMinutes()).padStart(2, '0')}00`;
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//App Viagens//PT', 'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@app-viagens`, `DTSTAMP:${f(new Date())}Z`,
    `DTSTART;TZID=${tz}:${d}T${h}`, `DTEND;TZID=${tz}:${f(fim)}`, `SUMMARY:${titulo.replace(/[,;]/g, ' ')}`, `LOCATION:${local.replace(/[,;]/g, ' ')}`];
  for (const a of alarmes) linhas.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${titulo.replace(/[,;]/g, ' ')}`, `TRIGGER:-PT${a}M`, 'END:VALARM');
  linhas.push('END:VEVENT', 'END:VCALENDAR');
  return new Blob([linhas.join('\r\n')], { type: 'text/calendar' });
}

export function descarregar(blob, nome) {
  const u = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}

export const OFFSETS = [
  [10080, '1 semana antes'], [2880, '2 dias antes'], [1440, '1 dia antes'], [180, '3 horas antes'],
  [120, '2 horas antes'], [60, '1 hora antes'], [30, '30 min antes'], [15, '15 min antes'],
];
export const offsetTxt = (m) => (OFFSETS.find(([v]) => v === m)?.[1]) || (m >= 1440 ? `${Math.round(m / 1440)} dias antes` : m >= 60 ? `${Math.round(m / 60)} h antes` : `${m} min antes`);

export const KIND_LABEL = { flight: 'Voo', train: 'Comboio', bus: 'Autocarro', transfer: 'Transfer', car: 'Carro', boat: 'Barco', other: 'Outro' };
