import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { BasketProvider } from '@/components/basket/BasketContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatWidget from '@/components/chat/ChatWidget';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import { BASE_URL, ogImages } from '@/lib/seo';
import '@/styles/globals.css';

export function generateStaticParams() {
  return [{ locale: 'fa' }, { locale: 'en' }];
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const fa = locale === 'fa';
  return {
    title: fa ? 'کالالند۲۴ — لوازم برقی و خانگی' : 'Kalaland24 — Home & Electrical Appliances',
    description: fa
      ? 'خرید آنلاین لوازم خانگی و برقی با بهترین قیمت — فروش خرده و عمده از کالالند۲۴'
      : 'Buy home and electrical appliances online at the best price — retail and wholesale from Kalaland24',
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'fa': `${BASE_URL}/fa`,
        'en': `${BASE_URL}/en`,
        'x-default': `${BASE_URL}/fa`,
      },
    },
    openGraph: {
      siteName: 'کالالند۲۴',
      locale: fa ? 'fa_IR' : 'en_US',
      type: 'website',
      images: ogImages(fa ? 'کالالند۲۴' : 'Kalaland24'),
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImages('Kalaland24')[0].url],
    },
    verification: {
      google: 'blj87sz43KjDOYwluPkJB0ilg9BjADEJzfU__gw7f9M',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'fa' ? 'rtl' : 'ltr'}>
      <body className={`min-h-screen flex flex-col ${locale === 'fa' ? 'font-vazir' : 'font-inter'}`}>
        <NextIntlClientProvider messages={messages}>
          <BasketProvider>
            <Header />
            <main className="flex-1 pt-[64px]">{children}</main>
            <Footer />
            <ChatWidget locale={locale} />
            <WhatsAppFloat locale={locale} />
          </BasketProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
