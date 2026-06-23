import type { Metadata } from 'next';
import { getProduct, formatPrice, getImageUrl } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import AddToBasketButton from './AddToBasketButton';
import { BASE_URL, buildTitle, buildDescription, hreflangAlternates } from '@/lib/seo';

const CATEGORY_LABELS: Record<string, { fa: string; en: string }> = {
  electric:  { fa: 'برقی',       en: 'Electric' },
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
      keywords: [name, p.brand, CATEGORY_LABELS[p.category]?.[fa ? 'fa' : 'en'] || p.category, 'کالالند'].filter(Boolean).join(', '),
      alternates: hreflangAlternates(path),
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
    return { title: 'کالالند' };
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
  const images = product.images || [];
  const catLabel = CATEGORY_LABELS[product.category]?.[fa ? 'fa' : 'en'] || product.category;
  const productUrl = `${BASE_URL}/${locale}/retail/${product.category}/${productId}`;

  // JSON-LD: Product schema
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description || name,
    image: images.map(img => getImageUrl(img.url, 'full')),
    brand: { '@type': 'Brand', name: product.brand },
    sku: productId,
    offers: product.price_on_request
      ? { '@type': 'Offer', availability: 'https://schema.org/InStock', url: productUrl }
      : {
          '@type': 'Offer',
          priceCurrency: 'IRR',
          price: product.retail_price,
          availability: product.stock_status === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: productUrl,
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
    <div className="max-w-5xl mx-auto px-4 py-10">
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
        <div className="bg-white rounded-2xl p-6 shadow-sm aspect-square relative">
          {images[0] ? (
            <Image
              src={getImageUrl(images[0].url, 'full')}
              alt={`${name} | ${catLabel} | کالالند`}
              fill
              quality={100}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-4"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-8xl">📦</div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">{product.brand}</p>
          <h1 className="text-3xl font-bold text-navy-700 mb-4">{name}</h1>

          <div className="bg-cream rounded-xl p-4 mb-6">
            {product.price_on_request ? (
              <span className="inline-block text-sm font-semibold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full mb-2">
                {fa ? 'استعلام قیمت' : 'Price on Request'}
              </span>
            ) : (
              <p className="text-2xl font-bold text-gold-600">
                {formatPrice(product.retail_price, locale)}
              </p>
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
          ) : (
            <AddToBasketButton
              product={{ id: product.id, name, price: product.retail_price }}
              locale={locale}
              inStock={product.stock_status === 'in_stock'}
            />
          )}

          {description && (
            <div className="mt-8">
              <h2 className="font-semibold text-navy-700 mb-2">
                {fa ? 'توضیحات' : 'Description'}
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
