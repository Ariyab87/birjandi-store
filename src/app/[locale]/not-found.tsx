import Link from 'next/link';
import { getLocale } from 'next-intl/server';

export default async function NotFound() {
  let locale = 'fa';
  try {
    locale = await getLocale();
  } catch { /* default to fa */ }
  const fa = locale === 'fa';

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="text-7xl mb-6">🔍</p>
      <h1 className="text-3xl font-bold text-navy-700 mb-3">
        {fa ? 'صفحه پیدا نشد' : 'Page not found'}
      </h1>
      <p className="text-gray-500 mb-8">
        {fa
          ? 'صفحه‌ای که دنبال آن بودید وجود ندارد یا حذف شده است.'
          : 'The page you were looking for does not exist or has been removed.'}
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href={`/${locale}`} className="btn-gold text-sm">
          {fa ? 'بازگشت به خانه' : 'Back to home'}
        </Link>
        <Link href={`/${locale}/retail`} className="btn-primary text-sm">
          {fa ? 'مشاهده محصولات' : 'Browse products'}
        </Link>
      </div>
    </div>
  );
}
