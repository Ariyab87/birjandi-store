'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

const SLIDES = [
  {
    src: '/videos/kitchen1.mp4',
    label: { fa: 'آشپزخانه لاکچری', en: 'Luxury Kitchen' },
    sub: { fa: 'تجهیز آشپزخانه با بهترین برندها', en: 'Equip your kitchen with top brands' },
  },
  {
    src: '/videos/cafe.mp4',
    label: { fa: 'کافه و رستوران', en: 'Café & Restaurant' },
    sub: { fa: 'ظروف حرفه‌ای برای کسب‌وکار شما', en: 'Professional cookware for your business' },
  },
  {
    src: '/videos/kitchen2.mp4',
    label: { fa: 'آشپزخانه مدرن', en: 'Modern Kitchen' },
    sub: { fa: 'سبک زندگی متفاوت با کالالند', en: 'A different lifestyle with Kalaland' },
  },
];

const DURATION = 8000; // ms per slide

export default function VideoReel() {
  const params = useParams();
  const locale = params.locale as string;
  const fa = locale === 'fa';

  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function goTo(index: number) {
    if (transitioning || index === current) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setTransitioning(false);
    }, 400);
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES.length);
    }, DURATION);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    SLIDES.forEach((_, i) => {
      const vid = videoRefs.current[i];
      if (!vid) return;
      if (i === current) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [current]);

  const slide = SLIDES[current];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl mb-6" style={{ height: '340px' }}>
      {/* Videos stacked — only active one visible */}
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

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

      {/* Text overlay */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-6 transition-opacity duration-400"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        <p className="text-gold-400 text-xs font-semibold tracking-widest uppercase mb-1">
          {fa ? 'کالالند' : 'Kalaland'}
        </p>
        <h2 className="text-white text-2xl md:text-3xl font-bold mb-1">
          {fa ? slide.label.fa : slide.label.en}
        </h2>
        <p className="text-white/70 text-sm">
          {fa ? slide.sub.fa : slide.sub.en}
        </p>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? '24px' : '8px',
              height: '8px',
              background: i === current ? '#d4a017' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          key={current}
          className="h-full bg-gold-500"
          style={{ animation: `progress-bar ${DURATION}ms linear forwards` }}
        />
      </div>
    </div>
  );
}
