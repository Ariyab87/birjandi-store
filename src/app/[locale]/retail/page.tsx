import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Suspense } from 'react';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import SearchAndFilter from '@/components/retail/SearchAndFilter';
import { RETAIL_CATEGORIES } from '@/lib/utils';

export default async function RetailPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { category?: string; brand?: string; q?: string; price?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('retail');
  const tCat = await getTranslations('categories');

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
  }

  let products = { data: [] as Awaited<ReturnType<typeof getProducts>>['data'] };
  try {
    products = await getProducts(filters);
  } catch {
    // Strapi not running
  }

  const fa = locale === 'fa';

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title mb-0">{t('title')}</h1>
        <span className="text-sm text-gray-400">
          {fa
            ? `${products.data.length} محصول`
            : products.data.length === 1 ? '1 product' : `${products.data.length} products`}
        </span>
      </div>

      {/* Search & Filters */}
      <Suspense fallback={null}>
        <SearchAndFilter />
      </Suspense>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-8 pb-4 border-b border-gray-100">
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
    </div>
  );
}
