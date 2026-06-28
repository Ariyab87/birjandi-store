import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import Link from 'next/link';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import SearchAndFilter from '@/components/retail/SearchAndFilter';
import { WHOLESALE_BUSINESS_TYPES } from '@/lib/utils';

export function generateStaticParams() {
  return WHOLESALE_BUSINESS_TYPES.map((b) => ({ business: b.key }));
}

const LABELS: Record<string, { fa: string; en: string }> = {
  cafe:       { fa: 'کافه',      en: 'Café' },
  restaurant: { fa: 'رستوران',   en: 'Restaurant' },
  gym:        { fa: 'باشگاه',    en: 'Gym' },
  hotel:      { fa: 'هتل',       en: 'Hotel' },
  office:     { fa: 'دفتر کار',  en: 'Office' },
};

export default async function WholesaleBusinessPage({
  params: { locale, business },
  searchParams,
}: {
  params: { locale: string; business: string };
  searchParams: { brand?: string; q?: string; price?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('wholesale');
  const fa = locale === 'fa';

  const label = LABELS[business] ?? { fa: business, en: business };

  // Build filters — always lock to this business type
  const filters: Record<string, string> = {
    'filters[business_types][$containsi]': business,
  };
  if (searchParams.brand) filters['filters[brand][$containsi]'] = searchParams.brand;
  if (searchParams.q)     filters['filters[name_fa][$containsi]'] = searchParams.q;
  if (searchParams.price) {
    const [min, max] = searchParams.price.split('-');
    if (min) filters['filters[wholesale_price][$gte]'] = min;
    if (max) filters['filters[wholesale_price][$lte]'] = max;
  }

  let products = { data: [] as Awaited<ReturnType<typeof getProducts>>['data'] };
  try {
    products = await getProducts(filters, 1, 500);
  } catch {
    // Strapi not connected
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href={`/${locale}/wholesale`} className="hover:text-gold-500 transition-colors">
          {fa ? 'عمده‌فروشی' : 'Wholesale'}
        </Link>
        <span>/</span>
        <span className="text-navy-700 font-medium">{fa ? label.fa : label.en}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-navy-700">
          {fa ? label.fa : label.en}
        </h1>
        <span className="text-sm text-gray-400">
          {products.data.length} {fa ? 'محصول' : 'products'}
        </span>
      </div>

      {/* Search & Filters */}
      <Suspense fallback={null}>
        <SearchAndFilter />
      </Suspense>

      {/* Business type tabs */}
      <div className="flex gap-2 flex-wrap mb-8 pb-4 border-b border-gray-100">
        {Object.entries(LABELS).map(([key, lbl]) => (
          <Link
            key={key}
            href={`/${locale}/wholesale/${key}`}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              key === business
                ? 'bg-gold-500 text-white border-gold-500'
                : 'border-gray-300 hover:border-gold-400 hover:text-gold-500'
            }`}
          >
            {fa ? lbl.fa : lbl.en}
          </Link>
        ))}
      </div>

      {/* Product grid */}
      {products.data.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">📦</p>
          <p className="font-medium">{fa ? 'محصولی یافت نشد' : 'No products found'}</p>
          <p className="text-sm mt-2">
            {fa ? 'فیلترها را تغییر دهید' : 'Try changing your filters'}
          </p>
          <Link href={`/${locale}/wholesale/${business}`} className="inline-block mt-4 btn-gold text-sm">
            {fa ? 'پاک کردن فیلترها' : 'Clear filters'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.data.map((product) => (
            <ProductCard key={product.id} product={product} mode="wholesale" />
          ))}
        </div>
      )}
    </div>
  );
}
