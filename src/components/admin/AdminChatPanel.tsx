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
  const [activeTab, setActiveTab] = useState<'chat' | 'prices'>('chat');

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'سلام! به پنل مدیریت کالالند خوش آمدید.\n\nمی‌توانم:\n• قیمت محصولات را جستجو کنم\n• قیمت را با درصد یا مقدار ثابت تغییر دهم\n• افزایش/کاهش قیمت دسته‌بندی را اعمال کنم\n• تاریخچه تغییرات قیمت را نشان دهم\n\nمثال: "قیمت همه محصولات آشپزخانه را ۵٪ افزایش بده"',
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
              <p className="text-white font-bold">کالالند Admin</p>
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
            <p className="text-white font-bold text-sm">کالالند — پنل مدیریت</p>
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
    </div>
  );
}
