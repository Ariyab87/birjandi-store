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

// Persian reading speed ≈ 180 words/min
function readingTime(content: string): string {
  const mins = Math.max(1, Math.round(content.split(/\s+/).length / 180));
  return `${new Intl.NumberFormat('fa-IR').format(mins)} دقیقه مطالعه`;
}

function CoverImage({ a, sizes, priority = false }: { a: Article; sizes: string; priority?: boolean }) {
  if (!a.cover) {
    return <div className="w-full h-full flex items-center justify-center text-5xl text-gold-500/40 bg-cream">📖</div>;
  }
  return (
    <Image
      src={getImageUrl(a.cover.formats?.medium?.url || a.cover.url, 'full')}
      alt={a.title_fa}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

export default async function BlogPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const fa = locale === 'fa';

  let articles: Article[] = [];
  try {
    articles = (await getArticles()).data;
  } catch { /* Strapi unavailable */ }

  const [featured, ...rest] = articles;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header band */}
      <div className="bg-gradient-to-l from-navy-800 to-navy-900 text-white py-12 px-4 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="ambient-blob w-80 h-80 bg-gold-500/20 -top-20 -left-20" />
          <div className="ambient-blob w-96 h-96 bg-gold-500/10 -bottom-32 right-1/4" style={{ animationDelay: '6s' }} />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <p className="text-gold-400 text-xs font-medium tracking-widest uppercase mb-2">{fa ? 'کالالند۲۴' : 'Kalaland24'}</p>
          <h1 className="text-3xl md:text-5xl font-bold">{fa ? 'مجله کالالند۲۴' : 'Kalaland24 Magazine'}</h1>
          <p className="text-white/60 mt-3 text-sm md:text-base max-w-xl">
            {fa
              ? 'راهنمای خرید، مقایسه برندها و نکات نگهداری لوازم خانگی — از زبان اهل فن، بدون اغراق'
              : 'Buying guides, brand comparisons and care tips for home appliances'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {articles.length === 0 ? (
          <p className="text-center text-gray-400 py-20">{fa ? 'به‌زودی مقالات جدید منتشر می‌شود…' : 'New articles coming soon…'}</p>
        ) : (
          <>
            {/* Featured (newest) */}
            {featured && (
              <Link
                href={`/${locale}/blog/${featured.slug}`}
                className="group grid md:grid-cols-2 bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow mb-10"
              >
                <div className="relative h-60 md:h-auto md:min-h-[20rem] overflow-hidden">
                  <CoverImage a={featured} sizes="(max-width: 768px) 100vw, 50vw" priority />
                </div>
                <div className="p-7 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="bg-gold-500/10 text-gold-600 font-semibold px-3 py-1 rounded-full">{fa ? 'جدیدترین' : 'Latest'}</span>
                    <span>{faDate(featured.publishedAt)}</span>
                    <span>·</span>
                    <span>{readingTime(featured.content_fa)}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-navy-700 leading-snug mb-3 group-hover:text-gold-600 transition-colors">
                    {featured.title_fa}
                  </h2>
                  {featured.excerpt_fa && (
                    <p className="text-sm md:text-base text-gray-500 leading-relaxed line-clamp-3 mb-5">{featured.excerpt_fa}</p>
                  )}
                  <span className="text-gold-600 font-semibold text-sm">
                    {fa ? 'ادامه مطلب ←' : 'Read more →'}
                  </span>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map(a => (
                <Link
                  key={a.documentId}
                  href={`/${locale}/blog/${a.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
                >
                  <div className="h-44 relative overflow-hidden">
                    <CoverImage a={a} sizes="(max-width: 640px) 100vw, 33vw" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span>{faDate(a.publishedAt)}</span>
                      <span>·</span>
                      <span>{readingTime(a.content_fa)}</span>
                    </div>
                    <h2 className="font-bold text-navy-700 leading-snug mb-2 group-hover:text-gold-600 transition-colors">
                      {a.title_fa}
                    </h2>
                    {a.excerpt_fa && <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{a.excerpt_fa}</p>}
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA strip */}
            <div className="mt-12 bg-navy-800 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-lg">{fa ? 'سوالی درباره انتخاب محصول دارید؟' : 'Not sure what to buy?'}</p>
                <p className="text-white/60 text-sm mt-1">{fa ? 'مشاور هوشمند ما ۲۴ ساعته پاسخگوست — یا مستقیم در واتساپ بپرسید' : 'Our AI assistant is available 24/7'}</p>
              </div>
              <Link href={`/${locale}/retail`} className="shrink-0 bg-gold-500 hover:bg-gold-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
                {fa ? 'مشاهده محصولات' : 'Browse products'}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
