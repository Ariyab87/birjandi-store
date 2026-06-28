import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import SearchAndFilter from '@/components/retail/SearchAndFilter';
import PromoStrip from '@/components/retail/PromoStrip';
import { RETAIL_CATEGORIES } from '@/lib/utils';
import { BASE_URL, hreflangAlternates, ogImages } from '@/lib/seo';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const fa = locale === 'fa';
  const title = fa
    ? 'خرید لوازم خانگی آنلاین | ظروف، برقی، ملامین، چینی | کالالند'
    : 'Buy Home Appliances Online | Cookware, Electric, Melamine, Porcelain | Kalaland';
  const description = fa
    ? 'خرید ظروف آشپزخانه، لوازم برقی، ظروف ملامین، چینی، استیل، تفلون و بیشتر با بهترین قیمت. ارسال سریع به سراسر ایران از کالالند.'
    : 'Buy kitchen cookware, electric appliances, melamine, porcelain, steel, teflon and more at the best price. Fast delivery across Iran from Kalaland.';
  const ogAlt = fa ? 'فروش خرده | کالالند' : 'Retail | Kalaland';
  return {
    title,
    description,
    alternates: hreflangAlternates('retail', locale),
    openGraph: {
      title: ogAlt,
      description,
      url: `${BASE_URL}/${locale}/retail`,
      type: 'website',
      images: ogImages(ogAlt),
    },
    twitter: { card: 'summary_large_image', title: ogAlt, description, images: [ogImages(ogAlt)[0].url] },
  };
}

const PAGE_SIZE = 20;

export default async function RetailPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { category?: string; brand?: string; q?: string; price?: string; page?: string; sort?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('retail');
  const tCat = await getTranslations('categories');

  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10));

  const filters: Record<string, string> = {};
  if (searchParams.category) filters['filters[category][$eq]'] = searchParams.category;
  if (searchParams.brand)    filters['filters[brand][$containsi]'] = searchParams.brand;
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
    const allProducts = await getProducts({}, 1, 500);
    allBrands = Array.from(new Set(
      allProducts.data.map(p => p.brand).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'fa'));
  } catch {
    // Strapi not running
  }

  const fa = locale === 'fa';
  const { total, pageCount } = products.meta.pagination;
  const fromItem = (currentPage - 1) * PAGE_SIZE + 1;
  const toItem = Math.min(currentPage * PAGE_SIZE, total);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (searchParams.category) sp.set('category', searchParams.category);
    if (searchParams.brand) sp.set('brand', searchParams.brand);
    if (searchParams.q) sp.set('q', searchParams.q);
    if (searchParams.price) sp.set('price', searchParams.price);
    if (searchParams.sort) sp.set('sort', searchParams.sort);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/${locale}/retail${qs ? `?${qs}` : ''}`;
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
      {/* Hero banner */}
      <div className="bg-gradient-to-l from-navy-800 to-navy-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-gold-400 text-xs font-medium mb-1 tracking-widest uppercase">
                {fa ? 'کالالند' : 'Kalaland'}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold">
                {fa ? 'فروشگاه لوازم خانگی' : 'Home Appliances Store'}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {fa
                  ? 'بیش از ۳۰ سال تجربه — ارسال به سراسر ایران'
                  : 'Over 30 years of experience — Delivery across Iran'}
              </p>
            </div>
            <div className="shrink-0">
              <div className="w-16 h-16 rounded-full ring-2 ring-gold-500/50 overflow-hidden">
                <Image src="/logo.png" alt="کالالند" width={64} height={64} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search & Filters */}
        <Suspense fallback={null}>
          <SearchAndFilter brands={allBrands} />
        </Suspense>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto flex-nowrap mb-6 pb-3 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          <Link
            href={`/${locale}/retail`}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              !searchParams.category
                ? 'bg-navy-700 text-white border-navy-700 shadow-sm'
                : 'border-gray-300 bg-white hover:border-navy-400 hover:text-navy-700'
            }`}
          >
            {t('all_products')}
          </Link>
          {RETAIL_CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={`/${locale}/retail?category=${cat.key}`}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                searchParams.category === cat.key
                  ? 'bg-navy-700 text-white border-navy-700 shadow-sm'
                  : 'border-gray-300 bg-white hover:border-navy-400 hover:text-navy-700'
              }`}
            >
              {cat.icon} {tCat(cat.key)}
            </Link>
          ))}
        </div>

        {/* Promo strip */}
        <PromoStrip />

        {/* Result info bar */}
        {total > 0 && (
          <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
            <span>
              {fa
                ? `نمایش ${new Intl.NumberFormat('fa-IR').format(fromItem)} تا ${new Intl.NumberFormat('fa-IR').format(toItem)} از ${new Intl.NumberFormat('fa-IR').format(total)} محصول`
                : `Showing ${fromItem}–${toItem} of ${total} products`}
            </span>
            {pageCount > 1 && (
              <span className="text-xs">
                {fa
                  ? `صفحه ${new Intl.NumberFormat('fa-IR').format(currentPage)} از ${new Intl.NumberFormat('fa-IR').format(pageCount)}`
                  : `Page ${currentPage} of ${pageCount}`}
              </span>
            )}
          </div>
        )}

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
      </div>
    </div>
  );
}
