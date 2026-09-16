'use client';

import { useEffect, useState } from 'react';

// Blog article list + editor for the admin panel.

interface ArticleForm {
  documentId?: string;
  title_fa: string;
  slug: string;
  excerpt_fa: string;
  content_fa: string;
  seo_title: string;
  seo_description: string;
  published: boolean;
  coverUrl: string | null;
}

const EMPTY: ArticleForm = {
  title_fa: '', slug: '', excerpt_fa: '', content_fa: '', seo_title: '', seo_description: '',
  published: true, coverUrl: null,
};

const input = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500';
const label = 'text-gray-400 text-xs mb-1 block';

export default function ArticlesManager({ password }: { password: string }) {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState<ArticleForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/articles?password=${encodeURIComponent(password)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setArticles(data.articles);
    } catch (e) {
      setMsg({ text: `خطا در بارگذاری مقاله‌ها: ${e instanceof Error ? e.message : ''}`, ok: false });
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  function set<K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) {
    setForm(f => (f ? { ...f, [key]: value } : f));
  }

  async function uploadCover(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'articles');
      const res = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-password': password }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set('coverUrl', data.image.url);
    } catch (e) {
      setMsg({ text: `آپلود ناموفق: ${e instanceof Error ? e.message : ''}`, ok: false });
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form) return;
    if (!form.title_fa.trim() || !form.slug.trim() || !form.content_fa.trim()) {
      setMsg({ text: 'عنوان، آدرس (slug) و متن مقاله لازم است', ok: false });
      return;
    }
    setSaving(true);
    setMsg(null);
    const { documentId, coverUrl, ...fields } = form;
    const article: Record<string, unknown> = { ...fields, slug: fields.slug.trim().toLowerCase() };
    // cover_url is re-uploaded server-side; only send it when it changed
    const original = articles.find(a => a.documentId === documentId);
    if (coverUrl && coverUrl !== original?.cover?.url) article.cover_url = coverUrl;
    try {
      const res = await fetch('/api/admin/articles', {
        method: documentId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, documentId, article }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ text: '✅ مقاله ذخیره شد', ok: true });
      setForm(null);
      load();
    } catch (e) {
      setMsg({ text: `ذخیره ناموفق: ${e instanceof Error ? e.message : ''}`, ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function remove(documentId: string, title: string) {
    if (!confirm(`مقاله «${title}» برای همیشه حذف شود؟`)) return;
    const res = await fetch(
      `/api/admin/articles?password=${encodeURIComponent(password)}&documentId=${documentId}`,
      { method: 'DELETE' },
    );
    setMsg(res.ok ? { text: '🗑 مقاله حذف شد', ok: true } : { text: 'حذف ناموفق بود', ok: false });
    setForm(null);
    load();
  }

  const banner = msg && (
    <p className={`text-sm px-4 py-3 rounded-xl border ${msg.ok
      ? 'bg-green-900/30 border-green-700 text-green-300'
      : 'bg-red-900/30 border-red-700 text-red-300'}`}>{msg.text}</p>
  );

  if (form) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold">{form.documentId ? 'ویرایش مقاله' : 'مقاله جدید'}</h2>
          <button onClick={() => setForm(null)} className="text-gray-400 hover:text-white text-sm">→ بازگشت به لیست</button>
        </div>
        {banner}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div><label className={label}>عنوان *</label>
            <input className={input} value={form.title_fa} onChange={e => set('title_fa', e.target.value)} /></div>
          <div><label className={label}>آدرس صفحه (slug، فقط حروف انگلیسی و خط تیره) *</label>
            <input className={input} dir="ltr" placeholder="rahnamaye-kharid-..." value={form.slug}
              onChange={e => set('slug', e.target.value.replace(/[^a-zA-Z0-9-]/g, '-'))} /></div>
          <div><label className={label}>خلاصه</label>
            <textarea className={input} value={form.excerpt_fa} onChange={e => set('excerpt_fa', e.target.value)} /></div>
          <div><label className={label}>متن مقاله * (Markdown: ## تیتر، **پررنگ**، - لیست)</label>
            <textarea className={`${input} min-h-[320px] leading-7`} value={form.content_fa}
              onChange={e => set('content_fa', e.target.value)} /></div>
          <div>
            <label className={label}>تصویر شاخص</label>
            <div className="flex items-center gap-3">
              {form.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.coverUrl} alt="" className="w-32 h-20 object-cover rounded-lg" />
              )}
              <label className="text-xs text-gray-300 border border-gray-700 px-3 py-2 rounded-lg cursor-pointer hover:border-gold-500">
                {uploading ? 'در حال آپلود…' : form.coverUrl ? 'تغییر تصویر' : 'انتخاب تصویر'}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { uploadCover(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            </div>
          </div>
          <div><label className={label}>عنوان سئو</label>
            <input className={input} value={form.seo_title} onChange={e => set('seo_title', e.target.value)} /></div>
          <div><label className={label}>توضیحات سئو</label>
            <textarea className={input} value={form.seo_description} onChange={e => set('seo_description', e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm text-gray-200"><input type="checkbox" checked={form.published}
            onChange={e => set('published', e.target.checked)} /> منتشر شده</label>
        </section>
        <div className="flex flex-wrap items-center gap-3 pb-10">
          <button onClick={save} disabled={saving || uploading}
            className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm">
            {saving ? 'در حال ذخیره…' : 'ذخیره مقاله'}
          </button>
          <button onClick={() => setForm(null)} className="text-gray-400 hover:text-white text-sm px-4 py-3">انصراف</button>
          {form.documentId && (
            <button onClick={() => remove(form.documentId!, form.title_fa)}
              className="mr-auto text-red-400 hover:text-red-300 text-sm px-4 py-3">حذف مقاله</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-white font-bold">مقاله‌ها</h2>
        <button onClick={() => { setMsg(null); setForm({ ...EMPTY }); }}
          className="mr-auto bg-gold-500 hover:bg-gold-400 text-white font-bold px-4 py-2 rounded-xl text-sm">+ مقاله جدید</button>
      </div>
      {banner}
      {loading && !articles.length ? (
        <p className="text-gray-400 text-sm text-center py-10">در حال بارگذاری...</p>
      ) : articles.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-10">هنوز مقاله‌ای ثبت نشده است</p>
      ) : articles.map(a => (
        <button key={a.documentId}
          onClick={() => {
            setMsg(null);
            setForm({
              documentId: a.documentId, title_fa: a.title_fa, slug: a.slug, excerpt_fa: a.excerpt_fa ?? '',
              content_fa: a.content_fa ?? '', seo_title: a.seo_title ?? '', seo_description: a.seo_description ?? '',
              published: a.published, coverUrl: a.cover?.url ?? null,
            });
          }}
          className="w-full flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-3 text-right">
          {a.cover?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.cover.url} alt="" className="w-20 h-12 object-cover rounded-lg shrink-0" loading="lazy" />
          ) : <div className="w-20 h-12 bg-gray-800 rounded-lg shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm truncate">{a.title_fa}</p>
            <p className="text-gray-500 text-xs" dir="ltr">/blog/{a.slug}</p>
          </div>
          {!a.published && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">پیش‌نویس</span>}
        </button>
      ))}
    </div>
  );
}
