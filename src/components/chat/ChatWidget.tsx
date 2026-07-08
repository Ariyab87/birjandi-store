'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Phone numbers and Latin-digit sequences get scrambled inside RTL text
// (e.g. "+98 993..." renders as "98...+"), so isolate them as LTR runs.
const LTR_NUMBER_RE = /(\+?[0-9۰-۹][0-9۰-۹\s\-().]{5,}[0-9۰-۹])/g;

function renderMessage(text: string) {
  return text.split(LTR_NUMBER_RE).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} dir="ltr" style={{ unicodeBidi: 'isolate' }}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

const QUICK_QUESTIONS_FA = [
  'چه محصولاتی دارید؟',
  'قیمت ظروف ملامین چنده؟',
  'ارسال به کجا دارید؟',
  'فروش عمده دارید؟',
];

const QUICK_QUESTIONS_EN = [
  'What products do you have?',
  'Do you offer wholesale?',
  'Do you deliver nationwide?',
  'How do I place an order?',
];

export default function ChatWidget({ locale }: { locale: string }) {
  const fa = locale === 'fa';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: fa
          ? 'سلام! 👋 به کالالند۲۴ خوش آمدید.\nمن کیا هستم، دستیار هوشمند کالالند۲۴. می‌توانم درباره محصولات، قیمت‌ها، ارسال و سفارش عمده راهنماییتان کنم. چطور می‌توانم کمکتان کنم؟'
          : 'Hi! 👋 Welcome to Kalaland24.\nI\'m Kia, your smart assistant. I can help you with products, prices, delivery and wholesale orders. How can I help?',
      }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Allow other components (e.g. contact page card) to open the chat via a global event
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('open-chat', openChat);
    return () => window.removeEventListener('open-chat', openChat);
  }, []);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, locale }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply || '...' }]);
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: fa ? 'خطایی رخ داد. لطفاً دوباره تلاش کنید.' : 'Something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  const quickQuestions = fa ? QUICK_QUESTIONS_FA : QUICK_QUESTIONS_EN;
  const showQuick = messages.length <= 1 && !loading;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-navy-700 hover:bg-navy-800 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110"
        aria-label="Chat support"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {/* pulse ring */}
            <span className="absolute inset-0 rounded-full border-2 border-gold-400 animate-ping opacity-40" />
          </>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-[4.5rem] right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(520px, calc(100dvh - 120px))' }}
          dir={fa ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="bg-navy-700 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center text-white font-bold text-sm shrink-0 relative">
              ک
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-navy-700" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{fa ? 'کیا — دستیار کالالند۲۴' : 'Kia — Kalaland24 Assistant'}</p>
              <p className="text-white/60 text-xs">{fa ? 'آنلاین | معمولاً فوری پاسخ می‌دهم' : 'Online | Usually replies instantly'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="mr-auto text-white/50 hover:text-white transition-colors p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1 ml-1.5 mr-0">
                    ک
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-navy-700 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {renderMessage(msg.content)}
                </div>
              </div>
            ))}

            {/* Quick question chips — only shown at start */}
            {showQuick && (
              <div className={`flex flex-wrap gap-2 pt-1 ${fa ? 'justify-end' : 'justify-start'}`}>
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs bg-white border border-navy-200 text-navy-700 hover:bg-navy-50 hover:border-navy-400 px-3 py-1.5 rounded-full transition-colors shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start items-end gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  ک
                </div>
                <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={fa ? 'سوال خود را بنویسید...' : 'Ask me anything...'}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-navy-500 bg-gray-50 focus:bg-white transition-colors"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-navy-700 hover:bg-navy-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
