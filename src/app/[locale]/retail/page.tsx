import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import RetailCatalog from '@/components/retail/RetailCatalog';
import { BASE_URL, hreflangAlternates, ogImages } from '@/lib/seo';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const fa = locale === 'fa';
  const title = fa
    ? 'خرید لوازم خانگی آنلاین | ظروف، برقی، ملامین، چینی | کالالند۲۴'
    : 'Buy Home Appliances Online | Cookware, Electric, Melamine, Porcelain | Kalaland24';
  const description = fa
    ? 'خرید ظروف آشپزخانه، لوازم برقی، ظروف ملامین، چینی، استیل، تفلون و بیشتر با بهترین قیمت. ارسال سریع به سراسر ایران از کالالند۲۴.'
    : 'Buy kitchen cookware, electric appliances, melamine, porcelain, steel, teflon and more at the best price. Fast delivery across Iran from Kalaland24.';
  const ogAlt = fa ? 'فروش خرده | کالالند۲۴' : 'Retail | Kalaland24';
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

export default async function RetailPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { category?: string; brand?: string; q?: string; price?: string; page?: string; sort?: string };
}) {
  setRequestLocale(locale);

  // Old bookmarks/links used ?category=X — send them to the real category URL.
  if (searchParams.category) {
    const { category, ...rest } = searchParams;
    const qs = new URLSearchParams(rest as Record<string, string>).toString();
    redirect(`/${locale}/retail/${category}${qs ? `?${qs}` : ''}`);
  }

  return <RetailCatalog locale={locale} searchParams={searchParams} />;
}
