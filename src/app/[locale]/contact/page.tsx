import { setRequestLocale } from 'next-intl/server';

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
          {fa ? 'تماس با بی‌شاپ' : 'Contact Bshop'}
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
            <p className="text-gray-600 text-sm" dir="ltr">+98 913 144 4021</p>
            <p className="text-gold-500 text-xs mt-1 font-medium">24/7</p>
          </div>
        </div>

        {/* WhatsApp */}
        <a
          href="#"
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

        {/* Instagram */}
        <a
          href="#"
          className="bg-pink-50 rounded-2xl p-6 border border-pink-100 flex gap-4 items-start hover:bg-pink-100 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.975-.975 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.197.157 3.355.673 2.014 2.014.673 3.355.157 5.197.072 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.085 1.855.601 3.697 1.942 5.038 1.341 1.341 3.183 1.857 5.038 1.942C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 1.855-.085 3.697-.601 5.038-1.942 1.341-1.341 1.857-3.183 1.942-5.038C23.986 15.668 24 15.259 24 12c0-3.259-.014-3.668-.072-4.948-.085-1.855-.601-3.697-1.942-5.038C20.645.673 18.803.157 16.948.072 15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-navy-700 mb-1">Instagram</h3>
            <p className="text-gray-600 text-sm">
              {fa ? 'ما را در اینستاگرام دنبال کنید' : 'Follow us on Instagram'}
            </p>
            <p className="text-pink-500 text-xs mt-1 font-medium group-hover:underline">
              {fa ? 'مشاهده صفحه ←' : 'View profile →'}
            </p>
          </div>
        </a>

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
