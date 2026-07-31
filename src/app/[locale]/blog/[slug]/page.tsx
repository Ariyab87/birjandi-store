import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { getArticleBySlug, getArticles, getImageUrl, type Article } from '@/lib/api';
import { markdownToHtml } from '@/lib/markdown';
import { BASE_URL, hreflangAlternates, truncate, ogImages, safeJsonLd } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  try {
    const a = await getArticleBySlug(slug);
    if (!a) return { title: 'کالالند۲۴' };
    const title = a.seo_title || `${a.title_fa} | مجله کالالند۲۴`;
    const description = a.seo_description || truncate(a.excerpt_fa || a.content_fa, 155);
    const image = a.cover ? getImageUrl(a.cover.url, 'full') : undefined;
    return {
      title,
      description,
      alternates: hreflangAlternates(`blog/${slug}`, locale),
      openGraph: {
        title, description, type: 'article',
        url: `${BASE_URL}/${locale}/blog/${slug}`,
        images: image ? [{ url: image, alt: a.title_fa }] : ogImages(a.title_fa),
      },
    };
  } catch {
    return { title: 'کالالند۲۴' };
  }
}

function faDate(iso: string): string {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
}

export default async function ArticlePage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const fa = locale === 'fa';

  let article: Article | null = null;
  let others: Article[] = [];
  try {
    article = await getArticleBySlug(slug);
    others = (await getArticles(1, 4)).data.filter(a => a.slug !== slug).slice(0, 3);
  } catch { /* Strapi unavailable */ }

  if (!article) notFound();

  const articleUrl = `${BASE_URL}/${locale}/blog/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title_fa,
    description: article.excerpt_fa || undefined,
    image: article.cover ? [getImageUrl(article.cover.url, 'full')] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: 'fa-IR',
    mainEntityOfPage: articleUrl,
    author: { '@type': 'Organization', name: 'کالالند۲۴', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'کالالند۲۴', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: fa ? 'خانه' : 'Home', item: `${BASE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: fa ? 'مجله' : 'Magazine', item: `${BASE_URL}/${locale}/blog` },
      { '@type': 'ListItem', position: 3, name: article.title_fa, item: articleUrl },
    ],
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 py-10">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap" aria-label="breadcrumb">
          <Link href={`/${locale}`} className="hover:text-navy-700 transition-colors">{fa ? 'خانه' : 'Home'}</Link>
          <span>›</span>
          <Link href={`/${locale}/blog`} className="hover:text-navy-700 transition-colors">{fa ? 'مجله' : 'Magazine'}</Link>
          <span>›</span>
          <span className="text-navy-700 font-medium">{article.title_fa}</span>
        </nav>

        <h1 className="text-2xl md:text-4xl font-bold text-navy-700 leading-snug mb-3">{article.title_fa}</h1>
        <p className="text-sm text-gray-400 mb-8">{faDate(article.publishedAt)} · مجله کالالند۲۴</p>

        {article.cover && (
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-10 bg-cream">
            <Image src={getImageUrl(article.cover.url, 'full')} alt={article.title_fa} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 768px" />
          </div>
        )}

        <div
          className="article-body bg-white rounded-2xl border border-gray-100 p-6 md:p-10"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content_fa) }}
        />

        <div className="mt-10 bg-navy-800 text-white rounded-2xl p-6 md:p-8 text-center">
          <p className="font-bold text-lg mb-2">{fa ? 'دنبال خرید هستید؟' : 'Ready to shop?'}</p>
          <p className="text-white/60 text-sm mb-4">{fa ? 'همه محصولات با ضمانت اصالت و ارسال به سراسر ایران' : 'Authentic products, delivered across Iran'}</p>
          <Link href={`/${locale}/retail`} className="inline-block bg-gold-500 hover:bg-gold-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            {fa ? 'مشاهده محصولات' : 'Browse products'}
          </Link>
        </div>

        {others.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-navy-700 mb-5">{fa ? 'مقالات دیگر' : 'More articles'}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {others.map(a => (
                <Link key={a.documentId} href={`/${locale}/blog/${a.slug}`} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <p className="font-semibold text-navy-700 text-sm leading-snug">{a.title_fa}</p>
                  <p className="text-xs text-gray-400 mt-2">{faDate(a.publishedAt)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
