import type { Metadata } from 'next';
import { getProduct, getProducts, formatPrice, getImageUrl, type Product } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import AddToBasketButton from './AddToBasketButton';
import WhatsAppOrderButton from '@/components/ui/WhatsAppOrderButton';
import ProductCard from '@/components/product/ProductCard';
import { BASE_URL, buildTitle, buildDescription, hreflangAlternates, normalizeFarsi } from '@/lib/seo';

const CATEGORY_LABELS: Record<string, { fa: string; en: string }> = {
  electric:  { fa: 'برقی',       en: 'Electric' },
  kitchen:   { fa: 'آشپزخانه',   en: 'Kitchen' },
  cooling:   { fa: 'سرمایشی',    en: 'Cooling' },
  heating:   { fa: 'گرمایشی',    en: 'Heating' },
  cleaning:  { fa: 'نظافت',      en: 'Cleaning' },
  metal:     { fa: 'فلزی',       en: 'Metal' },
  melamine:  { fa: 'ملامین',     en: 'Melamine' },
  glass:     { fa: 'شکستنی',     en: 'Glassware' },
  porcelain: { fa: 'چینی',       en: 'Porcelain' },
  teflon:    { fa: 'تفلون',      en: 'Teflon' },
  steel:     { fa: 'استیل',      en: 'Steel' },
  ceramic:   { fa: 'سرامیک',    en: 'Ceramic' },
  plastic:   { fa: 'پلاستیک',   en: 'Plastic' },
  crystal:   { fa: 'کریستال',   en: 'Crystal' },
  copper:    { fa: 'مسی',        en: 'Copper' },
  cast_iron: { fa: 'چدن',        en: 'Cast Iron' },
};

export async function generateMetadata({
  params: { locale, product: productId },
}: {
  params: { locale: string; category: string; product: string };
}): Promise<Metadata> {
  try {
    const res = await getProduct(productId);
    const p = res.data;
    const fa = locale === 'fa';
    const name = fa ? p.name_fa : p.name_en;
    const title = p.seo_title || buildTitle(name, locale);
    const description = p.seo_description || buildDescription(fa ? p.description_fa : p.description_en, name, locale);
    const image = p.images?.[0] ? getImageUrl(p.images[0].url, 'full') : undefined;
    const path = `retail/${p.category}/${productId}`;

    return {
      title,
      description,
      keywords: [name, p.brand, CATEGORY_LABELS[p.category]?.[fa ? 'fa' : 'en'] || p.category, 'کالالند۲۴'].filter(Boolean).join(', '),
      alternates: hreflangAlternates(path, locale),
      robots: p.no_index ? { index: false, follow: false } : { index: true, follow: true },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/${locale}/${path}`,
        type: 'website',
        locale: fa ? 'fa_IR' : 'en_US',
        images: image ? [{ url: image, width: 800, height: 800, alt: name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return { title: 'کالالند۲۴' };
  }
}

export default async function ProductPage({
  params: { locale, category, product: productId },
}: {
  params: { locale: string; category: string; product: string };
}) {
  let product;
  try {
    const res = await getProduct(productId);
    product = res.data;
  } catch {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">
        Product not found or Strapi is not connected.
      </div>
    );
  }

  const fa = locale === 'fa';
  const name = fa ? product.name_fa : product.name_en;
  const description = fa ? product.description_fa : product.description_en;

  // Related products — same category, ranked by name similarity + same brand,
  // so a juicer suggests other juicers/blenders before unrelated appliances.
  const GENERIC_TOKENS = new Set(['مدل', 'طرح', 'سایز', 'برند', 'با', 'و', 'در', 'از', 'برای', 'دو', 'سه', 'تک']);
  const nameTokens = (...names: Array<string | null | undefined>) => {
    const tokens = new Set<string>();
    for (const n of names) {
      if (!n) continue;
      // split on anything that isn't a Persian/Arabic or Latin letter (es5-safe, no \p{L})
      for (const w of normalizeFarsi(n).toLowerCase().split(/[^a-z؀-ۿ]+/)) {
        if (w.length >= 2 && !GENERIC_TOKENS.has(w)) tokens.add(w);
      }
    }
    return tokens;
  };

  let related: Product[] = [];
  try {
    const rel = await getProducts(
      {
        'filters[category][$eq]': product.category,
        'filters[documentId][$ne]': product.documentId,
        sort: 'createdAt:desc',
      },
      1,
      100,
    );
    const baseTokens = nameTokens(product.name_fa, product.name_en);
    related = rel.data
      .map(p => {
        let score = 0;
        nameTokens(p.name_fa, p.name_en).forEach(t => { if (baseTokens.has(t)) score += 2; });
        if (p.brand && p.brand === product.brand) score += 3;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score) // stable sort keeps newest-first among ties
      .map(s => s.p);
  } catch { /* Strapi unavailable — skip related section */ }
  const images = product.images || [];
  const catLabel = CATEGORY_LABELS[product.category]?.[fa ? 'fa' : 'en'] || product.category;
  const productUrl = `${BASE_URL}/${locale}/retail/${product.category}/${productId}`;

  // Price validity: one year out (Google wants priceValidUntil for rich results)
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const seller = { '@type': 'Organization', name: 'کالالند۲۴', url: BASE_URL };
  const availability = product.stock_status === 'in_stock'
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  // JSON-LD: Product schema
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description || name,
    image: images.map(img => getImageUrl(img.url, 'full')),
    brand: { '@type': 'Brand', name: product.brand },
    category: catLabel,
    sku: productId,
    offers: product.price_on_request
      ? {
          '@type': 'Offer',
          availability,
          url: productUrl,
          itemCondition: 'https://schema.org/NewCondition',
          seller,
        }
      : product.retail_price != null
        ? {
            '@type': 'Offer',
            priceCurrency: 'IRR',
            // Stored value is in thousands of tomans → ×1000 (toman) ×10 (rial) = ×10,000 IRR
            price: String(product.retail_price * 10000),
            priceValidUntil,
            availability,
            itemCondition: 'https://schema.org/NewCondition',
            url: productUrl,
            seller,
          }
        : {
            '@type': 'Offer',
            availability,
            url: productUrl,
            itemCondition: 'https://schema.org/NewCondition',
            seller,
          },
  };

  // JSON-LD: Breadcrumb schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: fa ? 'خانه' : 'Home', item: `${BASE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: fa ? 'فروش خرده' : 'Retail', item: `${BASE_URL}/${locale}/retail` },
      { '@type': 'ListItem', position: 3, name: catLabel, item: `${BASE_URL}/${locale}/retail?category=${product.category}` },
      { '@type': 'ListItem', position: 4, name, item: productUrl },
    ],
  };

  return (
    <div className="relative overflow-hidden">
      {/* Ambient animated background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="ambient-blob w-80 h-80 bg-gold-500/15 top-10 -right-24" />
        <div className="ambient-blob w-[28rem] h-[28rem] bg-navy-700/10 top-1/4 -left-32" style={{ animationDelay: '5s' }} />
        <div className="ambient-blob w-72 h-72 bg-amber-300/15 bottom-16 right-1/4" style={{ animationDelay: '9s' }} />
      </div>

    <div className="max-w-5xl mx-auto px-4 py-10 relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap" aria-label="breadcrumb">
        <Link href={`/${locale}`} className="hover:text-navy-700 transition-colors">{fa ? 'خانه' : 'Home'}</Link>
        <span>›</span>
        <Link href={`/${locale}/retail`} className="hover:text-navy-700 transition-colors">{fa ? 'فروش خرده' : 'Retail'}</Link>
        <span>›</span>
        <Link href={`/${locale}/retail?category=${product.category}`} className="hover:text-navy-700 transition-colors">{catLabel}</Link>
        <span>›</span>
        <span className="text-navy-700 font-medium">{name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="relative">
          {/* Spotlight halo behind the product image */}
          <div aria-hidden className="spotlight-glow" />
        <div className="bg-white rounded-2xl p-6 shadow-sm aspect-square relative overflow-hidden group">
          {images[0] ? (
            <Image
              src={getImageUrl(images[0].url, 'full')}
              alt={`${name} | ${catLabel} | کالالند۲۴`}
              fill
              quality={100}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-105"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-8xl">📦</div>
          )}
        </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">{product.brand}</p>
          <h1 className="text-3xl font-bold text-navy-700 mb-4">{name}</h1>

          <div className="bg-cream rounded-xl p-4 mb-6">
            {product.price_on_request ? (
              <span className="inline-block text-sm font-semibold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full mb-2">
                {fa ? 'استعلام قیمت' : 'Price on Request'}
              </span>
            ) : product.retail_price != null ? (
              <p className="text-2xl font-bold text-gold-600">
                {formatPrice(product.retail_price, locale)}
              </p>
            ) : (
              <span className="inline-block text-sm font-semibold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full mb-2">
                {fa ? 'استعلام قیمت' : 'Price on Request'}
              </span>
            )}
            <span className={`text-sm mt-1 inline-block px-2 py-0.5 rounded ${
              product.stock_status === 'in_stock'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}>
              {product.stock_status === 'in_stock'
                ? (fa ? 'موجود' : 'In Stock')
                : (fa ? 'ناموجود' : 'Out of Stock')}
            </span>
          </div>

          {product.price_on_request ? (
            <a
              href={`https://wa.me/905338586763?text=${encodeURIComponent(fa ? `سلام، می‌خواهم قیمت "${name}" را بدانم` : `Hello, I'm interested in "${name}" — can you tell me the price?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              {fa ? 'استعلام قیمت از طریق واتساپ' : 'Inquire on WhatsApp'}
            </a>
          ) : product.retail_price != null ? (
            <>
              <AddToBasketButton
                product={{ id: product.id, name, price: product.retail_price }}
                locale={locale}
                inStock={product.stock_status === 'in_stock'}
              />
              <WhatsAppOrderButton
                fa={fa}
                productName={name}
                priceLabel={formatPrice(product.retail_price, locale)}
                productUrl={productUrl}
              />
            </>
          ) : (
            <a
              href={`https://wa.me/905338586763?text=${encodeURIComponent(fa ? `سلام، می‌خواهم قیمت "${name}" را بدانم` : `Hello, I'm interested in "${name}" — can you tell me the price?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              {fa ? 'استعلام قیمت از طریق واتساپ' : 'Inquire on WhatsApp'}
            </a>
          )}

          {description && (
            <div className="mt-8">
              <h2 className="font-semibold text-navy-700 mb-2">
                {fa ? 'توضیحات' : 'Description'}
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
            </div>
          )}

          {/* Specs table */}
          <div className="mt-8">
            <h2 className="font-semibold text-navy-700 mb-3">
              {fa ? 'مشخصات کلی' : 'General Specifications'}
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 text-sm">
              <div className="flex justify-between px-4 py-3">
                <span className="text-gray-400">{fa ? 'برند' : 'Brand'}</span>
                <span className="text-navy-700 font-medium">{product.brand}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-gray-400">{fa ? 'دسته‌بندی' : 'Category'}</span>
                <Link href={`/${locale}/retail?category=${product.category}`} className="text-navy-700 font-medium hover:text-gold-600 transition-colors">
                  {catLabel}
                </Link>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-gray-400">{fa ? 'وضعیت' : 'Availability'}</span>
                <span className={product.stock_status === 'in_stock' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                  {product.stock_status === 'in_stock' ? (fa ? 'موجود در انبار' : 'In stock') : (fa ? 'ناموجود' : 'Out of stock')}
                </span>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {[
              { icon: '🚚', fa: 'ارسال به سراسر ایران', en: 'Delivery across Iran' },
              { icon: '✅', fa: 'ضمانت اصالت کالا', en: 'Authenticity guaranteed' },
              { icon: '📞', fa: 'پشتیبانی ۲۴ ساعته', en: '24/7 support' },
              { icon: '💬', fa: 'سفارش آسان از واتساپ', en: 'Easy WhatsApp ordering' },
            ].map((b) => (
              <div key={b.icon} className="flex items-center gap-2 bg-cream rounded-xl px-3 py-2.5">
                <span>{b.icon}</span>
                <span className="text-gray-600">{fa ? b.fa : b.en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-navy-700">
              {fa ? 'محصولات مشابه' : 'Related Products'}
            </h2>
            <Link
              href={`/${locale}/retail?category=${product.category}`}
              className="text-sm text-gold-600 hover:text-gold-700 font-medium transition-colors"
            >
              {fa ? `مشاهده همه ${catLabel} ›` : `View all ${catLabel} ›`}
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} mode="retail" />
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
