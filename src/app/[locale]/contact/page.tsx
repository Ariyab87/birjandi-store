import { setRequestLocale } from 'next-intl/server';
import ChatCard from '@/components/chat/ChatCard';
import { hreflangAlternates } from '@/lib/seo';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const fa = locale === 'fa';
  return {
    title: fa
      ? 'تماس با کالالند۲۴ | واتساپ، تلفن و پشتیبانی ۲۴/۷'
      : 'Contact Kalaland24 | WhatsApp, Phone & 24/7 Support',
    description: fa
      ? 'برای سفارش، استعلام قیمت لوازم خانگی و برقی یا هر سوالی با کالالند۲۴ در تماس باشید — واتساپ، تلفن ۰۹۹۳۴۶۴۲۴۵۵ و دستیار هوشمند.'
      : 'Contact Kalaland24 for orders, price enquiries or any questions — WhatsApp, phone +98 993 464 2455, and AI assistant.',
    alternates: hreflangAlternates('contact', locale),
  };
}

export default async function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const fa = locale === 'fa';

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <span className="text-gold-500 font-semibold text-sm uppercase tracking-widest">
          {fa ? 'ارتباط با ما' : 'Get in touch'}
        </span>
        <h1 className="text-4xl font-bold text-navy-700 mt-2 mb-3">
          {fa ? 'تماس با کالالند۲۴' : 'Contact Kalaland24'}
        </h1>
        <p className="text-gray-500">
          {fa
            ? 'برای سفارش، استعلام قیمت یا هر سوالی با ما در تماس باشید'
            : 'For orders, price enquiries, or any questions — we\'re here for you'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Phone */}
        <div className="bg-cream rounded-2xl p-6 border border-gray-100 flex gap-4 items-start">
          <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-navy-700 mb-1">{fa ? 'تلفن' : 'Phone'}</h3>
            <p className="text-gray-600 text-sm" dir="ltr">+98 993 464 2455</p>
            <p className="text-gold-500 text-xs mt-1 font-medium">24/7</p>
          </div>
        </div>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/905338586763?text=${encodeURIComponent(fa ? 'سلام، از سایت کالالند۲۴ پیام می‌دهم.' : 'Hello, contacting you from the Kalaland24 website.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-50 rounded-2xl p-6 border border-green-100 flex gap-4 items-start hover:bg-green-100 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-navy-700 mb-1">WhatsApp</h3>
            <p className="text-gray-600 text-sm">
              {fa ? 'پیام مستقیم در واتساپ' : 'Chat with us on WhatsApp'}
            </p>
            <p className="text-green-600 text-xs mt-1 font-medium group-hover:underline">
              {fa ? 'شروع مکالمه ←' : 'Start chat →'}
            </p>
          </div>
        </a>

        {/* Rubika */}
        <a
          href="https://rubika.ir/kalaland24"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex gap-4 items-start hover:bg-purple-100 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1.5 22.5 12 12 22.5 1.5 12 12 1.5zm0 3.4L4.9 12l7.1 7.1 7.1-7.1L12 4.9zm0 3.2 3.9 3.9-3.9 3.9-3.9-3.9L12 8.1z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-navy-700 mb-1">{fa ? 'روبیکا' : 'Rubika'}</h3>
            <p className="text-gray-600 text-sm">
              {fa ? 'کالالند۲۴ در روبیکا فعال است' : 'Kalaland24 is active on Rubika'}
            </p>
            <p className="text-purple-600 text-sm mt-1 font-bold group-hover:underline" dir="ltr">@kalaland24</p>
          </div>
        </a>

        {/* AI Assistant (Kia) */}
        <ChatCard fa={fa} />

        {/* Email */}
        <div className="bg-cream rounded-2xl p-6 border border-gray-100 flex gap-4 items-start">
          <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-navy-700 mb-1">{fa ? 'ایمیل' : 'Email'}</h3>
            <p className="text-gray-600 text-sm" dir="ltr">ariyabirjandi87@gmail.com</p>
            <p className="text-gray-400 text-xs mt-1">
              {fa ? 'پاسخ در اسرع وقت' : 'We reply as soon as possible'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
