import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import RetailCatalog from '@/components/retail/RetailCatalog';
import { RETAIL_CATEGORIES } from '@/lib/utils';
import { BASE_URL, hreflangAlternates, ogImages } from '@/lib/seo';

export function generateStaticParams() {
  return RETAIL_CATEGORIES.map(c => ({ category: c.key }));
}

function isValidCategory(category: string): boolean {
  return RETAIL_CATEGORIES.some(c => c.key === category);
}

export async function generateMetadata({
  params: { locale, category },
}: {
  params: { locale: string; category: string };
}): Promise<Metadata> {
  if (!isValidCategory(category)) return { title: 'کالالند۲۴' };

  const fa = locale === 'fa';
  const tCat = await getTranslations({ locale, namespace: 'categories' });
  const label = tCat(category);

  const title = fa
    ? `خرید ${label} | بهترین قیمت و ارسال به سراسر ایران | کالالند۲۴`
    : `Buy ${label} | Best Price, Delivery Across Iran | Kalaland24`;
  const description = fa
    ? `خرید آنلاین ${label} با بهترین قیمت بازار، ضمانت اصالت کالا و ارسال سریع به سراسر ایران از کالالند۲۴.`
    : `Buy ${label} online at the best market price with authenticity guarantee and fast delivery across Iran from Kalaland24.`;

  return {
    title,
    description,
    alternates: hreflangAlternates(`retail/${category}`, locale),
    openGraph: {
      title, description, type: 'website',
      url: `${BASE_URL}/${locale}/retail/${category}`,
      images: ogImages(title),
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImages(title)[0].url] },
  };
}

export default async function CategoryPage({
  params: { locale, category },
  searchParams,
}: {
  params: { locale: string; category: string };
  searchParams: { brand?: string; q?: string; price?: string; page?: string; sort?: string };
}) {
  setRequestLocale(locale);
  if (!isValidCategory(category)) notFound();

  return <RetailCatalog locale={locale} category={category} searchParams={searchParams} />;
}
