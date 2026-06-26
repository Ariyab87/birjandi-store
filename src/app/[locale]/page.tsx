import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getFeaturedProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { BASE_URL, hreflangAlternates, ogImages, SOCIAL_LINKS } from '@/lib/seo';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const fa = locale === 'fa';
  const title = fa ? 'کالالند — خرید آنلاین لوازم برقی و خانگی' : 'Kalaland — Buy Home & Electrical Appliances Online';
  const description = fa
    ? 'فروشگاه آنلاین کالالند — خرید لوازم برقی، آشپزخانه، فلزی، چینی، ملامین و بیشتر با بهترین قیمت. فروش خرده و عمده.'
    : 'Kalaland online store — buy electric, kitchen, metal, porcelain, melamine appliances at the best price. Retail & wholesale.';
  const ogAlt = fa ? 'کالالند — لوازم برقی و خانگی' : 'Kalaland — Home & Electrical Appliances';
  return {
    title,
    description,
    alternates: hreflangAlternates('', locale),
    openGraph: {
      title: ogAlt,
      description: fa ? 'خرید آنلاین لوازم خانگی با بهترین قیمت' : 'Buy home appliances at the best price',
      url: `${BASE_URL}/${locale}`,
      type: 'website',
      images: ogImages(ogAlt),
    },
    twitter: {
      card: 'summary_large_image',
      title: ogAlt,
      description,
      images: [ogImages(ogAlt)[0].url],
    },
  };
}
import AnimatedStats from '@/components/ui/AnimatedStats';
import ScrollVideo from '@/components/ui/ScrollVideo';
import WarehouseDeliverySection from '@/components/ui/WarehouseDeliverySection';

const BUSINESS_TYPES = [
  { key: 'cafe',       image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop', label: { fa: 'کافه',      en: 'Café' } },
  { key: 'restaurant', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop', label: { fa: 'رستوران',   en: 'Restaurant' } },
  { key: 'gym',        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop', label: { fa: 'باشگاه',   en: 'Gym' } },
  { key: 'hotel',      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop', label: { fa: 'هتل',       en: 'Hotel' } },
  { key: 'office',     image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop', label: { fa: 'دفتر کار', en: 'Office' } },
] as const;


export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('homepage');
  const fa = locale === 'fa';

  let featured = { data: [] as Awaited<ReturnType<typeof getFeaturedProducts>>['data'] };
  try {
    featured = await getFeaturedProducts();
  } catch {
    // Strapi not running — empty state
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'کالالند',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/fa/retail?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'کالالند',
    alternateName: 'Kalaland',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    image: `${BASE_URL}/logo.png`,
    description: fa
      ? 'عرضه‌کننده لوازم برقی و خانگی — فروش خرده و عمده با بیش از ۳۰ سال تجربه'
      : 'Supplier of home and electrical appliances — retail and wholesale with over 30 years of experience',
    sameAs: SOCIAL_LINKS,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+98-993-464-2455',
      contactType: 'customer service',
      availableLanguage: ['Persian', 'English'],
    },
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      {/* ── HERO ── scroll-driven 3D video */}
      <section className="relative min-h-screen flex items-center overflow-hidden border-b border-gray-100" style={{ marginTop: '-64px' }}>
        {/* Video fills background, scroll-controlled */}
        <div className="absolute inset-0 z-0">
          <ScrollVideo src="https://res.cloudinary.com/doi5encow/video/upload/v1781980055/bshop-videos/hero-3d.mp4" />
          {/* Dark overlay so text is always readable */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 py-20">
          <span className="inline-block bg-gold-500 text-white text-xs font-semibold px-4 py-1 rounded-full mb-6 tracking-wide uppercase">
            {fa ? 'بیش از ۳۰ سال اعتماد' : 'Over 30 years of trust'}
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
            {fa
              ? <>لوازم برقی و خانگی کالالند<span className="text-2xl sm:text-3xl font-normal" style={{verticalAlign:'super', fontSize:'0.55em'}}>۲۴</span></>
              : <>Kalaland<span className="font-normal" style={{verticalAlign:'super', fontSize:'0.55em'}}>24</span><br className="hidden sm:block" /> Electrical &amp; Household</>
            }
          </h1>
          <p className="text-base md:text-lg text-white mb-6 md:mb-12 max-w-xl mx-auto" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.9)' }}>
            {fa
              ? 'عرضه‌کننده معتبر لوازم خانگی با بهترین برندهای دنیا — خرده‌فروشی و عمده‌فروشی'
              : 'Premium supplier of home appliances — retail & wholesale across Iran'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Retail card — glass style */}
            <Link
              href={`/${locale}/retail`}
              className="group bg-white/10 hover:bg-white/15 border border-white/30 rounded-2xl p-5 md:p-8 transition-all hover:scale-105 hover:shadow-2xl text-white backdrop-blur-md"
            >
              <div className="mb-3 md:mb-4">
                <svg className="w-8 h-8 md:w-10 md:h-10 mx-auto text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{t('retail')}</h2>
              <p className="text-xs md:text-sm text-white/70 group-hover:text-white/90 transition-colors">{t('retail_desc')}</p>
            </Link>

            {/* Wholesale card — gold, priority */}
            <Link
              href={`/${locale}/wholesale`}
              className="group bg-white/10 hover:bg-white/15 border border-white/30 rounded-2xl p-5 md:p-8 transition-all hover:scale-105 hover:shadow-2xl text-white backdrop-blur-md"
            >
              <div className="mb-3 md:mb-4">
                <svg className="w-8 h-8 md:w-10 md:h-10 mx-auto text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{t('wholesale')}</h2>
              <p className="text-xs md:text-sm text-white/80 group-hover:text-white transition-colors">{t('wholesale_desc')}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <AnimatedStats locale={locale} />

      {/* ── ABOUT ── */}
      <section id="about" className="py-20 px-4 bg-white scroll-mt-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
              {fa ? 'درباره ما' : 'About Us'}
            </span>
            <h2 className="text-3xl font-bold text-navy-700 mt-2 mb-5">
              {fa ? 'سه دهه تجربه، یک نام قابل اعتماد' : '30 Years of Experience, One Trusted Name'}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {fa
                ? 'کالالند با دهه‌ها تجربه در حوزه لوازم خانگی، یکی از معتبرترین و شناخته‌شده‌ترین عرضه‌کنندگان این صنعت در بازار است.'
                : 'With decades of expertise in home appliances, Kalaland has built a reputation as one of the most trusted names in the industry.'}
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              {fa
                ? 'ما با بهترین برندهای ایرانی و خارجی همکاری مستقیم داریم و محصولات خود را به سراسر ایران — تمام ۳۱ استان کشور — تحویل می‌دهیم.'
                : 'We work directly with the best Iranian and international brands, delivering nationwide across all 31 provinces of Iran.'}
            </p>
            <p className="text-gray-600 leading-relaxed">
              {fa
                ? 'خدمات ما شامل فروش خرده به افراد و فروش عمده به کافه‌ها، رستوران‌ها، هتل‌ها، باشگاه‌ها و دفاتر کاری در سراسر کشور است.'
                : 'Our services include retail sales to individuals and wholesale to cafés, restaurants, hotels, gyms, and offices nationwide.'}
            </p>
            <Link
              href={`/${locale}/retail`}
              className="inline-block mt-6 btn-gold"
            >
              {fa ? 'مشاهده محصولات ←' : 'Browse Products →'}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🏭', title: fa ? 'برندهای معتبر' : 'Top Brands', desc: fa ? 'ال‌جی، سامسونگ، بوش، آبسال و بیشتر' : 'LG, Samsung, Bosch, Absal & more' },
              { icon: '🚚', title: fa ? 'ارسال سراسری' : 'Nationwide Delivery', desc: fa ? 'به تمام استان‌های ایران' : 'To all provinces of Iran' },
              { icon: '🤝', title: fa ? 'ضمانت اصالت' : 'Authenticity Guarantee', desc: fa ? 'تمام محصولات اصل و دارای گارانتی' : 'All products genuine & warranted' },
              { icon: '📞', title: fa ? 'پشتیبانی ۲۴/۷' : '24/7 Support', desc: fa ? 'همیشه در کنار شما هستیم' : 'Always here for you' },
            ].map((item) => (
              <div key={item.title} className="bg-cream rounded-xl p-5 border border-gray-100">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h4 className="font-bold text-navy-700 text-sm mb-1">{item.title}</h4>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WAREHOUSE & DELIVERY ── */}
      <WarehouseDeliverySection locale={locale} />

      {/* ── FEATURED PRODUCTS ── */}
      {featured.data.length > 0 && (
        <section id="featured" className="bg-gray-50 py-16 px-4 scroll-mt-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="section-title text-center">{t('featured_products')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {featured.data.map((product) => (
                <ProductCard key={product.id} product={product} mode="retail" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHOLESALE BUSINESS TYPES ── */}
      <section className="bg-white py-16 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
            {fa ? 'فروش عمده' : 'Wholesale'}
          </span>
          <h2 className="text-3xl font-bold text-navy-700 mt-2 mb-10">
            {fa ? 'خرید عمده برای کسب‌وکار شما' : 'Wholesale for your business'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {BUSINESS_TYPES.map((biz) => (
              <Link
                key={biz.key}
                href={`/${locale}/wholesale/${biz.key}`}
                className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="relative h-36 md:h-44 w-full">
                  <Image
                    src={biz.image}
                    alt={biz.label.en}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-bold text-white text-base">
                    {fa ? biz.label.fa : biz.label.en}
                  </p>
                  <p className="text-white/70 text-xs mt-0.5 group-hover:text-white transition-colors">
                    {fa ? 'مشاهده محصولات ←' : 'View products →'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
