import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const ADMIN_PASSWORD = process.env.ADMIN_CHAT_PASSWORD || 'bshop-admin-2024';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const CAT_FA: Record<string, string> = {
  electric: 'لوازم برقی', kitchen: 'لوازم آشپزخانه', cooling: 'لوازم سرمایشی',
  heating: 'لوازم گرمایشی', cleaning: 'لوازم نظافت', metal: 'ظروف فلزی',
  melamine: 'ظروف ملامین', glass: 'ظروف شکستنی', porcelain: 'ظروف چینی',
  teflon: 'ظروف تفلون', steel: 'ظروف استیل', ceramic: 'ظروف سرامیک',
  plastic: 'لوازم پلاستیکی', crystal: 'ظروف کریستال', copper: 'ظروف مسی', cast_iron: 'ظروف چدنی',
};
const CAT_EN: Record<string, string> = {
  electric: 'electric appliances', kitchen: 'kitchen appliances', cooling: 'cooling appliances',
  heating: 'heating appliances', cleaning: 'cleaning appliances', metal: 'metal cookware',
  melamine: 'melamine tableware', glass: 'glassware', porcelain: 'porcelain tableware',
  teflon: 'non-stick cookware', steel: 'stainless steel cookware', ceramic: 'ceramic cookware',
  plastic: 'plastic housewares', crystal: 'crystal tableware', copper: 'copper cookware', cast_iron: 'cast iron cookware',
};

const SYSTEM_PROMPT = `You write product copy for کالالند۲۴ (Kalaland24), an Iranian online household-appliances store (kalaland24.com). Respond ONLY with valid JSON, no markdown fences.

STRICT RULES:
- NEVER invent technical specifications (wattage, capacity, liters, dimensions, materials, speeds, warranty length). You may only mention a model number or spec if it literally appears inside the product NAME itself.
- Fluent, natural, native-quality Persian. No stiff machine translation.
- No dishonest superlatives. Keep it honest and warm.
- description_fa: 3-4 sentences of natural Persian describing the product generally (what it is, brand, use at home, buying from Kalaland24 with ارسال به سراسر ایران and ضمانت اصالت کالا).
- description_en: 2-3 sentences, natural English, same constraints.
- seo_title: Persian, MAX 60 characters, keyword-first, e.g.: خرید {product} {brand} | کالالند۲۴
- seo_description: Persian, MAX 155 characters, includes the product name and something like خرید آنلاین / ارسال سراسر ایران.

JSON shape: {"description_fa": "...", "description_en": "...", "seo_title": "...", "seo_description": "..."}`;

interface ProductRow {
  documentId: string;
  name_fa: string;
  name_en: string;
  brand: string;
  category: string;
  description_fa: string | null;
  description_en: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

const empty = (v: string | null | undefined) => !v || !String(v).trim();

function missingFields(p: ProductRow): string[] {
  return (['description_fa', 'description_en', 'seo_title', 'seo_description'] as const)
    .filter(k => empty(p[k]));
}

async function fetchAllProducts(): Promise<ProductRow[]> {
  const out: ProductRow[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(
      `${STRAPI_URL}/api/products?pagination[page]=${page}&pagination[pageSize]=100&sort=createdAt:asc`,
      { cache: 'no-store' },
    );
    if (!res.ok) throw new Error(`Strapi list ${res.status}`);
    const json = await res.json();
    out.push(...json.data);
    if (page >= json.meta.pagination.pageCount) break;
  }
  return out;
}

async function generateCopy(p: ProductRow) {
  const user = `Product:
- Persian name: ${p.name_fa}
- English name: ${p.name_en}
- Brand: ${p.brand}
- Category: ${CAT_FA[p.category] || p.category} (${CAT_EN[p.category] || p.category})`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const json = await res.json();
  const out = JSON.parse(json.choices[0].message.content);
  if (empty(out.description_fa) || empty(out.seo_title)) throw new Error('incomplete generation');
  if (out.seo_title.length > 70) out.seo_title = out.seo_title.slice(0, 70);
  if (!out.seo_title.includes('کالالند۲۴') && out.seo_title.length <= 48) out.seo_title += ' | کالالند۲۴';
  if (out.seo_description.length > 160) out.seo_description = out.seo_description.slice(0, 157) + '...';
  return out as Record<string, string>;
}

// GET /api/admin/fill-seo?password=… — report how many products still need content
export async function GET(req: NextRequest) {
  const pw = req.nextUrl.searchParams.get('password');
  if (pw !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const products = await fetchAllProducts();
  const pending = products.filter(p => missingFields(p).length > 0);
  return NextResponse.json({ total: products.length, remaining: pending.length });
}

// POST /api/admin/fill-seo — body: { password, batchSize? } OR { password, items: [...] }
// Fills ONLY empty fields; owner content is never overwritten. With `items`,
// pre-written copy is applied instead of AI generation (same empty-field guard).
export async function POST(req: NextRequest) {
  try {
    const { password, batchSize = 5, items } = await req.json();
    if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!STRAPI_TOKEN) {
      return NextResponse.json({ error: 'STRAPI_API_TOKEN not set' }, { status: 500 });
    }

    if (Array.isArray(items)) {
      const products = await fetchAllProducts();
      const byId = new Map(products.map(p => [p.documentId, p]));
      const results: Array<{ documentId: string; name?: string; wrote?: string[]; error?: string }> = [];
      for (const item of items.slice(0, 40)) {
        const p = byId.get(item.documentId);
        if (!p) { results.push({ documentId: item.documentId, error: 'not found' }); continue; }
        const patch: Record<string, string> = {};
        for (const k of missingFields(p)) if (!empty(item[k])) patch[k] = String(item[k]);
        if (Object.keys(patch).length === 0) {
          results.push({ documentId: p.documentId, name: p.name_fa, wrote: [] });
          continue;
        }
        try {
          const put = await fetch(`${STRAPI_URL}/api/products/${p.documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_TOKEN}` },
            body: JSON.stringify({ data: patch }),
          });
          if (!put.ok) throw new Error(`Strapi PUT ${put.status}: ${(await put.text()).slice(0, 200)}`);
          results.push({ documentId: p.documentId, name: p.name_fa, wrote: Object.keys(patch) });
        } catch (err) {
          results.push({ documentId: p.documentId, name: p.name_fa, error: String(err) });
        }
      }
      const done = results.filter(r => r.wrote && r.wrote.length).length;
      return NextResponse.json({ processed: results.length, succeeded: done, results });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });
    }

    const products = await fetchAllProducts();
    const pending = products.filter(p => missingFields(p).length > 0);
    const batch = pending.slice(0, Math.min(batchSize, 10));

    const results: Array<{ documentId: string; name: string; wrote?: string[]; error?: string }> = [];
    for (const p of batch) {
      const fields = missingFields(p);
      try {
        const gen = await generateCopy(p);
        const patch: Record<string, string> = {};
        for (const k of fields) if (gen[k]) patch[k] = gen[k];
        const put = await fetch(`${STRAPI_URL}/api/products/${p.documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_TOKEN}` },
          body: JSON.stringify({ data: patch }),
        });
        if (!put.ok) throw new Error(`Strapi PUT ${put.status}: ${(await put.text()).slice(0, 300)}`);
        results.push({ documentId: p.documentId, name: p.name_fa, wrote: Object.keys(patch) });
      } catch (err) {
        results.push({ documentId: p.documentId, name: p.name_fa, error: String(err) });
      }
    }

    const done = results.filter(r => r.wrote).length;
    return NextResponse.json({
      processed: results.length,
      succeeded: done,
      remaining: pending.length - done,
      results,
    });
  } catch (err) {
    console.error('fill-seo error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
