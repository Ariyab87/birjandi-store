'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

// Stored prices are in thousands of tomans — filter values must match
const PRICE_RANGES = [
  { label: { fa: 'همه قیمت‌ها', en: 'All prices' }, value: '' },
  { label: { fa: 'زیر ۵ میلیون', en: 'Under 5M' }, value: '0-5000' },
  { label: { fa: '۵ تا ۱۵ میلیون', en: '5M – 15M' }, value: '5000-15000' },
  { label: { fa: '۱۵ تا ۳۰ میلیون', en: '15M – 30M' }, value: '15000-30000' },
  { label: { fa: 'بالای ۳۰ میلیون', en: 'Over 30M' }, value: '30000-999999' },
];

const SORT_OPTIONS = [
  { label: { fa: 'مرتب‌سازی', en: 'Sort by' }, value: '' },
  { label: { fa: 'ارزان‌ترین', en: 'Price: Low → High' }, value: 'retail_price:asc' },
  { label: { fa: 'گران‌ترین', en: 'Price: High → Low' }, value: 'retail_price:desc' },
  { label: { fa: 'جدیدترین', en: 'Newest' }, value: 'createdAt:desc' },
];

export default function SearchAndFilter({ brands = [] }: { brands?: string[] }) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  // Category now lives in the URL path (/retail/[category]), not a ?category= query param.
  const category = params.category as string | undefined;
  const basePath = category ? `/${locale}/retail/${category}` : `/${locale}/retail`;
  const fa = locale === 'fa';

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [price, setPrice] = useState(searchParams.get('price') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const timeout = setTimeout(() => applyFilters(query, brand, price, sort), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function applyFilters(q: string, b: string, p: string, s: string) {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (b) sp.set('brand', b);
    if (p) sp.set('price', p);
    if (s) sp.set('sort', s);
    // always reset to page 1 when filters change
    router.push(`${basePath}${sp.toString() ? `?${sp.toString()}` : ''}`);
  }

  function handleBrand(b: string) {
    setBrand(b);
    applyFilters(query, b, price, sort);
  }

  function handlePrice(p: string) {
    setPrice(p);
    applyFilters(query, brand, p, sort);
  }

  function handleSort(s: string) {
    setSort(s);
    applyFilters(query, brand, price, s);
  }

  function clearAll() {
    setQuery('');
    setBrand('');
    setPrice('');
    setSort('');
    router.push(basePath);
  }

  const hasFilters = query || brand || price || sort;

  return (
    <div className="mb-6 space-y-3">
      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={fa ? 'جستجوی محصول، برند...' : 'Search products, brands...'}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 bg-white shadow-sm"
        />
        <span className="absolute top-3 right-3.5 text-gray-400 text-lg">🔍</span>
      </div>

      {/* Filters row — 2 cols on mobile, auto on desktop */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 items-center">
        {/* Brand dropdown */}
        <select
          value={brand}
          onChange={(e) => handleBrand(e.target.value)}
          className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-navy-500 bg-white shadow-sm"
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
          className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-navy-500 bg-white shadow-sm"
        >
          {PRICE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {fa ? r.label.fa : r.label.en}
            </option>
          ))}
        </select>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => handleSort(e.target.value)}
          className="w-full sm:w-auto col-span-2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-navy-500 bg-white shadow-sm"
        >
          {SORT_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {fa ? r.label.fa : r.label.en}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="col-span-2 sm:col-span-1 text-sm text-red-400 hover:text-red-600 flex items-center justify-center sm:justify-start gap-1 transition-colors py-2 sm:py-0"
          >
            <span className="text-base leading-none">×</span>
            {fa ? 'پاک کردن فیلترها' : 'Clear filters'}
          </button>
        )}
      </div>

      {/* Active filter tags */}
      {(brand || query) && (
        <div className="flex flex-wrap gap-2">
          {brand && (
            <span className="bg-navy-700 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              {brand}
              <button onClick={() => handleBrand('')} className="text-white/70 hover:text-white font-bold leading-none">×</button>
            </span>
          )}
          {query && (
            <span className="bg-gold-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              "{query}"
              <button onClick={() => setQuery('')} className="text-white/70 hover:text-white font-bold leading-none">×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
