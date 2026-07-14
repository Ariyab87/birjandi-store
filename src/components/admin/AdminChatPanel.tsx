'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PreviewRow {
  documentId: string;
  name: string;
  oldPrice: number;
  newPrice: number;
}

interface LogEntry {
  id: string;
  date: string;
  category: string;
  percentage: number;
  productsUpdated: number;
  admin: string;
  canUndo: boolean;
}

const CATEGORIES = [
  { key: 'all',      label: 'همه دسته‌ها' },
  { key: 'electric', label: 'برقی' },
  { key: 'kitchen',  label: 'آشپزخانه' },
  { key: 'cooling',  label: 'سرمایشی' },
  { key: 'heating',  label: 'گرمایشی' },
  { key: 'cleaning', label: 'نظافت' },
  { key: 'metal',    label: 'فلزی' },
  { key: 'melamine', label: 'ملامین' },
  { key: 'glass',    label: 'شکستنی' },
  { key: 'porcelain',label: 'چینی' },
  { key: 'teflon',   label: 'تفلون' },
  { key: 'steel',    label: 'استیل' },
  { key: 'ceramic',  label: 'سرامیک' },
  { key: 'plastic',  label: 'پلاستیک' },
  { key: 'crystal',  label: 'کریستال' },
  { key: 'copper',   label: 'مسی' },
  { key: 'cast_iron',label: 'چدن' },
];

export default function AdminChatPanel() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'prices' | 'seo' | 'orders' | 'reviews'>('chat');

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersMsg, setOrdersMsg] = useState('');

  // Reviews state
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsMsg, setReviewsMsg] = useState('');

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'سلام! به پنل مدیریت کالالند۲۴ خوش آمدید.\n\nمی‌توانم:\n• قیمت محصولات را جستجو کنم\n• قیمت را با درصد یا مقدار ثابت تغییر دهم\n• افزایش/کاهش قیمت دسته‌بندی را اعمال کنم\n• تاریخچه تغییرات قیمت را نشان دهم\n\nمثال: "قیمت همه محصولات آشپزخانه را ۵٪ افزایش بده"',
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // SEO state
  const [seoProducts, setSeoProducts] = useState<any[]>([]);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoMsg, setSeoMsg] = useState('');
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [expandRunning, setExpandRunning] = useState(false);
  const [expandStatus, setExpandStatus] = useState('');
  const [expandStopRef] = useState({ current: false });

  // Price management state
  const [category, setCategory] = useState('all');
  const [percentage, setPercentage] = useState('');
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [priceMsg, setPriceMsg] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password.trim()) {
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('رمز عبور را وارد کنید');
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || chatLoading) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, password }),
      });
      if (res.status === 401) { setAuthed(false); setAuthError('رمز عبور نادرست است'); setMessages(messages); return; }
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply || '...' }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'خطا در اتصال. لطفاً دوباره تلاش کنید.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function fetchPreview() {
    const pct = parseFloat(percentage);
    if (!percentage || isNaN(pct)) { setPriceMsg('درصد را وارد کنید'); return; }
    setPreviewLoading(true);
    setPriceMsg('');
    setPreview(null);
    try {
      const res = await fetch('/api/admin/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'preview', category, percentage: pct }),
      });
      const data = await res.json();
      if (!res.ok) { setPriceMsg(data.error || 'خطا'); return; }
      setPreview(data.preview);
      if (data.count === 0) setPriceMsg('محصولی در این دسته‌بندی یافت نشد');
    } catch { setPriceMsg('خطا در اتصال'); }
    finally { setPreviewLoading(false); }
  }

  async function applyPrices() {
    const pct = parseFloat(percentage);
    setApplyLoading(true);
    setPriceMsg('');
    try {
      const res = await fetch('/api/admin/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'apply', category, percentage: pct }),
      });
      const data = await res.json();
      if (!res.ok) { setPriceMsg(data.error || 'خطا'); return; }
      setPriceMsg(`✅ ${data.updated} محصول با موفقیت به‌روزرسانی شد`);
      setPreview(null);
      setPercentage('');
      loadLog();
    } catch { setPriceMsg('خطا در اتصال'); }
    finally { setApplyLoading(false); }
  }

  async function loadSeoReport() {
    setSeoLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
      const all: any[] = [];
      for (let page = 1; ; page++) {
        const res = await fetch(`${base}/api/products?pagination[page]=${page}&pagination[pageSize]=100`);
        const data = await res.json();
        all.push(...(data.data || []));
        if (page >= (data.meta?.pagination?.pageCount || 1)) break;
      }
      setSeoProducts(all);
    } catch { setSeoMsg('خطا در اتصال به Strapi'); }
    finally { setSeoLoading(false); }
  }

  async function autoGenerateSeo(productId: string, name: string) {
    setAutoGenLoading(true);
    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          messages: [{
            role: 'user',
            content: `یک seo_title (حداکثر ۶۰ کاراکتر) و یک seo_description (حداکثر ۱۵۵ کاراکتر) فارسی برای محصول "${name}" بنویس. فقط JSON برگردان: {"seo_title": "...", "seo_description": "..."}`
          }],
        }),
      });
      const data = await res.json();
      setSeoMsg(`پیشنهاد برای ${name}:\n${data.reply}`);
    } catch { setSeoMsg('خطا در تولید متن سئو'); }
    finally { setAutoGenLoading(false); }
  }

  async function runExpandShort() {
    setExpandRunning(true);
    expandStopRef.current = false;
    let consecutiveFails = 0;
    try {
      for (let i = 0; i < 60; i++) {
        if (expandStopRef.current) { setExpandStatus('متوقف شد.'); break; }
        setExpandStatus(`در حال پردازش دسته ${i + 1}...`);
        let data: any;
        try {
          const res = await fetch('/api/admin/fill-seo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, batchSize: 5, expandShort: true }),
          });
          data = await res.json();
        } catch {
          setExpandStatus('خطا در اتصال. دوباره تلاش می‌شود...');
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        if (data.error) { setExpandStatus(`خطا: ${data.error}`); break; }
        if (data.processed === 0) {
          setExpandStatus('✅ همه محصولات تکمیل شدند!');
          break;
        }
        if (data.succeeded === 0) {
          consecutiveFails++;
          if (consecutiveFails >= 3) {
            setExpandStatus(`سهمیه روزانه هوش مصنوعی تمام شد. ${data.remaining} محصول باقی مانده — فردا دوباره روی دکمه بزنید تا ادامه پیدا کند.`);
            break;
          }
        } else {
          consecutiveFails = 0;
          setExpandStatus(`${data.succeeded} محصول تکمیل شد — ${data.remaining} محصول باقی مانده...`);
        }
        await new Promise(r => setTimeout(r, 18000));
      }
    } finally {
      setExpandRunning(false);
      loadSeoReport();
    }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    setOrdersMsg('');
    try {
      const res = await fetch(`/api/admin/orders?password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (!res.ok) { setOrdersMsg(data.error || 'خطا'); return; }
      setOrders(data.orders || []);
    } catch { setOrdersMsg('خطا در اتصال'); }
    finally { setOrdersLoading(false); }
  }

  async function updateOrderStatus(documentId: string, status: string) {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, documentId, status }),
      });
      if (!res.ok) { setOrdersMsg('به‌روزرسانی وضعیت ناموفق بود'); return; }
      setOrders(prev => prev.map(o => o.documentId === documentId ? { ...o, status } : o));
    } catch { setOrdersMsg('خطا در اتصال'); }
  }

  async function deleteOrder(documentId: string, orderId: string) {
    if (!confirm(`سفارش #${orderId} حذف شود؟ این عمل قابل بازگشت نیست.`)) return;
    try {
      const res = await fetch(`/api/admin/orders?password=${encodeURIComponent(password)}&documentId=${encodeURIComponent(documentId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) { setOrdersMsg('حذف ناموفق بود'); return; }
      setOrders(prev => prev.filter(o => o.documentId !== documentId));
    } catch { setOrdersMsg('خطا در اتصال'); }
  }

  async function loadPendingReviews() {
    setReviewsLoading(true);
    setReviewsMsg('');
    try {
      const res = await fetch(`/api/admin/reviews?password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (!res.ok) { setReviewsMsg(data.error || 'خطا'); return; }
      setPendingReviews(data.reviews || []);
    } catch { setReviewsMsg('خطا در اتصال'); }
    finally { setReviewsLoading(false); }
  }

  async function moderateReview(documentId: string, action: 'approve' | 'reject') {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, documentId, action }),
      });
      if (!res.ok) { setReviewsMsg(action === 'approve' ? 'تأیید ناموفق بود' : 'رد ناموفق بود'); return; }
      setPendingReviews(prev => prev.filter(r => r.documentId !== documentId));
    } catch { setReviewsMsg('خطا در اتصال'); }
  }

  async function loadLog() {
    setLogLoading(true);
    try {
      const res = await fetch(`/api/admin/bulk-price?password=${encodeURIComponent(password)}`);
      const data = await res.json();
      setLog(data.log || []);
    } catch { /* ignore */ }
    finally { setLogLoading(false); }
  }

  async function undoChange(logId: string) {
    try {
      const res = await fetch('/api/admin/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'undo', logId }),
      });
      const data = await res.json();
      setPriceMsg(data.message || data.error || '');
      loadLog();
    } catch { setPriceMsg('خطا در بازگشت'); }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center font-bold text-white text-lg">B</div>
            <div>
              <p className="text-white font-bold">کالالند۲۴ Admin</p>
              <p className="text-gray-400 text-xs">پنل مدیریت داخلی</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4" dir="rtl">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">رمز عبور ادمین</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور را وارد کنید"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500"
                autoFocus
              />
              {authError && <p className="text-red-400 text-xs mt-1">{authError}</p>}
            </div>
            <button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 rounded-xl transition-colors">
              ورود
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center font-bold text-white">B</div>
          <div>
            <p className="text-white font-bold text-sm">کالالند۲۴ — پنل مدیریت</p>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              متصل به Strapi
            </p>
          </div>
        </div>
        <button
          onClick={() => { setAuthed(false); setMessages([]); }}
          className="text-gray-400 hover:text-white text-xs border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          خروج
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-6 flex gap-1">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chat' ? 'border-gold-500 text-gold-400' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          💬 دستیار هوشمند
        </button>
        <button
          onClick={() => { setActiveTab('prices'); loadLog(); }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'prices' ? 'border-gold-500 text-gold-400' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          💰 مدیریت قیمت
        </button>
        <button
          onClick={() => { setActiveTab('seo'); loadSeoReport(); }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'seo' ? 'border-gold-500 text-gold-400' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          🔍 سئو
        </button>
        <button
          onClick={() => { setActiveTab('orders'); loadOrders(); }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'orders' ? 'border-gold-500 text-gold-400' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          📦 سفارش‌ها
        </button>
        <button
          onClick={() => { setActiveTab('reviews'); loadPendingReviews(); }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'reviews' ? 'border-gold-500 text-gold-400' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          ⭐ نظرات
        </button>
      </div>

      {/* ── CHAT TAB ── */}
      {activeTab === 'chat' && (
        <>
          <div className="px-6 py-3 bg-gray-900/30 border-b border-gray-800 flex gap-2 flex-wrap">
            {[
              'همه محصولات را نشان بده',
              'قیمت آشپزخانه را ۵٪ افزایش بده',
              'تاریخچه تغییرات قیمت',
              'موجودی کالاها',
            ].map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-4xl w-full mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gold-500 flex items-center justify-center text-white text-xs font-bold shrink-0 ml-2 mt-1">B</div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gray-800 text-white rounded-tr-sm'
                      : 'bg-gray-900 border border-gray-700 text-gray-100 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-end">
                <div className="w-7 h-7 rounded-lg bg-gold-500 flex items-center justify-center text-white text-xs font-bold shrink-0 ml-2">B</div>
                <div className="bg-gray-900 border border-gray-700 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-4 bg-gray-900 border-t border-gray-800">
            <div className="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder='مثال: "قیمت یخچال LG را ۱۰٪ افزایش بده"'
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500 placeholder-gray-500"
              />
              <button
                onClick={send}
                disabled={!input.trim() || chatLoading}
                className="bg-gold-500 hover:bg-gold-600 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors shrink-0"
              >
                ارسال
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── SEO TAB ── */}
      {activeTab === 'seo' && (
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto space-y-6">
          {seoLoading ? (
            <p className="text-gray-400 text-sm text-center py-10">در حال بارگذاری...</p>
          ) : (() => {
            const total = seoProducts.length;
            const noTitle = seoProducts.filter(p => !p.seo_title);
            const noDesc  = seoProducts.filter(p => !p.seo_description);
            const noDesc300 = seoProducts.filter(p => !p.description_fa || p.description_fa.length < 300);
            const noPrice = seoProducts.filter(p => !p.retail_price && !p.price_on_request);
            const complete = seoProducts.filter(p => p.seo_title && p.seo_description && p.description_fa?.length >= 300);

            return (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'کل محصولات', value: total, color: 'text-white', bg: 'bg-gray-800' },
                    { label: 'سئو کامل ✅', value: complete.length, color: 'text-green-400', bg: 'bg-green-900/30' },
                    { label: 'نیاز به بررسی ⚠️', value: total - complete.length, color: 'text-amber-400', bg: 'bg-amber-900/30' },
                    { label: 'بدون توضیحات ❌', value: noDesc300.length, color: 'text-red-400', bg: 'bg-red-900/30' },
                  ].map(card => (
                    <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-gray-800`}>
                      <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                      <p className="text-gray-400 text-xs mt-1">{card.label}</p>
                    </div>
                  ))}
                </div>

                {/* Issues list */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-white font-bold mb-2">مشکلات سئو</h3>
                  {[
                    { label: 'بدون عنوان سئو (seo_title)', products: noTitle, severity: 'red' },
                    { label: 'بدون توضیح سئو (seo_description)', products: noDesc, severity: 'red' },
                    { label: 'توضیحات کمتر از ۳۰۰ کاراکتر', products: noDesc300, severity: 'amber' },
                    { label: 'بدون قیمت', products: noPrice, severity: 'amber' },
                  ].map(issue => issue.products.length > 0 && (
                    <div key={issue.label}>
                      <p className={`text-sm font-medium ${issue.severity === 'red' ? 'text-red-400' : 'text-amber-400'} mb-2`}>
                        {issue.severity === 'red' ? '❌' : '⚠️'} {issue.label} ({issue.products.length} محصول)
                      </p>
                      <div className="space-y-1">
                        {issue.products.slice(0, 5).map((p: any) => (
                          <div key={p.documentId} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                            <span className="text-gray-300 text-xs">{p.name_fa}</span>
                            {(issue.label.includes('عنوان') || issue.label.includes('توضیح')) && (
                              <button
                                onClick={() => autoGenerateSeo(p.documentId, p.name_fa)}
                                disabled={autoGenLoading}
                                className="text-xs text-gold-400 hover:text-gold-300 border border-gold-700/40 px-2 py-1 rounded transition-colors disabled:opacity-40"
                              >
                                ✨ تولید خودکار
                              </button>
                            )}
                          </div>
                        ))}
                        {issue.products.length > 5 && (
                          <p className="text-gray-500 text-xs px-3">و {issue.products.length - 5} محصول دیگر...</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {noTitle.length === 0 && noDesc.length === 0 && noDesc300.length === 0 && noPrice.length === 0 && (
                    <p className="text-green-400 text-sm">✅ همه محصولات سئو کامل دارند!</p>
                  )}
                </div>

                {/* Bulk expand short descriptions */}
                {(noDesc300.length > 0 || expandRunning) && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-white font-bold">✨ تکمیل خودکار توضیحات کوتاه</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      این دکمه به‌صورت خودکار برای محصولاتی که توضیح کوتاه دارند (مثل &quot;900وات&quot;) یک توضیح کامل‌تر
                      می‌نویسد و اطلاعات فعلی (مثل توان یا مشخصات) را حفظ می‌کند، نه پاک. هر بار چند محصول را پردازش
                      می‌کند و کمی صبر می‌کند تا به محدودیت هوش مصنوعی نخوریم. اگر سهمیه روزانه تمام شود، متوقف می‌شود
                      و می‌توانید فردا دوباره روی دکمه بزنید تا از همان‌جا ادامه پیدا کند.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={runExpandShort}
                        disabled={expandRunning}
                        className="bg-gold-500 hover:bg-gold-600 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm transition-colors"
                      >
                        {expandRunning ? 'در حال اجرا...' : '▶️ شروع تکمیل خودکار'}
                      </button>
                      {expandRunning && (
                        <button
                          onClick={() => { expandStopRef.current = true; }}
                          className="text-xs text-gray-400 hover:text-white border border-gray-700 px-4 py-2 rounded-lg transition-colors"
                        >
                          ⏹ توقف
                        </button>
                      )}
                    </div>
                    {expandStatus && (
                      <p className="text-gold-300 text-xs">{expandStatus}</p>
                    )}
                  </div>
                )}

                {seoMsg && (
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-200 text-sm whitespace-pre-wrap">
                    {seoMsg}
                  </div>
                )}

                <button
                  onClick={() => { setSeoProducts([]); loadSeoReport(); }}
                  className="text-xs text-gray-400 hover:text-white border border-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  🔄 بروزرسانی گزارش
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* ── PRICE MANAGEMENT TAB ── */}
      {activeTab === 'prices' && (
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto space-y-6">

          {/* Bulk price form */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold mb-4">افزایش / کاهش قیمت دسته‌بندی</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">دسته‌بندی</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setPreview(null); setPriceMsg(''); }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">درصد تغییر (مثبت = افزایش، منفی = کاهش)</label>
                <input
                  type="number"
                  value={percentage}
                  onChange={(e) => { setPercentage(e.target.value); setPreview(null); setPriceMsg(''); }}
                  placeholder="مثال: 5 یا -3"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500 placeholder-gray-500"
                />
              </div>
            </div>
            <button
              onClick={fetchPreview}
              disabled={previewLoading || !percentage}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {previewLoading ? 'در حال بارگذاری...' : '🔍 پیش‌نمایش تغییرات'}
            </button>
          </div>

          {/* Preview table */}
          {preview && preview.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">پیش‌نمایش — {preview.length} محصول</h3>
                <button
                  onClick={applyPrices}
                  disabled={applyLoading}
                  className="bg-gold-500 hover:bg-gold-600 disabled:opacity-40 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  {applyLoading ? 'در حال اعمال...' : '✅ تأیید و اعمال'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-800">
                      <th className="text-right py-2 pr-2">محصول</th>
                      <th className="text-right py-2 px-4">قیمت فعلی</th>
                      <th className="text-right py-2">قیمت جدید</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map(row => (
                      <tr key={row.documentId} className="border-b border-gray-800/50">
                        <td className="py-2 pr-2 text-white">{row.name}</td>
                        <td className="py-2 px-4 text-gray-400">{row.oldPrice.toLocaleString('fa-IR')} تومان</td>
                        <td className="py-2 text-green-400 font-medium">{row.newPrice.toLocaleString('fa-IR')} تومان</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {priceMsg && (
            <p className={`text-sm px-4 py-3 rounded-xl border ${priceMsg.startsWith('✅') ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'}`}>
              {priceMsg}
            </p>
          )}

          {/* Change log */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">تاریخچه تغییرات قیمت</h3>
              <button onClick={loadLog} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                {logLoading ? 'در حال بارگذاری...' : '🔄 بروزرسانی'}
              </button>
            </div>
            {log.length === 0 ? (
              <p className="text-gray-500 text-sm">هنوز تغییری ثبت نشده است</p>
            ) : (
              <div className="space-y-3">
                {log.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between bg-gray-800/50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">
                        {entry.percentage > 0 ? '+' : ''}{entry.percentage}٪ — {entry.category}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">{entry.date} · {entry.productsUpdated} محصول</p>
                    </div>
                    {entry.canUndo && (
                      <button
                        onClick={() => undoChange(entry.id)}
                        className="text-xs text-amber-400 hover:text-amber-300 border border-amber-700/50 hover:border-amber-500 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        ↩ بازگشت
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold">سفارش‌ها</h2>
              <p className="text-gray-400 text-xs mt-1">{orders.length} سفارش ثبت‌شده — برای حسابداری</p>
            </div>
            <button onClick={loadOrders} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
              {ordersLoading ? 'در حال بارگذاری...' : '🔄 بروزرسانی'}
            </button>
          </div>

          {ordersMsg && (
            <p className="text-sm px-4 py-3 rounded-xl border bg-red-900/30 border-red-700 text-red-300">{ordersMsg}</p>
          )}

          {ordersLoading ? (
            <p className="text-gray-400 text-sm text-center py-10">در حال بارگذاری...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">هنوز سفارشی ثبت نشده است</p>
          ) : (
            orders.map((o) => {
              const items = Array.isArray(o.items) ? o.items : [];
              const STATUS: Record<string, { label: string; cls: string }> = {
                new:       { label: 'جدید',     cls: 'bg-blue-900/40 text-blue-300 border-blue-700' },
                confirmed: { label: 'تأییدشده',  cls: 'bg-amber-900/40 text-amber-300 border-amber-700' },
                delivered: { label: 'تحویل‌شده',  cls: 'bg-green-900/40 text-green-300 border-green-700' },
                cancelled: { label: 'لغوشده',    cls: 'bg-red-900/40 text-red-300 border-red-700' },
              };
              const fmt = (n: number) => (Number(n) * 1000).toLocaleString('fa-IR') + ' تومان';
              const date = o.createdAt ? new Date(o.createdAt).toLocaleString('fa-IR') : '';
              return (
                <div key={o.documentId} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-bold text-sm">
                        #{o.order_id} <span className="text-gray-400 font-normal">· {o.type === 'wholesale' ? 'عمده' : 'خرده'}</span>
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{date}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg border ${STATUS[o.status]?.cls || 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                      {STATUS[o.status]?.label || o.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-300 space-y-1 mb-3">
                    <p><span className="text-gray-500">نام:</span> {o.customer_name}</p>
                    <p><span className="text-gray-500">تلفن:</span> <span dir="ltr">{o.customer_phone}</span></p>
                    <p><span className="text-gray-500">آدرس:</span> {o.customer_address}</p>
                    {o.business_name && <p><span className="text-gray-500">کسب‌وکار:</span> {o.business_name}</p>}
                    {o.customer_email && <p><span className="text-gray-500">ایمیل:</span> <span dir="ltr">{o.customer_email}</span></p>}
                    {o.notes && <p><span className="text-gray-500">توضیحات:</span> {o.notes}</p>}
                  </div>

                  <div className="border-t border-gray-800 pt-3 space-y-1">
                    {items.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs text-gray-300">
                        <span>{it.name} × {it.quantity}</span>
                        <span>{fmt(it.price * it.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm text-gold-400 pt-2">
                      <span>مجموع کل</span>
                      <span>{fmt(o.total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    {['new', 'confirmed', 'delivered', 'cancelled'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateOrderStatus(o.documentId, s)}
                        disabled={o.status === s}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          o.status === s
                            ? 'bg-gold-500 text-white border-gold-500'
                            : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        {STATUS[s].label}
                      </button>
                    ))}
                    <button
                      onClick={() => deleteOrder(o.documentId, o.order_id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-800 bg-red-900/30 text-red-300 hover:bg-red-800/50 transition-colors mr-auto"
                    >
                      🗑 حذف
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'reviews' && (
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold">نظرات در انتظار تأیید</h2>
              <p className="text-gray-400 text-xs mt-1">{pendingReviews.length} نظر — پس از تأیید در صفحه محصول نمایش داده می‌شود</p>
            </div>
            <button onClick={loadPendingReviews} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
              {reviewsLoading ? 'در حال بارگذاری...' : '🔄 بروزرسانی'}
            </button>
          </div>

          {reviewsMsg && (
            <p className="text-sm px-4 py-3 rounded-xl border bg-red-900/30 border-red-700 text-red-300">{reviewsMsg}</p>
          )}

          {reviewsLoading ? (
            <p className="text-gray-400 text-sm text-center py-10">در حال بارگذاری...</p>
          ) : pendingReviews.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">نظر جدیدی برای تأیید وجود ندارد</p>
          ) : (
            pendingReviews.map((r) => {
              const date = r.createdAt ? new Date(r.createdAt).toLocaleString('fa-IR') : '';
              return (
                <div key={r.documentId} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-bold text-sm">{r.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{date}</p>
                    </div>
                    <span className="text-gold-400 text-sm" dir="ltr">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <p className="text-gray-500 text-xs mb-2">محصول: <span className="text-gray-300" dir="ltr">{r.product_document_id}</span></p>
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">{r.comment}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderateReview(r.documentId, 'approve')}
                      className="text-xs px-3 py-1.5 rounded-lg border border-green-700 bg-green-900/30 text-green-300 hover:bg-green-800/50 transition-colors"
                    >
                      ✅ تأیید و انتشار
                    </button>
                    <button
                      onClick={() => moderateReview(r.documentId, 'reject')}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-800 bg-red-900/30 text-red-300 hover:bg-red-800/50 transition-colors"
                    >
                      🗑 رد و حذف
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
