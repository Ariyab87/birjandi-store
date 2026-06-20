'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AdminChatPanel() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'سلام! به پنل مدیریت بی‌شاپ خوش آمدید.\n\nمی‌توانم:\n• قیمت محصولات را جستجو کنم\n• قیمت را با درصد یا مقدار ثابت تغییر دهم\n• تاریخچه تغییرات قیمت را نشان دهم\n\nمثال: "قیمت ماشین لباسشویی را ۵٪ افزایش بده"',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          password,
        }),
      });

      if (res.status === 401) {
        setAuthed(false);
        setAuthError('رمز عبور نادرست است');
        setMessages(messages);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply || '...' }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'خطا در اتصال. لطفاً دوباره تلاش کنید.' }]);
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center font-bold text-white text-lg">B</div>
            <div>
              <p className="text-white font-bold">Bshop Admin</p>
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
            <button
              type="submit"
              className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
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
            <p className="text-white font-bold text-sm">Bshop — دستیار مدیریت قیمت</p>
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

      {/* Quick actions */}
      <div className="px-6 py-3 bg-gray-900/50 border-b border-gray-800 flex gap-2 flex-wrap">
        {[
          'همه محصولات را نشان بده',
          'تاریخچه تغییرات قیمت',
          'موجودی کالاها',
        ].map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
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

        {loading && (
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

      {/* Input */}
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
            disabled={!input.trim() || loading}
            className="bg-gold-500 hover:bg-gold-600 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors shrink-0"
          >
            ارسال
          </button>
        </div>
        <p className="text-center text-gray-600 text-xs mt-2">این پنل فقط برای مدیر داخلی است — هرگز برای بازدیدکنندگان عمومی نمایش داده نمی‌شود</p>
      </div>
    </div>
  );
}
