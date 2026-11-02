// Reads a customer-sent photo/screenshot of another shop's quote. Only itemized
// quotes qualify; the owner decides whether to match. Nothing is sent to the customer.
// deno-lint-ignore-file no-explicit-any

const tool = {
  type: 'function',
  function: {
    name: 'read_quote',
    description: 'Read an auto-repair quote image.',
    parameters: {
      type: 'object',
      properties: {
        is_repair_quote: { type: 'boolean', description: 'True only if the image is an auto repair quote/estimate with prices.' },
        source_name: { type: 'string', description: 'Shop or service that issued the quote (e.g. Valyou).' },
        customer_name: { type: 'string' },
        address: { type: 'string', description: 'Customer service/street address if shown.' },
        vehicle_year: { type: 'number' }, vehicle_make: { type: 'string' }, vehicle_model: { type: 'string' },
        total: { type: 'number' },
        line_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              kind: { type: 'string', enum: ['part', 'labor', 'fee'] },
              amount: { type: 'number', description: 'Line total in dollars.' },
            },
            required: ['description', 'kind', 'amount'],
          },
        },
      },
      required: ['is_repair_quote', 'line_items'],
    },
  },
};

export function isItemized(lines: { amount?: number }[]): boolean {
  return lines.filter((l) => Number(l.amount) > 0).length >= 2;
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function readCompetitorQuote(
  sb: any,
  opts: { path: string; type: string; phone: string; threadId: string; customerId: string | null },
): Promise<void> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key || !opts.type.startsWith('image/')) return;
  const dl = await sb.storage.from('sms-media').download(opts.path);
  if (dl.error || !dl.data) return;
  const b64 = toBase64(new Uint8Array(await dl.data.arrayBuffer()));
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Decide whether the image is an auto-repair price quote. If so, read every priced line (part, labor or fee) with its dollar total, the quote total, the issuing shop, and the customer name, address and vehicle if shown. Never guess values that are not visible.' },
        { role: 'user', content: [{ type: 'text', text: 'Read this image.' }, { type: 'image_url', image_url: { url: `data:${opts.type};base64,${b64}` } }] },
      ],
      tools: [tool],
      tool_choice: { type: 'function', function: { name: 'read_quote' } },
    }),
  });
  if (!res.ok) { console.error('quote read failed', res.status); return; }
  const json = await res.json();
  const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return;
  const ex = JSON.parse(args);
  if (!ex.is_repair_quote) return;
  const lines = (Array.isArray(ex.line_items) ? ex.line_items : [])
    .map((l: any) => ({ description: String(l.description || '').slice(0, 200), kind: ['part', 'labor', 'fee'].includes(l.kind) ? l.kind : 'part', amount: Math.round(Number(l.amount || 0) * 100) / 100 }))
    .filter((l: any) => l.description && Number.isFinite(l.amount));
  const itemized = isItemized(lines);
  const total = Number.isFinite(Number(ex.total)) && Number(ex.total) > 0 ? Number(ex.total) : lines.reduce((s: number, l: any) => s + l.amount, 0);

  let estimateId: string | null = null;
  if (opts.customerId) {
    const { data: est } = await sb.from('estimates').select('id').eq('customer_id', opts.customerId)
      .in('status', ['draft', 'sent']).order('created_at', { ascending: false }).limit(1).maybeSingle();
    estimateId = est?.id ?? null;
    await fillMissingDetails(sb, opts.customerId, ex);
  }
  await sb.from('competitor_quotes').insert({
    estimate_id: estimateId, customer_id: opts.customerId, thread_id: opts.threadId, phone: opts.phone,
    image_path: opts.path, source_name: ex.source_name || null, itemized, line_items: lines, total,
    customer_name: ex.customer_name || null, address: ex.address || null,
    vehicle_year: Number.isInteger(ex.vehicle_year) ? ex.vehicle_year : null,
    vehicle_make: ex.vehicle_make || null, vehicle_model: ex.vehicle_model || null,
  });
}

// Only fills blanks; never overwrites saved customer information.
async function fillMissingDetails(sb: any, customerId: string, ex: any) {
  const { data: p } = await sb.from('profiles').select('full_name, address_line1').eq('id', customerId).maybeSingle();
  if (p) {
    const patch: Record<string, string> = {};
    if (!p.full_name && ex.customer_name) patch.full_name = String(ex.customer_name).slice(0, 120);
    if (!p.address_line1 && ex.address) patch.address_line1 = String(ex.address).slice(0, 200);
    if (Object.keys(patch).length) await sb.from('profiles').update(patch).eq('id', customerId);
  }
  if (ex.vehicle_make && ex.vehicle_model) {
    const { data: vs } = await sb.from('vehicles').select('id').eq('owner_id', customerId).limit(1);
    if (!vs?.length) await sb.from('vehicles').insert({
      owner_id: customerId, make: String(ex.vehicle_make).slice(0, 60), model: String(ex.vehicle_model).slice(0, 60),
      year: Number.isInteger(ex.vehicle_year) ? ex.vehicle_year : null,
    });
  }
}
