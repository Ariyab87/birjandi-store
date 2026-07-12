import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { getArticles, getImageUrl, type Article } from '@/lib/api';
import { BASE_URL, hreflangAlternates, ogImages } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const fa = locale === 'fa';
  const title = fa
    ? 'مجله کالالند۲۴ | راهنمای خرید لوازم خانگی و ظروف آشپزخانه'
    : 'Kalaland24 Magazine | Home Appliance Buying Guides';
  const description = fa
    ? 'راهنمای خرید، مقایسه و نگهداری لوازم خانگی و ظروف آشپزخانه — مقالات تخصصی مجله کالالند۲۴.'
    : 'Buying guides, comparisons and care tips for home appliances and cookware — Kalaland24 magazine.';
  return {
    title,
    description,
    alternates: hreflangAlternates('blog', locale),
    openGraph: {
      title, description, type: 'website',
      url: `${BASE_URL}/${locale}/blog`,
      images: ogImages(title),
    },
  };
}

function faDate(iso: string): string {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
}

export default async function BlogPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const fa = locale === 'fa';

  let articles: Article[] = [];
  try {
    articles = (await getArticles()).data;
  } catch { /* Strapi unavailable */ }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-l from-navy-800 to-navy-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold">{fa ? 'مجله کالالند۲۴' : 'Kalaland24 Magazine'}</h1>
          <p className="text-white/60 mt-2 text-sm md:text-base">
            {fa ? 'راهنمای خرید، مقایسه و نگهداری لوازم خانگی' : 'Buying guides and care tips for home appliances'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {articles.length === 0 ? (
          <p className="text-center text-gray-400 py-20">{fa ? 'به‌زودی مقالات جدید منتشر می‌شود…' : 'New articles coming soon…'}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(a => (
              <Link
                key={a.documentId}
                href={`/${locale}/blog/${a.slug}`}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="h-44 bg-cream relative overflow-hidden">
                  {a.cover ? (
                    <Image
                      src={getImageUrl(a.cover.formats?.medium?.url || a.cover.url)}
                      alt={a.title_fa}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-gold-500/40">📖</div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-gray-400 mb-2">{faDate(a.publishedAt)}</p>
                  <h2 className="font-bold text-navy-700 leading-snug mb-2 group-hover:text-gold-600 transition-colors">
                    {a.title_fa}
                  </h2>
                  {a.excerpt_fa && <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{a.excerpt_fa}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
