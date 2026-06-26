'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const PRICE_RANGES = [
  { label: { fa: 'همه قیمت‌ها', en: 'All prices' }, value: '' },
  { label: { fa: 'زیر ۵ میلیون', en: 'Under 5M' }, value: '0-5000000' },
  { label: { fa: '۵ تا ۱۵ میلیون', en: '5M – 15M' }, value: '5000000-15000000' },
  { label: { fa: '۱۵ تا ۳۰ میلیون', en: '15M – 30M' }, value: '15000000-30000000' },
  { label: { fa: 'بالای ۳۰ میلیون', en: 'Over 30M' }, value: '30000000-999999999' },
];

export default function SearchAndFilter({ brands = [] }: { brands?: string[] }) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const fa = locale === 'fa';

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [price, setPrice] = useState(searchParams.get('price') || '');

  useEffect(() => {
    const timeout = setTimeout(() => applyFilters(query, brand, price), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  function applyFilters(q: string, b: string, p: string) {
    const sp = new URLSearchParams();
    const category = searchParams.get('category');
    if (category) sp.set('category', category);
    if (q) sp.set('q', q);
    if (b) sp.set('brand', b);
    if (p) sp.set('price', p);
    router.push(`/${locale}/retail?${sp.toString()}`);
  }

  function handleBrand(b: string) {
    setBrand(b);
    applyFilters(query, b, price);
  }

  function handlePrice(p: string) {
    setPrice(p);
    applyFilters(query, brand, p);
  }

  function clearAll() {
    setQuery('');
    setBrand('');
    setPrice('');
    const category = searchParams.get('category');
    router.push(`/${locale}/retail${category ? `?category=${category}` : ''}`);
  }

  const hasFilters = query || brand || price;

  return (
    <div className="mb-6 space-y-3">
      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={fa ? 'جستجوی محصول...' : 'Search products...'}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
        />
        <span className="absolute top-3 right-3 text-gray-400 text-lg">🔍</span>
      </div>

      {/* Brand + Price filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Brand dropdown */}
        <select
          value={brand}
          onChange={(e) => handleBrand(e.target.value)}
          className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-navy-500 bg-white"
        >
          <option value="">{fa ? 'همه برندها' : 'All brands'}</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Price range dropdown */}
        <select
          value={price}
          onChange={(e) => handlePrice(e.target.value)}
          className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-navy-500 bg-white"
        >
          {PRICE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {fa ? r.label.fa : r.label.en}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            {fa ? 'پاک کردن فیلترها' : 'Clear filters'}
          </button>
        )}

        {/* Active filter tags */}
        {brand && (
          <span className="bg-navy-100 text-navy-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
            {brand}
            <button onClick={() => handleBrand('')} className="font-bold">×</button>
          </span>
        )}
        {query && (
          <span className="bg-gold-100 text-gold-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
            "{query}"
            <button onClick={() => setQuery('')} className="font-bold">×</button>
          </span>
        )}
      </div>
    </div>
  );
}
