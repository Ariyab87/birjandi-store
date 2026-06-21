'use client';

import { useEffect, useRef, useState } from 'react';

interface Stat {
  label: { fa: string; en: string };
  numeric: number;
  suffix: string;
}

const STATS: Stat[] = [
  { label: { fa: 'سال تجربه',        en: 'Years of experience' }, numeric: 30,    suffix: '+' },
  { label: { fa: 'برند معتبر',        en: 'Trusted brands' },      numeric: 500,   suffix: '+' },
  { label: { fa: 'استان ایران',       en: 'Iranian provinces' },   numeric: 31,    suffix: ''  },
  { label: { fa: 'مشتری راضی',        en: 'Happy customers' },     numeric: 10000, suffix: '+' },
  { label: { fa: 'محصول فروخته‌شده', en: 'Products sold' },       numeric: 5000,  suffix: '+' },
  { label: { fa: 'نمایندگی فعال',     en: 'Active branches' },     numeric: 20,    suffix: '+' },
  { label: { fa: 'پشتیبانی',          en: 'Support' },             numeric: 0,     suffix: '24/7' },
];

function toFarsi(n: number): string {
  return n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}

function StatItem({ stat, locale }: { stat: Stat; locale: string }) {
  const fa = locale === 'fa';
  const display =
    stat.suffix === '24/7'
      ? '24/7'
      : fa
      ? toFarsi(stat.numeric) + (stat.suffix === '+' ? '+' : '')
      : (stat.numeric >= 1000 ? stat.numeric.toLocaleString('en-US') : stat.numeric) + stat.suffix;

  return (
    <div className="flex items-center gap-8 shrink-0">
      <div className="text-left">
        <p className="text-4xl font-bold text-gold-500 whitespace-nowrap">{display}</p>
        <p className="text-sm text-gray-500 mt-1 whitespace-nowrap">
          {fa ? stat.label.fa : stat.label.en}
        </p>
      </div>
      <div className="w-px h-10 bg-gray-200 shrink-0" />
    </div>
  );
}

export default function AnimatedStats({ locale }: { locale: string }) {
  const items = [...STATS, ...STATS];
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-white border-y border-gray-100 py-10 overflow-hidden transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}
    >
      <div className="ticker-track">
        {items.map((s, i) => (
          <StatItem key={i} stat={s} locale={locale} />
        ))}
      </div>
    </section>
  );
}
