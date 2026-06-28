'use client';

import { useParams } from 'next/navigation';

const PROMOS = {
  fa: [
    { icon: '🚚', text: 'ارسال به سراسر ایران' },
    { icon: '✅', text: 'ضمانت اصالت کالا' },
    { icon: '💬', text: 'پشتیبانی ۲۴ ساعته' },
    { icon: '🏷️', text: 'بهترین قیمت بازار' },
    { icon: '🔄', text: 'امکان مرجوع کالا' },
    { icon: '🏭', text: 'بیش از ۳۰ سال تجربه' },
    { icon: '📦', text: 'بسته‌بندی مطمئن' },
    { icon: '⭐', text: 'برندهای معتبر جهانی' },
  ],
  en: [
    { icon: '🚚', text: 'Delivery across Iran' },
    { icon: '✅', text: 'Authenticity guaranteed' },
    { icon: '💬', text: '24/7 support' },
    { icon: '🏷️', text: 'Best market prices' },
    { icon: '🔄', text: 'Easy returns' },
    { icon: '🏭', text: '30+ years experience' },
    { icon: '📦', text: 'Secure packaging' },
    { icon: '⭐', text: 'Global trusted brands' },
  ],
};

export default function PromoStrip() {
  const params = useParams();
  const locale = params.locale as string;
  const items = PROMOS[locale as 'fa' | 'en'] ?? PROMOS.fa;
  // duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden bg-navy-900 rounded-xl mb-6 py-3 select-none">
      <div
        className="flex gap-8 w-max"
        style={{
          animation: locale === 'fa'
            ? 'marquee-rtl 28s linear infinite'
            : 'marquee-ltr 28s linear infinite',
        }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-white/80 text-sm whitespace-nowrap px-2">
            <span>{item.icon}</span>
            <span>{item.text}</span>
            <span className="text-gold-500 mx-2">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
