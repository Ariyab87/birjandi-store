'use client';

export default function ChatCard({ fa }: { fa: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('open-chat'))}
      className="text-right bg-gold-50 rounded-2xl p-6 border border-gold-100 flex gap-4 items-start hover:bg-gold-100 transition-colors group"
      style={{ backgroundColor: '#fdf6e3' }}
    >
      <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5h8M8 14h5m-9 6.5l3.5-2.5H18a2 2 0 002-2v-9a2 2 0 00-2-2H6a2 2 0 00-2 2v13.5z" />
        </svg>
      </div>
      <div>
        <h3 className="font-bold text-navy-700 mb-1">{fa ? 'دستیار هوشمند (کیا)' : 'AI Assistant (Kia)'}</h3>
        <p className="text-gray-600 text-sm">
          {fa ? 'پاسخ فوری درباره محصولات و قیمت‌ها' : 'Instant answers about products & prices'}
        </p>
        <p className="text-gold-600 text-xs mt-1 font-medium group-hover:underline">
          {fa ? 'شروع گفتگو ←' : 'Start chat →'}
        </p>
      </div>
    </button>
  );
}
