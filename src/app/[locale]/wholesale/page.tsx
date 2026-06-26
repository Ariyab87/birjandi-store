import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { BASE_URL, hreflangAlternates, ogImages } from '@/lib/seo';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const fa = locale === 'fa';
  const title = fa ? 'فروش عمده — لوازم خانگی برای کسب‌وکار | کالالند' : 'Wholesale — Home Appliances for Business | Kalaland';
  const description = fa
    ? 'خرید عمده لوازم خانگی و آشپزخانه برای کافه، رستوران، هتل، باشگاه و دفتر کار با قیمت ویژه از کالالند'
    : 'Wholesale home and kitchen appliances for cafés, restaurants, hotels, gyms and offices at special prices from Kalaland';
  const ogAlt = fa ? 'فروش عمده | کالالند' : 'Wholesale | Kalaland';
  return {
    title,
    description,
    alternates: hreflangAlternates('wholesale', locale),
    openGraph: {
      title: ogAlt,
      description,
      url: `${BASE_URL}/${locale}/wholesale`,
      type: 'website',
      images: ogImages(ogAlt),
    },
    twitter: { card: 'summary_large_image', title: ogAlt, description, images: [ogImages(ogAlt)[0].url] },
  };
}

const BUSINESS_TYPES = [
  {
    key: 'cafe',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop&q=80',
    label: { fa: 'کافه', en: 'Café' },
    desc: { fa: 'تجهیزات کامل برای کافه‌ها', en: 'Complete equipment for cafés' },
  },
  {
    key: 'restaurant',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80',
    label: { fa: 'رستوران', en: 'Restaurant' },
    desc: { fa: 'لوازم حرفه‌ای آشپزخانه رستوران', en: 'Professional kitchen appliances' },
  },
  {
    key: 'gym',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop&q=80',
    label: { fa: 'باشگاه', en: 'Gym' },
    desc: { fa: 'تجهیزات مخصوص باشگاه‌ها', en: 'Appliances for fitness centers' },
  },
  {
    key: 'hotel',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&q=80',
    label: { fa: 'هتل', en: 'Hotel' },
    desc: { fa: 'راه‌حل‌های یکپارچه برای هتل‌ها', en: 'Integrated solutions for hotels' },
  },
  {
    key: 'office',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop&q=80',
    label: { fa: 'دفتر کار', en: 'Office' },
    desc: { fa: 'لوازم اداری و دفتری', en: 'Office & workspace appliances' },
  },
] as const;

export default async function WholesalePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('wholesale');
  const fa = locale === 'fa';

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-700 text-white py-20 px-4 text-center">
        <span className="inline-block bg-gold-500 text-white text-xs font-semibold px-4 py-1 rounded-full mb-5 tracking-wide uppercase">
          {fa ? 'فروش عمده' : 'Wholesale'}
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('title')}</h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto">{t('subtitle')}</p>
      </section>

      {/* Business type cards */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-navy-700 text-center mb-2">{t('choose_business')}</h2>
        <p className="text-gray-500 text-center mb-10">
          {fa ? 'نوع کسب‌وکار خود را انتخاب کنید' : 'Select your business type to see relevant products'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BUSINESS_TYPES.map((biz) => (
            <Link
              key={biz.key}
              href={`/${locale}/wholesale/${biz.key}`}
              className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
            >
              {/* Photo */}
              <div className="relative h-56 w-full">
                <Image
                  src={biz.image}
                  alt={biz.label.en}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Strong gradient so text is always readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>

              {/* Text pinned to bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-xl font-bold text-white leading-tight">
                  {fa ? biz.label.fa : biz.label.en}
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  {fa ? biz.desc.fa : biz.desc.en}
                </p>
                <span className="inline-block mt-3 text-gold-400 text-xs font-semibold group-hover:text-gold-300 transition-colors">
                  {fa ? 'مشاهده محصولات ←' : 'View products →'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
