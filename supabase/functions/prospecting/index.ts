import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const MAPS = 'https://connector-gateway.lovable.dev/google_maps';
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const CITIES: Record<string, { lat: number; lng: number }> = {
  'Fort Myers': { lat: 26.6406, lng: -81.8723 },
  'Lehigh Acres': { lat: 26.6254, lng: -81.6248 },
};

const SearchSchema = z.object({
  categories: z.array(z.string().min(2).max(40)).min(1).max(8),
  cities: z.array(z.enum(['Fort Myers', 'Lehigh Acres'])).min(1),
});

async function streamResponses(prompt: string): Promise<string> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) throw new Error('LOVABLE_API_KEY missing');
  const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'Lovable-API-Key': key,
      'X-Lovable-AIG-SDK': 'fetch',
    },
    body: JSON.stringify({
      model: 'openai/gpt-6-astra',
      input: prompt,
      stream: true,
      store: false,
      reasoning: { effort: 'low' },
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text();
    const err = new Error(`AI ${res.status}: ${t}`);
    (err as any).status = res.status;
    throw err;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const d = line.slice(5).trim();
      if (!d || d === '[DONE]') continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === 'response.output_text.delta') out += ev.delta;
        if (ev.type === 'response.failed' || ev.type === 'error') throw new Error(JSON.stringify(ev));
      } catch (e) { if (String(e).includes('response.failed')) throw e; }
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  const { data: u } = await sb.auth.getUser(token);
  if (!u?.user) return json({ error: 'Not signed in' }, 401);
  const [a, o] = await Promise.all([
    sb.rpc('has_role', { _user_id: u.user.id, _role: 'admin' }),
    sb.rpc('has_role', { _user_id: u.user.id, _role: 'owner' }),
  ]);
  if (!a.data && !o.data) return json({ error: 'Admins only' }, 403);

  const action = new URL(req.url).searchParams.get('action');
  const body = await req.json().catch(() => ({}));

  try {
    if (action === 'search') {
      const p = SearchSchema.safeParse(body);
      if (!p.success) return json({ error: p.error.flatten().fieldErrors }, 400);
      const mk = Deno.env.get('GOOGLE_MAPS_API_KEY');
      let added = 0, found = 0;
      for (const city of p.data.cities) {
        for (const cat of p.data.categories) {
          const r = await fetch(`${MAPS}/places/v1/places:searchText`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
              'X-Connection-Api-Key': mk!,
              'Content-Type': 'application/json',
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus',
            },
            body: JSON.stringify({
              textQuery: `${cat} in ${city}, FL`,
              pageSize: 20,
              locationBias: { circle: { center: { latitude: CITIES[city].lat, longitude: CITIES[city].lng }, radius: 15000 } },
            }),
          });
          if (r.status === 403) return json({ error: 'Google Maps denied the search. Check the Maps connection.', details: await r.text() }, 403);
          if (!r.ok) return json({ error: 'Google Maps search failed', status: r.status, details: await r.text() }, r.status);
          const places = (await r.json()).places || [];
          found += places.length;
          const rows = places
            .filter((pl: any) => pl.businessStatus !== 'CLOSED_PERMANENTLY')
            .map((pl: any) => ({
              place_id: pl.id, name: pl.displayName?.text || 'Unknown', category: cat, city,
              phone: pl.nationalPhoneNumber || null, website: pl.websiteUri || null,
              address: pl.formattedAddress || null, rating: pl.rating ?? null, review_count: pl.userRatingCount ?? null,
            }));
          if (rows.length) {
            const { data } = await sb.from('prospects').upsert(rows, { onConflict: 'place_id', ignoreDuplicates: true }).select('id');
            added += data?.length || 0;
          }
        }
      }
      return json({ ok: true, found, added });
    }

    if (action === 'enrich') {
      // force=true: re-search drafts searched before with no email (pass 2)
      const force = body?.force === true;
      let q = sb.from('prospects').select('id,website,name,city').is('email', null).eq('do_not_contact', false);
      q = force ? q.eq('email_status', 'draft').not('enriched_at', 'is', null).is('email_source', null) : q.is('enriched_at', null);
      const { data: list } = await q.limit(8);
      const BAD = /example|sentry|wix|domain\.com|godaddy|myfloridalicense|\.gov$|\.fl\.us$|filler|noreply|no-reply|yourname|email@|user@|lehighfd|bbb\.org|yelp|facebook|google|squarespace|wordpress|\.(png|jpg|jpeg|gif|webp|svg)$/i;
      const host = (u?: string | null) => { try { return new URL(String(u)).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
      const pick = (raw: string, site: string) => {
        const text = raw.replace(/\s*(\[|\()\s*at\s*(\]|\))\s*/gi, '@').replace(/\s*(\[|\()\s*dot\s*(\]|\))\s*/gi, '.').replace(/&#64;|%40/g, '@');
        const all = [...new Set([...text.matchAll(/(?:mailto:)?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.(?:com|net|org|biz|us|co|info))\b/gi)].map((m) => m[1].toLowerCase()))].filter((e) => !BAD.test(e));
        return (site && all.find((e) => e.endsWith('@' + site))) || all[0] || null;
      };
      const fcKey = Deno.env.get('FIRECRAWL_API_KEY');
      const fc = (path: string, payload: unknown, ms = 40000) => fetch(`https://api.firecrawl.dev/v2/${path}`, {
        method: 'POST', headers: { Authorization: `Bearer ${fcKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(ms),
      });
      let emails = 0, outOfCredits = false;
      await Promise.all((list || []).map(async (p) => {
        let email: string | null = null, source: string | null = null;
        const site = host(p.website);
        if (p.website) {
          for (const path of ['', '/contact', '/contact-us', '/about', '/about-us', '/quote']) {
            try {
              const url = new URL(path || '/', String(p.website)).toString();
              const r = await fetch(url, { signal: AbortSignal.timeout(6000), redirect: 'follow' });
              if (!r.ok) continue;
              email = pick((await r.text()).slice(0, 400000), site);
              if (email) { source = `website${path || ''}`; break; }
            } catch { /* skip */ }
          }
          if (!email && fcKey && !outOfCredits) {
            try {
              const r = await fc('scrape', { url: String(p.website), formats: ['rawHtml'], waitFor: 1500 }, 30000);
              if (r.status === 402) outOfCredits = true;
              else if (r.ok) { const d = await r.json(); email = pick(String(d?.data?.rawHtml || d?.rawHtml || ''), site); if (email) source = 'website (full load)'; }
            } catch (e) { console.error('fc scrape', e); }
          }
        }
        for (const query of [`"${p.name}" ${p.city || ''} FL email`, `"${p.name}" ${p.city || ''} facebook OR bbb OR yelp`]) {
          if (email || !fcKey || outOfCredits) break;
          try {
            const r = await fc('search', { query, limit: 5, country: 'US', scrapeOptions: { formats: ['markdown'], onlyMainContent: true } });
            if (r.status === 402) { outOfCredits = true; break; }
            if (!r.ok) { console.error('firecrawl search', r.status, await r.text()); continue; }
            const d = await r.json();
            const items = Array.isArray(d?.data) ? d.data : (d?.data?.web || []);
            for (const it of items) {
              email = pick(`${it.description || ''} ${it.markdown || ''}`, site);
              if (email) { source = host(it.url) || 'web search'; break; }
            }
          } catch (e) { console.error('firecrawl error', e); }
        }
        if (email) emails++;
        if (outOfCredits && !email) return; // leave for later
        await sb.from('prospects').update({ email, email_source: source ?? (force ? 'none found' : null), enriched_at: new Date().toISOString() }).eq('id', p.id);
      }));
      const { count: fresh } = await sb.from('prospects').select('id', { count: 'exact', head: true }).is('email', null).eq('do_not_contact', false).is('enriched_at', null);
      const { count: retry } = await sb.from('prospects').select('id', { count: 'exact', head: true }).is('email', null).eq('do_not_contact', false).eq('email_status', 'draft').not('enriched_at', 'is', null).is('email_source', null);
      return json({ ok: true, checked: list?.length || 0, emails, remaining: force ? (retry || 0) : (fresh || 0), retry: retry || 0, outOfCredits });
    }

    if (action === 'pitch') {
      const cat = z.string().min(2).max(40).safeParse(body.category);
      if (!cat.success) return json({ error: 'category required' }, 400);
      const { data: cached } = await sb.from('prospect_pitches').select('*').eq('category', cat.data).maybeSingle();
      if (cached && !body.regenerate) return json({ ok: true, pitch: cached });
      const text = await streamResponses(
`You write B2B outreach for Mike's Mobile Auto Repair, a mobile mechanic serving Fort Myers and Lehigh Acres, FL. Phone/text 813-501-7572. Offer: the Fleet Partner Plan — monthly on-site "Yard Days" at the customer's lot, digital fleet health reports, priority dispatch when a vehicle goes down, no mobile diagnostic fees, and labor rates better than the average repair shop. NEVER mention specific prices, dollar amounts or percentages.
Target: ${cat.data} businesses with work trucks/vans. Tailor to how downtime hurts that trade.
Return ONLY JSON: {"email_subject": "...(under 60 chars)", "email_body": "...(under 120 words, plain text, start with 'Hi {{name}} team,', end with a call to reply or call/text 813-501-7572, sign '— Mike, Mike's Mobile Auto Repair')", "call_script": "...(opener, 2 value points, 1 question, ask for a 10-minute yard visit; under 110 words)"}`);
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) return json({ error: 'AI returned no pitch' }, 502);
      const parsed = JSON.parse(m[0]);
      const row = { category: cat.data, email_subject: String(parsed.email_subject), email_body: String(parsed.email_body), call_script: String(parsed.call_script) };
      await sb.from('prospect_pitches').upsert(row);
      return json({ ok: true, pitch: row });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    const status = (e as any).status || 500;
    return json({ error: String((e as Error).message || e) }, status);
  }
});
