'use client';

import { useEffect, useRef, useState } from 'react';

interface Stat {
  label: { fa: string; en: string };
  numeric: number;
  suffix: string;
  display?: { fa: string; en: string }; // overrides numeric display when set
}

const STATS: Stat[] = [
  { label: { fa: 'سال تجربه',             en: 'Years of Experience' },         numeric: 30,    suffix: '+' },
  { label: { fa: 'رضایت مشتریان',         en: 'Customer Satisfaction' },       numeric: 98,    suffix: '%' },
  { label: { fa: 'برند معتبر',             en: 'Trusted Brands' },             numeric: 500,   suffix: '+' },
  { label: { fa: 'مشتری راضی',            en: 'Happy Customers' },             numeric: 10000, suffix: '+' },
  { label: { fa: 'قطعات اورجینال',        en: 'Original Parts' },             numeric: 100,   suffix: '%' },
  { label: { fa: 'تجهیز مراکز تجاری',    en: 'Business Centers Equipped' },  numeric: 0, suffix: '', display: { fa: '✓', en: '✓' } },
  { label: { fa: 'ارسال سراسر کشور',      en: 'Nationwide Delivery' },        numeric: 0, suffix: '', display: { fa: '✓', en: '✓' } },
  { label: { fa: 'دارای مجوز رسمی',       en: 'Officially Licensed' },        numeric: 0, suffix: '', display: { fa: '✓', en: '✓' } },
  { label: { fa: 'پشتیبانی',              en: 'Support' },                    numeric: 0, suffix: '24/7' },
];

function toFarsi(n: number): string {
  return n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}

function StatItem({ stat, locale }: { stat: Stat; locale: string }) {
  const fa = locale === 'fa';
  const display = stat.display
    ? (fa ? stat.display.fa : stat.display.en)
    : stat.suffix === '24/7'
      ? '24/7'
      : fa
      ? toFarsi(stat.numeric) + (stat.suffix === '%' ? '٪' : stat.suffix === '+' ? '+' : '')
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

  return (
    <section className="bg-white border-y border-gray-100 py-10">
      <div className="ticker-wrap">
        <div className="ticker-track">
          {items.map((s, i) => (
            <StatItem key={i} stat={s} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
