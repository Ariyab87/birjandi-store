'use client';

import { useEffect, useMemo, useState } from 'react';

// Product list + add/edit form for the admin panel (replaces the Strapi admin).

interface Img { url: string; width?: number | null; height?: number | null; formats?: unknown }

interface ProductForm {
  documentId?: string;
  name_fa: string;
  name_en: string;
  brand: string;
  category: string;
  retail_price: string;
  wholesale_price: string;
  min_wholesale_qty: string;
  price_on_request: boolean;
  stock_status: 'in_stock' | 'out_of_stock';
  featured: boolean;
  published: boolean;
  business_types: string[];
  description_fa: string;
  description_en: string;
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  no_index: boolean;
  images: Img[];
}

const EMPTY: ProductForm = {
  name_fa: '', name_en: '', brand: '', category: 'electric',
  retail_price: '', wholesale_price: '', min_wholesale_qty: '1',
  price_on_request: false, stock_status: 'in_stock', featured: false, published: true,
  business_types: [], description_fa: '', description_en: '',
  seo_title: '', seo_description: '', focus_keyword: '', no_index: false, images: [],
};

const BUSINESS_TYPES = [
  { key: 'cafe', label: 'کافه' },
  { key: 'restaurant', label: 'رستوران' },
  { key: 'gym', label: 'باشگاه' },
  { key: 'hotel', label: 'هتل' },
  { key: 'office', label: 'دفتر کار' },
];

const input = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500';
const label = 'text-gray-400 text-xs mb-1 block';

const fmt = (n: number | null) => (n == null ? '—' : (n * 1000).toLocaleString('fa-IR') + ' ت');

/** Shrink big phone photos before upload (Vercel caps request bodies at 4.5MB). */
async function shrinkImage(file: File, maxSide = 1600): Promise<Blob> {
  if (file.size < 1.5 * 1024 * 1024 || file.type === 'image/gif') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', 0.88),
  );
}

export default function ProductsManager({
  password, categories,
}: {
  password: string;
  categories: Array<{ key: string; label: string }>;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [form, setForm] = useState<ProductForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const catLabel = (k: string) => categories.find(c => c.key === k)?.label || k;
  const headers = { 'x-admin-password': password };

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products', { headers, cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(data.products);
    } catch (e) {
      setMsg({ text: `خطا در بارگذاری محصولات: ${e instanceof Error ? e.message : ''}`, ok: false });
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p =>
      (catFilter === 'all' || p.category === catFilter) &&
      (!q || [p.name_fa, p.name_en, p.brand].some((s: string) => s?.toLowerCase().includes(q))),
    );
  }, [products, search, catFilter]);

  function openNew() {
    setMsg(null);
    setForm({ ...EMPTY, category: catFilter !== 'all' ? catFilter : EMPTY.category });
  }

  async function openEdit(documentId: string) {
    setMsg(null);
    const res = await fetch(`/api/admin/products?documentId=${documentId}`, { headers, cache: 'no-store' });
    const { product: p, error } = await res.json();
    if (!res.ok) { setMsg({ text: error || 'خطا', ok: false }); return; }
    setForm({
      documentId: p.documentId,
      name_fa: p.name_fa ?? '', name_en: p.name_en ?? '', brand: p.brand ?? '', category: p.category,
      retail_price: p.retail_price?.toString() ?? '', wholesale_price: p.wholesale_price?.toString() ?? '',
      min_wholesale_qty: String(p.min_wholesale_qty ?? 1),
      price_on_request: p.price_on_request, stock_status: p.stock_status, featured: p.featured,
      published: p.published, business_types: p.business_types ?? [],
      description_fa: p.description_fa ?? '', description_en: p.description_en ?? '',
      seo_title: p.seo_title ?? '', seo_description: p.seo_description ?? '',
      focus_keyword: p.focus_keyword ?? '', no_index: p.no_index, images: p.images ?? [],
    });
    window.scrollTo({ top: 0 });
  }

  function set<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm(f => (f ? { ...f, [key]: value } : f));
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !form) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append('file', await shrinkImage(file), file.name);
        const res = await fetch('/api/admin/upload', { method: 'POST', headers, body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setForm(f => (f ? { ...f, images: [...f.images, data.image] } : f));
      }
    } catch (e) {
      setMsg({ text: `آپلود ناموفق: ${e instanceof Error ? e.message : ''}`, ok: false });
    } finally {
      setUploading(false);
    }
  }

  function moveImage(i: number, dir: -1 | 1) {
    if (!form) return;
    const imgs = [...form.images];
    const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    set('images', imgs);
  }

  async function save() {
    if (!form) return;
    if (!form.name_fa.trim()) { setMsg({ text: 'نام فارسی را وارد کنید', ok: false }); return; }
    setSaving(true);
    setMsg(null);
    const { documentId, ...product } = form;
    try {
      const res = await fetch('/api/admin/products', {
        method: documentId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, documentId, product }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ text: documentId ? '✅ محصول ذخیره شد' : '✅ محصول جدید اضافه شد', ok: true });
      setForm(null);
      load();
    } catch (e) {
      setMsg({ text: `ذخیره ناموفق: ${e instanceof Error ? e.message : ''}`, ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function remove(documentId: string, name: string) {
    if (!confirm(`«${name}» برای همیشه حذف شود؟`)) return;
    const res = await fetch(`/api/admin/products?documentId=${documentId}`, { method: 'DELETE', headers });
    if (res.ok) {
      setMsg({ text: '🗑 محصول حذف شد', ok: true });
      setForm(null);
      load();
    } else {
      setMsg({ text: 'حذف ناموفق بود', ok: false });
    }
  }

  const banner = msg && (
    <p className={`text-sm px-4 py-3 rounded-xl border ${msg.ok
      ? 'bg-green-900/30 border-green-700 text-green-300'
      : 'bg-red-900/30 border-red-700 text-red-300'}`}>{msg.text}</p>
  );

  // ── FORM ──
  if (form) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold">{form.documentId ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h2>
          <button onClick={() => setForm(null)} className="text-gray-400 hover:text-white text-sm">→ بازگشت به لیست</button>
        </div>
        {banner}

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={label}>نام فارسی *</label>
              <input className={input} value={form.name_fa} onChange={e => set('name_fa', e.target.value)} /></div>
            <div><label className={label}>نام انگلیسی</label>
              <input className={input} dir="ltr" value={form.name_en} onChange={e => set('name_en', e.target.value)} /></div>
            <div><label className={label}>برند</label>
              <input className={input} value={form.brand} onChange={e => set('brand', e.target.value)} /></div>
            <div><label className={label}>دسته‌بندی *</label>
              <select className={input} value={form.category} onChange={e => set('category', e.target.value)}>
                {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select></div>
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <p className="text-gray-400 text-xs">قیمت‌ها به <b className="text-gray-200">هزار تومان</b> — مثلاً ۶۵۰۰ یعنی ۶٬۵۰۰٬۰۰۰ تومان</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={label}>قیمت خرده</label>
              <input className={input} type="number" min="0" dir="ltr" value={form.retail_price}
                onChange={e => set('retail_price', e.target.value)} />
              {form.retail_price && <p className="text-gold-400 text-xs mt-1">{fmt(Number(form.retail_price))}</p>}</div>
            <div><label className={label}>قیمت عمده</label>
              <input className={input} type="number" min="0" dir="ltr" value={form.wholesale_price}
                onChange={e => set('wholesale_price', e.target.value)} />
              {form.wholesale_price && <p className="text-gold-400 text-xs mt-1">{fmt(Number(form.wholesale_price))}</p>}</div>
            <div><label className={label}>حداقل تعداد عمده</label>
              <input className={input} type="number" min="1" dir="ltr" value={form.min_wholesale_qty}
                onChange={e => set('min_wholesale_qty', e.target.value)} /></div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-200">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.price_on_request}
              onChange={e => set('price_on_request', e.target.checked)} /> قیمت استعلامی</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.stock_status === 'in_stock'}
              onChange={e => set('stock_status', e.target.checked ? 'in_stock' : 'out_of_stock')} /> موجود</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured}
              onChange={e => set('featured', e.target.checked)} /> ویژه</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.published}
              onChange={e => set('published', e.target.checked)} /> نمایش در سایت</label>
          </div>
          <div>
            <label className={label}>مناسب برای کسب‌وکار (بخش عمده)</label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TYPES.map(b => {
                const on = form.business_types.includes(b.key);
                return (
                  <button key={b.key} type="button"
                    onClick={() => set('business_types', on
                      ? form.business_types.filter(x => x !== b.key)
                      : [...form.business_types, b.key])}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${on
                      ? 'bg-gold-500/20 border-gold-500 text-gold-300'
                      : 'border-gray-700 text-gray-400 hover:text-white'}`}>
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
          <label className={label}>تصاویر (اولین تصویر، تصویر اصلی است)</label>
          <div className="flex flex-wrap gap-3">
            {form.images.map((img, i) => (
              <div key={img.url} className="relative w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url.replace('/upload/', '/upload/w_200,q_70,f_auto/')} alt=""
                  className="w-24 h-24 object-contain bg-white rounded-lg" />
                <div className="flex justify-between mt-1 text-xs">
                  <button type="button" onClick={() => moveImage(i, -1)} className="text-gray-400 hover:text-white px-1">→</button>
                  <button type="button" onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-300 px-1">حذف</button>
                  <button type="button" onClick={() => moveImage(i, 1)} className="text-gray-400 hover:text-white px-1">←</button>
                </div>
              </div>
            ))}
            <label className={`w-24 h-24 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-400 text-xs cursor-pointer hover:border-gold-500 hover:text-gold-400 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-2xl leading-none">+</span>
              {uploading ? 'در حال آپلود…' : 'افزودن تصویر'}
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => { uploadFiles(e.target.files); e.target.value = ''; }} />
            </label>
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div><label className={label}>توضیحات فارسی</label>
            <textarea className={`${input} min-h-[120px]`} value={form.description_fa}
              onChange={e => set('description_fa', e.target.value)} /></div>
          <div><label className={label}>توضیحات انگلیسی</label>
            <textarea className={`${input} min-h-[80px]`} dir="ltr" value={form.description_en}
              onChange={e => set('description_en', e.target.value)} /></div>
        </section>

        <details className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <summary className="text-gray-300 text-sm cursor-pointer">تنظیمات سئو (اختیاری)</summary>
          <div className="space-y-4 mt-4">
            <div><label className={label}>عنوان سئو ({form.seo_title.length}/60)</label>
              <input className={input} value={form.seo_title} onChange={e => set('seo_title', e.target.value)} /></div>
            <div><label className={label}>توضیحات سئو ({form.seo_description.length}/155)</label>
              <textarea className={input} value={form.seo_description} onChange={e => set('seo_description', e.target.value)} /></div>
            <div><label className={label}>کلمه کلیدی</label>
              <input className={input} value={form.focus_keyword} onChange={e => set('focus_keyword', e.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm text-gray-200"><input type="checkbox" checked={form.no_index}
              onChange={e => set('no_index', e.target.checked)} /> عدم نمایش در گوگل (noindex)</label>
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-3 pb-10">
          <button onClick={save} disabled={saving || uploading}
            className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm">
            {saving ? 'در حال ذخیره…' : form.documentId ? 'ذخیره تغییرات' : 'افزودن محصول'}
          </button>
          <button onClick={() => setForm(null)} className="text-gray-400 hover:text-white text-sm px-4 py-3">انصراف</button>
          {form.documentId && (
            <>
              <a href={`/fa/retail/${form.category}/${form.documentId}`} target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm px-4 py-3">مشاهده در سایت ↗</a>
              <button onClick={() => remove(form.documentId!, form.name_fa)}
                className="mr-auto text-red-400 hover:text-red-300 text-sm px-4 py-3">حذف محصول</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── LIST ──
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-white font-bold">محصولات <span className="text-gray-500 font-normal text-sm">({products.length.toLocaleString('fa-IR')})</span></h2>
        <button onClick={openNew} className="mr-auto bg-gold-500 hover:bg-gold-400 text-white font-bold px-4 py-2 rounded-xl text-sm">
          + افزودن محصول
        </button>
      </div>
      {banner}
      <div className="flex flex-col sm:flex-row gap-3">
        <input className={input} placeholder="جستجو در نام یا برند…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className={`${input} sm:w-48`} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">همه دسته‌ها</option>
          {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>

      {loading && !products.length ? (
        <p className="text-gray-400 text-sm text-center py-10">در حال بارگذاری...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-10">محصولی پیدا نشد</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <button key={p.documentId} onClick={() => openEdit(p.documentId)}
              className="w-full flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-3 text-right transition-colors">
              {p.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0].url.replace('/upload/', '/upload/w_120,q_60,f_auto/')} alt=""
                  className="w-14 h-14 object-contain bg-white rounded-lg shrink-0" loading="lazy" />
              ) : <div className="w-14 h-14 bg-gray-800 rounded-lg shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{p.name_fa}</p>
                <p className="text-gray-500 text-xs truncate">{p.brand} · {catLabel(p.category)}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {!p.published && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">مخفی</span>}
                  {p.stock_status === 'out_of_stock' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/50 text-red-300">ناموجود</span>}
                  {p.featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-300">ویژه</span>}
                </div>
              </div>
              <div className="text-left shrink-0">
                <p className="text-gold-400 text-sm">{p.price_on_request ? 'استعلامی' : fmt(p.retail_price)}</p>
                {p.wholesale_price != null && <p className="text-gray-500 text-xs">عمده: {fmt(p.wholesale_price)}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
