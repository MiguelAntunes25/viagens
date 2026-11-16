// Função "narrar": gera o áudio dos guias com as vozes naturais da Google (Text-to-Speech).
// Ações: vozes | amostra | gerar | local (nome, morada e telefone na língua local, pelo Google Places, e o áudio)
import { createClient } from 'npm:@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL')!;
const SRK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
let GKEY = Deno.env.get('GOOGLE_TTS_KEY') || '';
const admin = createClient(URL, SRK);
// a chave da Google está guardada no cofre do Supabase (vault)
async function chave() { if (!GKEY) { const { data } = await admin.rpc('narrar_google_key'); GKEY = data || ''; } return GKEY; }
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const resp = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Texto do guia → pedaços com menos de 4500 bytes (limite da Google é 5000)
function pedacos(txt: string): string[] {
  const blocos = txt.replace(/\r/g, '').split(/\n\s*\n|\n(?=## )/)
    .flatMap((b) => b.split('\n'))
    .map((l) => l.trim()).filter(Boolean)
    .map((l) => l.startsWith('## ') ? l.slice(3).trim().replace(/[.:]?$/, '.') : l);
  const out: string[] = []; let cur = '';
  const bytes = (s: string) => new TextEncoder().encode(s).length;
  for (const b of blocos) {
    if (bytes(cur + '\n\n' + b) > 4500 && cur) { out.push(cur); cur = b; } else cur = cur ? cur + '\n\n' + b : b;
  }
  if (cur) out.push(cur);
  return out;
}

async function sintetizar(texto: string, voz: string): Promise<Uint8Array> {
  if (!(await chave())) throw new Error('Falta a chave da Google no Supabase.');
  const partes: Uint8Array[] = [];
  for (const p of pedacos(texto)) {
    const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GKEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { text: p }, voice: { languageCode: voz.split('-').slice(0, 2).join('-'), name: voz }, audioConfig: { audioEncoding: 'MP3' } }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error('Google: ' + (j.error?.message || r.status));
    partes.push(Uint8Array.from(atob(j.audioContent), (c) => c.charCodeAt(0)));
  }
  const tot = partes.reduce((n, p) => n + p.length, 0); const mp3 = new Uint8Array(tot); let o = 0;
  for (const p of partes) { mp3.set(p, o); o += p.length; }
  return mp3;
}

async function guardar(path: string, mp3: Uint8Array) {
  const { error } = await admin.storage.from('audio').upload(path, mp3, { contentType: 'audio/mpeg', upsert: true });
  if (error) throw error;
}

// ---------- língua local ----------
const LINGUA_VOZ: Record<string, string> = { ja: 'ja-JP', th: 'th-TH', zh: 'cmn-CN', ko: 'ko-KR', nl: 'nl-NL', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', es: 'es-ES', el: 'el-GR', ru: 'ru-RU', vi: 'vi-VN', tr: 'tr-TR', ar: 'ar-XA', hi: 'hi-IN', id: 'id-ID', cs: 'cs-CZ', pl: 'pl-PL', hu: 'hu-HU' };
async function melhorVoz(lingua: string): Promise<string> {
  const lc = LINGUA_VOZ[lingua] || lingua; await chave();
  const r = await fetch(`https://texttospeech.googleapis.com/v1/voices?languageCode=${lc}&key=${GKEY}`); const j = await r.json();
  const vs = (j.voices || []).filter((v: any) => v.languageCodes?.includes(lc)).map((v: any) => v.name as string);
  return vs.find((n: string) => /Neural2/.test(n)) || vs.find((n: string) => /Wavenet/.test(n)) || vs.find((n: string) => /Standard/.test(n)) || vs[0] || `${lc}-Standard-A`;
}
async function placesLocal(q: string, lingua: string, lat?: number | null, lng?: number | null) {
  await chave();
  const corpo: any = { textQuery: q, languageCode: lingua, maxResultCount: 1 };
  if (lat != null && lng != null) corpo.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 3000 } };
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GKEY,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.location' }, body: JSON.stringify(corpo) });
  const j = await r.json(); if (!r.ok) throw new Error('Google Places: ' + (j.error?.message || r.status));
  const p = j.places?.[0]; if (!p) throw new Error('O Google não encontrou este local.');
  // o mesmo local em letras nossas, para poderes confirmar que é o sítio certo
  let pt: any = {};
  try { const d = await fetch(`https://places.googleapis.com/v1/places/${p.id}?languageCode=pt`, { headers: { 'X-Goog-Api-Key': GKEY, 'X-Goog-FieldMask': 'displayName,formattedAddress' } }); if (d.ok) pt = await d.json(); } catch (_) {}
  return { nome: p.displayName?.text || null, morada: p.formattedAddress || null, tel: p.nationalPhoneNumber || p.internationalPhoneNumber || null,
    id: p.id, latitude: p.location?.latitude ?? null, longitude: p.location?.longitude ?? null, nomeLat: pt.displayName?.text || null, moradaLat: pt.formattedAddress || null };
}

// hotel: nome + morada; atração: nome do local; transporte: o ponto de partida (aeroporto, estação)
function consultaLocal(tab: string, x: any): string {
  if (tab === 'hotels') return [x.name, x.address, x.city].filter(Boolean).join(', ');
  if (x.transport_mode) return x.from_place ? [x.from_place, x.transport_mode === 'aviao' ? 'aeroporto' : x.transport_mode === 'comboio' ? 'estação' : ''].filter(Boolean).join(' ') : '';
  return [x.place_name || x.title, x.maps_query && x.maps_query !== x.place_name ? x.maps_query : ''].filter(Boolean).join(', ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const body = await req.json().catch(() => ({}));
    // Autorização: token interno (chamadas feitas pela base de dados) ou o dono da viagem
    let ehAdmin = false;
    const tok = req.headers.get('x-narrar-admin');
    if (tok) { const { data } = await admin.rpc('narrar_token_ok', { t: tok }); ehAdmin = data === true; if (!ehAdmin) return resp({ erro: 'Sem autorização' }, 401); }
    const donoDe = async (tripId: string) => {
      if (ehAdmin) return true;
      const auth = req.headers.get('Authorization'); if (!auth) return false;
      const u = createClient(URL, ANON, { global: { headers: { Authorization: auth } } });
      const { data } = await u.rpc('is_trip_owner', { t: tripId }); return data === true;
    };

    if (body.acao === 'vozes') {
      if (!ehAdmin) return resp({ erro: 'Sem autorização' }, 401);
      if (!(await chave())) return resp({ erro: 'Falta a chave da Google no Supabase.' }, 400);
      const r = await fetch(`https://texttospeech.googleapis.com/v1/voices?languageCode=${body.lingua || 'pt-PT'}&key=${GKEY}`);
      const j = await r.json(); if (!r.ok) return resp({ erro: j.error?.message || r.status }, 400);
      return resp({ vozes: (j.voices || []).map((v: any) => ({ nome: v.name, genero: v.ssmlGender, linguas: v.languageCodes })) });
    }

    if (body.acao === 'amostra') {
      if (!(await donoDe(body.trip_id))) return resp({ erro: 'Sem autorização' }, 401);
      const mp3 = await sintetizar(body.texto, body.voz);
      const path = `${body.trip_id}/amostras/${String(body.nome || body.voz).replace(/[^\w.-]/g, '_')}.mp3`;
      await guardar(path, mp3);
      const { data } = await admin.storage.from('audio').createSignedUrl(path, 60 * 60 * 24 * 7);
      return resp({ path, url: data?.signedUrl, bytes: mp3.length });
    }

    if (body.acao === 'gerar') {
      const { data: a, error } = await admin.from('activities').select('id, trip_id, guide').eq('id', body.activity_id).single();
      if (error || !a) return resp({ erro: 'Atividade não encontrada' }, 404);
      if (!(await donoDe(a.trip_id))) return resp({ erro: 'Sem autorização' }, 401);
      if (!a.guide) return resp({ erro: 'Esta atividade não tem guia.' }, 400);
      const mp3 = await sintetizar(a.guide, body.voz);
      const path = `${a.trip_id}/guias/${a.id}.mp3`;
      await guardar(path, mp3);
      await admin.from('activities').update({ guide_audio_path: path, guide_voice: body.voz, guide_audio_at: new Date().toISOString() }).eq('id', a.id);
      const { data: su } = await admin.storage.from('audio').createSignedUrl(path, 60 * 60 * 24 * 7);
      return resp({ path, bytes: mp3.length, url: su?.signedUrl });
    }
    if (body.acao === 'local' || body.acao === 'local-audio') {
      const tab = body.tabela === 'hotels' ? 'hotels' : 'activities';
      const { data: x, error } = await admin.from(tab).select('*').eq('id', body.id).single();
      if (error || !x) return resp({ erro: 'Local não encontrado' }, 404);
      if (!(await donoDe(x.trip_id))) return resp({ erro: 'Sem autorização' }, 401);
      const lingua = String(body.lingua || x.local_lang || '').trim(); if (!lingua) return resp({ erro: 'Falta a língua local.' }, 400);
      let campos: any = { local_lang: lingua };
      if (body.acao === 'local') {
        // o mesmo texto de pesquisa que a app usa (para saber quando é preciso atualizar)
        const q = consultaLocal(tab, x); if (!q) return resp({ erro: 'Falta o nome do local.' }, 400);
        const r = await placesLocal(q, lingua, x.transport_mode ? null : x.lat, x.transport_mode ? null : x.lng);
        campos.local_query = q;
        campos = { ...campos, local_name: r.nome, local_address: r.morada, local_phone: r.tel || x.local_phone || (tab === 'hotels' ? x.phone : null),
          local_place_id: r.id, local_lat: r.latitude, local_lng: r.longitude, local_nome_lat: r.nomeLat, local_morada_lat: r.moradaLat, local_ok: false };
      } else campos = { ...campos, local_name: x.local_name, local_address: x.local_address };
      // áudio: nome e morada na voz da língua local
      try {
        const voz = await melhorVoz(lingua); const texto = [campos.local_name, campos.local_address].filter(Boolean).join(['ja', 'zh'].includes(lingua) ? '。' : '. ');
        if (texto) { const mp3 = await sintetizar(texto, voz); const path = `${x.trip_id}/local/${tab}-${x.id}.mp3`; await guardar(path, mp3); campos.local_audio_path = path; }
      } catch (_) { /* sem áudio, o texto chega */ }
      campos.local_at = new Date().toISOString();
      await admin.from(tab).update(campos).eq('id', x.id);
      return resp({ ok: true, ...campos });
    }
    return resp({ erro: 'Ação desconhecida' }, 400);
  } catch (e) {
    return resp({ erro: String((e as Error).message || e) }, 500);
  }
});
