import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ReactNode } from 'react';
import { BasketProvider } from '@/components/basket/BasketContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatWidget from '@/components/chat/ChatWidget';
import '@/styles/globals.css';

export function generateStaticParams() {
  return [{ locale: 'fa' }, { locale: 'en' }];
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
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>کالالند — لوازم برقی و خانگی</title>
      </head>
      <body className={`min-h-screen flex flex-col ${locale === 'fa' ? 'font-vazir' : 'font-inter'}`}>
        <NextIntlClientProvider messages={messages}>
          <BasketProvider>
            <Header />
            <main className="flex-1 pt-[64px]">{children}</main>
            <Footer />
            <ChatWidget locale={locale} />
          </BasketProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
