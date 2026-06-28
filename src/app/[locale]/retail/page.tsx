import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import SearchAndFilter from '@/components/retail/SearchAndFilter';
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
  searchParams: { category?: string; brand?: string; q?: string; price?: string; page?: string };
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

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (searchParams.category) sp.set('category', searchParams.category);
    if (searchParams.brand) sp.set('brand', searchParams.brand);
    if (searchParams.q) sp.set('q', searchParams.q);
    if (searchParams.price) sp.set('price', searchParams.price);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/${locale}/retail${qs ? `?${qs}` : ''}`;
  }

  // Build visible page numbers (show at most 5 around current page)
  function visiblePages(): number[] {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
    const pages: number[] = [];
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(pageCount - 1, currentPage + 2);
    pages.push(1);
    if (start > 2) pages.push(-1); // ellipsis
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < pageCount - 1) pages.push(-2); // ellipsis
    pages.push(pageCount);
    return pages;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title mb-0">{t('title')}</h1>
        <span className="text-sm text-gray-400">
          {fa
            ? `${total} محصول`
            : total === 1 ? '1 product' : `${total} products`}
        </span>
      </div>

      {/* Search & Filters */}
      <Suspense fallback={null}>
        <SearchAndFilter brands={allBrands} />
      </Suspense>

      {/* Category tabs — horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto flex-nowrap mb-8 pb-4 border-b border-gray-100 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        <Link
          href={`/${locale}/retail`}
          className={`px-4 py-2 rounded-full text-sm border transition-colors ${
            !searchParams.category
              ? 'bg-navy-700 text-white border-navy-700'
              : 'border-gray-300 hover:border-navy-500'
          }`}
        >
          {t('all_products')}
        </Link>
        {RETAIL_CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            href={`/${locale}/retail?category=${cat.key}`}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              searchParams.category === cat.key
                ? 'bg-navy-700 text-white border-navy-700'
                : 'border-gray-300 hover:border-navy-500'
            }`}
          >
            {cat.icon} {tCat(cat.key)}
          </Link>
        ))}
      </div>

      {/* Product grid */}
      {products.data.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-medium">{fa ? 'محصولی یافت نشد' : 'No products found'}</p>
          <p className="text-sm mt-2">
            {fa ? 'فیلترها را تغییر دهید یا جستجو را پاک کنید' : 'Try changing the filters or clearing the search'}
          </p>
          <Link href={`/${locale}/retail`} className="inline-block mt-4 btn-primary text-sm">
            {fa ? 'نمایش همه محصولات' : 'Show all products'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.data.map((product) => (
            <ProductCard key={product.id} product={product} mode="retail" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1 mt-10 flex-wrap">
          {/* Prev */}
          {currentPage > 1 ? (
            <Link
              href={pageUrl(currentPage - 1)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:border-navy-500 hover:text-navy-700 transition-colors"
            >
              {fa ? '‹ قبلی' : '‹ Prev'}
            </Link>
          ) : (
            <span className="px-3 py-2 rounded-lg border border-gray-100 text-sm text-gray-300">
              {fa ? '‹ قبلی' : '‹ Prev'}
            </span>
          )}

          {/* Page numbers */}
          {visiblePages().map((p, i) =>
            p < 0 ? (
              <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400 text-sm">…</span>
            ) : (
              <Link
                key={p}
                href={pageUrl(p)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm border transition-colors ${
                  p === currentPage
                    ? 'bg-navy-700 text-white border-navy-700 font-bold'
                    : 'border-gray-300 hover:border-navy-500 hover:text-navy-700'
                }`}
              >
                {fa ? new Intl.NumberFormat('fa-IR').format(p) : p}
              </Link>
            )
          )}

          {/* Next */}
          {currentPage < pageCount ? (
            <Link
              href={pageUrl(currentPage + 1)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:border-navy-500 hover:text-navy-700 transition-colors"
            >
              {fa ? 'بعدی ›' : 'Next ›'}
            </Link>
          ) : (
            <span className="px-3 py-2 rounded-lg border border-gray-100 text-sm text-gray-300">
              {fa ? 'بعدی ›' : 'Next ›'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
