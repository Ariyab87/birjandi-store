'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

const SLIDES = [
  {
    src: 'https://res.cloudinary.com/diyqjjbgb/video/upload/v1782715469/kitchen1_adky8x.mp4',
    label: { fa: 'آشپزخانه لاکچری', en: 'Luxury Kitchen' },
  },
  {
    src: 'https://res.cloudinary.com/diyqjjbgb/video/upload/v1782715451/cafe_ebdg2q.mp4',
    label: { fa: 'کافه و رستوران', en: 'Café & Restaurant' },
  },
  {
    src: 'https://res.cloudinary.com/diyqjjbgb/video/upload/v1782715487/kitchen2_um6khj.mp4',
    label: { fa: 'آشپزخانه مدرن', en: 'Modern Kitchen' },
  },
];

const DURATION = 8000;

export default function VideoReel() {
  const params = useParams();
  const locale = params.locale as string;
  const fa = locale === 'fa';

  const [current, setCurrent] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(prev => (prev + 1) % SLIDES.length), DURATION);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    SLIDES.forEach((_, i) => {
      const vid = videoRefs.current[i];
      if (!vid) return;
      if (i === current) { vid.currentTime = 0; vid.play().catch(() => {}); }
      else vid.pause();
    });
  }, [current]);

  return (
    <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
      <div className={`flex flex-col md:flex-row ${fa ? 'md:flex-row-reverse' : ''}`}>

        {/* Video box — 220px tall on mobile, square on desktop */}
        <div
          className="relative w-full md:w-1/2 shrink-0 bg-black overflow-hidden"
          style={{ height: '220px' }}
        >
          <style>{`@media (min-width: 768px) { .vr-box { height: auto !important; aspect-ratio: 1 / 1; } }`}</style>
          <div className="vr-box absolute inset-0" style={{ height: '220px' }}>
            {SLIDES.map((s, i) => (
              <video
                key={s.src}
                ref={el => { videoRefs.current[i] = el; }}
                src={s.src}
                muted
                loop
                playsInline
                preload={i === 0 ? 'auto' : 'none'}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{ opacity: i === current ? 1 : 0 }}
              />
            ))}

            {/* Slide label */}
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full z-10">
              {fa ? SLIDES[current].label.fa : SLIDES[current].label.en}
            </div>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? 22 : 8,
                    height: 8,
                    background: i === current ? '#d4a017' : 'rgba(255,255,255,0.5)',
                  }}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
              <div key={current} className="h-full bg-gold-500" style={{ animation: `progress-bar ${DURATION}ms linear forwards` }} />
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className={`md:w-1/2 flex flex-col justify-center p-5 md:p-8 gap-4 ${fa ? 'text-right' : 'text-left'}`}>

          <div>
            <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-1.5">
              {fa ? 'کالالند ۲۴' : 'Kalaland 24'}
            </p>
            <h2 className="text-navy-800 text-lg md:text-2xl font-bold leading-snug">
              {fa ? 'لوازم خانگی و برقی برای کسب‌وکار و خانه' : 'Home & Commercial Appliances'}
            </h2>
            <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
              {fa
                ? 'از ظروف آشپزخانه تا لوازم برقی حرفه‌ای — با بهترین قیمت، ارسال سریع به سراسر ایران'
                : 'From cookware to professional appliances — best prices, fast delivery across Iran'}
            </p>
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className={`flex items-start gap-3 ${fa ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center text-sm shrink-0">🔍</div>
              <div className={fa ? 'text-right' : 'text-left'}>
                <p className="font-semibold text-navy-700 text-sm">{fa ? 'جستجو و فیلتر پیشرفته' : 'Advanced Search & Filter'}</p>
                <p className="text-gray-400 text-xs mt-0.5">{fa ? 'بر اساس برند، دسته‌بندی و قیمت فیلتر کنید' : 'Filter by brand, category and price'}</p>
              </div>
            </div>

            {/* Chatbot */}
            <div className={`flex items-start gap-3 ${fa ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center text-sm shrink-0">💬</div>
              <div className={fa ? 'text-right' : 'text-left'}>
                <p className="font-semibold text-navy-700 text-sm">{fa ? 'دستیار هوشمند کالالند' : 'Kalaland Smart Assistant'}</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                  {fa
                    ? 'روی آیکون چت کلیک کنید، نام محصول یا بودجه بنویسید — دستیار فوری پاسخ می‌دهد'
                    : 'Click the chat icon, type a product or budget — assistant replies instantly'}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className={`flex items-start gap-3 ${fa ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center text-sm shrink-0">📞</div>
              <div className={fa ? 'text-right' : 'text-left'}>
                <p className="font-semibold text-navy-700 text-sm">{fa ? 'پشتیبانی ۲۴ ساعته' : '24/7 Support'}</p>
                <div className="flex flex-col gap-0.5 mt-0.5" dir="ltr" style={{ textAlign: 'left' }}>
                  <span className="text-gray-500 text-xs font-mono">+98 993 464 2455</span>
                  <span className="text-gray-500 text-xs font-mono">+98 913 144 4021</span>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp — full width on mobile, auto on desktop */}
          <a
            href="https://wa.me/905338586763"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            {fa ? 'تماس از طریق واتساپ' : 'Contact via WhatsApp'}
          </a>
        </div>
      </div>
    </div>
  );
}
