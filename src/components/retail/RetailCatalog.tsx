import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import SearchAndFilter from '@/components/retail/SearchAndFilter';
import PromoStrip from '@/components/retail/PromoStrip';
import VideoReel from '@/components/retail/VideoReel';
import { RETAIL_CATEGORIES } from '@/lib/utils';
import { BASE_URL, safeJsonLd } from '@/lib/seo';

const PAGE_SIZE = 20;

interface Props {
  locale: string;
  /** Fixed category for a /retail/[category] landing page; undefined = all products (/retail). */
  category?: string;
  searchParams: { brand?: string; q?: string; price?: string; page?: string; sort?: string };
}

export default async function RetailCatalog({ locale, category, searchParams }: Props) {
  const t = await getTranslations('retail');
  const tCat = await getTranslations('categories');

  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10));

  const filters: Record<string, string> = {};
  if (category) filters['filters[category][$eq]'] = category;
  if (searchParams.brand) filters['filters[brand][$containsi]'] = searchParams.brand;
  if (searchParams.q) {
    filters['filters[$or][0][name_fa][$containsi]'] = searchParams.q;
    filters['filters[$or][1][name_en][$containsi]'] = searchParams.q;
    filters['filters[$or][2][brand][$containsi]']   = searchParams.q;
  }
  if (searchParams.price) {
    const [min, max] = searchParams.price.split('-');
    if (min) filters['filters[retail_price][$gte]'] = min;
    if (max) filters['filters[retail_price][$lte]'] = max;
    filters['filters[price_on_request][$eq]'] = 'false';
  }
  if (searchParams.sort) {
    filters['sort'] = searchParams.sort;
  }

  let products = {
    data: [] as Awaited<ReturnType<typeof getProducts>>['data'],
    meta: { pagination: { total: 0, page: 1, pageSize: PAGE_SIZE, pageCount: 1 } },
  };
  let allBrands: string[] = [];
  try {
    products = await getProducts(filters, currentPage, PAGE_SIZE);
    const scopeFilter: Record<string, string> = category ? { 'filters[category][$eq]': category } : {};
    const allProducts = await getProducts(scopeFilter, 1, 500);
    allBrands = Array.from(new Set(
      allProducts.data.map(p => p.brand).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'fa'));
  } catch {
    // Strapi not running
  }

  const fa = locale === 'fa';
  const { pageCount } = products.meta.pagination;
  const basePath = category ? `retail/${category}` : 'retail';
  const catLabel = category ? tCat(category) : null;

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: products.meta.pagination.total,
    itemListElement: products.data.map((p, i) => ({
      '@type': 'ListItem',
      position: (currentPage - 1) * PAGE_SIZE + i + 1,
      name: fa ? p.name_fa : p.name_en,
      url: `${BASE_URL}/${locale}/retail/${p.category}/${p.documentId}`,
    })),
  };

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (searchParams.brand) sp.set('brand', searchParams.brand);
    if (searchParams.q) sp.set('q', searchParams.q);
    if (searchParams.price) sp.set('price', searchParams.price);
    if (searchParams.sort) sp.set('sort', searchParams.sort);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/${locale}/${basePath}${qs ? `?${qs}` : ''}`;
  }

  function visiblePages(): number[] {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
    const pages: number[] = [];
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(pageCount - 1, currentPage + 2);
    pages.push(1);
    if (start > 2) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < pageCount - 1) pages.push(-2);
    pages.push(pageCount);
    return pages;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }} />

      {/* Hero banner */}
      <div className="bg-gradient-to-l from-navy-800 to-navy-900 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className={`flex items-center justify-between gap-3 ${fa ? 'flex-row-reverse' : ''}`}>
            <div className={fa ? 'text-right' : 'text-left'}>
              <p className="text-gold-400 text-xs font-medium mb-1 tracking-widest uppercase">
                {fa ? 'کالالند۲۴' : 'Kalaland24'}
              </p>
              <h1 className="text-xl md:text-3xl font-bold leading-tight">
                {catLabel ? catLabel : (fa ? 'فروشگاه لوازم خانگی' : 'Home Appliances Store')}
              </h1>
              <p className="text-white/60 text-xs md:text-sm mt-1">
                {fa ? 'بیش از ۳۰ سال تجربه — ارسال به سراسر ایران' : 'Over 30 years of experience — Delivery across Iran'}
              </p>
            </div>
            <div className="shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full ring-2 ring-gold-500/50 overflow-hidden">
                <Image src="/logo.png" alt="کالالند۲۴" width={64} height={64} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Search & Filters */}
        <Suspense fallback={null}>
          <SearchAndFilter brands={allBrands} />
        </Suspense>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto flex-nowrap mb-6 pb-3 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          <Link
            href={`/${locale}/retail`}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              !category
                ? 'bg-navy-700 text-white border-navy-700 shadow-sm'
                : 'border-gray-300 bg-white hover:border-navy-400 hover:text-navy-700'
            }`}
          >
            {t('all_products')}
          </Link>
          {RETAIL_CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={`/${locale}/retail/${cat.key}`}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                category === cat.key
                  ? 'bg-navy-700 text-white border-navy-700 shadow-sm'
                  : 'border-gray-300 bg-white hover:border-navy-400 hover:text-navy-700'
              }`}
            >
              {tCat(cat.key)}
            </Link>
          ))}
        </div>

        {/* Video reel */}
        <VideoReel />

        {/* Product grid */}
        {products.data.length === 0 ? (
          <div className="text-center py-24 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-medium text-gray-600">{fa ? 'محصولی یافت نشد' : 'No products found'}</p>
            <p className="text-sm mt-2">
              {fa ? 'فیلترها را تغییر دهید یا جستجو را پاک کنید' : 'Try changing the filters or clearing the search'}
            </p>
            <Link href={`/${locale}/retail`} className="inline-block mt-5 bg-navy-700 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-navy-800 transition-colors">
              {fa ? 'نمایش همه محصولات' : 'Show all products'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {products.data.map((product) => (
              <ProductCard key={product.id} product={product} mode="retail" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
            {currentPage > 1 ? (
              <Link href={pageUrl(currentPage - 1)} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-navy-500 hover:text-navy-700 transition-colors shadow-sm">
                {fa ? '‹ قبلی' : '‹ Prev'}
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-lg border border-gray-100 text-sm text-gray-300 bg-white">
                {fa ? '‹ قبلی' : '‹ Prev'}
              </span>
            )}

            {visiblePages().map((p, i) =>
              p < 0 ? (
                <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400 text-sm">…</span>
              ) : (
                <Link
                  key={p}
                  href={pageUrl(p)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm border transition-colors shadow-sm ${
                    p === currentPage
                      ? 'bg-navy-700 text-white border-navy-700 font-bold'
                      : 'bg-white border-gray-200 hover:border-navy-500 hover:text-navy-700'
                  }`}
                >
                  {fa ? new Intl.NumberFormat('fa-IR').format(p) : p}
                </Link>
              )
            )}

            {currentPage < pageCount ? (
              <Link href={pageUrl(currentPage + 1)} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-navy-500 hover:text-navy-700 transition-colors shadow-sm">
                {fa ? 'بعدی ›' : 'Next ›'}
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-lg border border-gray-100 text-sm text-gray-300 bg-white">
                {fa ? 'بعدی ›' : 'Next ›'}
              </span>
            )}
          </div>
        )}

        {/* Promo strip — after pagination */}
        <div className="mt-8">
          <PromoStrip />
        </div>
      </div>
    </div>
  );
}
