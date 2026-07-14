import { getRequestConfig } from 'next-intl/server';

const LOCALES = ['fa', 'en'];

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl 3.22+: use requestLocale and always return a locale,
  // falling back to fa for requests outside a locale segment (e.g. root 404).
  let locale = await requestLocale;
  if (!locale || !LOCALES.includes(locale)) locale = 'fa';
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
